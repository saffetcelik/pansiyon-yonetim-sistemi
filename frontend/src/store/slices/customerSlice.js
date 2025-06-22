import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../services/api';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await customerService.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteriler yüklenemedi');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await customerService.create(customerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteri oluşturulamadı');
    }
  }
);

const initialState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      });
  },
});

export const { clearError, setSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;
