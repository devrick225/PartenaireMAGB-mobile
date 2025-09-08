import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des slices
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import donationSlice from './slices/donationSlice';
import eventSlice from './slices/eventSlice';
import reportSlice from './slices/reportSlice';
import notificationSlice from './slices/notificationSlice';
import networkSlice from './slices/networkSlice';
import ministrySlice from './slices/ministrySlice';

// Import des APIs RTK Query
import { avatarApi } from './services/avatarService';

// Configuration de persistance
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Seuls ces reducers seront persistés
  blacklist: ['network', 'notification', 'avatarApi'], // Ces reducers ne seront pas persistés
};

// Combinaison des reducers
const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  donation: donationSlice,
  event: eventSlice,
  report: reportSlice,
  notification: notificationSlice,
  network: networkSlice,
  ministry: ministrySlice,
  // APIs RTK Query
  [avatarApi.reducerPath]: avatarApi.reducer,
});

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
    })
    .concat(avatarApi.middleware), // Ajouter le middleware de l'API
  devTools: __DEV__, // Outils de développement seulement en dev
});

// Persistor pour la sauvegarde
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 