import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import eventService from '../services/eventService';

// Types
interface Event {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  prix?: number;
  capaciteMax?: number;
  inscriptionsCount: number;
  image?: string;
  organisateurId: string;
  organisateur?: {
    nom: string;
    prenom: string;
    email: string;
  };
  statut: 'draft' | 'published' | 'cancelled' | 'completed';
  type: 'conference' | 'formation' | 'reunion' | 'celebration' | 'autre';
  isPublic: boolean;
  requiresApproval: boolean;
  tags: string[];
  dateCreation: string;
  dateModification: string;
}

interface EventInscription {
  id: string;
  eventId: string;
  userId: string;
  statut: 'pending' | 'approved' | 'rejected' | 'cancelled';
  dateInscription: string;
  user?: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

interface EventState {
  events: Event[];
  myEvents: Event[];
  myInscriptions: EventInscription[];
  currentEvent: Event | null;
  inscriptions: EventInscription[];
  isLoading: boolean;
  isCreatingEvent: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// État initial
const initialState: EventState = {
  events: [],
  myEvents: [],
  myInscriptions: [],
  currentEvent: null,
  inscriptions: [],
  isLoading: false,
  isCreatingEvent: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Actions asynchrones
export const getEvents = createAsyncThunk(
  'event/getEvents',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await eventService.getEvents(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  }
);

export const getEventById = createAsyncThunk(
  'event/getById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventService.getEventById(eventId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération de l\'événement');
    }
  }
);

export const createEvent = createAsyncThunk(
  'event/create',
  async (eventData: any, { rejectWithValue }) => {
    try {
      const response = await eventService.createEvent(eventData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'event/update',
  async (data: { eventId: string; eventData: Partial<Event> }, { rejectWithValue }) => {
    try {
      const response = await eventService.updateEvent(data.eventId, data.eventData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'événement');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'event/delete',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventService.deleteEvent(eventId);
      return eventId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression de l\'événement');
    }
  }
);

export const inscribeToEvent = createAsyncThunk(
  'event/inscribe',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventService.inscribeToEvent(eventId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  }
);

export const cancelInscription = createAsyncThunk(
  'event/cancelInscription',
  async (inscriptionId: string, { rejectWithValue }) => {
    try {
      await eventService.cancelInscription(inscriptionId);
      return inscriptionId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  }
);

export const getMyEvents = createAsyncThunk(
  'event/getMyEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventService.getMyEvents();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  }
);

export const getMyInscriptions = createAsyncThunk(
  'event/getMyInscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventService.getMyInscriptions();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération de vos inscriptions');
    }
  }
);

export const getEventInscriptions = createAsyncThunk(
  'event/getEventInscriptions',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventService.getEventInscriptions(eventId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des inscriptions');
    }
  }
);

export const approveInscription = createAsyncThunk(
  'event/approveInscription',
  async (inscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await eventService.approveInscription(inscriptionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  }
);

export const rejectInscription = createAsyncThunk(
  'event/rejectInscription',
  async (inscriptionId: string, { rejectWithValue }) => {
    try {
      const response = await eventService.rejectInscription(inscriptionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du rejet');
    }
  }
);

// Slice
const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentEvent: (state, action: PayloadAction<Event | null>) => {
      state.currentEvent = action.payload;
    },
    clearEvents: (state) => {
      state.events = [];
      state.myEvents = [];
      state.myInscriptions = [];
      state.inscriptions = [];
    },
    updateEventLocally: (state, action: PayloadAction<Event>) => {
      const updatedEvent = action.payload;
      
      // Mise à jour dans la liste générale
      const eventIndex = state.events.findIndex(e => e.id === updatedEvent.id);
      if (eventIndex !== -1) {
        state.events[eventIndex] = updatedEvent;
      }
      
      // Mise à jour dans mes événements
      const myEventIndex = state.myEvents.findIndex(e => e.id === updatedEvent.id);
      if (myEventIndex !== -1) {
        state.myEvents[myEventIndex] = updatedEvent;
      }
      
      // Mise à jour de l'événement courant
      if (state.currentEvent && state.currentEvent.id === updatedEvent.id) {
        state.currentEvent = updatedEvent;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events || action.payload;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Get Event By ID
    builder
      .addCase(getEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
        state.error = null;
      })
      .addCase(getEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

    // Create Event
    builder
      .addCase(createEvent.pending, (state) => {
        state.isCreatingEvent = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isCreatingEvent = false;
        state.myEvents.push(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isCreatingEvent = false;
        state.error = action.payload as string;
      })

    // Update Event
    builder
      .addCase(updateEvent.fulfilled, (state, action) => {
        const updatedEvent = action.payload;
        
        // Mise à jour dans la liste générale
        const eventIndex = state.events.findIndex(e => e.id === updatedEvent.id);
        if (eventIndex !== -1) {
          state.events[eventIndex] = updatedEvent;
        }
        
        // Mise à jour dans mes événements
        const myEventIndex = state.myEvents.findIndex(e => e.id === updatedEvent.id);
        if (myEventIndex !== -1) {
          state.myEvents[myEventIndex] = updatedEvent;
        }
        
        // Mise à jour de l'événement courant
        if (state.currentEvent && state.currentEvent.id === updatedEvent.id) {
          state.currentEvent = updatedEvent;
        }
      })

    // Delete Event
    builder
      .addCase(deleteEvent.fulfilled, (state, action) => {
        const eventId = action.payload;
        state.events = state.events.filter(e => e.id !== eventId);
        state.myEvents = state.myEvents.filter(e => e.id !== eventId);
        if (state.currentEvent && state.currentEvent.id === eventId) {
          state.currentEvent = null;
        }
      })

    // Inscribe to Event
    builder
      .addCase(inscribeToEvent.fulfilled, (state, action) => {
        state.myInscriptions.push(action.payload);
        
        // Mise à jour du compteur d'inscriptions
        if (state.currentEvent && state.currentEvent.id === action.payload.eventId) {
          state.currentEvent.inscriptionsCount += 1;
        }
      })

    // Cancel Inscription
    builder
      .addCase(cancelInscription.fulfilled, (state, action) => {
        const inscriptionId = action.payload;
        state.myInscriptions = state.myInscriptions.filter(i => i.id !== inscriptionId);
        state.inscriptions = state.inscriptions.filter(i => i.id !== inscriptionId);
      })

    // Get My Events
    builder
      .addCase(getMyEvents.fulfilled, (state, action) => {
        state.myEvents = action.payload.events || action.payload;
      })

    // Get My Inscriptions
    builder
      .addCase(getMyInscriptions.fulfilled, (state, action) => {
        state.myInscriptions = action.payload;
      })

    // Get Event Inscriptions
    builder
      .addCase(getEventInscriptions.fulfilled, (state, action) => {
        state.inscriptions = action.payload;
      })

    // Approve Inscription
    builder
      .addCase(approveInscription.fulfilled, (state, action) => {
        const approvedInscription = action.payload;
        const index = state.inscriptions.findIndex(i => i.id === approvedInscription.id);
        if (index !== -1) {
          state.inscriptions[index] = approvedInscription;
        }
      })

    // Reject Inscription
    builder
      .addCase(rejectInscription.fulfilled, (state, action) => {
        const rejectedInscription = action.payload;
        const index = state.inscriptions.findIndex(i => i.id === rejectedInscription.id);
        if (index !== -1) {
          state.inscriptions[index] = rejectedInscription;
        }
      });
  },
});

export const { 
  clearError, 
  setCurrentEvent, 
  clearEvents, 
  updateEventLocally 
} = eventSlice.actions;

export default eventSlice.reducer; 