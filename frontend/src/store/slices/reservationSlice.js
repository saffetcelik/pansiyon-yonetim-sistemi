import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '../../services/api';

export const fetchReservations = createAsyncThunk(
  'reservations/fetchReservations',
  async (params, { rejectWithValue }) => {
    try {
      // Status filtresini işle ve pagination parametrelerini kaldır
      const { page, pageSize, ...rest } = params;
      const processedParams = { ...rest };

      // Tarih parametrelerinin doğru formatta olduğundan emin ol
      if (processedParams.checkInDate) {
        console.log('Frontend - Raw checkInDate:', processedParams.checkInDate);
        
        try {
          let date;
          
          if (processedParams.checkInDate instanceof Date) {
            // Tarih bir Date nesnesi ise
            date = processedParams.checkInDate;
          } else {
            // Tarih bir string ise
            date = new Date(processedParams.checkInDate);
          }
          
          // Yerel tarih bileşenlerini kullanarak yeni bir tarih oluştur (saat 12:00)
          const year = date.getFullYear();
          const month = date.getMonth(); 
          const day = date.getDate();
          
          // Tam öğle saatini kullanarak oluştur (zaman dilimi sorunlarını önlemek için)
          const fixedDate = new Date(year, month, day, 12, 0, 0);
          
          // ISO formatında tarih kısmını al (YYYY-MM-DD)
          processedParams.checkInDate = fixedDate.toISOString().split('T')[0];
        } catch (e) {
          console.error('Error formatting checkInDate:', e);
        }
        
        console.log('Frontend - Normalized checkInDate:', processedParams.checkInDate);
      }

      if (processedParams.checkOutDate) {
        console.log('Frontend - Raw checkOutDate:', processedParams.checkOutDate);
        
        try {
          let date;
          
          if (processedParams.checkOutDate instanceof Date) {
            // Tarih bir Date nesnesi ise
            date = processedParams.checkOutDate;
          } else {
            // Tarih bir string ise
            date = new Date(processedParams.checkOutDate);
          }
          
          // Yerel tarih bileşenlerini kullanarak yeni bir tarih oluştur (saat 12:00)
          const year = date.getFullYear();
          const month = date.getMonth(); 
          const day = date.getDate();
          
          // Tam öğle saatini kullanarak oluştur (zaman dilimi sorunlarını önlemek için)
          const fixedDate = new Date(year, month, day, 12, 0, 0);
          
          // ISO formatında tarih kısmını al (YYYY-MM-DD)
          processedParams.checkOutDate = fixedDate.toISOString().split('T')[0];
        } catch (e) {
          console.error('Error formatting checkOutDate:', e);
        }
        
        console.log('Frontend - Normalized checkOutDate:', processedParams.checkOutDate);
      }

      if (processedParams.status === 'exclude-checked-out') {
        processedParams.excludeCheckedOut = true;
        delete processedParams.status; // Status parametresini kaldır
      }

      // customerId varsa customerName'i gönderme, sadece ID ile arama yap
      if (processedParams.customerId) {
        delete processedParams.customerName; // CustomerName parametresini kaldır
      }

      console.log('Fetching reservations with final params:', processedParams);
      const response = await reservationService.getAll(processedParams);
      console.log('Reservation response:', response.data);
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
    customerId: null,
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
  },
  total: 0
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
        if (action.payload.data) {
          // API yeni formatta veri dönüyorsa
          state.reservations = action.payload.data;
          // API artık pagination olmadan tüm veriyi dönüyor
          state.reservations = action.payload.data || action.payload;
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
  clearFilters
} = reservationSlice.actions;

export default reservationSlice.reducer;
