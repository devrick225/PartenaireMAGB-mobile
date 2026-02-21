import apiClient from './apiClient';

interface UpdateDonationData {
  amount?: number;
  category?: string;
  message?: string;
}

interface DonationFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  category?: 'tithe' | 'offering' | 'building' | 'missions' | 'charity' | 'education' | 'youth' | 'women' | 'men' | 'special' | 'emergency';
  type?: 'one_time' | 'recurring';
  includeAll?: boolean;
}

interface DonationStatsParams {
  period?: 'week' | 'month' | 'year' | 'all';
}

interface Donation {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  currency: string;
  category: string;
  type: 'one_time' | 'recurring';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  message?: string;
  isAnonymous: boolean;
  recurring?: {
    frequency: string;
    isActive: boolean;
    nextPaymentDate?: string;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
    currentOccurrence: number;
  };
  receipt: {
    number: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
  formattedAmount: string;
  payment?: {
    _id: string;
    status: string;
    provider: string;
    amount: number;
    currency: string;
    transactionId?: string;
  };
}

interface DonationStatsResponse {
  stats: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeRecurringDonations: number;
    categoriesBreakdown: Array<{
      _id: string;
      count: number;
      totalAmount: number;
    }>;
    monthlyEvolution: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      totalAmount: number;
    }>;
  };
}

interface DonationResponse {
  success: boolean;
  data: {
    donations: Donation[];
    pagination: {
      current: number;
      total: number;
      pages: number;
      limit: number;
      totalDocs: number;
    };
  };
}

export interface CreateDonationData {
  amount: number;
  currency: string;
  category: string;
  type: 'one_time' | 'recurring';
  paymentMethod: string;
  message?: string;
  isAnonymous?: boolean;
  dedication?: {
    type: 'honor' | 'memory' | 'celebration';
    name: string;
    message: string;
  };
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number; // Ex: tous les 2 semaines = interval: 2
    dayOfWeek?: number; // 0-6 (0=Dimanche) - requis pour frequency 'weekly'
    dayOfMonth?: number; // 1-31 - requis pour frequency 'monthly'|'quarterly'|'yearly'
    startDate: string;
    endDate?: string; // Optionnel
    maxOccurrences?: number; // Optionnel - illimité si non défini
  };
  metadata?: {
    parentDonationId?: string; // Pour les paiements d'occurrence
    occurrence?: number; // Numéro d'occurrence
    type?: string; // Type de métadonnée
    [key: string]: any; // Autres métadonnées
  };
}

export interface InitializePaymentData {
  donationId: string;
  provider: string;
  paymentMethod: string;
  customerPhone?: string;
  existingPaymentId?: string; // Pour éviter les doublons de paiement
}

class DonationService {
  async createDonation(donationData: CreateDonationData) {
    try {
      console.log('Envoi données don:', donationData);
      const response = await apiClient.post('/donations', donationData);
      console.log('Réponse création don:', response.data);
      return response;
    } catch (error) {
      console.error('Erreur service createDonation:', error);
      throw error;
    }
  }

