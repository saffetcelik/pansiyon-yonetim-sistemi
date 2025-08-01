import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../services/api';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      console.log('Calling customerService.getAll with params:', params);
      const response = await customerService.getAll(params);
      console.log('Got response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
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
  error: null
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
        console.log('fetchCustomers.fulfilled payload:', action.payload);
        state.customers = Array.isArray(action.payload) ? action.payload : [];
        console.log('Updated state.customers:', state.customers);
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
