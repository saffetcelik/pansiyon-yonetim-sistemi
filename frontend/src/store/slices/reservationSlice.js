import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '../../services/api';

export const fetchReservations = createAsyncThunk(
  'reservations/fetchReservations',
  async (params, { rejectWithValue }) => {
    try {
      // Status filtresini işle
      const processedParams = { ...params };

      if (processedParams.status === 'exclude-checked-out') {
        processedParams.excludeCheckedOut = true;
        delete processedParams.status; // Status parametresini kaldır
      }

      console.log('Fetching reservations with params:', processedParams);
      const response = await reservationService.getAll(processedParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Rezervasyonlar yüklenemedi');
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservations/createReservation',
  async (reservationData, { rejectWithValue }) => {
    try {
      const response = await reservationService.create(reservationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Rezervasyon oluşturulamadı');
    }
  }
);

export const updateReservation = createAsyncThunk(
  'reservations/updateReservation',
  async ({ id, reservationData }, { rejectWithValue }) => {
    try {
      const response = await reservationService.update(id, reservationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Rezervasyon güncellenemedi');
    }
  }
);

export const deleteReservation = createAsyncThunk(
  'reservations/deleteReservation',
  async (id, { rejectWithValue }) => {
    try {
      await reservationService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Rezervasyon silinemedi');
    }
  }
);

export const checkInReservation = createAsyncThunk(
  'reservations/checkInReservation',
  async ({ id, checkInData }, { rejectWithValue }) => {
    try {
      const response = await reservationService.checkIn(id, checkInData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check-in işlemi başarısız');
    }
  }
);

export const checkOutReservation = createAsyncThunk(
  'reservations/checkOutReservation',
  async ({ id, checkOutData }, { rejectWithValue }) => {
    try {
      const response = await reservationService.checkOut(id, checkOutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check-out işlemi başarısız');
    }
  }
);

const initialState = {
  reservations: [],
  selectedReservation: null,
  loading: false,
  error: null,
  calendarData: [],
  filters: {
    status: 'exclude-checked-out', // Varsayılan olarak çıkış yapılanları hariç tut
    customerName: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

const reservationSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedReservation: (state, action) => {
      state.selectedReservation = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'exclude-checked-out', // Varsayılan olarak çıkış yapılanları hariç tut
        customerName: '',
        roomNumber: '',
        checkInDate: '',
        checkOutDate: '',
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reservations
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Reservation
      .addCase(createReservation.fulfilled, (state, action) => {
        state.reservations.push(action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update Reservation
      .addCase(updateReservation.fulfilled, (state, action) => {
        const index = state.reservations.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete Reservation
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.reservations = state.reservations.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Check-in
      .addCase(checkInReservation.fulfilled, (state, action) => {
        const index = state.reservations.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
      })
      .addCase(checkInReservation.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Check-out
      .addCase(checkOutReservation.fulfilled, (state, action) => {
        const index = state.reservations.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reservations[index] = action.payload;
        }
      })
      .addCase(checkOutReservation.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedReservation,
  setFilters,
  clearFilters,
  setPagination
} = reservationSlice.actions;

export default reservationSlice.reducer;
