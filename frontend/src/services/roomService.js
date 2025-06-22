import api from './authService';

export const roomService = {
  // Get all rooms
  async getAllRooms() {
    try {
      const response = await api.get('/room');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Odalar getirilemedi'
      };
    }
  },

  // Get room by ID
  async getRoomById(id) {
    try {
      const response = await api.get(`/room/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda getirilemedi'
      };
    }
  },

  // Create new room
  async createRoom(roomData) {
    try {
      const response = await api.post('/room', roomData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda oluşturulamadı'
      };
    }
  },

  // Update room
  async updateRoom(id, roomData) {
    try {
      const response = await api.put(`/room/${id}`, roomData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda güncellenemedi'
      };
    }
  },

  // Update room status
  async updateRoomStatus(id, status) {
    try {
      const response = await api.patch(`/room/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda durumu güncellenemedi'
      };
    }
  },

  // Delete room
  async deleteRoom(id) {
    try {
      const response = await api.delete(`/room/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda silinemedi'
      };
    }
  },

  // Get available rooms
  async getAvailableRooms() {
    try {
      const response = await api.get('/room/available');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Müsait odalar getirilemedi'
      };
    }
  },

  // Get room status summary
  async getRoomStatusSummary() {
    try {
      const response = await api.get('/room/status-summary');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Oda durumu özeti getirilemedi'
      };
    }
  }
};

// Room status constants
export const ROOM_STATUS = {
  AVAILABLE: 0,
  OCCUPIED: 1,
  CLEANING: 2,
  MAINTENANCE: 3,
  OUT_OF_ORDER: 4
};

export const ROOM_STATUS_NAMES = {
  [ROOM_STATUS.AVAILABLE]: 'Müsait',
  [ROOM_STATUS.OCCUPIED]: 'Dolu',
  [ROOM_STATUS.CLEANING]: 'Temizlik',
  [ROOM_STATUS.MAINTENANCE]: 'Bakım',
  [ROOM_STATUS.OUT_OF_ORDER]: 'Arızalı'
};

export const ROOM_STATUS_COLORS = {
  [ROOM_STATUS.AVAILABLE]: '#4caf50',    // Green
  [ROOM_STATUS.OCCUPIED]: '#f44336',     // Red
  [ROOM_STATUS.CLEANING]: '#ff9800',     // Orange
  [ROOM_STATUS.MAINTENANCE]: '#9c27b0',  // Purple
  [ROOM_STATUS.OUT_OF_ORDER]: '#607d8b'  // Blue Grey
};

// Room type constants
export const ROOM_TYPE = {
  SINGLE: 0,
  DOUBLE: 1,
  TRIPLE: 2,
  FAMILY: 3,
  SUITE: 4
};

export const ROOM_TYPE_NAMES = {
  [ROOM_TYPE.SINGLE]: 'Tek Kişilik',
  [ROOM_TYPE.DOUBLE]: 'Çift Kişilik',
  [ROOM_TYPE.TRIPLE]: 'Üç Kişilik',
  [ROOM_TYPE.FAMILY]: 'Aile Odası',
  [ROOM_TYPE.SUITE]: 'Suit'
};
