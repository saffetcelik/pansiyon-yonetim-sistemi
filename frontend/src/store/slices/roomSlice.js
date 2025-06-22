import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomService } from '../../services/api';

// Async thunks
export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roomService.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Odalar yüklenemedi');
    }
  }
);

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await roomService.create(roomData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Oda oluşturulamadı');
    }
  }
);

export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ id, roomData }, { rejectWithValue }) => {
    try {
      const response = await roomService.update(id, roomData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Oda güncellenemedi');
    }
  }
);

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (id, { rejectWithValue }) => {
    try {
      await roomService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Oda silinemedi');
    }
  }
);

export const updateRoomStatus = createAsyncThunk(
  'rooms/updateRoomStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await roomService.updateStatus(id, status);
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Oda durumu güncellenemedi');
    }
  }
);

const initialState = {
  rooms: [],
  selectedRoom: null,
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedRoom: (state, action) => {
      state.selectedRoom = action.payload;
    },
    clearSelectedRoom: (state) => {
      state.selectedRoom = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create room
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload);
      })
      // Update room
      .addCase(updateRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(room => room.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      // Delete room
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter(room => room.id !== action.payload);
      })
      // Update room status
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(room => room.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index].status = action.payload.status;
        }
      });
  },
});

export const { clearError, setSelectedRoom, clearSelectedRoom } = roomSlice.actions;
export default roomSlice.reducer;
