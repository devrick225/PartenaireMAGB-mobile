import apiClient from './apiClient';
import { ENDPOINTS } from '../../config/api';

interface UserStats {
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  level: number;
  points: number;
  badges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  activeRecurringDonations: number;
  partnerLevel: 'classique' | 'bronze' | 'argent' | 'or';
  partnerLevelDetails: {
    name: string;
    range: string;
    minAmount: number;
    maxAmount: number;
    color: string;
    icon: string;
  };
  lastDonation: {
    amount: number;
    currency: string;
    category: string;
    date: string;
  } | null;
  memberSince: string;
  profileCompletion: number;
}

interface UserProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    language: string;
    currency: string;
    avatar?: string;
    role: string;
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    createdAt: string;
    lastLogin?: string;
    totalDonations: number;
    donationCount: number;
    level: number;
    points: number;
    badges: Array<{
      name: string;
      icon: string;
      earnedAt: string;
    }>;
    partnerId: string;
    partnerLevel: 'classique' | 'bronze' | 'argent' | 'or';
    partnerLevelDetails: {
      name: string;
      range: string;
      minAmount: number;
      maxAmount: number;
      color: string;
      icon: string;
    };
  };
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  employer?: string;
  monthlyIncome?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  churchMembership?: {
    memberSince?: string;
    previousChurches?: string[];
    ministerialExperience?: string[];
  };
  donationPreferences?: {
    preferredCategories?: string[];
    preferredFrequency?: string;
    preferredAmount?: number;
    preferredMethod?: string;
  };
  communicationPreferences?: {
    language?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    newsletterSubscription?: boolean;
  };
  volunteer?: {
    isInterested?: boolean;
    availableTime?: string[];
    skills?: string[];
    experience?: string;
  };
  familyInfo?: {
    hasChildren?: boolean;
    numberOfChildren?: number;
    childrenAges?: number[];
    spouse?: {
      name?: string;
      isChurchMember?: boolean;
    };
  };
  isComplete: boolean;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface LeaderboardEntry {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  level: number;
  badges: Array<{
    name: string;
    icon: string;
    earnedAt: string;
  }>;
  totalAmount: number;
  donationCount: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  period: string;
  userRank: number | null;
  totalParticipants: number;
}

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

class UserService {
  async getProfile() {
    return apiClient.get<{ profile: UserProfile }>('/users/profile');
  }

  async updateProfile(profileData: any) {
    return apiClient.put('/users/profile', profileData);
  }

  async uploadAvatar(formData: FormData) {
    return apiClient.post(ENDPOINTS.USERS.UPLOAD_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getAllUsers(params: GetUsersParams = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/users${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async getUserById(userId: string) {
    return apiClient.get(`/users/${userId}`);
  }

  async changeUserRole(data: { userId: string; role: string }) {
    return apiClient.patch(`/users/${data.userId}/role`, { role: data.role });
  }

  async deleteUser(userId: string) {
    return apiClient.delete(`/users/${userId}`);
  }

  async blockUser(userId: string, reason?: string) {
    return apiClient.patch(`/users/${userId}/block`, { reason });
  }

  async unblockUser(userId: string) {
    return apiClient.patch(`/users/${userId}/unblock`);
  }

  async getUserStats(userId?: string) {
    if (userId) {
      return apiClient.get(`/users/${userId}/stats`);
    } else {
      const response = await apiClient.get('/auth/me');
      const currentUserId = response.data.data.user.id;
      return apiClient.get(`/users/${currentUserId}/stats`);
    }
  }

  async getMyStats() {
    return this.getUserStats();
  }

  async getLeaderboard(params: {
    period?: 'week' | 'month' | 'year' | 'all';
    limit?: number;
  } = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/users/leaderboard${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url);
  }

  async exportUsers(filters: GetUsersParams = {}) {
    const queryString = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });

    const url = `/users/export${queryString.toString() ? `?${queryString.toString()}` : ''}`;
    return apiClient.get(url, {
      responseType: 'blob',
    });
  }

  async changeEmail(newEmail: string, password: string) {
    return apiClient.post('/users/change-email', {
      newEmail,
      password,
    });
  }

  async verifyEmailChange(token: string) {
    return apiClient.post('/users/verify-email-change', { token });
  }

  async deactivateAccount(password: string, reason?: string) {
    return apiClient.post('/users/deactivate', {
      password,
      reason,
    });
  }

  async reactivateAccount(email: string) {
    return apiClient.post('/users/reactivate', { email });
  }

  async getUserPreferences() {
    return apiClient.get('/users/preferences');
  }

  async updateUserPreferences(preferences: {
    emailNotifications?: {
      donations?: boolean;
      reminders?: boolean;
      newsletters?: boolean;
    };
    smsNotifications?: {
      donations?: boolean;
      reminders?: boolean;
    };
    language?: string;
    currency?: string;
    timezone?: string;
  }) {
    return apiClient.put('/users/preferences', preferences);
  }

  async downloadPersonalData() {
    return apiClient.get('/users/download-data', {
      responseType: 'blob',
    });
  }

  async deleteAccount(password: string) {
    return apiClient.delete('/users/account', {
      data: { password }
    });
  }
}

const userService = new UserService();
export default userService; 