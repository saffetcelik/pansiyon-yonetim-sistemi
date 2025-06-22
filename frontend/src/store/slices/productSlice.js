import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../services/api';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productService.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ürünler yüklenemedi');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productService.create(productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ürün oluşturulamadı');
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  lowStockProducts: [],
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      });
  },
});

export const { clearError, setSelectedProduct } = productSlice.actions;
export default productSlice.reducer;
