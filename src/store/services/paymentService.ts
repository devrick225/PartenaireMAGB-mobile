import apiClient from './apiClient';

export interface Payment {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  donation: {
    _id: string;
    amount: number;
    currency: string;
    category: string;
    type: 'one_time' | 'recurring';
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  fees: {
    processingFee: number;
    platformFee: number;
    currency: string;
  };
  transaction?: {
    externalId?: string;
    reference?: string;
    completedAt?: string;
  };
  moneyfusion?: {
    token: string;
    paymentUrl: string;
    status: string;
    customerInfo: {
      name: string;
      phone: string;
    };
    fees: {
      amount: number;
      currency: string;
    };
    metadata: any;
    completedAt?: string;
  };
  fusionpay?: {
    transactionId: string;
    reference: string;
    paymentUrl: string;
    status: string;
    paymentMethod: string;
    customerInfo: any;
    expiresAt: string;
    fees: any;
  };
  paydunya?: {
    token: string;
    transactionId: string;
    paymentUrl: string;
    invoiceUrl: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
    responseCode: string;
    responseText: string;
    paymentMethod: string;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
    fees: {
      percentageFee: number;
      fixedFee: number;
      totalFee: number;
      netAmount: number;
    };
    expiresAt: string;
    completedAt?: string;
    failedAt?: string;
    invoice: {
      totalAmount: number;
      description: string;
      currency: string;
    };
    customData: {
      donationId: string;
      customerId: string;
      platform: string;
      transactionId: string;
    };
    metadata: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  provider?: 'cinetpay' | 'stripe' | 'paypal' | 'fusionpay' | 'moneyfusion' | 'paydunya' | 'orange_money' | 'mtn_mobile_money' | 'moov_money';
}

export interface PaymentResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      current: number;
      total: number;
      pages: number;
      limit: number;
      totalDocs: number;
    };
  };
}

export interface PaymentStatsParams {
  period?: 'week' | 'month' | 'year';
  provider?: string;
}

