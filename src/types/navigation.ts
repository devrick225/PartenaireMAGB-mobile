export interface Ministry {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  externalLink?: string;
  category: string;
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
  isActive: boolean;
  order: number;
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

export type RootStackParamList = {
  // Écrans existants
  Dashboard: undefined;
  Profile: undefined;
  Settings: undefined;
  CreateDonation: undefined;
  DonationHistory: undefined;
  PaymentHistory: undefined;
  ContactSupport: undefined;
  HelpCenter: undefined;
  
  // Nouveaux écrans des ministères
  Ministry: undefined;
  MinistryDetail: { ministry: Ministry };
}; 