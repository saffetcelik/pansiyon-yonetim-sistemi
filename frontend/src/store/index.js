import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import roomSlice from './slices/roomSlice';
import customerSlice from './slices/customerSlice';
import reservationSlice from './slices/reservationSlice';
import productSlice from './slices/productSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    rooms: roomSlice,
    customers: customerSlice,
    reservations: reservationSlice,
    products: productSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
