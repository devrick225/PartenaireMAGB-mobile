import apiClient from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  city: string;
  language?: string;
  currency?: string;
}

interface VerifyEmailData {
  token: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginCredentials) {
    console.log('🔄 AuthService.login - Début avec:', {
      email: credentials.email,
      hasPassword: !!credentials.password
    });

    try {
      const response = await apiClient.post('/auth/login', credentials);
      console.log('✅ AuthService.login - Réponse API:', {
        success: response.data.success,
        hasUser: !!response.data.data?.user,
        hasToken: !!response.data.data?.token
      });
      
      // Sauvegarder les tokens après connexion réussie
      if (response.data.success && response.data.data.token) {
        await apiClient.setTokens(
          response.data.data.token,
          response.data.data.refreshToken
        );
        console.log('✅ Tokens sauvegardés avec succès');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService.login - Erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async register(userData: RegisterData) {
    const response = await apiClient.post('/auth/register', userData);
    
    // Sauvegarder les tokens après inscription réussie
    if (response.data.success && response.data.data.token) {
      await apiClient.setTokens(
        response.data.data.token,
        response.data.data.refreshToken
      );
    }
    
    return response.data;
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continuer même si l'appel API échoue
      console.log('Logout API call failed:', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      await apiClient.clearTokens();
    }
  }

  async verifyEmail(token: string) {
    const response = await apiClient.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async forgotPassword(email: string) {
    console.log('🔄 AuthService.forgotPassword - Début avec email:', email);
    
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      console.log('✅ AuthService.forgotPassword - Réponse API:', {
        success: response.data.success,
        message: response.data.message
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService.forgotPassword - Erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Retourner une erreur plus explicite
      let errorMessage = 'Une erreur est survenue lors de la demande de réinitialisation';
      if (error.response?.status === 404) {
        errorMessage = 'Aucun compte associé à cette adresse email';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  async resetPassword(data: ResetPasswordData) {
    console.log('🔄 AuthService.resetPassword - Début avec token:', data.token);
    
    try {
      const response = await apiClient.post(`/auth/reset-password/${data.token}`, { 
        password: data.password 
      });
      console.log('✅ AuthService.resetPassword - Réponse API:', {
        success: response.data.success,
        message: response.data.message
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService.resetPassword - Erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Retourner une erreur plus explicite
      let errorMessage = 'Une erreur est survenue lors de la réinitialisation';
      if (error.response?.status === 400) {
        errorMessage = 'Le lien de réinitialisation a expiré ou est invalide';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  async refreshToken() {
    const refreshToken = await apiClient.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    
    if (response.data.success && response.data.data.token) {
      await apiClient.setTokens(
        response.data.data.token,
        response.data.data.refreshToken
      );
    }
    
    return response.data;
  }

  async checkAuthStatus() {
    try {
      console.log('🔄 AuthService.checkAuthStatus - Vérification du token stocké...');
      
      // Vérifier d'abord si on a un token
      const token = await apiClient.getToken();
      if (!token) {
        console.log('❌ AuthService.checkAuthStatus - Aucun token trouvé');
        throw new Error('No token found');
      }

      console.log('✅ AuthService.checkAuthStatus - Token trouvé, vérification avec le serveur...');
      
      // Créer une promesse avec timeout plus court pour l'initialisation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 5000); // 5 secondes pour l'auth check
      });

      const authCheckPromise = apiClient.get('/auth/me');

      const response: any = await Promise.race([authCheckPromise, timeoutPromise]);
      
      console.log('✅ AuthService.checkAuthStatus - Statut vérifié avec succès');
      return response.data;
    } catch (error: any) {
      console.log('❌ AuthService.checkAuthStatus - Erreur:', error.message);
      
      // Si l'erreur est due à un token invalide, nettoyer les tokens
      if (error.response?.status === 401 || error.message === 'No token found') {
        console.log('🧹 AuthService.checkAuthStatus - Nettoyage des tokens invalides');
        await apiClient.clearTokens();
      }
      
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async resendVerificationEmail(email: string) {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  }

  async deleteAccount(password: string) {
    return apiClient.delete('/auth/account', { data: { password } });
  }

  // Méthodes de vérification par codes
  async sendEmailVerificationCode() {
    return apiClient.post('/auth/send-email-verification-code');
  }

  async verifyEmailCode(code: string) {
    return apiClient.post('/auth/verify-email-code', { code });
  }

  async sendPhoneVerificationCode() {
    return apiClient.post('/auth/send-phone-verification-code');
  }

  async verifyPhoneCode(code: string) {
    return apiClient.post('/auth/verify-phone-code', { code });
  }
}

const authService = new AuthService();
export default authService; 