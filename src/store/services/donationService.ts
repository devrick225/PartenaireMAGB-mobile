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
  // Catégories alignées avec le backend
  category?: 'don_mensuel' | 'don_trimestriel' | 'don_semestriel' | 'don_ponctuel' | 'don_libre' | 'don_concert_femmes' | 'don_ria_2025';
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
  /** Don récurrent d'origine quand ce don est une échéance générée par le backend */
  recurringParent?: string;
  /** Rang de l'échéance dans le don récurrent */
  occurrenceNumber?: number;
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
  existingPaymentId?: string;
  callbackUrl?: string; // Deep link de retour (adapté à l'environnement)
}

class DonationService {
  async createDonation(donationData: CreateDonationData) {
    try {
      const response = await apiClient.post('/donations', donationData);
      return response;
    } catch (error) {
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

  // NOTE: processPayment n'existe pas côté backend — utiliser initializePayment() à la place
  async processPayment(donationId: string, paymentData: any) {
    return apiClient.post('/payments/initialize', paymentData);
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

  async getRecentDonations(limit: number = 5) {
    return this.getDonations({ 
      limit, 
      status: 'completed',
      page: 1 
    });
  }

  async getDonationHistory(filters: DonationFilters = {}) {
    const historyFilters = { includeAll: true, ...filters };
    return this.getDonations(historyFilters);
  }

  async searchDonations(query: string, filters: DonationFilters = {}) {
    return this.getDonations({ ...filters, search: query } as any);
  }

  // NOTE: pause/resume non implémentés côté backend — cancel est utilisé à la place
  async pauseRecurringDonation(donationId: string, reason?: string) {
    return apiClient.post(`/donations/${donationId}/cancel`, { reason });
  }

  async resumeRecurringDonation(donationId: string) {
    throw new Error('La reprise de don récurrent n\'est pas encore disponible');
  }

  // Catégories réelles du backend
  async getDonationCategories() {
    return [
      { value: 'don_mensuel', label: 'Mensuelle', icon: 'calendar-today' },
      { value: 'don_trimestriel', label: 'Trimestrielle', icon: 'date-range' },
      { value: 'don_semestriel', label: 'Semestrielle', icon: 'event-repeat' },
      { value: 'don_ponctuel', label: 'Ponctuel', icon: 'favorite' },
      { value: 'don_libre', label: 'Don libre', icon: 'volunteer-activism' },
    ];
  }

  // NOTE: Le reçu est disponible via /documents/donation-receipt/:id
  async getDonationReceipt(donationId: string) {
    return apiClient.get(`/documents/donation-receipt/${donationId}`, {
      responseType: 'blob',
    });
  }

  async refundDonation(donationId: string, reason: string) {
    // NOTE: Le remboursement se fait via /payments/:id/refund
    return apiClient.post(`/donations/${donationId}/refund`, { reason });
  }

  // NOTE: export disponible via /documents/donations-report
  async exportDonations(filters: DonationFilters = {}) {
    const queryString = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });
    return apiClient.get(`/documents/donations-report?${queryString.toString()}`, {
      responseType: 'blob',
    });
  }

  // NOTE: top-donors non implémenté côté backend
  async getTopDonors(params: { limit?: number; period?: string } = {}) {
    throw new Error('Les top donateurs ne sont pas encore disponibles');
  }

  async updateDonationStatus(donationId: string, status: string, note?: string) {
    return apiClient.patch(`/donations/${donationId}/status`, { status, note });
  }

  // NOTE: /donations/admin non implémenté — utilise getDonations()
  async getAllDonationsAdmin(filters: DonationFilters = {}) {
    return this.getDonations(filters);
  }

  // NOTE: /donations/analytics non implémenté — utilise getStats()
  async getDonationAnalytics(period: string = 'month') {
    return this.getStats({ period: period as any });
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
      const response = await apiClient.post('/payments/initialize', paymentData);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async verifyAllPayments() {
    try {
      const response = await apiClient.post('/donations/verify-payments');
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateDonationStatusFromPayment(donationId: string, paymentStatus: 'pending' | 'paid' | 'failed') {
    try {
      let donationStatus = 'pending';
      if (paymentStatus === 'paid') donationStatus = 'completed';
      else if (paymentStatus === 'failed') donationStatus = 'failed';

      const response = await apiClient.patch(`/donations/${donationId}/status`, {
        status: donationStatus,
        updatedFrom: 'payment_verification',
        paymentStatus,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }


}

const donationService = new DonationService();
export default donationService;
export type { Donation, DonationResponse, DonationFilters, DonationStatsResponse }; 