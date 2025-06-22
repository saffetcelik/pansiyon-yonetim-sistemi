import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { roomService } from '../services/roomService';

// Async thunks
export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const result = await roomService.getAllRooms();
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRoomStatus = createAsyncThunk(
  'rooms/updateRoomStatus',
  async ({ roomId, status }, { rejectWithValue }) => {
    try {
      const result = await roomService.updateRoomStatus(roomId, status);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRoomStatusSummary = createAsyncThunk(
  'rooms/fetchRoomStatusSummary',
  async (_, { rejectWithValue }) => {
    try {
      const result = await roomService.getRoomStatusSummary();
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const result = await roomService.createRoom(roomData);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ roomId, roomData }, { rejectWithValue }) => {
    try {
      const result = await roomService.updateRoom(roomId, roomData);
      if (result.success) {
        return result.data;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  rooms: [],
  statusSummary: [],
  selectedRoom: null,
  loading: false,
  error: null,
  lastUpdated: null,
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
    // Optimistic update for room status
    updateRoomStatusOptimistic: (state, action) => {
      const { roomId, status } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.status = status;
        room.updatedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms cases
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update room status cases
      .addCase(updateRoomStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRoom = action.payload;
        const index = state.rooms.findIndex(r => r.id === updatedRoom.id);
        if (index !== -1) {
          state.rooms[index] = updatedRoom;
        }
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(updateRoomStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch status summary cases
      .addCase(fetchRoomStatusSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomStatusSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.statusSummary = action.payload;
        state.error = null;
      })
      .addCase(fetchRoomStatusSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create room cases
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms.push(action.payload);
        state.error = null;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update room cases
      .addCase(updateRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRoom = action.payload;
        const index = state.rooms.findIndex(r => r.id === updatedRoom.id);
        if (index !== -1) {
          state.rooms[index] = updatedRoom;
        }
        state.error = null;
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setSelectedRoom, 
  clearSelectedRoom, 
  updateRoomStatusOptimistic 
} = roomSlice.actions;

export default roomSlice.reducer;
