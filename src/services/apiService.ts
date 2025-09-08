import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG_CENTRALIZED, currentConfig, ENDPOINTS, ERROR_MESSAGES } from '../config/api';

// Extension de l'interface Axios pour ajouter des propriétés personnalisées
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
    _retryCount?: number;
  }
}

// Clés de stockage
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Interface pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

// Interface pour les options de requête
interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  timeout?: number;
  retries?: number;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

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

  private setupInterceptors() {
    // Intercepteur pour les requêtes - ajout automatique du token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        
        if (token && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Logging en mode développement
        if (currentConfig.enableLogging && __DEV__) {
          console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            data: config.data,
            params: config.params,
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour les réponses - gestion du refresh token et retry
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Logging en mode développement
        if (currentConfig.enableLogging && __DEV__) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Gestion du refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Si un refresh est déjà en cours, mettre en queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              const response = await this.axiosInstance.post(ENDPOINTS.AUTH.REFRESH, {
                refreshToken,
              }, { skipAuth: true } as any);

              const { token, refreshToken: newRefreshToken } = response.data.data;

              await this.setTokens(token, newRefreshToken);

              // Traiter la queue des requêtes en attente
              this.processQueue(null, token);

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.clearTokens();
            // Rediriger vers la connexion ou déclencher une action Redux
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Retry logic pour les erreurs réseau
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        // Logging des erreurs
        if (currentConfig.enableLogging && __DEV__) {
          console.error(`❌ API Error: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

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

  private shouldRetry(error: any, config: any): boolean {
    if (config._retryCount >= (currentConfig.retryAttempts || 2)) {
      return false;
    }

    // Retry sur les erreurs réseau ou les erreurs serveur temporaires
    const retryableErrors = ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET'];
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    return (
      retryableErrors.includes(error.code) ||
      retryableStatusCodes.includes(error.response?.status)
    );
  }

  private async retryRequest(config: any): Promise<any> {
    config._retryCount = (config._retryCount || 0) + 1;
    
    // Délai exponentiel entre les tentatives
    const delay = Math.pow(2, config._retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.axiosInstance(config);
  }

  private normalizeError(error: any) {
    if (error.response) {
      // Erreur avec réponse du serveur
      return {
        status: error.response.status,
        message: error.response.data?.error || error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR,
        data: error.response.data,
      };
    } else if (error.request) {
      // Erreur réseau
      return {
        status: 0,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        data: null,
      };
    } else {
      // Autre erreur
      return {
        status: 0,
        message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        data: null,
      };
    }
  }

  // Méthodes HTTP publiques
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.get(url, options);
  }

  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.post(url, data, options);
  }

  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.put(url, data, options);
  }

  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.patch(url, data, options);
  }

  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.axiosInstance.delete(url, options);
  }

  // Méthodes utilitaires pour les tokens
  async setTokens(token: string, refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async clearTokens(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Configuration dynamique
  updateConfig(newConfig: Partial<typeof currentConfig>): void {
    Object.assign(currentConfig, newConfig);
    this.axiosInstance.defaults.baseURL = currentConfig.baseURL;
    this.axiosInstance.defaults.timeout = currentConfig.timeout;
  }

  // Obtenir l'instance Axios brute si nécessaire
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Obtenir la configuration actuelle
  getConfig() {
    return { ...currentConfig };
  }

  // Méthodes de convenance pour les endpoints communs
  auth = {
    login: (credentials: any) => this.post(ENDPOINTS.AUTH.LOGIN, credentials),
    register: (userData: any) => this.post(ENDPOINTS.AUTH.REGISTER, userData),
    logout: () => this.post(ENDPOINTS.AUTH.LOGOUT),
    refresh: (refreshToken: string) => this.post(ENDPOINTS.AUTH.REFRESH, { refreshToken }),
    forgotPassword: (email: string) => this.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
    resetPassword: (token: string, password: string) => this.post(ENDPOINTS.AUTH.RESET_PASSWORD, { token, password }),
    changePassword: (oldPassword: string, newPassword: string) => this.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, { oldPassword, newPassword }),
    me: () => this.get(ENDPOINTS.AUTH.ME),
  };

  users = {
    getProfile: () => this.get(ENDPOINTS.USERS.PROFILE),
    updateProfile: (data: any) => this.put(ENDPOINTS.USERS.PROFILE, data),
    uploadAvatar: (formData: FormData) => this.post(ENDPOINTS.USERS.UPLOAD_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadAvatarBase64: (imageData: string, filename?: string) => this.post(ENDPOINTS.USERS.UPLOAD_AVATAR_BASE64, {
      imageData,
      filename
    }),
  };

  donations = {
    getAll: (params?: any) => this.get(ENDPOINTS.DONATIONS.ALL, { params }),
    getMy: () => this.get(ENDPOINTS.DONATIONS.MY_DONATIONS),
    getById: (id: string) => this.get(ENDPOINTS.DONATIONS.BY_ID(id)),
    create: (data: any) => this.post(ENDPOINTS.DONATIONS.CREATE, data),
    processPayment: (data: any) => this.post(ENDPOINTS.DONATIONS.PROCESS_PAYMENT, data),
  };
}

// Instance singleton
const apiService = new ApiService();

export default apiService;
export { ApiService };
export type { ApiResponse, RequestOptions }; 