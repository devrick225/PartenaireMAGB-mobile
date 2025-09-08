import apiClient from './apiClient';

// Types correspondant au modèle backend
export interface CompleteProfile {
  user: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  
  address: {
    street?: string;
    neighborhood?: string;
    postalCode?: string;
    state?: string;
    country?: string;
  };
  
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
  
  churchMembership: {
    isChurchMember?: boolean;
    churchName?: string;
    membershipDate?: Date;
    baptismDate?: Date;
    ministry?: string;
    churchRole?: 'member' | 'deacon' | 'elder' | 'pastor' | 'evangelist' | 'other';
  };
  
  emergencyContact: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  
  donationPreferences: {
    preferredAmount?: number;
    preferredFrequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    preferredDay?: number;
    preferredPaymentMethod?: 'card' | 'mobile_money' | 'bank_transfer' | 'cash';
    donationCategories?: ('soutien''tithe' | 'offering' | 'building' | 'missions' | 'charity' | 'education' | 'youth' | 'women' | 'men')[];
  };
  
  financialInfo: {
    bankName?: string;
    accountNumber?: string;
    mobileMoney?: {
      provider?: 'orange' | 'mtn' | 'moov' | 'wave';
      number?: string;
    };
  };
  
  communicationPreferences: {
    language?: 'fr' | 'en';
    preferredContactMethod?: 'email' | 'sms' | 'phone' | 'whatsapp';
    receiveNewsletters?: boolean;
    receiveEventNotifications?: boolean;
    receiveDonationReminders?: boolean;
  };
  
  volunteer: {
    isAvailable?: boolean;
    skills?: string[];
    availability?: {
      days?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
      timeSlots?: {
        start: string;
        end: string;
      }[];
    };
    interests?: ('teaching' | 'music' | 'technical' | 'administration' | 'counseling' | 'children' | 'youth' | 'elderly')[];
  };
  
  familyInfo: {
    numberOfChildren?: number;
    children?: {
      name: string;
      dateOfBirth: Date;
      gender: 'male' | 'female';
    }[];
    spouse?: {
      name?: string;
      dateOfBirth?: Date;
      isChurchMember?: boolean;
    };
  };
  
  notes?: {
    content: string;
    author: string;
    isPrivate: boolean;
    createdAt: Date;
  }[];
  
  isComplete?: boolean;
  completedSections?: {
    section: string;
    completedAt: Date;
  }[];
  profileCompletionPercentage?: number;
}

export interface ProfileUpdateData {
  section: string;
  data: Partial<CompleteProfile>;
}

class ProfileService {
  // Récupérer le profil complet - correspond au backend /api/users/profile
  async getProfile(): Promise<any> {
    try {
      const response = await apiClient.get('/users/profile');
      
      // Gestion flexible des différentes structures de réponse
      const responseData = response.data as any;
      
      if (responseData.success && responseData.data?.profile) {
        return responseData.data.profile;
      } else if (responseData.success && responseData.profile) {
        return responseData.profile;
      }
      
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du profil:', error);
      if (error.response?.status === 404) {
        return null; // Profil n'existe pas encore
      }
      throw new Error(error.response?.data?.error || 'Erreur lors de la récupération du profil');
    }
  }

  // Récupérer le profil complet par ID utilisateur (pour compatibilité)
  async getCompleteProfile(userId: string): Promise<any> {
    return this.getProfile(); // L'API utilise le token pour identifier l'utilisateur
  }

  // Mettre à jour le profil - correspond au backend PUT /api/users/profile
  async updateProfile(userId: string, profileData: Partial<CompleteProfile>): Promise<any> {
    try {
      console.log('Updating profile with data:', profileData);
      
      const response = await apiClient.put('/users/profile', profileData);
      console.log('Update profile response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Réponse inattendue du serveur');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la mise à jour du profil');
    }
  }

  // Mettre à jour une section du profil (alias pour compatibilité)
  async updateProfileSection(userId: string, sectionData: Partial<CompleteProfile>): Promise<any> {
    return this.updateProfile(userId, sectionData);
  }

