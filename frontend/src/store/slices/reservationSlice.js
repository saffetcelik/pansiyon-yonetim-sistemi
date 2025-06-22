import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reservationService } from '../../services/api';

export const fetchReservations = createAsyncThunk(
  'reservations/fetchReservations',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reservationService.getAll(params);
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

const initialState = {
  reservations: [],
  selectedReservation: null,
  loading: false,
  error: null,
  calendarData: [],
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.reservations.push(action.payload);
      });
  },
});

export const { clearError, setSelectedReservation } = reservationSlice.actions;
export default reservationSlice.reducer;
