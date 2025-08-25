import axios from 'axios';

// API Base URL - Domain üzerinden erişim için dinamik URL belirleme
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // 'http:' veya 'https:'
  
  console.log('AuthService - Hostname:', hostname, 'Protocol:', protocol);
  console.log('AuthService - Full location:', window.location.href);
  
  // ASLA localhost kullanma - sadece gerçek localhost erişiminde
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('AuthService: Gerçek localhost erişimi tespit edildi.');
    return `http://${hostname}:5297/api`;
  }
  
  // Tüm domain erişimleri için domain üzerinden API kullan
  const apiUrl = `${protocol}//${hostname}/api`;
  console.log('AuthService: Domain erişimi - API URL:', apiUrl);
  return apiUrl;
};

const API_BASE_URL = getBaseUrl();

// Cookie yardımcı fonksiyonları
const cookieUtils = {
  // Cookie'den değer oku
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  // Cookie ayarla
  setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  },

  // Cookie sil
  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Önce localStorage'dan token al
    let token = localStorage.getItem('authToken');

    // Eğer localStorage'da yoksa cookie'den al
    if (!token) {
      token = cookieUtils.getCookie('authToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials, {
        withCredentials: true // Cookie'leri dahil et
      });
      const { token, user, expiresAt } = response.data;

      // Store token and user info in localStorage (backup)
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tokenExpiresAt', expiresAt);

      // Cookie'ler backend tarafından otomatik olarak ayarlanacak

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Giriş işlemi başarısız'
      };
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Kayıt işlemi başarısız'
      };
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Şifre değiştirme işlemi başarısız'
      };
    }
  },

  // Refresh token
  async refreshToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await api.post('/auth/refresh-token', token);
      const { token: newToken, expiresAt } = response.data;
      
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('tokenExpiresAt', expiresAt);
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token yenileme başarısız'
      };
    }
  },

  // Logout user
  async logout() {
    try {
      // Backend'e logout isteği gönder (cookie'leri temizlemek için)
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // LocalStorage'ı temizle
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');

    // Cookie'leri manuel olarak da temizle
    cookieUtils.deleteCookie('authToken');
    cookieUtils.deleteCookie('userInfo');

    window.location.href = '/login';
  },

  // Check if user is authenticated
  isAuthenticated() {
    // Önce localStorage'dan kontrol et
    let token = localStorage.getItem('authToken');
    let expiresAt = localStorage.getItem('tokenExpiresAt');

    // Eğer localStorage'da yoksa cookie'den kontrol et
    if (!token) {
      token = cookieUtils.getCookie('authToken');
    }

    if (!token) {
      return false;
    }

    // Token expiry kontrolü - 30 gün boyunca geçerli
    if (expiresAt) {
      const now = new Date();
      const expiry = new Date(expiresAt);

      // Sadece gerçekten süresi dolmuşsa çıkış yap (30 gün)
      if (now >= expiry) {
        this.logout();
        return false;
      }
    }

    return true;
  },

  // Get current user
  getCurrentUser() {
    // Önce localStorage'dan al
    let userStr = localStorage.getItem('user');

    // Eğer localStorage'da yoksa cookie'den al
    if (!userStr) {
      userStr = cookieUtils.getCookie('userInfo');
    }

    return userStr ? JSON.parse(userStr) : null;
  },

  // Şifre değiştirme
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Şifre değiştirme başarısız'
      };
    }
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }
};

export default api;
