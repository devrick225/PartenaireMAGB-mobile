import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import donationService from '../services/donationService';

// Types
interface Donation {
  id: string;
  userId: string;
  montant: number;
  devise: string;
  methodePaiement: 'stripe' | 'paypal' | 'cinetpay' | 'moneyfusion';
  statut: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transactionId?: string;
  reference: string;
  description?: string;
  categorieId?: string;
  isAnonymous: boolean;
  dateCreation: string;
  dateCompletion?: string;
  metadata?: Record<string, any>;
  user?: {
    nom: string;
    prenom: string;
    email: string;
  };
  categorie?: {
    nom: string;
    description: string;
  };
}

interface DonationCategory {
  id: string;
  nom: string;
  description: string;
  objectif?: number;
  montantCollecte: number;
  isActive: boolean;
  dateCreation: string;
  dateEcheance?: string;
}

interface DonationStats {
  totalDonations: number;
  totalMontant: number;
  donationsThisMonth: number;
  montantThisMonth: number;
  topDonors: Array<{
    userId: string;
    nom: string;
    prenom: string;
    totalDonations: number;
    totalMontant: number;
  }>;
  donationsByCategory: Array<{
    categorieId: string;
    nom: string;
    count: number;
    montant: number;
  }>;
}

interface DonationState {
  donations: Donation[];
  myDonations: Donation[];
  categories: DonationCategory[];
  stats: DonationStats | null;
  currentDonation: Donation | null;
  isLoading: boolean;
  isProcessingPayment: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// État initial
const initialState: DonationState = {
  donations: [],
  myDonations: [],
  categories: [],
  stats: null,
  currentDonation: null,
  isLoading: false,
  isProcessingPayment: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Actions asynchrones
export const createDonation = createAsyncThunk(
  'donation/create',
  async (donationData: any, { rejectWithValue }) => {
    try {
      const response = await donationService.createDonation(donationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const processPayment = createAsyncThunk(
  'donation/processPayment',
  async (paymentData: {
    donationId: string;
    paymentMethod: string;
    paymentDetails: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.processPayment(paymentData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du traitement du paiement');
    }
  }
);

export const getDonations = createAsyncThunk(
  'donation/getDonations',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await donationService.getDonations(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  }
);

export const getMyDonations = createAsyncThunk(
  'donation/getMyDonations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await donationService.getMyDonations();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  }
);

export const getDonationById = createAsyncThunk(
  'donation/getById',
  async (donationId: string, { rejectWithValue }) => {
    try {
      const response = await donationService.getDonationById(donationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération de la donation');
    }
  }
);

export const getCategories = createAsyncThunk(
  'donation/getCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await donationService.getCategories();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des catégories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'donation/createCategory',
  async (categoryData: {
    nom: string;
    description: string;
    objectif?: number;
    dateEcheance?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await donationService.createCategory(categoryData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création de la catégorie');
    }
  }
);

export const getDonationStats = createAsyncThunk(
  'donation/getStats',
  async (params: { startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const response = await donationService.getStats(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
    }
  }
);

export const refundDonation = createAsyncThunk(
  'donation/refund',
  async (data: { donationId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await donationService.refundDonation(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du remboursement');
    }
  }
);

// Slice
const donationSlice = createSlice({
  name: 'donation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDonation: (state, action: PayloadAction<Donation | null>) => {
      state.currentDonation = action.payload;
    },
    updateDonationStatus: (state, action: PayloadAction<{ donationId: string; status: string }>) => {
      const { donationId, status } = action.payload;
      const donation = state.donations.find(d => d.id === donationId);
      if (donation) {
        donation.statut = status as any;
      }
    },
    clearDonations: (state) => {
      state.donations = [];
      state.myDonations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDonation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDonation = action.payload;
      })
      .addCase(createDonation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(processPayment.pending, (state) => {
        state.isProcessingPayment = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessingPayment = false;
        if (state.currentDonation) {
          state.currentDonation = action.payload;
        }
        state.error = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessingPayment = false;
        state.error = action.payload as string;
      })
      .addCase(getDonations.fulfilled, (state, action) => {
        state.donations = action.payload.donations || action.payload;
        state.pagination = action.payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
      })
      .addCase(getMyDonations.fulfilled, (state, action) => {
        state.myDonations = action.payload.donations || action.payload;
      })
      .addCase(getDonationById.fulfilled, (state, action) => {
        state.currentDonation = action.payload;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(getDonationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(refundDonation.fulfilled, (state, action) => {
        const refundedDonation = action.payload;
        const donationIndex = state.donations.findIndex(d => d.id === refundedDonation.id);
        if (donationIndex !== -1) {
          state.donations[donationIndex] = refundedDonation;
        }
        const myDonationIndex = state.myDonations.findIndex(d => d.id === refundedDonation.id);
        if (myDonationIndex !== -1) {
          state.myDonations[myDonationIndex] = refundedDonation;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentDonation, 
  updateDonationStatus, 
  clearDonations 
} = donationSlice.actions;

export default donationSlice.reducer; 