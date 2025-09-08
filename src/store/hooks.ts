import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Hook useDispatch typé
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Hook useSelector typé
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hook pour obtenir l'état d'authentification
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isInitialized: auth.isInitialized,
    error: auth.error,
    isEmailVerified: auth.isEmailVerified,
  };
};

// Hook pour obtenir le profil utilisateur
export const useUserProfile = () => {
  const user = useAppSelector((state) => state.user);
  return {
    profile: user.profile,
    users: user.users,
    isLoading: user.isLoading,
    error: user.error,
    uploadingAvatar: user.uploadingAvatar,
  };
};

// Hook pour obtenir les donations
export const useDonations = () => {
  const donation = useAppSelector((state) => state.donation);
  return {
    donations: donation.donations,
    myDonations: donation.myDonations,
    currentDonation: donation.currentDonation,
    isLoading: donation.isLoading,
    isProcessingPayment: donation.isProcessingPayment,
    error: donation.error,
  };
};

// Hook pour obtenir les événements
export const useEvents = () => {
  const event = useAppSelector((state) => state.event);
  return {
    events: event.events,
    myEvents: event.myEvents,
    currentEvent: event.currentEvent,
    isLoading: event.isLoading,
    error: event.error,
  };
};

// Hook pour obtenir les notifications
export const useNotifications = () => {
  const notification = useAppSelector((state) => state.notification);
  return {
    notifications: notification.notifications,
    unreadCount: notification.unreadCount,
    isVisible: notification.isVisible,
    current: notification.current,
  };
};

// Hook pour obtenir l'état du réseau
export const useNetwork = () => {
  const network = useAppSelector((state) => state.network);
  return {
    isConnected: network.isConnected,
    connectionType: network.connectionType,
    isOnline: network.isOnline,
    pendingRequests: network.pendingRequests,
    lastSyncTime: network.lastSyncTime,
  };
};

// Hook pour obtenir les rapports
export const useReports = () => {
  const report = useAppSelector((state) => state.report);
  return {
    reports: report.reports,
    dashboardStats: report.dashboardStats,
    currentReport: report.currentReport,
    isGenerating: report.isGenerating,
    isLoading: report.isLoading,
    error: report.error,
    filters: report.filters,
  };
}; 