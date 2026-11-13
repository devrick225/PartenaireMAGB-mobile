/**
 * Hook centralisé pour la déconnexion.
 *
 * NE PAS utiliser navigation.reset/navigate('Login') depuis AppNavigator —
 * 'Login' est dans AuthNavigator et n'est pas accessible directement.
 *
 * La bonne approche : dispatcher forceLogout() ou logoutUser().
 * RootNavigator détecte isAuthenticated === false et bascule automatiquement
 * vers AuthNavigator, qui affiche LoginRedux par défaut.
 */

import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { forceLogout, logoutUser } from '../store/slices/authSlice';
import apiClient from '../store/services/apiClient';

export const useLogout = () => {
  const dispatch = useAppDispatch();

  /**
   * Déconnexion normale (appelle l'API logout puis nettoie Redux).
   * RootNavigator redirige automatiquement vers AuthNavigator.
   */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // Même si l'API échoue, forcer la déconnexion locale
      dispatch(forceLogout());
    }
  }, [dispatch]);

  /**
   * Déconnexion forcée immédiate (token expiré, 401, etc.).
   * Ne fait pas d'appel API — nettoie directement Redux + tokens.
   */
  const forceLogoutNow = useCallback(() => {
    dispatch(forceLogout());
  }, [dispatch]);

  /**
   * Gérer une erreur 401/403 : déconnexion forcée immédiate.
   * À utiliser dans les catch des appels API.
   */
  const handleAuthError = useCallback((status?: number) => {
    if (status === 401 || status === 403) {
      dispatch(forceLogout());
      return true; // indique que l'erreur a été gérée
    }
    return false;
  }, [dispatch]);

  return { logout, forceLogoutNow, handleAuthError };
};

export default useLogout;
