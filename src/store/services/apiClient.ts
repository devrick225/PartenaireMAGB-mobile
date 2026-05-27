import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currentConfig } from '../../config/api';

// Clés de stockage
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Callback de déconnexion forcée — branché depuis le store Redux
let onForceLogout: (() => void) | null = null;

export const setForceLogoutCallback = (callback: () => void) => {
  onForceLogout = callback;
};

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  // File d'attente des requêtes en attente pendant le refresh
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: currentConfig.baseURL,
      timeout: currentConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Résoudre ou rejeter toutes les requêtes en attente
  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private setupInterceptors() {
    // Intercepteur pour les requêtes - ajout automatique du token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour les réponses - gestion du refresh token
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        // Ignorer les erreurs 401 sur la route de refresh elle-même
        // pour éviter une boucle infinie
        if (
          error.response?.status === 401 &&
          originalRequest.url?.includes('/auth/refresh')
        ) {
          await this.clearTokens();
          if (onForceLogout) onForceLogout();
          return Promise.reject(error);
        }

        // Pour toute autre requête avec 401 et pas encore retentée
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Si un refresh est déjà en cours, mettre la requête en file d'attente
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

            if (!refreshToken) {
              // Pas de refresh token → déconnexion immédiate
              this.processQueue(new Error('Pas de refresh token'), null);
              await this.clearTokens();
              if (onForceLogout) onForceLogout();
              return Promise.reject(error);
            }

            // Appel direct axios (pas this.axiosInstance) pour éviter
            // que l'intercepteur ne se déclenche à nouveau
            const response = await axios.post(
              `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            const { token: newToken, refreshToken: newRefreshToken } =
              response.data.data;

            await AsyncStorage.setItem(TOKEN_KEY, newToken);
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

            // Mettre à jour le header par défaut
            this.axiosInstance.defaults.headers.common['Authorization'] =
              `Bearer ${newToken}`;

            // Débloquer toutes les requêtes en attente
            this.processQueue(null, newToken);

            // Relancer la requête originale
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh échoué → déconnexion propre
            this.processQueue(refreshError, null);
            await this.clearTokens();
            if (onForceLogout) onForceLogout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Méthodes HTTP
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.delete(url, config);
  }

  // Gestion des tokens
  async setTokens(token: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Instance singleton
const apiClient = new ApiClient();

export default apiClient;
export type { ApiResponse };