import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingRequests: Array<{
    id: string;
    url: string;
    method: string;
    data: any;
    timestamp: string;
  }>;
}

const initialState: NetworkState = {
  isConnected: true,
  connectionType: null,
  isOnline: true,
  lastSyncTime: null,
  pendingRequests: [],
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<{ isConnected: boolean; connectionType: string | null }>) => {
      state.isConnected = action.payload.isConnected;
      state.connectionType = action.payload.connectionType;
      state.isOnline = action.payload.isConnected;
    },
    addPendingRequest: (state, action: PayloadAction<{
      id: string;
      url: string;
      method: string;
      data: any;
    }>) => {
      state.pendingRequests.push({
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    removePendingRequest: (state, action: PayloadAction<string>) => {
      state.pendingRequests = state.pendingRequests.filter(req => req.id !== action.payload);
    },
    clearPendingRequests: (state) => {
      state.pendingRequests = [];
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  addPendingRequest,
  removePendingRequest,
  clearPendingRequests,
  setLastSyncTime,
} = networkSlice.actions;

export default networkSlice.reducer; 