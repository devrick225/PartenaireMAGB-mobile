import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import ministryService, { 
  Ministry, 
  MinistryStats, 
  MinistryFilters, 
  CreateMinistryData, 
  UpdateMinistryData 
} from '../services/ministryService';

// Types
interface MinistryState {
  ministries: Ministry[];
  currentMinistry: Ministry | null;
  stats: MinistryStats | null;
  categories: Array<{
    key: string;
    label: string;
    icon: string;
  }>;
  selectedCategory: string;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// État initial
const initialState: MinistryState = {
  ministries: [],
  currentMinistry: null,
  stats: null,
  categories: ministryService.getCategories(),
  selectedCategory: 'all',
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Actions asynchrones
export const fetchAllMinistries = createAsyncThunk(
  'ministry/fetchAll',
  async (filters: MinistryFilters = {}, { rejectWithValue }) => {
    try {
      const response = await ministryService.getAllMinistries(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des ministères');
    }
  }
);

export const fetchMinistriesByCategory = createAsyncThunk(
  'ministry/fetchByCategory',
  async (category: string, { rejectWithValue }) => {
    try {
      const response = await ministryService.getMinistriesByCategory(category);
      return { ...response, category };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des ministères');
    }
  }
);

export const fetchMinistryById = createAsyncThunk(
  'ministry/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await ministryService.getMinistryById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération du ministère');
    }
  }
);

export const createMinistry = createAsyncThunk(
  'ministry/create',
  async (ministryData: CreateMinistryData, { rejectWithValue }) => {
    try {
      const response = await ministryService.createMinistry(ministryData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création du ministère');
    }
  }
);

export const updateMinistry = createAsyncThunk(
  'ministry/update',
  async ({ id, updateData }: { id: string; updateData: UpdateMinistryData }, { rejectWithValue }) => {
    try {
      const response = await ministryService.updateMinistry(id, updateData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du ministère');
    }
  }
);

export const deleteMinistry = createAsyncThunk(
  'ministry/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await ministryService.deleteMinistry(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression du ministère');
    }
  }
);

export const toggleMinistryStatus = createAsyncThunk(
  'ministry/toggleStatus',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await ministryService.toggleMinistryStatus(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  }
);

export const fetchMinistryStats = createAsyncThunk(
  'ministry/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ministryService.getMinistryStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
    }
  }
);