  // Marquer une section comme complétée
  async markSectionComplete(userId: string, section: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/profile/sections/${section}/complete`);
    } catch (error: any) {
      console.error('Error marking section complete:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la validation de la section');
    }
  }

  // Ajouter une note au profil
  async addNote(userId: string, content: string, isPrivate: boolean = false): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/profile/notes`, {
        content,
        isPrivate
      });
    } catch (error: any) {
      console.error('Error adding note:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'ajout de la note');
    }
  }

  // Calculer le pourcentage de complétion (côté client pour aperçu)
  calculateCompletionPercentage(profile: Partial<CompleteProfile>): number {
    const requiredFields = [
      'dateOfBirth',
      'gender',
      'address.street',
      'address.country',
      'occupation',
      'emergencyContact.name',
      'emergencyContact.relationship',
      'emergencyContact.phone'
    ];
    
    const optionalFields = [
      'maritalStatus',
      'employer',
      'monthlyIncome',
      'churchMembership.isChurchMember',
      'donationPreferences.preferredAmount',
      'donationPreferences.preferredFrequency'
    ];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    // Vérifier les champs requis (70% du score)
    requiredFields.forEach(field => {
      const value = this.getNestedValue(profile, field);
      if (value !== null && value !== undefined && value !== '') {
        completedRequired++;
      }
    });
    
    // Vérifier les champs optionnels (30% du score)
    optionalFields.forEach(field => {
      const value = this.getNestedValue(profile, field);
      if (value !== null && value !== undefined && value !== '') {
        completedOptional++;
      }
    });
    
    const requiredScore = (completedRequired / requiredFields.length) * 70;
    const optionalScore = (completedOptional / optionalFields.length) * 30;
    
    return Math.round(requiredScore + optionalScore);
  }

  // Utilitaire pour accéder aux propriétés imbriquées
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Obtenir les options pour les champs d'énumération
  getFieldOptions() {
    return {
      gender: [
        { label: 'Homme', value: 'male' },
        { label: 'Femme', value: 'female' },
        { label: 'Autre', value: 'other' }
      ],
      maritalStatus: [
        { label: 'Célibataire', value: 'single' },
        { label: 'Marié(e)', value: 'married' },
        { label: 'Divorcé(e)', value: 'divorced' },
        { label: 'Veuf/Veuve', value: 'widowed' }
      ],
      churchRole: [
        { label: 'Membre', value: 'member' },
        { label: 'Diacre', value: 'deacon' },
        { label: 'Ancien', value: 'elder' },
        { label: 'Pasteur', value: 'pastor' },
        { label: 'Évangéliste', value: 'evangelist' },
        { label: 'Autre', value: 'other' }
      ],
      donationFrequency: [
        { label: 'Hebdomadaire', value: 'weekly' },
        { label: 'Mensuel', value: 'monthly' },
        { label: 'Trimestriel', value: 'quarterly' },
        { label: 'Annuel', value: 'yearly' }
      ],
      paymentMethod: [
        { label: 'Carte bancaire', value: 'card' },
        { label: 'Mobile Money', value: 'mobile_money' },
        { label: 'Virement bancaire', value: 'bank_transfer' },
        { label: 'Espèces', value: 'cash' }
      ],
      donationCategories: [
        { label: 'Dîme', value: 'tithe' },
        { label: 'Offrande', value: 'offering' },
        { label: 'Construction', value: 'building' },
        { label: 'Missions', value: 'missions' },
        { label: 'Charité', value: 'charity' },
        { label: 'Éducation', value: 'education' },
        { label: 'Jeunesse', value: 'youth' },
        { label: 'Femmes', value: 'women' },
        { label: 'Hommes', value: 'men' }
      ],
      contactMethod: [
        { label: 'Email', value: 'email' },
        { label: 'SMS', value: 'sms' },
        { label: 'Téléphone', value: 'phone' },
        { label: 'WhatsApp', value: 'whatsapp' }
      ],
      language: [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' }
      ],
      mobileMoneyProvider: [
        { label: 'Orange Money', value: 'orange' },
        { label: 'MTN Money', value: 'mtn' },
        { label: 'Moov Money', value: 'moov' },
        { label: 'Wave', value: 'wave' }
      ],
      volunteerInterests: [
        { label: 'Enseignement', value: 'teaching' },
        { label: 'Musique', value: 'music' },
        { label: 'Technique', value: 'technical' },
        { label: 'Administration', value: 'administration' },
        { label: 'Conseil', value: 'counseling' },
        { label: 'Enfants', value: 'children' },
        { label: 'Jeunesse', value: 'youth' },
        { label: 'Personnes âgées', value: 'elderly' }
      ],
      weekDays: [
        { label: 'Lundi', value: 'monday' },
        { label: 'Mardi', value: 'tuesday' },
        { label: 'Mercredi', value: 'wednesday' },
        { label: 'Jeudi', value: 'thursday' },
        { label: 'Vendredi', value: 'friday' },
        { label: 'Samedi', value: 'saturday' },
        { label: 'Dimanche', value: 'sunday' }
      ]
    };
  }
}

export const profileService = new ProfileService();
export default profileService; 