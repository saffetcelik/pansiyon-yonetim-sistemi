import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5297/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
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

// API Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  }
};

export const roomService = {
  getAll: (forReservation = false) => {
    const url = forReservation ? '/rooms?forReservation=true' : '/rooms';
    return api.get(url);
  },
  getById: (id) => api.get(`/rooms/${id}`),
  create: (roomData) => api.post('/rooms', roomData),
  update: (id, roomData) => api.put(`/rooms/${id}`, roomData),
  delete: (id) => api.delete(`/rooms/${id}`),
  updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
  getAvailability: (checkInDate, checkOutDate, excludeReservationId = null) => {
    let url = `/rooms/availability?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`;
    if (excludeReservationId) {
      url += `&excludeReservationId=${excludeReservationId}`;
    }
    return api.get(url);
  },
  getOccupiedDates: (roomId, startDate = null, endDate = null, excludeReservationId = null) => {
    let url = `/rooms/${roomId}/occupied-dates`;
    const params = new URLSearchParams();

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (excludeReservationId) params.append('excludeReservationId', excludeReservationId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return api.get(url);
  }
};

export const customerService = {
  getAll: async (params) => {
    const { page, pageSize, ...filteredParams } = params || {};
    console.log('customerService.getAll called with params:', params);
    console.log('Filtered params:', filteredParams);
    try {
      // API istek yolunu kontrol et
      const apiUrl = '/customers';
      console.log('API URL:', `${API_BASE_URL}${apiUrl}`);
      console.log('Token:', localStorage.getItem('authToken') ? 'Mevcut' : 'Mevcut değil');
      
      // Axios istek konfigürasyonu
      const config = { 
        params: filteredParams,
        headers: {
          'X-Debug-Info': 'CustomerAPI-Request'
        }
      };
      console.log('Request config:', config);
      
      // API isteği yapma
      const response = await api.get(apiUrl, config);
      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      console.log('API response data:', response.data);
      
      // Doğru cevap alındı mı kontrol et
      if (!response.data) {
        console.warn('API response is missing data property:', response);
        return { data: [] };
      }
      
      // Veri yapısını kontrol et
      if (Array.isArray(response.data)) {
        console.log(`Veri bir dizi olarak geldi, ${response.data.length} kayıt içeriyor`);
        return { data: response.data }; // Backend direkt dizi dönüyorsa, data property içine saralım
      } else {
        console.log('Veri bir nesne olarak geldi:', typeof response.data);
      }
      
      return response;
    } catch (error) {
      console.error('API error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      });
      
      // Otomatik düzeltme mekanizması
      if (error.response?.status === 404) {
        console.log('Alternatif API endpoint deneniyor: /customer');
        try {
          const altResponse = await api.get('/customer', { params: filteredParams });
          console.log('Alternatif API endpoint çalıştı:', altResponse);
          return altResponse;
        } catch (altError) {
          console.error('Alternatif API endpoint de çalışmadı:', altError.message);
          throw altError;
        }
      }
      
      // API kontrolü deneme
      try {
        console.log('API endpoint kontrolü yapılıyor: /api/customers');
        const checkResponse = await axios.get(`${API_BASE_URL}/customers`, {
          params: filteredParams,
          headers: api.defaults.headers
        });
        console.log('API kontrolü cevabı:', checkResponse);
        return { data: checkResponse.data };
      } catch (checkError) {
        console.error('API kontrol hatası:', checkError.message);
      }
      
      throw error;
    }
  },
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: async (id) => {
    try {
      // Müşterinin herhangi bir rezervasyonunu kontrol et (aktif veya aktif değil)
      const reservationCheck = await api.get(`/customers/${id}/reservation-check`);
      // Eğer herhangi bir rezervasyon varsa (API'den bir kontrol değeri dönecek)
      if (reservationCheck.data && reservationCheck.data.hasReservations) {
        // Rezervasyonları duruma göre sınıflandır
        const reservations = reservationCheck.data.reservations || [];
        const activeReservations = reservations.filter(r => 
          r.status === 'Active' || r.status === 'CheckedIn' || 
          r.status === 'Confirmed' || r.status === 'Reserved');
        const pastReservations = reservations.filter(r => 
          r.status === 'CheckedOut' || r.status === 'Completed' || 
          r.status === 'Canceled' || r.status === 'NoShow');

        // Detaylı hata mesajı oluştur
        let errorMessage = 'Bu müşteri rezervasyon kayıtlarına bağlı olduğu için silinemez.';
        if (activeReservations.length > 0) {
          errorMessage += ' Aktif rezervasyonları bulunmaktadır.';
        }
        if (pastReservations.length > 0) {
          errorMessage += ' Geçmiş rezervasyon kayıtları bulunmaktadır.';
        }
        
        // Özel hata fırlat
        const error = new Error(errorMessage);
        error.isReservationError = true;
        error.reservations = reservations;
        error.activeReservations = activeReservations;
        error.pastReservations = pastReservations;
        throw error;
      }
      
      // Rezervasyon yoksa silme işlemini gerçekleştir
      return api.delete(`/customers/${id}`);
    } catch (error) {
      // API'nin 404 hatası döndürdüğü durumda eski endpoint'i dene
      if (error.response?.status === 404 && !error.isReservationError) {
        console.log('Rezervasyon kontrolü endpoint bulunamadı, direkt silme deneniyor');
        return api.delete(`/customers/${id}`);
      }
      throw error;
    }
  },
  search: (query) => api.get(`/customers/search?query=${encodeURIComponent(query)}`),
  getRecent: (count = 10) => api.get(`/customers/recent?count=${count}`)
};

export const productService = {
  getAll: (params) => api.get('/product', { params }),
  getById: (id) => api.get(`/product/${id}`),
  create: (data) => api.post('/product', data),
  update: (id, data) => api.put(`/product/${id}`, data),
  delete: (id) => api.delete(`/product/${id}`),
  search: (query) => api.get(`/product/search?query=${query}`),
  getLowStock: () => api.get('/product/low-stock'),
  getStockAlerts: () => api.get('/product/stock-alerts'),
  updateStock: (id, data) => api.post(`/product/${id}/stock`, data)
};

export const saleService = {
  getAll: (params) => api.get('/sale', { params }),
  getById: (id) => api.get(`/sale/${id}`),
  create: (data) => api.post('/sale', data),
  getDailySales: (date) => api.get(`/sale/daily/${date}`),
  getMonthlySales: (year, month) => api.get(`/sale/monthly/${year}/${month}`),
  getByCustomer: (customerId) => api.get(`/sale/customer/${customerId}`),
  getByDateRange: (startDate, endDate) => api.get(`/sale/date-range?startDate=${startDate}&endDate=${endDate}`)
};

export const reservationService = {
  getAll: (params) => api.get('/reservations', { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  create: (reservationData) => api.post('/reservations', reservationData),
  update: (id, reservationData) => api.put(`/reservations/${id}`, reservationData),
  delete: (id) => api.delete(`/reservations/${id}`),
  checkIn: (id, checkInData) => api.post(`/reservations/${id}/checkin`, checkInData),
  checkOut: (id, checkOutData) => api.post(`/reservations/${id}/checkout`, checkOutData),
  getCalendar: (month, year) => api.get(`/reservations/calendar?month=${month}&year=${year}`),
  getDashboardStats: () => api.get('/reservations/dashboard-stats')
};



export const testService = {
  health: () => api.get('/test/health'),
  database: () => api.get('/test/database'),
  rooms: () => api.get('/test/rooms')
};

export default api;
