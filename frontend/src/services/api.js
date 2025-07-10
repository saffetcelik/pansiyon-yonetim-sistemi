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
  getAll: () => api.get('/rooms'),
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
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customerData) => api.post('/customers', customerData),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (query) => api.get(`/customers/search?query=${query}`)
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
  getCalendar: (month, year) => api.get(`/reservations/calendar?month=${month}&year=${year}`)
};



export const testService = {
  health: () => api.get('/test/health'),
  database: () => api.get('/test/database'),
  rooms: () => api.get('/test/rooms')
};

export default api;