  async getDonations(filters: DonationFilters = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async getMyDonations(filters: DonationFilters = {}) {
    return this.getDonations(filters);
  }

  // Nouvelle méthode spécifique pour les dons récurrents
  async getRecurringDonations(filters: { page?: number; limit?: number } = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations/recurring${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async getDonationById(donationId: string) {
    return apiClient.get(`/donations/${donationId}`);
  }

  async updateDonation(donationId: string, updateData: UpdateDonationData) {
    return apiClient.put(`/donations/${donationId}`, updateData);
  }

  async cancelRecurringDonation(donationId: string, reason?: string) {
    return apiClient.post(`/donations/${donationId}/cancel`, { reason });
  }

  async processPayment(donationId: string, paymentData: any) {
    return apiClient.post(`/donations/${donationId}/process-payment`, paymentData);
  }

  // Méthode pour les statistiques basée sur l'API backend
  async getStats(params: DonationStatsParams = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations/stats${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Méthode pour obtenir les derniers dons (utile pour le dashboard)
  async getRecentDonations(limit: number = 5) {
    return this.getDonations({ 
      limit, 
      status: 'completed',
      page: 1 
    });
  }

  // Méthode pour obtenir l'historique complet avec pagination
  async getDonationHistory(filters: DonationFilters = {}) {
    // Par défaut, inclure tous les statuts pour l'historique
    const historyFilters = {
      includeAll: true,
      ...filters
    };
    return this.getDonations(historyFilters);
  }

  // Méthode pour rechercher des dons
  async searchDonations(query: string, filters: DonationFilters = {}) {
    const searchFilters = {
      ...filters,
      search: query
    };
    return this.getDonations(searchFilters);
  }

  // Méthodes pour la gestion des dons récurrents
  async pauseRecurringDonation(donationId: string, reason?: string) {
    return apiClient.post(`/donations/${donationId}/pause`, { reason });
  }

  async resumeRecurringDonation(donationId: string) {
    return apiClient.post(`/donations/${donationId}/resume`);
  }

  // Méthodes utilitaires
  async getDonationCategories() {
    return [
      { value: 'tithe', label: 'Dîme', icon: 'volunteer-activism' },
      { value: 'offering', label: 'Offrande', icon: 'favorite' },
      { value: 'building', label: 'Construction', icon: 'business' },
      { value: 'missions', label: 'Missions', icon: 'public' },
      { value: 'charity', label: 'Charité', icon: 'volunteer-activism' },
      { value: 'education', label: 'Éducation', icon: 'school' },
      { value: 'youth', label: 'Jeunesse', icon: 'group' },
      { value: 'women', label: 'Femmes', icon: 'woman' },
      { value: 'men', label: 'Hommes', icon: 'man' },
      { value: 'special', label: 'Spécial', icon: 'star' },
      { value: 'emergency', label: 'Urgence', icon: 'emergency' },
    ];
  }

  async getDonationReceipt(donationId: string) {
    return apiClient.get(`/donations/${donationId}/receipt`, {
      responseType: 'blob',
    });
  }

  async refundDonation(donationId: string, reason: string) {
    return apiClient.post(`/donations/${donationId}/refund`, { reason });
  }

  async exportDonations(filters: DonationFilters = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations/export${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url, {
      responseType: 'blob',
    });
  }

  // Méthodes pour les administrateurs
  async getTopDonors(params: { limit?: number; period?: string } = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations/top-donors${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async updateDonationStatus(donationId: string, status: string, note?: string) {
    return apiClient.patch(`/donations/${donationId}/status`, {
      status,
      note,
    });
  }

  async getAllDonationsAdmin(filters: DonationFilters = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/donations/admin${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async getDonationAnalytics(period: string = 'month') {
    return apiClient.get(`/donations/analytics?period=${period}`);
  }

  // Méthodes utilitaires pour formater les données
  formatAmount(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatCategory(category: string): string {
    const categories = {
      'tithe': 'Dîme',
      'offering': 'Offrande',
      'building': 'Construction',
      'missions': 'Missions',
      'charity': 'Charité',
      'education': 'Éducation',
      'youth': 'Jeunesse',
      'women': 'Femmes',
      'men': 'Hommes',
      'special': 'Spécial',
      'emergency': 'Urgence',
      'don_mensuel': 'Mensuelle',
      'don_trimestriel': 'Trimestrielle',
      'don_semestriel': 'Semestrielle',
      'don_ponctuel': 'Ponctuel',
    };
    return categories[category as keyof typeof categories] || category;
  }

  formatStatus(status: string): string {
    const statuses = {
      'pending': 'En attente',
      'processing': 'En cours',
      'completed': 'Terminé',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
    };
    return statuses[status as keyof typeof statuses] || status;
  }

  getStatusColor(status: string): string {
    const colors = {
      'pending': '#FF9800',
      'processing': '#2196F3',
      'completed': '#4CAF50',
      'failed': '#F44336',
      'cancelled': '#9E9E9E',
    };
    return colors[status as keyof typeof colors] || '#9E9E9E';
  }

  getCategoryIcon(category: string): string {
    const icons = {
      'tithe': 'volunteer-activism',
      'offering': 'favorite',
      'building': 'business',
      'missions': 'public',
      'charity': 'volunteer-activism',
      'education': 'school',
      'youth': 'group',
      'women': 'woman',
      'men': 'man',
      'special': 'star',
      'emergency': 'emergency',
      'don_mensuel': 'calendar-today',
      'don_trimestriel': 'date-range',
      'don_semestriel': 'event-repeat',
      'don_ponctuel': 'favorite',
    };
    return icons[category as keyof typeof icons] || 'favorite';
  }

  async initializePayment(paymentData: InitializePaymentData) {
    try {
      console.log('Envoi données paiement:', paymentData);
      const response = await apiClient.post('/payments/initialize', paymentData);
      console.log('Réponse initialisation paiement:', response.data);
      return response;
    } catch (error) {
      console.error('Erreur service initializePayment:', error);
      throw error;
    }
  }

  // Vérifier tous les paiements en attente (pour admins)
  async verifyAllPayments() {
    try {
      console.log('Lancement vérification de tous les paiements en attente');
      const response = await apiClient.post('/donations/verify-payments');
      console.log('Résultat vérification globale:', response.data);
      return response;
    } catch (error) {
      console.error('Erreur service verifyAllPayments:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un don basé sur le statut du paiement
  async updateDonationStatusFromPayment(donationId: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    try {
      let donationStatus = 'pending';
      
      if (paymentStatus === 'paid') {
        donationStatus = 'completed';
      } else if (paymentStatus === 'failed') {
        donationStatus = 'failed';
      } else if (paymentStatus === 'pending') {
        donationStatus = 'pending';
      }
      
      console.log(`Mise à jour statut don ${donationId}: ${paymentStatus} -> ${donationStatus}`);
      
      const response = await apiClient.patch(`/donations/${donationId}/status`, {
        status: donationStatus,
        updatedFrom: 'payment_verification',
        paymentStatus: paymentStatus,
      });
      
      console.log('Statut don mis à jour:', response.data);
      return response;
    } catch (error) {
      console.error('Erreur mise à jour statut don:', error);
      throw error;
    }
  }


}

const donationService = new DonationService();
export default donationService;
export type { Donation, DonationResponse, DonationFilters, DonationStatsResponse }; 