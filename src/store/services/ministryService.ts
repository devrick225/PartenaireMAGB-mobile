import apiClient from './apiClient';

// Types
export interface Ministry {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  category: string;
  isActive: boolean;
  order: number;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  meetingInfo?: {
    day?: string;
    time?: string;
    location?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MinistryStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Array<{
    _id: string;
    count: number;
  }>;
}

export interface MinistryFilters {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMinistryData {
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  category: string;
  order?: number;
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  meetingInfo?: {
    day?: string;
    time?: string;
    location?: string;
  };
}

export interface UpdateMinistryData extends Partial<CreateMinistryData> {
  isActive?: boolean;
}

export interface MinistryResponse {
  success: boolean;
  data: Ministry;
  message: string;
}

export interface MinistriesResponse {
  success: boolean;
  data: Ministry[];
  message: string;
}

export interface MinistryStatsResponse {
  success: boolean;
  data: MinistryStats;
  message: string;
}

class MinistryService {
  // Récupérer tous les ministères
  async getAllMinistries(filters: MinistryFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get(`/ministries?${params.toString()}`);
      return response.data as MinistriesResponse;
    } catch (error) {
      console.error('Erreur lors de la récupération des ministères:', error);
      throw error;
    }
  }

  // Récupérer les ministères par catégorie
  async getMinistriesByCategory(category: string) {
    try {
      const response = await apiClient.get(`/ministries/category/${category}`);
      return response.data as MinistriesResponse;
    } catch (error) {
      console.error('Erreur lors de la récupération des ministères par catégorie:', error);
      throw error;
    }
  }

  // Récupérer un ministère par ID
  async getMinistryById(id: string) {
    try {
      const response = await apiClient.get(`/ministries/${id}`);
      return response.data as MinistryResponse;
    } catch (error) {
      console.error('Erreur lors de la récupération du ministère:', error);
      throw error;
    }
  }

  // Créer un nouveau ministère (Admin)
  async createMinistry(ministryData: CreateMinistryData) {
    try {
      const response = await apiClient.post('/ministries', ministryData);
      return response.data as MinistryResponse;
    } catch (error) {
      console.error('Erreur lors de la création du ministère:', error);
      throw error;
    }
  }

  // Mettre à jour un ministère (Admin)
  async updateMinistry(id: string, updateData: UpdateMinistryData) {
    try {
      const response = await apiClient.put(`/ministries/${id}`, updateData);
      return response.data as MinistryResponse;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du ministère:', error);
      throw error;
    }
  }

  // Supprimer un ministère (Admin)
  async deleteMinistry(id: string) {
    try {
      const response = await apiClient.delete(`/ministries/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du ministère:', error);
      throw error;
    }
  }

  // Activer/Désactiver un ministère (Admin)
  async toggleMinistryStatus(id: string) {
    try {
      const response = await apiClient.patch(`/ministries/${id}/toggle`);
      return response.data as MinistryResponse;
    } catch (error) {
      console.error('Erreur lors du changement de statut du ministère:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des ministères
  async getMinistryStats() {
    try {
      const response = await apiClient.get('/ministries/stats/overview');
      return response.data as MinistryStatsResponse;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Récupérer les catégories disponibles
  getCategories() {
    return [
      { key: 'all', label: 'Tous', icon: 'grid-outline' },
      { key: 'general', label: 'Général', icon: 'people-outline' },
      { key: 'youth', label: 'Jeunesse', icon: 'people-circle-outline' },
      { key: 'children', label: 'Enfants', icon: 'happy-outline' },
      { key: 'women', label: 'Femmes', icon: 'female-outline' },
      { key: 'men', label: 'Hommes', icon: 'male-outline' },
      { key: 'music', label: 'Musique', icon: 'musical-notes-outline' },
      { key: 'prayer', label: 'Prières', icon: 'heart-outline' },
      { key: 'evangelism', label: 'Évangélisation', icon: 'megaphone-outline' },
      { key: 'social', label: 'Social', icon: 'hand-left-outline' },
      { key: 'other', label: 'Autres', icon: 'ellipsis-horizontal-outline' }
    ];
  }

  // Formater la catégorie
  formatCategory(category: string): string {
    const categories: { [key: string]: string } = {
      general: 'Général',
      youth: 'Jeunesse',
      children: 'Enfants',
      women: 'Femmes',
      men: 'Hommes',
      music: 'Musique',
      prayer: 'Prières',
      evangelism: 'Évangélisation',
      social: 'Social',
      other: 'Autres'
    };
    return categories[category] || category;
  }

  // Formater le jour de la semaine
  formatDay(day: string): string {
    const days: { [key: string]: string } = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    };
    return days[day] || day;
  }

  // Obtenir l'icône de la catégorie
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      general: 'people-outline',
      youth: 'people-circle-outline',
      children: 'happy-outline',
      women: 'female-outline',
      men: 'male-outline',
      music: 'musical-notes-outline',
      prayer: 'heart-outline',
      evangelism: 'megaphone-outline',
      social: 'hand-left-outline',
      other: 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'ellipsis-horizontal-outline';
  }

  // Vérifier si un ministère a des informations de contact
  hasContactInfo(ministry: Ministry): boolean {
    return !!(ministry.contactInfo && 
      (ministry.contactInfo.phone || ministry.contactInfo.email));
  }

  // Vérifier si un ministère a des informations de réunion
  hasMeetingInfo(ministry: Ministry): boolean {
    return !!(ministry.meetingInfo && 
      (ministry.meetingInfo.day || ministry.meetingInfo.time || ministry.meetingInfo.location));
  }

  // Formater les informations de contact pour l'affichage
  formatContactInfo(ministry: Ministry): string {
    if (!ministry.contactInfo) return '';
    
    const parts = [];
    if (ministry.contactInfo.name) parts.push(ministry.contactInfo.name);
    if (ministry.contactInfo.phone) parts.push(ministry.contactInfo.phone);
    if (ministry.contactInfo.email) parts.push(ministry.contactInfo.email);
    
    return parts.join(' • ');
  }

  // Formater les informations de réunion pour l'affichage
  formatMeetingInfo(ministry: Ministry): string {
    if (!ministry.meetingInfo) return '';
    
    const parts = [];
    if (ministry.meetingInfo.day) parts.push(this.formatDay(ministry.meetingInfo.day));
    if (ministry.meetingInfo.time) parts.push(ministry.meetingInfo.time);
    if (ministry.meetingInfo.location) parts.push(ministry.meetingInfo.location);
    
    return parts.join(' • ');
  }

  // Rechercher des ministères
  async searchMinistries(query: string, filters: MinistryFilters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

      const response = await apiClient.get(`/ministries/search?${params.toString()}`);
      return response.data as MinistriesResponse;
    } catch (error) {
      console.error('Erreur lors de la recherche de ministères:', error);
      throw error;
    }
  }

  // Récupérer les ministères favoris (si implémenté)
  async getFavoriteMinistries() {
    try {
      const response = await apiClient.get('/ministries/favorites');
      return response.data as MinistriesResponse;
    } catch (error) {
      console.error('Erreur lors de la récupération des ministères favoris:', error);
      throw error;
    }
  }

  // Ajouter/Retirer des favoris (si implémenté)
  async toggleFavorite(ministryId: string) {
    try {
      const response = await apiClient.post(`/ministries/${ministryId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      throw error;
    }
  }
}

const ministryService = new MinistryService();
export default ministryService; 