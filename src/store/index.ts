import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des slices
import authSlice, { forceLogout } from './slices/authSlice';
import userSlice from './slices/userSlice';
import donationSlice from './slices/donationSlice';
import eventSlice from './slices/eventSlice';
import reportSlice from './slices/reportSlice';
import notificationSlice from './slices/notificationSlice';
import networkSlice from './slices/networkSlice';
import ministrySlice from './slices/ministrySlice';

// Import des APIs RTK Query
import { avatarApi } from './services/avatarService';

// Import du callback de déconnexion forcée
import { setForceLogoutCallback } from './services/apiClient';

// Configuration de persistance
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'],
  blacklist: ['network', 'notification', 'avatarApi'],
};

const appReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  donation: donationSlice,
  event: eventSlice,
  report: reportSlice,
  notification: notificationSlice,
  network: networkSlice,
  ministry: ministrySlice,
  [avatarApi.reducerPath]: avatarApi.reducer,
});

// Wrapper qui remet tous les slices à zéro lors d'un logout
// Cela évite que les données d'un utilisateur restent en mémoire après déconnexion
const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout/fulfilled' || action.type === 'auth/forceLogout') {
    // Conserver uniquement l'état réseau, tout le reste est réinitialisé
    const networkState = state?.network;
    state = { network: networkState };
  }
  return appReducer(state, action);
};

// Reducer persisté
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuration du store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(avatarApi.middleware),
  devTools: __DEV__,
});

// Brancher le callback de déconnexion forcée dans apiClient
// Quand le refresh token est invalide/expiré, Redux est notifié proprement
setForceLogoutCallback(() => {
  store.dispatch(forceLogout());
});

// Persistor pour la sauvegarde
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;