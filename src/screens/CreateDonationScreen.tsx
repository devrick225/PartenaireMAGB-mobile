import logger from '../utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  Card,
  SegmentedTabs,
  ChoiceCard,
  TextField,
  Button,
  IconName,
} from '../design/components';
import { radius, spacing, typography, MIN_TOUCH } from '../design/tokens';
import donationService, { CreateDonationData, InitializePaymentData } from '../store/services/donationService';
import paymentService from '../store/services/paymentService';
import { showApiError } from '../store/services/apiClient';
import { buildPaymentReturnDeepLink } from '../utils/deepLinkScheme';
import { openPaymentPage } from '../utils/openPaymentPage';
import PayDunyaOperatorSelector from '../components/PayDunyaOperatorSelector';
import { PaymentOperator } from '../constants/paymentMethods';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

// Date locale au format AAAA-MM-JJ (sans décalage UTC)
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

interface CreateDonationScreenProps {
  navigation: any;
  route?: {
    params?: {
      mode?: 'new' | 'existing_donation' | 'retry_failed' | 'pay_occurrence';
      donationData?: any; // Données don existant pour mode existing_donation
      previousDonationData?: any; // Données don précédent pour mode retry_failed
      // Paramètres pour pay_occurrence
      donationId?: string;
      occurrence?: number;
      amount?: number;
      currency?: string;
      category?: string;
      initialType?: 'recurring' | 'one_time';
    };
  };
}

interface CategoryOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface PaymentMethodOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

interface FrequencyOption {
  value: string;
  label: string;
  description: string;
}

