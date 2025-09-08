import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ReportData {
  id: string;
  title: string;
  type: 'donation' | 'event' | 'user' | 'financial';
  data: any;
  dateGenerated: string;
  filters: Record<string, any>;
}

interface DashboardStats {
  totalDonations: number;
  totalEvents: number;
  totalUsers: number;
  totalAmount: number;
  monthlyDonations: number;
  monthlyEvents: number;
  topDonors: Array<{ name: string; amount: number }>;
  recentActivities: Array<{ type: string; description: string; date: string }>;
}

interface ReportState {
  reports: ReportData[];
  dashboardStats: DashboardStats | null;
  currentReport: ReportData | null;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  filters: {
    dateRange: {
      start: string | null;
      end: string | null;
    };
    type: string | null;
    category: string | null;
  };
}

const initialState: ReportState = {
  reports: [],
  dashboardStats: null,
  currentReport: null,
  isGenerating: false,
  isLoading: false,
  error: null,
  filters: {
    dateRange: {
      start: null,
      end: null,
    },
    type: null,
    category: null,
  },
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    addReport: (state, action: PayloadAction<ReportData>) => {
      state.reports.unshift(action.payload);
    },
    setCurrentReport: (state, action: PayloadAction<ReportData | null>) => {
      state.currentReport = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<ReportState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.filters.dateRange = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        dateRange: { start: null, end: null },
        type: null,
        category: null,
      };
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    removeReport: (state, action: PayloadAction<string>) => {
      state.reports = state.reports.filter(report => report.id !== action.payload);
      if (state.currentReport && state.currentReport.id === action.payload) {
        state.currentReport = null;
      }
    },
    clearReports: (state) => {
      state.reports = [];
      state.currentReport = null;
    },
    updateDashboardStat: (state, action: PayloadAction<{ key: keyof DashboardStats; value: any }>) => {
      if (state.dashboardStats) {
        (state.dashboardStats as any)[action.payload.key] = action.payload.value;
      }
    },
  },
});

export const {
  setDashboardStats,
  addReport,
  setCurrentReport,
  updateFilters,
  setDateRange,
  clearFilters,
  setGenerating,
  setLoading,
  setError,
  clearError,
  removeReport,
  clearReports,
  updateDashboardStat,
} = reportSlice.actions;

export default reportSlice.reducer; 