class PaymentService {
  // Récupérer la liste des paiements
  async getPayments(filters: PaymentFilters = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/payments${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Récupérer un paiement par ID
  async getPaymentById(paymentId: string) {
    return apiClient.get(`/payments/${paymentId}`);
  }

  // Récupérer un paiement par l'ID de donation (premier trouvé)
  async getPaymentByDonationId(donationId: string) {
    try {
      console.log('Récupération paiement pour donation:', donationId);
      const response = await apiClient.get(`/payments/donation/${donationId}`);
      console.log('Paiement trouvé pour donation:', response.data);
      return response;
    } catch (error) {
      console.error('Erreur service getPaymentByDonationId:', error);
      throw error;
    }
  }

  // Récupérer TOUS les paiements pour une donation (pour gérer les cas multiples)
  async getAllPaymentsByDonationId(donationId: string) {
    try {
      console.log('Récupération de TOUS les paiements pour donation:', donationId);
      const response = await apiClient.get(`/payments/donation/${donationId}/all`);
      console.log(`${response.data.data?.payments?.length || 0} paiements trouvés pour donation:`, donationId);
      return response;
    } catch (error: any) {
      console.error('Erreur service getAllPaymentsByDonationId:', error);
      
      // Si l'endpoint n'existe pas, fallback sur la méthode classique
      if (error.response?.status === 404) {
        console.log('Endpoint /all non trouvé, fallback sur méthode classique');
        const fallbackResponse = await this.getPaymentByDonationId(donationId);
        // Transformer la réponse pour avoir le même format
        if (fallbackResponse.data.success && fallbackResponse.data.data.payment) {
          return {
            ...fallbackResponse,
            data: {
              ...fallbackResponse.data,
              data: {
                payments: [fallbackResponse.data.data.payment]
              }
            }
          };
        }
      }
      
      throw error;
    }
  }

  // Vérifier un paiement (interroge directement le fournisseur)
  async verifyPayment(paymentId: string) {
    try {
      console.log('🔍 Service verifyPayment - ID paiement:', paymentId);
      const response = await apiClient.post(`/payments/${paymentId}/verify`);
      console.log('REPONSE-KOFFI', response);
      console.log('✅ Service verifyPayment - Réponse reçue:', response.data);
      return response;
    } catch (error: any) {
      console.error('❌ Service verifyPayment - Erreur:', error);
      console.log('📋 Service verifyPayment - Détails erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Vérifier si l'erreur contient des informations MoneyFusion valides
      const errorData = error.response?.data;
      
      if (errorData?.statut !== undefined) {
        // Structure MoneyFusion directe: {statut: boolean, message: string, data: {...}}
        console.log('✅ Service - Erreur contient structure MoneyFusion directe, traitement comme réponse valide');
        console.log('📋 Service - Données MoneyFusion:', errorData);
        return error.response;
      } else if (errorData?.data?.statut !== undefined) {
        // Structure MoneyFusion imbriquée
        console.log('✅ Service - Erreur contient structure MoneyFusion imbriquée, traitement comme réponse valide');
        console.log('📋 Service - Données MoneyFusion imbriquées:', errorData.data);
        return error.response;
      }
      
      // Vraie erreur réseau/serveur
      console.log('❌ Service - Vraie erreur, pas de données MoneyFusion trouvées');
      throw error;
    }
  }

  // Rembourser un paiement
  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    return apiClient.post(`/payments/${paymentId}/refund`, {
      amount,
      reason,
    });
  }

  // Obtenir les statistiques des paiements
  async getPaymentStats(params: PaymentStatsParams = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/payments/stats${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  // Récupérer les paiements récents
  async getRecentPayments(limit: number = 5) {
    return this.getPayments({ 
      limit, 
      page: 1 
    });
  }

  // Méthodes utilitaires pour formater les données
  formatAmount(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatStatus(status: string): string {
    const statuses = {
      'pending': 'En attente',
      'processing': 'En cours',
      'completed': 'Terminé',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
      'refunded': 'Remboursé',
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
      'refunded': '#9C27B0',
    };
    return colors[status as keyof typeof colors] || '#9E9E9E';
  }

  formatProvider(provider: string): string {
    const providers = {
      'moneyfusion': 'MoneyFusion',
      'fusionpay': 'FusionPay',
      'paydunya': 'PayDunya',
      'stripe': 'Stripe',
      'paypal': 'PayPal',
      'cinetpay': 'CinetPay',
      'orange_money': 'Orange Money',
      'mtn_mobile_money': 'MTN Mobile Money',
      'moov_money': 'Moov Money',
    };
    return providers[provider as keyof typeof providers] || provider;
  }

  getProviderIcon(provider: string): string {
    const icons = {
      'moneyfusion': 'account-balance-wallet',
      'fusionpay': 'payment',
      'paydunya': 'smartphone',
      'stripe': 'credit-card',
      'paypal': 'payment',
      'cinetpay': 'account-balance',
      'orange_money': 'smartphone',
      'mtn_mobile_money': 'smartphone',
      'moov_money': 'smartphone',
    };
    return icons[provider as keyof typeof icons] || 'payment';
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
      'don_mensuel': 'Don mensuel',
      'don_ponctuel': 'Don ponctuel',
      'don_libre': 'Don libre',
      'don_concert_femmes': 'Don Concert des Femmes',
      'don_ria_2025': 'Don RIA 2025',
    };
    return categories[category as keyof typeof categories] || category;
  }

  formatPaymentMethod(method: string): string {
    const methods = {
      'card': 'Carte bancaire',
      'mobile_money': 'Mobile Money',
      'bank_transfer': 'Virement bancaire',
      'paypal': 'PayPal',
      'moneyfusion': 'MoneyFusion',
      'crypto': 'Cryptomonnaie',
      // PayDunya - Opérateurs Mobile Money spécifiques
      'orange-money-senegal': 'Orange Money Sénégal',
      'wave-senegal': 'Wave Sénégal',
      'free-money-senegal': 'Free Money Sénégal',
      'expresso-sn': 'Expresso Sénégal',
      'wizall-senegal': 'Wizall Sénégal',
      'mtn-benin': 'MTN Bénin',
      'moov-benin': 'Moov Bénin',
      'orange-money-ci': 'Orange Money Côte d\'Ivoire',
      'wave-ci': 'Wave Côte d\'Ivoire',
      'mtn-ci': 'MTN Côte d\'Ivoire',
      'moov-ci': 'Moov Côte d\'Ivoire',
      't-money-togo': 'T-Money Togo',
      'moov-togo': 'Moov Togo',
      'orange-money-mali': 'Orange Money Mali',
      'moov-ml': 'Moov Mali',
      'orange-money-burkina': 'Orange Money Burkina Faso',
      'moov-burkina-faso': 'Moov Burkina Faso',
    };
    return methods[method as keyof typeof methods] || method;
  }

  // Calculer les frais de paiement
  calculateFees(amount: number, provider: string, currency: string = 'XOF') {
    const feeStructures = {
      'moneyfusion': { percentage: 2.5, fixed: 100 },
      'fusionpay': { percentage: 2.5, fixed: 100 },
      'paydunya': { percentage: 3.0, fixed: 50 },
      'stripe': { percentage: 2.9, fixed: currency === 'XOF' ? 30 : 0.30 },
      'paypal': { percentage: 3.4, fixed: 0 },
      'cinetpay': { percentage: 2.5, fixed: 100 },
      'orange_money': { percentage: 1.0, fixed: 50 },
      'mtn_mobile_money': { percentage: 1.0, fixed: 50 },
      'moov_money': { percentage: 1.0, fixed: 50 },
    };

    const structure = feeStructures[provider as keyof typeof feeStructures];
    if (!structure) {
      return { percentageFee: 0, fixedFee: 0, totalFee: 0, netAmount: amount };
    }

    const percentageFee = (amount * structure.percentage) / 100;
    const totalFee = percentageFee + structure.fixed;

    return {
      percentageFee: Math.round(percentageFee),
      fixedFee: structure.fixed,
      totalFee: Math.round(totalFee),
      netAmount: Math.round(amount - totalFee),
    };
  }
}

const paymentService = new PaymentService();
export default paymentService; 