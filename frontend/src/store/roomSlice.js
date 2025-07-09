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

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      const result = await roomService.deleteRoom(roomId);
      if (result.success) {
        return roomId; // Return the id of the deleted room on success
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
    selectRoom: (state, action) => {
      state.selectedRoom = action.payload;
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
        state.lastUpdated = Date.now();
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update room status cases
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(room => room.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      // Fetch status summary cases
      .addCase(fetchRoomStatusSummary.fulfilled, (state, action) => {
        state.statusSummary = action.payload;
      })
      // Create room cases
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload);
        state.rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
      })
      // Update room cases
      .addCase(updateRoom.fulfilled, (state, action) => {
        const index = state.rooms.findIndex(room => room.id === action.payload.id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
        state.rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
      })
      // Delete room cases
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter(room => room.id !== action.payload);
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