export const searchMinistries = createAsyncThunk(
  'ministry/search',
  async ({ query, filters }: { query: string; filters?: MinistryFilters }, { rejectWithValue }) => {
    try {
      const response = await ministryService.searchMinistries(query, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la recherche');
    }
  }
);

// Slice
const ministrySlice = createSlice({
  name: 'ministry',
  initialState,
  reducers: {
    // Réinitialiser l'état
    resetMinistryState: (state) => {
      state.ministries = [];
      state.currentMinistry = null;
      state.stats = null;
      state.error = null;
      state.pagination = initialState.pagination;
    },

    // Définir la catégorie sélectionnée
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },

    // Définir le ministère actuel
    setCurrentMinistry: (state, action: PayloadAction<Ministry | null>) => {
      state.currentMinistry = action.payload;
    },

    // Effacer l'erreur
    clearError: (state) => {
      state.error = null;
    },

    // Mettre à jour un ministère dans la liste
    updateMinistryInList: (state, action: PayloadAction<Ministry>) => {
      const index = state.ministries.findIndex(m => m._id === action.payload._id);
      if (index !== -1) {
        state.ministries[index] = action.payload;
      }
    },

    // Supprimer un ministère de la liste
    removeMinistryFromList: (state, action: PayloadAction<string>) => {
      state.ministries = state.ministries.filter(m => m._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // fetchAllMinistries
    builder
      .addCase(fetchAllMinistries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllMinistries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ministries = action.payload.data;
        state.error = null;
      })
      .addCase(fetchAllMinistries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchMinistriesByCategory
    builder
      .addCase(fetchMinistriesByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMinistriesByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ministries = action.payload.data;
        state.selectedCategory = action.payload.category;
        state.error = null;
      })
      .addCase(fetchMinistriesByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchMinistryById
    builder
      .addCase(fetchMinistryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMinistryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMinistry = action.payload.data;
        state.error = null;
      })
      .addCase(fetchMinistryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createMinistry
    builder
      .addCase(createMinistry.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createMinistry.fulfilled, (state, action) => {
        state.isCreating = false;
        state.ministries.unshift(action.payload.data);
        state.error = null;
      })
      .addCase(createMinistry.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // updateMinistry
    builder
      .addCase(updateMinistry.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateMinistry.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedMinistry = action.payload.data;
        
        // Mettre à jour dans la liste
        const index = state.ministries.findIndex(m => m._id === updatedMinistry._id);
        if (index !== -1) {
          state.ministries[index] = updatedMinistry;
        }
        
        // Mettre à jour le ministère actuel si c'est le même
        if (state.currentMinistry && state.currentMinistry._id === updatedMinistry._id) {
          state.currentMinistry = updatedMinistry;
        }
        
        state.error = null;
      })
      .addCase(updateMinistry.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // deleteMinistry
    builder
      .addCase(deleteMinistry.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteMinistry.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedId = action.payload;
        
        // Supprimer de la liste
        state.ministries = state.ministries.filter(m => m._id !== deletedId);
        
        // Effacer le ministère actuel si c'est le même
        if (state.currentMinistry && state.currentMinistry._id === deletedId) {
          state.currentMinistry = null;
        }
        
        state.error = null;
      })
      .addCase(deleteMinistry.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // toggleMinistryStatus
    builder
      .addCase(toggleMinistryStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(toggleMinistryStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedMinistry = action.payload.data;
        
        // Mettre à jour dans la liste
        const index = state.ministries.findIndex(m => m._id === updatedMinistry._id);
        if (index !== -1) {
          state.ministries[index] = updatedMinistry;
        }
        
        // Mettre à jour le ministère actuel si c'est le même
        if (state.currentMinistry && state.currentMinistry._id === updatedMinistry._id) {
          state.currentMinistry = updatedMinistry;
        }
        
        state.error = null;
      })
      .addCase(toggleMinistryStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // fetchMinistryStats
    builder
      .addCase(fetchMinistryStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchMinistryStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
        state.error = null;
      })
      .addCase(fetchMinistryStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // searchMinistries
    builder
      .addCase(searchMinistries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchMinistries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ministries = action.payload.data;
        state.error = null;
      })
      .addCase(searchMinistries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  resetMinistryState,
  setSelectedCategory,
  setCurrentMinistry,
  clearError,
  updateMinistryInList,
  removeMinistryFromList,
} = ministrySlice.actions;

// Sélecteurs
export const selectAllMinistries = (state: { ministry: MinistryState }) => state.ministry.ministries;
export const selectCurrentMinistry = (state: { ministry: MinistryState }) => state.ministry.currentMinistry;
export const selectMinistryStats = (state: { ministry: MinistryState }) => state.ministry.stats;
export const selectMinistryCategories = (state: { ministry: MinistryState }) => state.ministry.categories;
export const selectSelectedCategory = (state: { ministry: MinistryState }) => state.ministry.selectedCategory;
export const selectMinistryLoading = (state: { ministry: MinistryState }) => state.ministry.isLoading;
export const selectMinistryCreating = (state: { ministry: MinistryState }) => state.ministry.isCreating;
export const selectMinistryUpdating = (state: { ministry: MinistryState }) => state.ministry.isUpdating;
export const selectMinistryDeleting = (state: { ministry: MinistryState }) => state.ministry.isDeleting;
export const selectMinistryError = (state: { ministry: MinistryState }) => state.ministry.error;

// Sélecteurs dérivés
export const selectMinistriesByCategory = (state: { ministry: MinistryState }, category: string) => {
  if (category === 'all') return state.ministry.ministries;
  return state.ministry.ministries.filter(m => m.category === category);
};

export const selectActiveMinistries = (state: { ministry: MinistryState }) => {
  return state.ministry.ministries.filter(m => m.isActive);
};

export const selectMinistriesWithContact = (state: { ministry: MinistryState }) => {
  return state.ministry.ministries.filter(m => 
    m.contactInfo && (m.contactInfo.phone || m.contactInfo.email)
  );
};

export const selectMinistriesWithMeetings = (state: { ministry: MinistryState }) => {
  return state.ministry.ministries.filter(m => 
    m.meetingInfo && (m.meetingInfo.day || m.meetingInfo.time || m.meetingInfo.location)
  );
};

// Reducer
export default ministrySlice.reducer; 