const CreateDonationScreen: React.FC<CreateDonationScreenProps> = ({ navigation, route }) => {
  const { c, dark } = useDS();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Extraire les paramètres de route
  const mode = route?.params?.mode || 'new';
  const donationData = route?.params?.donationData;
  const previousDonationData = route?.params?.previousDonationData;
  const occurrenceData = {
    donationId: route?.params?.donationId,
    occurrence: route?.params?.occurrence,
    amount: route?.params?.amount,
    currency: route?.params?.currency,
    category: route?.params?.category,
  };
  const initialType = route?.params?.initialType;

  // Bloquer si email/téléphone non vérifiés
  const needsEmailVerification = user ? !user.isEmailVerified : false;
  const needsPhoneVerification = user ? (!!user.phone && !user.isPhoneVerified) : false;

  const handleRefreshStatus = async () => {
    try {
      await dispatch<any>(checkAuthStatus());
    } catch (_) {}
  };

  // Afficher un appel à l'action si des vérifications sont requises, sans casser l'ordre des hooks
  useEffect(() => {
    if (needsEmailVerification || needsPhoneVerification) {
      const actions: Array<{ text: string; onPress: () => void; style?: any }> = [];
      if (needsEmailVerification) {
        actions.push({ text: 'Vérifier email', onPress: () => navigation.navigate('EmailVerification') });
      }
      if (needsPhoneVerification) {
        actions.push({ text: 'Vérifier téléphone', onPress: () => navigation.navigate('PhoneVerification') });
      }
      actions.push({ text: 'Paramètres', onPress: () => navigation.navigate('Settings') });
      actions.push({ text: 'Actualiser', onPress: handleRefreshStatus });
      actions.push({ text: 'Annuler', onPress: () => {}, style: 'cancel' });

      Alert.alert(
        'Vérification requise',
        "Pour effectuer un don, veuillez vérifier votre email et/ou votre numéro de téléphone.",
        actions
      );
    }
  }, [needsEmailVerification, needsPhoneVerification]);

  // Fonction pour initialiser les données selon le mode
  const getInitialFormData = (): CreateDonationData => {
    switch (mode) {
      case 'existing_donation':
        // Mode don existant - utiliser les données du don
        if (donationData) {
          return {
            amount: donationData.amount || 0,
            currency: 'XOF',
            category: donationData.category || '',
            type: donationData.type || 'one_time',
            paymentMethod: donationData.paymentMethod || 'moneyfusion',
            message: donationData.message || '',
            isAnonymous: donationData.isAnonymous || false,
          };
        }
        break;
        
      case 'retry_failed':
        // Mode retry après échec - utiliser les données du don précédent
        if (previousDonationData) {
          return {
            amount: previousDonationData.amount || 0,
            currency: 'XOF',
            category: previousDonationData.category || '',
            type: previousDonationData.type || 'one_time',
            paymentMethod: previousDonationData.paymentMethod || 'moneyfusion',
            message: previousDonationData.message || '',
            isAnonymous: previousDonationData.isAnonymous || false,
          };
        }
        break;

      case 'pay_occurrence':
        // Mode paiement d'occurrence - utiliser les données de l'occurrence
        if (occurrenceData.amount) {
          return {
            amount: occurrenceData.amount,
            currency: 'XOF',
            category: occurrenceData.category || 'don_ponctuel',
            type: 'one_time', // Les paiements d'occurrence sont toujours uniques
            paymentMethod: 'moneyfusion', // seul moyen actif côté mobile
            message: `Paiement occurrence #${occurrenceData.occurrence}`,
            isAnonymous: false,
          };
        }
        break;
        
      default:
        // Mode nouveau don - données par défaut
        return {
          amount: 0,
          currency: 'XOF',
          // Don unique -> « Ponctuel » ; don récurrent -> « Mensuelle » par défaut
          category: initialType === 'recurring' ? 'don_mensuel' : 'don_ponctuel',
          type: initialType || 'one_time',
          paymentMethod: 'moneyfusion', // seul moyen actif côté mobile
          message: '',
          isAnonymous: false,
        };
    }
    
    // Données par défaut pour nouveau don
    return {
      amount: 0,
      currency: 'XOF',
      category: initialType === 'recurring' ? 'don_mensuel' : 'don_ponctuel',
      type: initialType || 'one_time',
      paymentMethod: 'moneyfusion', // seul moyen actif côté mobile
      message: '',
      isAnonymous: false, // Par défaut, pas anonyme
    };
  };
  
  // Form states
  const [formData, setFormData] = useState<CreateDonationData>(getInitialFormData());
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showDedicationModal, setShowDedicationModal] = useState(false);
  
  // Dedication states
  const [hasDedication, setHasDedication] = useState(false);
  const [dedicationType, setDedicationType] = useState<'honor' | 'memory' | 'celebration'>('honor');
  const [dedicationName, setDedicationName] = useState('');
  const [dedicationMessage, setDedicationMessage] = useState('');
  
  // Recurring donation states
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(1); // 1=Lundi par défaut
  const [recurringDayOfMonth, setRecurringDayOfMonth] = useState(new Date().getDate());
  const [recurringStartDate, setRecurringStartDate] = useState(() => toYMD(new Date()));
  // Sélecteurs de date (Alert.prompt n'existe que sur iOS : rien ne s'ouvrait sur Android)
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState<number | undefined>(undefined);
  const [isUnlimited, setIsUnlimited] = useState(true);
  // Don déjà créé si l'initialisation du paiement a échoué : on le réutilise au lieu d'en recréer un
  const createdDonationRef = useRef<any>(null);
  // Toute modification du formulaire après un échec de paiement = un nouveau don à créer
  useEffect(() => {
    createdDonationRef.current = null;
  }, [formData, recurringFrequency, recurringInterval, recurringStartDate, recurringEndDate,
      recurringMaxOccurrences, isUnlimited, hasDedication, dedicationName, dedicationMessage]);
  
  // Modales pour la récurrence
  const [showDayOfWeekModal, setShowDayOfWeekModal] = useState(false);
  const [showDayOfMonthModal, setShowDayOfMonthModal] = useState(false);
  
  // État pour PayDunya
  const [selectedPayDunyaOperator, setSelectedPayDunyaOperator] = useState<PaymentOperator | undefined>();
  
  const amountInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const messageInputRef = useRef<TextInput>(null);

  const categories: CategoryOption[] = [
    { value: 'don_mensuel', label: 'Mensuelle', icon: 'calendar-today', description: 'Contribution mensuelle régulière' },
    { value: 'don_trimestriel', label: 'Trimestrielle', icon: 'date-range', description: 'Contribution tous les 3 mois' },
    { value: 'don_semestriel', label: 'Semestrielle', icon: 'event-repeat', description: 'Contribution tous les 6 mois' },
    { value: 'don_ponctuel', label: 'Ponctuel', icon: 'favorite', description: 'Don unique, sans engagement' },
  ];

  const paymentMethods: PaymentMethodOption[] = [
    { value: 'moneyfusion', label: 'MoneyFusion', icon: 'account-balance-wallet', description: 'Orange Money, MTN, Moov, Wave' },
    { value: 'geniuspay', label: 'GeniusPay', icon: 'payment', description: 'Wave, Orange Money, MTN, Carte bancaire' },
    // PayDunya désactivé côté mobile
    // { value: 'paydunya', label: 'PayDunya', icon: 'smartphone', description: 'Mobile Money Afrique de l\'Ouest' },
  //  { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone', description: 'Orange Money, MTN, Moov' },
  //  { value: 'card', label: 'Carte bancaire', icon: 'credit-card', description: 'Visa, Mastercard' },
  //  { value: 'bank_transfer', label: 'Virement bancaire', icon: 'account-balance', description: 'Transfert direct' },
  //  { value: 'paypal', label: 'PayPal', icon: 'payment', description: 'Paiement PayPal' },
  ];

  const currencies: CurrencyOption[] = [
    { value: 'XOF', label: 'Franc CFA (XOF)', symbol: 'CFA' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'USD', label: 'Dollar US (USD)', symbol: '$' },
  ];

  const frequencies: FrequencyOption[] = [
    { value: 'daily', label: 'Quotidien', description: 'Chaque jour' },
    { value: 'weekly', label: 'Hebdomadaire', description: 'Chaque semaine' },
    { value: 'monthly', label: 'Mensuel', description: 'Chaque mois' },
    { value: 'quarterly', label: 'Trimestriel', description: 'Tous les 3 mois' },
    { value: 'yearly', label: 'Annuel', description: 'Une fois par an' },
  ];

  const daysOfWeek = [
    { value: 0, label: 'Dimanche', short: 'Dim' },
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' },
  ];

  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${i === 0 ? 'er' : 'e'} jour du mois`,
  }));

  const dedicationTypes = [
    { value: 'honor', label: 'En l\'honneur de', description: 'Célébrer quelqu\'un' },
    { value: 'memory', label: 'À la mémoire de', description: 'Commémorer quelqu\'un' },
    { value: 'celebration', label: 'Pour célébrer', description: 'Marquer un événement' },
  ];

  // Catégories proposées pour un don récurrent (« Ponctuel » est réservé au don unique)
  const recurringCategories = categories.filter(c => c.value !== 'don_ponctuel');

  const selectDonationType = (type: 'one_time' | 'recurring') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'one_time'
        ? 'don_ponctuel'
        : (prev.category && prev.category !== 'don_ponctuel' ? prev.category : 'don_mensuel'),
    }));
    if (type === 'recurring' && formData.category === 'don_ponctuel') {
      setRecurringFrequency('monthly');
      setRecurringInterval(1);
    }
  };

  // Choisir une catégorie récurrente règle aussi la fréquence correspondante
  const selectRecurringCategory = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    if (category === 'don_mensuel') { setRecurringFrequency('monthly'); setRecurringInterval(1); }
    if (category === 'don_trimestriel') { setRecurringFrequency('quarterly'); setRecurringInterval(1); }
    if (category === 'don_semestriel') { setRecurringFrequency('monthly'); setRecurringInterval(6); }
  };

  // Et inversement : la fréquence met à jour la catégorie quand la correspondance est évidente
  const syncCategoryWithFrequency = (frequency: string, interval: number) => {
    let category: string | null = null;
    if (frequency === 'monthly' && interval === 1) category = 'don_mensuel';
    if ((frequency === 'monthly' && interval === 3) || (frequency === 'quarterly' && interval === 1)) category = 'don_trimestriel';
    if ((frequency === 'monthly' && interval === 6) || (frequency === 'quarterly' && interval === 2)) category = 'don_semestriel';
    if (category) setFormData(prev => ({ ...prev, category: category as string }));
  };

  const handleAmountChange = (text: string) => {
    // FCFA : entiers uniquement (les espaces / points / virgules collés sont ignorés)
    const numericValue = parseInt(text.replace(/\D/g, ''), 10) || 0;
    if (numericValue <= 2000000) {
      setFormData(prev => ({ ...prev, amount: numericValue }));
      // Un nouveau montant = un nouveau don
      createdDonationRef.current = null;
    }
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return '';
    const currency = currencies.find(c => c.value === formData.currency);
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
    }).format(amount) + ' ' + (currency?.symbol || '');
  };

  // Unité en français : « jour(s) », « semaine(s) », « mois », « trimestre(s) », « an(s) »
  const frequencyUnit = (frequency: string, n: number) => {
    const units: Record<string, [string, string]> = {
      daily: ['jour', 'jours'],
      weekly: ['semaine', 'semaines'],
      monthly: ['mois', 'mois'],
      quarterly: ['trimestre', 'trimestres'],
      yearly: ['an', 'ans'],
    };
    const [one, many] = units[frequency] || ['', ''];
    return n > 1 ? many : one;
  };

  const formatRecurrenceDescription = () => {
    if (formData.type !== 'recurring') return '';

    let description = '';
    if (recurringInterval === 1) {
      // « Chaque jour », « Chaque semaine », « Chaque mois »...
      description = `Chaque ${frequencyUnit(recurringFrequency, 1)}`;
    } else {
      // « Tous les 2 mois », « Toutes les 2 semaines »
      const feminine = recurringFrequency === 'weekly';
      description = `${feminine ? 'Toutes' : 'Tous'} les ${recurringInterval} ${frequencyUnit(recurringFrequency, recurringInterval)}`;
    }

    // Ajouter le jour spécifique
    if (recurringFrequency === 'weekly') {
      const dayLabel = daysOfWeek.find(d => d.value === recurringDayOfWeek)?.label;
      description += ` (${dayLabel})`;
    } else if (['monthly', 'quarterly', 'yearly'].includes(recurringFrequency)) {
      description += ` (le ${recurringDayOfMonth}${recurringDayOfMonth === 1 ? 'er' : 'e'})`;
    }

    // Ajouter les limitations
    if (!isUnlimited && recurringMaxOccurrences) {
      description += ` - ${recurringMaxOccurrences} fois maximum`;
    }

    if (recurringEndDate) {
      description += ` - jusqu'au ${fromYMD(recurringEndDate).toLocaleDateString('fr-FR')}`;
    }

    return description;
  };

  const validateForm = () => {
    if (formData.amount < 200) {
      Alert.alert('Montant trop faible', 'Le montant minimum est de 200 FCFA');
      return false;
    }
    if (formData.amount > 2000000) {
      Alert.alert('Montant trop élevé', 'Le montant maximum est de 2 000 000 FCFA');
      return false;
    }
    // Catégorie automatiquement définie à "soutien", pas besoin de vérification
    if (!formData.paymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return false;
    }
    // Neutraliser la validation PayDunya
    // if (formData.paymentMethod === 'paydunya' && !selectedPayDunyaOperator) {
    //   Alert.alert('Erreur', 'Veuillez sélectionner un opérateur PayDunya');
    //   return false;
    // }
    if (formData.type === 'recurring') {
      if (!recurringFrequency) {
        Alert.alert('Erreur', 'Veuillez sélectionner une fréquence pour le don récurrent');
        return false;
      }
      if (recurringInterval < 1) {
        Alert.alert('Erreur', 'L\'intervalle doit être au minimum de 1');
        return false;
      }
      if (!recurringStartDate) {
        Alert.alert('Erreur', 'Veuillez sélectionner une date de début pour le don récurrent');
        return false;
      }
      if (recurringEndDate && fromYMD(recurringEndDate) <= fromYMD(recurringStartDate)) {
        Alert.alert('Erreur', 'La date de fin doit être postérieure à la date de début');
        return false;
      }
      if (!isUnlimited && !recurringMaxOccurrences && !recurringEndDate) {
        Alert.alert('Erreur', 'Veuillez définir soit un nombre maximum de paiements, soit une date de fin');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (needsEmailVerification || needsPhoneVerification) {
      Alert.alert(
        'Vérification requise',
        'Vérifiez votre email et votre téléphone avant de faire un don.',
        [
          ...(needsEmailVerification ? [{ text: 'Vérifier email', onPress: () => navigation.navigate('EmailVerification') }] : []),
          ...(needsPhoneVerification ? [{ text: 'Vérifier téléphone', onPress: () => navigation.navigate('PhoneVerification') }] : []),
          { text: 'Annuler', style: 'cancel' as const },
        ]
      );
      return;
    }
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let donation: any;
      
      if (mode === 'existing_donation' && donationData) {
        // Mode don existant - utiliser le don existant et aller directement au paiement
        donation = {
          id: donationData._id,
          receiptNumber: `Existant-${donationData._id.slice(-6)}`, // Numéro temporaire
        };
        logger.log('Utilisation du don existant:', donation);
      } else if (mode === 'pay_occurrence' && occurrenceData.donationId) {
        // Mode paiement d'occurrence - créer un nouveau don lié au don récurrent
        const newDonationData: CreateDonationData = {
          ...formData,
          message: formData.message || `Paiement occurrence #${occurrenceData.occurrence}`,
        };

        // Ajouter des métadonnées pour lier au don récurrent parent
        newDonationData.metadata = {
          parentDonationId: occurrenceData.donationId,
          occurrence: occurrenceData.occurrence,
          type: 'occurrence_payment'
        };

        logger.log('Création don pour occurrence:', newDonationData);

        // Créer le don d'occurrence
        const response = await donationService.createDonation(newDonationData);
        
        if (response.data.success) {
          donation = response.data.data.donation;
          logger.log('Don d\'occurrence créé avec succès:', donation);
        } else {
          Alert.alert('Erreur', 'Erreur lors de la création du don d\'occurrence');
          return;
        }
      } else if (createdDonationRef.current) {
        // Le don a déjà été créé lors d'une tentative précédente (paiement échoué) : le réutiliser
        donation = createdDonationRef.current;
      } else {
        // Mode nouveau don ou retry - créer un nouveau don
        const newDonationData: CreateDonationData = {
          ...formData,
          message: formData.message || undefined,
        };

        // Ajouter la dédicace si elle existe
        if (hasDedication && dedicationName.trim()) {
          newDonationData.dedication = {
            type: dedicationType,
            name: dedicationName.trim(),
            message: dedicationMessage.trim(),
          };
        }

        // Ajouter les données de récurrence si nécessaire
        if (formData.type === 'recurring') {
          const startDate = recurringStartDate || new Date().toISOString();
          newDonationData.recurring = {
            frequency: recurringFrequency as any,
            interval: recurringInterval,
            startDate,
            endDate: recurringEndDate || undefined,
            maxOccurrences: isUnlimited ? undefined : recurringMaxOccurrences,
          };

          // Ajouter dayOfWeek pour les dons hebdomadaires
          if (recurringFrequency === 'weekly') {
            newDonationData.recurring.dayOfWeek = recurringDayOfWeek;
          }

          // Ajouter dayOfMonth pour les dons mensuels/trimestriels/annuels
          if (['monthly', 'quarterly', 'yearly'].includes(recurringFrequency)) {
            newDonationData.recurring.dayOfMonth = recurringDayOfMonth;
          }
        }

        // Créer le don
        const response = await donationService.createDonation(newDonationData);
        
        if (response.data.success) {
          donation = response.data.data.donation;
          createdDonationRef.current = donation;
          logger.log('Don créé avec succès:', donation?.id);
        } else {
          Alert.alert('Erreur', 'Erreur lors de la création du don');
          return;
        }
      }
      
      // Initialiser le paiement (pour tous les modes)
      const paymentData: InitializePaymentData = {
        donationId: donation.id,
        provider: formData.paymentMethod,
        paymentMethod: formData.paymentMethod,
        // Envoyer le deep link adapté à l'environnement (Expo Go, dev client, production)
        callbackUrl: buildPaymentReturnDeepLink(donation.id),
      };

      // Si on est en mode "existing_donation", récupérer l'ID du paiement existant
      if (mode === 'existing_donation' && donationData) {
        try {
          logger.log('🔍 Mode existing_donation - Récupération des paiements existants pour donation:', donationData._id);
          
          // Récupérer TOUS les paiements pour cette donation
          const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donationData._id);
          
          if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments.length > 0) {
            const existingPayments = allPaymentsResponse.data.data.payments;
            logger.log(`✅ ${existingPayments.length} paiement(s) trouvé(s) pour cette donation`);
            
            // Prendre le premier paiement (le plus récent)
            const existingPayment = existingPayments[0];
            paymentData.existingPaymentId = existingPayment._id;
            
            logger.log('🔄 Mode mise à jour - Utilisation du paiement existant:', existingPayment._id);
            logger.log('📊 Statut paiement existant:', existingPayment.status);
          } else {
            logger.log('⚠️ Aucun paiement existant trouvé - Création d\'un nouveau paiement');
          }
        } catch (error) {
          logger.error('❌ Erreur récupération paiements existants:', error);
          logger.log('🆕 Fallback: Création d\'un nouveau paiement');
        }
      }

      const paymentResponse = await donationService.initializePayment(paymentData);
      
      if (paymentResponse.data.success) {
        createdDonationRef.current = null; // paiement lancé : la prochaine soumission est un nouveau don
        const paymentInfo = paymentResponse.data.data;
        
        // Récupérer l'URL de paiement - elle est directement dans la réponse
        const paymentUrl = paymentInfo.paymentUrl;
        
        // Si c'est MoneyFusion, GeniusPay, PayDunya ou un autre provider qui nécessite une redirection web
        if (paymentUrl && (formData.paymentMethod === 'moneyfusion' || formData.paymentMethod === 'geniuspay' || formData.paymentMethod === 'paydunya')) {
          const paymentProvider = formData.paymentMethod === 'paydunya'
            ? 'PayDunya'
            : formData.paymentMethod === 'geniuspay'
              ? 'GeniusPay'
              : 'MoneyFusion';
          const operatorName = formData.paymentMethod === 'paydunya' && selectedPayDunyaOperator 
            ? ` (${selectedPayDunyaOperator.name})` 
            : '';
          
          const alertTitle = mode === 'existing_donation' ? 'Paiement initié' : 'Don créé avec succès';
          const alertMessage = mode === 'existing_donation' 
            ? `Le paiement de ${formatAmount(formData.amount)} va être initié pour votre don existant.\n\nVous allez être redirigé vers la page de paiement ${paymentProvider}${operatorName}.`
            : `Votre don de ${formatAmount(formData.amount)} a été créé. Numéro de reçu: ${donation.receiptNumber}.\n\nVous allez être redirigé vers la page de paiement ${paymentProvider}${operatorName}.`;
            
          Alert.alert(
            alertTitle,
            alertMessage,
            [
              {
                text: 'Annuler',
                style: 'cancel',
                onPress: () => navigation.navigate('Dashboard'),
              },
              {
                text: 'Continuer le paiement',
                onPress: async () => {
                  try {
                    // Ouvrir la page de paiement : se referme automatiquement au retour dans l'app
                    const ret = await openPaymentPage(paymentUrl);

                    // Naviguer vers l'écran de vérification (le backend confirme le statut réel)
                    navigation.replace('PaymentVerification', {
                      paymentId: paymentInfo.paymentId,
                      donationId: donation.id,
                      transactionId: paymentInfo.transactionId,
                      paymentUrl: paymentUrl,
                      ...(ret.status ? { status: ret.status } : {}),
                    });
                  } catch (error) {
                    logger.error('Erreur ouverture URL:', error);
                    Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Veuillez réessayer.');
                    navigation.navigate('Dashboard');
                  }
                },
              },
            ]
          );
        } else {
          // Pour les autres méthodes de paiement ou si pas d'URL
          const alertTitle = mode === 'existing_donation' ? 'Paiement initié' : 'Don créé avec succès';
          const alertMessage = mode === 'existing_donation'
            ? `Le paiement de ${formatAmount(formData.amount)} a été initié pour votre don existant.`
            : `Votre don de ${formatAmount(formData.amount)} a été créé. Numéro de reçu: ${donation.receiptNumber}`;
            
          Alert.alert(
            alertTitle,
            alertMessage,
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Dashboard'),
              },
            ]
          );
        }
      } else {
        Alert.alert('Paiement non initialisé', 'Votre don est enregistré. Appuyez à nouveau sur le bouton pour relancer le paiement.');
      }
    } catch (error: any) {
      logger.error('Erreur création don:', error);
      logger.error('Détails erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      showApiError(error, 'Une erreur est survenue lors de la création du don');
    } finally {
      setIsLoading(false);
    }
  };


  const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000];
  const PAYMENT_ICONS: Record<string, IconName> = { moneyfusion: 'phone-portrait-outline', geniuspay: 'card-outline', paydunya: 'phone-portrait-outline' };
  const CATEGORY_ICONS: Record<string, IconName> = { don_mensuel: 'calendar-outline', don_trimestriel: 'calendar-number-outline', don_semestriel: 'repeat' };

  const title =
    mode === 'existing_donation' ? 'Régler ce don' :
    mode === 'retry_failed' ? 'Réessayer le don' :
    mode === 'pay_occurrence' ? 'Payer l\'échéance' : 'Faire un don';

  const modeNotice = mode !== 'new' ? {
    icon: (mode === 'existing_donation' ? 'card-outline' : mode === 'pay_occurrence' ? 'calendar-outline' : 'refresh') as IconName,
    text: mode === 'existing_donation'
      ? 'Vous allez régler un don déjà enregistré et en attente de paiement.'
      : mode === 'pay_occurrence'
        ? `Paiement de l'échéance n°${occurrenceData.occurrence} de votre don récurrent.`
        : 'Un nouveau don sera créé avec les informations du don précédent.',
  } : null;

  const amountError = formData.amount > 0 && formData.amount < 200 ? 'Le montant minimum est de 200 FCFA.' : undefined;

  // Champ « sélecteur » (ouvre une fenêtre de choix)
  const SelectField = ({ label, value, icon, onPress }: { label: string; value: string; icon: IconName; onPress: () => void }) => (
    <View style={{ gap: 6 }}>
      <AppText variant="smallStrong">{label}</AppText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value}`}
        style={({ pressed }) => [styles.select, { backgroundColor: c.card, borderColor: c.input, opacity: pressed ? 0.85 : 1 }]}
      >
        <Ionicons name={icon} size={18} color={c.primary} />
        <AppText variant="body" style={styles.flex} numberOfLines={1}>{value}</AppText>
        <Ionicons name="chevron-down" size={18} color={c.mutedForeground} />
      </Pressable>
    </View>
  );

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={[styles.chip, { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border }]}
    >
      <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>{label}</AppText>
    </Pressable>
  );

  const hero = (
    <HeroHeader
      eyebrow="Partenaire MAGB"
      eyebrowIcon="heart-outline"
      title={title}
      subtitle="Merci de soutenir l'œuvre du ministère."
      onBack={() => navigation.goBack()}
    />
  );

  const footer = (
    <View style={{ gap: spacing.sm }}>
      {formData.amount >= 200 ? (
        <AppText variant="small" color={c.mutedForeground} center numberOfLines={2}>
          {formData.type === 'recurring' ? formatRecurrenceDescription() : 'Don ponctuel'} · {paymentMethods.find(p => p.value === formData.paymentMethod)?.label}
        </AppText>
      ) : null}
      <Button
        title={formData.amount > 0 ? `Donner ${formatAmount(formData.amount)}` : 'Saisissez un montant'}
        variant="gold"
        icon="heart"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={formData.amount < 200}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen hero={hero} footer={footer}>
        {modeNotice ? (
          <Card style={[styles.notice, { backgroundColor: c.infoSoft, borderColor: c.info }]}>
            <Ionicons name={modeNotice.icon} size={20} color={c.info} />
            <AppText variant="small" color={c.info} style={styles.flex}>{modeNotice.text}</AppText>
          </Card>
        ) : null}

        {/* Montant */}
        <Card style={{ gap: spacing.md }}>
          <AppText variant="overline" color={c.mutedForeground}>Montant du don</AppText>
          <Pressable
            onPress={() => amountInputRef.current?.focus()}
            style={[styles.amountBox, { borderColor: amountError ? c.destructive : c.input, backgroundColor: c.background }]}
          >
            <TextInput
              ref={amountInputRef}
              style={[styles.amountInput, { color: c.foreground }]}
              placeholder="0"
              placeholderTextColor={c.mutedForeground}
              value={formData.amount > 0 ? formData.amount.toLocaleString('fr-FR') : ''}
              onChangeText={handleAmountChange}
              keyboardType="number-pad"
              maxLength={9}
              returnKeyType="done"
              maxFontSizeMultiplier={1.2}
              accessibilityLabel="Montant du don en francs CFA"
            />
            <AppText variant="subtitle" color={c.primary}>FCFA</AppText>
          </Pressable>
          <View style={styles.chipsWrap}>
            {QUICK_AMOUNTS.map(a => (
              <Chip key={a} label={a.toLocaleString('fr-FR')} active={formData.amount === a} onPress={() => handleAmountChange(String(a))} />
            ))}
          </View>
          <AppText variant="small" color={amountError ? c.destructive : c.mutedForeground}>
            {amountError ?? 'Entre 200 et 2 000 000 FCFA.'}
          </AppText>
        </Card>

        {/* Type de don */}
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color={c.mutedForeground} style={styles.sectionLabel}>Type de don</AppText>
          <SegmentedTabs
            value={formData.type as 'one_time' | 'recurring'}
            onChange={selectDonationType}
            options={[
              { key: 'one_time', label: 'Ponctuel', icon: 'flash-outline' },
              { key: 'recurring', label: 'Récurrent', icon: 'repeat' },
            ]}
          />
        </View>

        {/* Récurrence */}
        {formData.type === 'recurring' && (
          <>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="overline" color={c.mutedForeground} style={styles.sectionLabel}>Rythme de contribution</AppText>
              {recurringCategories.map(cat => (
                <ChoiceCard
                  key={cat.value}
                  icon={CATEGORY_ICONS[cat.value] ?? 'calendar-outline'}
                  title={cat.label}
                  description={cat.description}
                  selected={formData.category === cat.value}
                  onPress={() => selectRecurringCategory(cat.value)}
                />
              ))}
            </View>

            <Card style={{ gap: spacing.lg }}>
              <View style={[styles.summary, { backgroundColor: c.primarySoft }]}>
                <Ionicons name="time-outline" size={18} color={c.primary} />
                <AppText variant="smallStrong" color={c.primary} style={styles.flex}>{formatRecurrenceDescription()}</AppText>
              </View>

              <View style={{ gap: 6 }}>
                <AppText variant="smallStrong">Fréquence</AppText>
                <View style={styles.chipsWrap}>
                  {frequencies.map(f => (
                    <Chip
                      key={f.value}
                      label={f.label}
                      active={recurringFrequency === f.value}
                      onPress={() => {
                        setRecurringFrequency(f.value);
                        syncCategoryWithFrequency(f.value, recurringInterval);
                      }}
                    />
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <AppText variant="smallStrong">Intervalle</AppText>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => {
                      const n = Math.max(1, recurringInterval - 1);
                      setRecurringInterval(n);
                      syncCategoryWithFrequency(recurringFrequency, n);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Diminuer l'intervalle"
                    style={[styles.stepBtn, { borderColor: c.input, backgroundColor: c.card }]}
                  >
                    <Ionicons name="remove" size={20} color={c.primary} />
                  </Pressable>
                  <AppText variant="bodyStrong" center style={styles.flex} accessibilityLiveRegion="polite">
                    Tous les {recurringInterval} {frequencyUnit(recurringFrequency, recurringInterval)}
                  </AppText>
                  <Pressable
                    onPress={() => {
                      const n = Math.min(99, recurringInterval + 1);
                      setRecurringInterval(n);
                      syncCategoryWithFrequency(recurringFrequency, n);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Augmenter l'intervalle"
                    style={[styles.stepBtn, { borderColor: c.input, backgroundColor: c.card }]}
                  >
                    <Ionicons name="add" size={20} color={c.primary} />
                  </Pressable>
                </View>
              </View>

              {recurringFrequency === 'weekly' && (
                <View style={{ gap: 6 }}>
                  <AppText variant="smallStrong">Jour de la semaine</AppText>
                  <View style={styles.chipsWrap}>
                    {daysOfWeek.map(d => (
                      <Chip key={d.value} label={d.short} active={recurringDayOfWeek === d.value} onPress={() => setRecurringDayOfWeek(d.value)} />
                    ))}
                  </View>
                </View>
              )}

              {['monthly', 'quarterly', 'yearly'].includes(recurringFrequency) && (
                <SelectField
                  label="Jour du mois"
                  icon="calendar-outline"
                  value={`Le ${recurringDayOfMonth}${recurringDayOfMonth === 1 ? 'er' : ''} du mois`}
                  onPress={() => setShowDayOfMonthModal(true)}
                />
              )}

              <SelectField
                label="Date de début"
                icon="play-outline"
                value={fromYMD(recurringStartDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                onPress={() => setDatePickerTarget('start')}
              />

              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">Sans date de fin</AppText>
                  <AppText variant="small" color={c.mutedForeground}>Le don continue jusqu'à ce que vous l'arrêtiez.</AppText>
                </View>
                <Switch
                  value={isUnlimited}
                  onValueChange={(value) => {
                    setIsUnlimited(value);
                    if (value) {
                      setRecurringMaxOccurrences(undefined);
                      setRecurringEndDate('');
                    }
                  }}
                  trackColor={{ false: c.input, true: c.primary }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel="Sans date de fin"
                />
              </View>

              {!isUnlimited && (
                <View style={{ gap: spacing.md }}>
                  <TextField
                    label="Nombre de paiements"
                    value={recurringMaxOccurrences?.toString() || ''}
                    onChangeText={(text) => setRecurringMaxOccurrences(parseInt(text.replace(/\D/g, ''), 10) || undefined)}
                    keyboardType="number-pad"
                    placeholder="Ex. 12"
                    icon="layers-outline"
                  />
                  <AppText variant="caption" color={c.mutedForeground} center>OU</AppText>
                  <SelectField
                    label="Date de fin"
                    icon="flag-outline"
                    value={recurringEndDate ? fromYMD(recurringEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Choisir une date'}
                    onPress={() => setDatePickerTarget('end')}
                  />
                </View>
              )}
            </Card>
          </>
        )}

        {/* Moyen de paiement */}
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color={c.mutedForeground} style={styles.sectionLabel}>Moyen de paiement</AppText>
          {paymentMethods.map(m => (
            <ChoiceCard
              key={m.value}
              icon={PAYMENT_ICONS[m.value] ?? 'wallet-outline'}
              title={m.label}
              description={m.description}
              selected={formData.paymentMethod === m.value}
              onPress={() => setFormData(prev => ({ ...prev, paymentMethod: m.value }))}
            />
          ))}
        </View>

        {formData.paymentMethod === 'paydunya' && (
          <Card>
            <PayDunyaOperatorSelector
              onOperatorSelect={setSelectedPayDunyaOperator}
              selectedOperator={selectedPayDunyaOperator}
              placeholder="Choisir un opérateur PayDunya"
              showCountryFilter={true}
            />
          </Card>
        )}

        {/* Message */}
        <Card style={{ gap: spacing.sm }}>
          <TextField
            label="Message (facultatif)"
            placeholder="Un mot accompagnant votre don…"
            value={formData.message}
            onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
            multiline
            textAlignVertical="top"
            maxLength={500}
            style={{ minHeight: 90 }}
            hint={`${formData.message?.length || 0}/500`}
          />
        </Card>

        <View style={styles.secure}>
          <Ionicons name="lock-closed-outline" size={14} color={c.mutedForeground} />
          <AppText variant="caption" color={c.mutedForeground}>Paiement sécurisé · reçu disponible après confirmation</AppText>
        </View>
      </Screen>

      {/* Jour du mois */}
      <Modal visible={showDayOfMonthModal} animationType="slide" transparent onRequestClose={() => setShowDayOfMonthModal(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={() => setShowDayOfMonthModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: c.card }]}>
            <View style={styles.sheetHeader}>
              <AppText variant="title">Jour du mois</AppText>
              <Pressable onPress={() => setShowDayOfMonthModal(false)} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={8}>
                <Ionicons name="close" size={24} color={c.foreground} />
              </Pressable>
            </View>
            <View style={styles.daysGrid}>
              {daysOfMonth.map(d => {
                const active = recurringDayOfMonth === d.value;
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => {
                      setRecurringDayOfMonth(d.value);
                      setShowDayOfMonthModal(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={d.label}
                    style={[styles.dayCell, { backgroundColor: active ? c.primary : c.muted }]}
                  >
                    <AppText variant="bodyStrong" color={active ? c.primaryForeground : c.foreground}>{d.value}</AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText variant="small" color={c.mutedForeground}>Les mois plus courts utilisent leur dernier jour.</AppText>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Sélecteur de date (Android : boîte de dialogue native ; iOS : calendrier dans une fenêtre) */}
      {datePickerTarget && Platform.OS === 'android' && (
        <DateTimePicker
          value={datePickerTarget === 'start'
            ? fromYMD(recurringStartDate)
            : (recurringEndDate ? fromYMD(recurringEndDate) : new Date(fromYMD(recurringStartDate).getTime() + 86400000))}
          mode="date"
          minimumDate={datePickerTarget === 'start' ? new Date() : new Date(fromYMD(recurringStartDate).getTime() + 86400000)}
          onChange={(event, date) => {
            const target = datePickerTarget;
            setDatePickerTarget(null);
            if (event.type === 'set' && date) {
              if (target === 'start') {
                setRecurringStartDate(toYMD(date));
                if (recurringEndDate && fromYMD(recurringEndDate) <= date) setRecurringEndDate('');
              } else setRecurringEndDate(toYMD(date));
            }
          }}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={!!datePickerTarget} transparent animationType="slide" onRequestClose={() => setDatePickerTarget(null)}>
          <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={() => setDatePickerTarget(null)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.card }]}>
              <View style={styles.sheetHeader}>
                <AppText variant="title">{datePickerTarget === 'start' ? 'Date de début' : 'Date de fin'}</AppText>
                <Pressable onPress={() => setDatePickerTarget(null)} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="bodyStrong" color={c.primary}>OK</AppText>
                </Pressable>
              </View>
              {datePickerTarget && (
                <DateTimePicker
                  value={datePickerTarget === 'start'
                    ? fromYMD(recurringStartDate)
                    : (recurringEndDate ? fromYMD(recurringEndDate) : new Date(fromYMD(recurringStartDate).getTime() + 86400000))}
                  mode="date"
                  display="inline"
                  locale="fr-FR"
                  themeVariant={dark ? 'dark' : 'light'}
                  accentColor={c.primary}
                  minimumDate={datePickerTarget === 'start' ? new Date() : new Date(fromYMD(recurringStartDate).getTime() + 86400000)}
                  onChange={(_, date) => {
                    if (!date) return;
                    if (datePickerTarget === 'start') {
                      setRecurringStartDate(toYMD(date));
                      // Date de fin devenue invalide : on l'efface
                      if (recurringEndDate && fromYMD(recurringEndDate) <= date) setRecurringEndDate('');
                    } else {
                      setRecurringEndDate(toYMD(date));
                    }
                  }}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionLabel: { paddingHorizontal: spacing.xs },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  amountBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing.lg, minHeight: 64, gap: spacing.sm },
  amountInput: { flex: 1, ...typography.amount, fontSize: 30, lineHeight: 36, paddingVertical: spacing.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: MIN_TOUCH - 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayCell: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

export default CreateDonationScreen;
