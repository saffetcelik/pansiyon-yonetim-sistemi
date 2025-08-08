import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerService } from '../../services/api';

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params, { rejectWithValue }) => {
    try {
      console.log('Calling customerService.getAll with params:', params);
      
      // API servisini çağır
      const response = await customerService.getAll(params);
      console.log('Got response from API:', response);
      
      // API yanıtını kontrol et - yapısal olarak doğru mu?
      if (!response) {
        console.error('API response is null or undefined');
        return [];
      }
      
      // Veri formatını analiz et
      let customersData;
      if (Array.isArray(response.data)) {
        console.log(`Response.data is an array with ${response.data.length} items`);
        customersData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        console.log(`Response.data.data is an array with ${response.data.data.length} items`);
        customersData = response.data.data;
      } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log(`Response.data.items is an array with ${response.data.items.length} items`);
        customersData = response.data.items;
      } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
        console.log(`Response.data.customers is an array with ${response.data.customers.length} items`);
        customersData = response.data.customers;
      } else if (response.data && typeof response.data === 'object') {
        console.log('Response.data is an object, checking for array properties');
        // Nesne içindeki herhangi bir dizi özelliğini bulma girişimi
        const arrayProps = Object.entries(response.data)
          .find(([key, value]) => Array.isArray(value) && value.length > 0);
        
        if (arrayProps) {
          console.log(`Found array property: ${arrayProps[0]} with ${arrayProps[1].length} items`);
          customersData = arrayProps[1];
        } else {
          console.error('Could not find any array property in response.data object');
          customersData = [];
        }
      } else {
        console.error('Response data structure is unexpected:', response.data);
        customersData = [];
      }
      
      if (customersData.length === 0) {
        console.warn('No customers data found in the response');
        // Geliştirme ortamı için test verisi
        if (process.env.NODE_ENV !== 'production' && process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          console.log('Using mock data for development');
          customersData = [
            { 
              id: 'test-1', 
              firstName: 'Ahmet', 
              lastName: 'Yılmaz', 
              phone: '5551112233', 
              email: 'ahmet@example.com',
              tcKimlikNo: '12345678901',
              nationality: 'TC',
              address: 'İstanbul',
              notes: 'VIP Müşteri'
            },
            { 
              id: 'test-2', 
              firstName: 'Ayşe', 
              lastName: 'Demir', 
              phone: '5559998877', 
              email: 'ayse@example.com',
              tcKimlikNo: '98765432109',
              nationality: 'TC',
              address: 'Ankara',
              notes: 'Düzenli müşteri'
            }
          ];
        }
      }
      
      console.log('Final customers data:', customersData);
      return customersData;
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Geliştirme ortamı için test verisi
      if (process.env.NODE_ENV !== 'production') {
        console.log('Returning mock data due to error in development environment');
        return [
          { 
            id: 'err-1', 
            firstName: 'Hata', 
            lastName: 'Test', 
            phone: '5551112233', 
            email: 'hata@example.com',
            tcKimlikNo: '11122233344',
            nationality: 'TC',
            address: 'Test Şehri',
            notes: 'Bu veri API hatası sonrası oluşturuldu'
          }
        ];
      }
      
      return rejectWithValue(error.response?.data?.message || 'Müşteriler yüklenemedi. API hatası: ' + error.message);
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
        
        // Veri yapısını kontrol et ve uygun şekilde ayıkla
        let customersData;
        
        if (Array.isArray(action.payload)) {
          customersData = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          customersData = action.payload.data;
        } else if (action.payload && typeof action.payload === 'object') {
          // Nesne içindeki data alanını kontrol et
          customersData = action.payload.data || [];
        } else {
          customersData = [];
        }
        
        state.customers = customersData;
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
