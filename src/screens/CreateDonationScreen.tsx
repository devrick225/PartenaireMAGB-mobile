import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import donationService, { CreateDonationData, InitializePaymentData } from '../store/services/donationService';
import paymentService from '../store/services/paymentService';
import PayDunyaOperatorSelector from '../components/PayDunyaOperatorSelector';
import { PaymentOperator } from '../constants/paymentMethods';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';

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
  const { dark, colors } = useTheme();
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
            currency: donationData.currency || 'XOF',
            category: donationData.category || '',
            type: donationData.type || 'one_time',
            paymentMethod: donationData.paymentMethod || '',
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
            currency: previousDonationData.currency || 'XOF',
            category: previousDonationData.category || '',
            type: previousDonationData.type || 'one_time',
            paymentMethod: previousDonationData.paymentMethod || '',
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
            currency: occurrenceData.currency || 'XOF',
            category: occurrenceData.category || '',
            type: 'one_time', // Les paiements d'occurrence sont toujours uniques
            paymentMethod: '',
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
          category: 'don_mensuel',
          type: initialType || 'one_time',
          paymentMethod: '',
          message: '',
          isAnonymous: false,
        };
    }
    
    // Données par défaut pour nouveau don
    return {
      amount: 0,
      currency: 'XOF',
      category: 'don_mensuel',
      type: initialType || 'one_time',
      paymentMethod: '',
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
  const [recurringStartDate, setRecurringStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringMaxOccurrences, setRecurringMaxOccurrences] = useState<number | undefined>(undefined);
  const [isUnlimited, setIsUnlimited] = useState(true);
  
  // Modales pour la récurrence
  const [showDayOfWeekModal, setShowDayOfWeekModal] = useState(false);
  const [showDayOfMonthModal, setShowDayOfMonthModal] = useState(false);
  
  // État pour PayDunya
  const [selectedPayDunyaOperator, setSelectedPayDunyaOperator] = useState<PaymentOperator | undefined>();
  
  const amountInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);

  const categories: CategoryOption[] = [
    { value: 'don_mensuel', label: 'Mensuelle', icon: 'calendar-today', description: 'Contribution mensuelle régulière' },
    { value: 'don_trimestriel', label: 'Trimestrielle', icon: 'date-range', description: 'Contribution tous les 3 mois' },
    { value: 'don_semestriel', label: 'Semestrielle', icon: 'event-repeat', description: 'Contribution tous les 6 mois' },
    { value: 'don_ponctuel', label: 'Ponctuel', icon: 'favorite', description: 'Don unique, sans engagement' },
  ];

  const paymentMethods: PaymentMethodOption[] = [
    { value: 'moneyfusion', label: 'MoneyFusion', icon: 'account-balance-wallet', description: 'Paiement mobile sécurisé' },
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

  const handleAmountChange = (text: string) => {
    const numericValue = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    setFormData(prev => ({ ...prev, amount: numericValue }));
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return '';
    const currency = currencies.find(c => c.value === formData.currency);
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
    }).format(amount) + ' ' + (currency?.symbol || '');
  };

  const formatRecurrenceDescription = () => {
    if (formData.type !== 'recurring') return '';
    
    let description = '';
    const frequencyLabel = frequencies.find(f => f.value === recurringFrequency)?.label.toLowerCase();
    
    if (recurringInterval === 1) {
      description = `Tous les ${frequencyLabel}s`;
    } else {
      description = `Tous les ${recurringInterval} ${frequencyLabel}s`;
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
      description += ` - jusqu'au ${new Date(recurringEndDate).toLocaleDateString('fr-FR')}`;
    }

    return description;
  };

  const validateForm = () => {
    if (formData.amount < 200) {
      Alert.alert('Erreur', 'Le montant minimum est de 200');
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
      if (recurringEndDate && new Date(recurringEndDate) <= new Date(recurringStartDate)) {
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
        console.log('Utilisation du don existant:', donation);
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

        console.log('Création don pour occurrence:', newDonationData);

        // Créer le don d'occurrence
        const response = await donationService.createDonation(newDonationData);
        
        if (response.data.success) {
          donation = response.data.data.donation;
          console.log('Don d\'occurrence créé avec succès:', donation);
        } else {
          Alert.alert('Erreur', 'Erreur lors de la création du don d\'occurrence');
          return;
        }
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
          console.log('Don créé avec succès:', donation);
        } else {
          Alert.alert('Erreur', 'Erreur lors de la création du don');
          return;
        }
      }
      
      // Initialiser le paiement (pour tous les modes)
      const paymentData: InitializePaymentData = {
        donationId: donation.id,
        provider: 'moneyfusion', // Forcer MoneyFusion côté mobile
        paymentMethod: 'moneyfusion',
      };

      // Si on est en mode "existing_donation", récupérer l'ID du paiement existant
      if (mode === 'existing_donation' && donationData) {
        try {
          console.log('🔍 Mode existing_donation - Récupération des paiements existants pour donation:', donationData._id);
          
          // Récupérer TOUS les paiements pour cette donation
          const allPaymentsResponse = await paymentService.getAllPaymentsByDonationId(donationData._id);
          
          if (allPaymentsResponse.data.success && allPaymentsResponse.data.data.payments.length > 0) {
            const existingPayments = allPaymentsResponse.data.data.payments;
            console.log(`✅ ${existingPayments.length} paiement(s) trouvé(s) pour cette donation`);
            
            // Prendre le premier paiement (le plus récent)
            const existingPayment = existingPayments[0];
            paymentData.existingPaymentId = existingPayment._id;
            
            console.log('🔄 Mode mise à jour - Utilisation du paiement existant:', existingPayment._id);
            console.log('📊 Statut paiement existant:', existingPayment.status);
          } else {
            console.log('⚠️ Aucun paiement existant trouvé - Création d\'un nouveau paiement');
          }
        } catch (error) {
          console.error('❌ Erreur récupération paiements existants:', error);
          console.log('🆕 Fallback: Création d\'un nouveau paiement');
        }
      }

      console.log('📝 Données finales pour initialisation paiement:', paymentData);
      const paymentResponse = await donationService.initializePayment(paymentData);
      console.log('Réponse paiement:', paymentResponse.data);
      
      if (paymentResponse.data.success) {
        const paymentInfo = paymentResponse.data.data;
        
        // Récupérer l'URL de paiement - elle est directement dans la réponse
        const paymentUrl = paymentInfo.paymentUrl;
        
        // Si c'est MoneyFusion, PayDunya ou un autre provider qui nécessite une redirection web
        if (paymentUrl && (formData.paymentMethod === 'moneyfusion' || formData.paymentMethod === 'paydunya')) {
          const paymentProvider = formData.paymentMethod === 'paydunya' ? 'PayDunya' : 'MoneyFusion';
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
                onPress: () => navigation.navigate('DashboardModern'),
              },
              {
                text: 'Continuer le paiement',
                onPress: async () => {
                  try {
                    // Rediriger vers MoneyFusion
                    await Linking.openURL(paymentUrl);
                    
                    // Naviguer vers l'écran de vérification
                    navigation.replace('PaymentVerification', {
                      paymentId: paymentInfo.paymentId,
                      donationId: donation.id,
                      transactionId: paymentInfo.transactionId,
                      paymentUrl: paymentUrl,
                    });
                  } catch (error) {
                    console.error('Erreur ouverture URL:', error);
                    Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Veuillez réessayer.');
                    navigation.navigate('DashboardModern');
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
                onPress: () => navigation.navigate('DashboardModern'),
              },
            ]
          );
        }
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('Erreur création don:', error);
      console.error('Détails erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      Alert.alert(
        'Erreur',
        error.response?.data?.error || error.message || 'Une erreur est survenue lors de la création du don'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner une catégorie
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  formData.category === item.value && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: item.value }));
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={24}
                    color={formData.category === item.value ? colors.primary : colors.text}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    {item.description}
                  </Text>
                </View>
                {formData.category === item.value && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Méthode de paiement
            </Text>
            <TouchableOpacity
              onPress={() => setShowPaymentModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={paymentMethods}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  formData.paymentMethod === item.value && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, paymentMethod: item.value }));
                  setShowPaymentModal(false);
                }}
              >
                <View style={styles.optionIconContainer}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={24}
                    color={formData.paymentMethod === item.value ? colors.primary : colors.text}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    {item.description}
                  </Text>
                </View>
                {formData.paymentMethod === item.value && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'existing_donation' ? 'Initier le paiement' :
             mode === 'retry_failed' ? 'Réessayer le don' :
             mode === 'pay_occurrence' ? 'Paiement d\'occurrence' : 'Nouveau don'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Alerte informative selon le mode */}
          {mode !== 'new' && (
            <View style={[
              styles.modeAlert,
              { 
                backgroundColor: mode === 'existing_donation' ? '#E3F2FD' : 
                                mode === 'pay_occurrence' ? '#E8F5E8' : '#FFF3E0',
                borderColor: mode === 'existing_donation' ? '#1976D2' : 
                            mode === 'pay_occurrence' ? '#4CAF50' : '#F57C00'
              }
            ]}>
              <MaterialIcons 
                name={mode === 'existing_donation' ? 'payment' : 
                     mode === 'pay_occurrence' ? 'schedule' : 'refresh'} 
                size={20} 
                color={mode === 'existing_donation' ? '#1976D2' : 
                      mode === 'pay_occurrence' ? '#4CAF50' : '#F57C00'} 
              />
              <Text style={[
                styles.modeAlertText,
                { color: mode === 'existing_donation' ? '#0D47A1' : 
                         mode === 'pay_occurrence' ? '#2E7D32' : '#E65100' }
              ]}>
                {mode === 'existing_donation' 
                  ? 'Initiation du paiement pour un don existant en attente'
                  : mode === 'pay_occurrence'
                  ? `Paiement de l'occurrence #${occurrenceData.occurrence} du don récurrent`
                  : 'Création d\'un nouveau don après un échec précédent'}
              </Text>
            </View>
          )}
          
          {/* Montant */}
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Montant du don
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => amountInputRef.current?.focus()}
            >
              <TextInput
                ref={amountInputRef}
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
                value={formData.amount > 0 ? formData.amount.toString() : ''}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.currencyButton}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={[styles.currencyText, { color: colors.primary }]}>
                  {currencies.find(c => c.value === formData.currency)?.symbol}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
            {formData.amount > 0 && (
              <Text style={[styles.amountDisplay, { color: colors.primary }]}>
                {formatAmount(formData.amount)}
              </Text>
            )}
            <Text style={[styles.helperText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Montant minimum: 200 {currencies.find(c => c.value === formData.currency)?.symbol}
            </Text>
          </View>

          {/* Type de don */}
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Type de don
            </Text>
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'one_time' && { backgroundColor: colors.primary },
                  { borderColor: colors.primary }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'one_time' }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: formData.type === 'one_time' ? '#FFFFFF' : colors.text }
                ]}>
                  Don unique
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'recurring' && { backgroundColor: colors.primary },
                  { borderColor: colors.primary }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, type: 'recurring' }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  { color: formData.type === 'recurring' ? '#FFFFFF' : colors.text }
                ]}>
                  Don récurrent
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Configuration récurrence (si don récurrent) */}
          {formData.type === 'recurring' && (
            <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Configuration de la récurrence
              </Text>
              
              {/* Résumé de la récurrence */}
              {formatRecurrenceDescription() && (
                <View style={[styles.recurrenceSummary, { backgroundColor: colors.primary + '10' }]}>
                  <MaterialIcons name="schedule" size={20} color={colors.primary} />
                  <Text style={[styles.recurrenceSummaryText, { color: colors.primary }]}>
                    {formatRecurrenceDescription()}
                  </Text>
                </View>
              )}

              {/* Fréquence */}
              <TouchableOpacity
                style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                onPress={() => setShowFrequencyModal(true)}
              >
                <View style={styles.selectButtonContent}>
                  <MaterialIcons name="repeat" size={20} color={colors.primary} style={styles.selectButtonIcon} />
                  <Text style={[styles.selectButtonText, { color: colors.text }]}>
                    {frequencies.find(f => f.value === recurringFrequency)?.label || 'Sélectionner la fréquence'}
                  </Text>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Intervalle */}
              <View style={styles.intervalContainer}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Intervalle (tous les combien)
                </Text>
                <View style={styles.intervalInputContainer}>
                  <TextInput
                    style={[styles.intervalInput, { 
                      color: colors.text, 
                      borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 
                    }]}
                    value={recurringInterval.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 1;
                      setRecurringInterval(Math.max(1, num));
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                  <Text style={[styles.intervalLabel, { color: colors.text }]}>
                    {frequencies.find(f => f.value === recurringFrequency)?.label.toLowerCase()}(s)
                  </Text>
                </View>
              </View>

              {/* Jour de la semaine (pour hebdomadaire) */}
              {recurringFrequency === 'weekly' && (
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Jour de la semaine
                  </Text>
                  <TouchableOpacity
                    style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                    onPress={() => setShowDayOfWeekModal(true)}
                  >
                    <Text style={[styles.selectButtonText, { color: colors.text }]}>
                      {daysOfWeek.find(d => d.value === recurringDayOfWeek)?.label || 'Sélectionner un jour'}
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Jour du mois (pour mensuel/trimestriel/annuel) */}
              {['monthly', 'quarterly', 'yearly'].includes(recurringFrequency) && (
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Jour du mois
                  </Text>
                  <TouchableOpacity
                    style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                    onPress={() => setShowDayOfMonthModal(true)}
                  >
                    <Text style={[styles.selectButtonText, { color: colors.text }]}>
                      Le {recurringDayOfMonth}{recurringDayOfMonth === 1 ? 'er' : 'e'} jour du mois
                    </Text>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Date de début */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Date de début
                </Text>
                <TouchableOpacity
                  style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                  onPress={() => {
                    Alert.prompt(
                      'Date de début',
                      'Entrez la date de début (AAAA-MM-JJ) :',
                      [
                        {
                          text: 'Annuler',
                          style: 'cancel',
                        },
                        {
                          text: 'OK',
                          onPress: (date) => {
                            if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                              setRecurringStartDate(date);
                            } else {
                              Alert.alert('Erreur', 'Format de date invalide. Utilisez AAAA-MM-JJ');
                            }
                          },
                        },
                      ],
                      'plain-text',
                      recurringStartDate
                    );
                  }}
                >
                  <Text style={[styles.selectButtonText, { color: colors.text }]}>
                    {recurringStartDate ? 
                      new Date(recurringStartDate).toLocaleDateString('fr-FR') : 
                      'Sélectionner la date de début'
                    }
                  </Text>
                  <MaterialIcons name="calendar-today" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Options de fin */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Limiter la récurrence
                </Text>
                
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>
                    Illimité
                  </Text>
                  <Switch
                    value={isUnlimited}
                    onValueChange={(value) => {
                      setIsUnlimited(value);
                      if (value) {
                        setRecurringMaxOccurrences(undefined);
                        setRecurringEndDate('');
                      }
                    }}
                    trackColor={{ false: dark ? COLORS.grayTie : COLORS.greyscale300, true: colors.primary + '50' }}
                    thumbColor={isUnlimited ? colors.primary : '#FFFFFF'}
                  />
                </View>

                {!isUnlimited && (
                  <View style={styles.limitOptionsContainer}>
                    {/* Nombre d'occurrences */}
                    <View style={styles.limitOption}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>
                        Nombre maximum de paiements
                      </Text>
                      <TextInput
                        style={[styles.limitInput, { 
                          color: colors.text, 
                          borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 
                        }]}
                        value={recurringMaxOccurrences?.toString() || ''}
                        onChangeText={(text) => {
                          const num = parseInt(text) || undefined;
                          setRecurringMaxOccurrences(num);
                        }}
                        keyboardType="numeric"
                        placeholder="Ex: 12"
                      />
                    </View>

                    {/* OU */}
                    <Text style={[styles.orText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                      OU
                    </Text>

                    {/* Date de fin */}
                    <View style={styles.limitOption}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>
                        Date de fin
                      </Text>
                      <TouchableOpacity
                        style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                        onPress={() => {
                          Alert.prompt(
                            'Date de fin',
                            'Entrez la date de fin (AAAA-MM-JJ) :',
                            [
                              {
                                text: 'Annuler',
                                style: 'cancel',
                              },
                              {
                                text: 'OK',
                                onPress: (date) => {
                                  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                                    setRecurringEndDate(date);
                                  } else {
                                    Alert.alert('Erreur', 'Format de date invalide. Utilisez AAAA-MM-JJ');
                                  }
                                },
                              },
                            ],
                            'plain-text',
                            recurringEndDate
                          );
                        }}
                      >
                        <Text style={[styles.selectButtonText, { color: colors.text }]}>
                          {recurringEndDate ? 
                            new Date(recurringEndDate).toLocaleDateString('fr-FR') : 
                            'Sélectionner la date de fin'
                          }
                        </Text>
                        <MaterialIcons name="calendar-today" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Catégorie */}
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Catégorie
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.selectButtonContent}>
                {formData.category && (
                  <MaterialIcons
                    name={categories.find(c => c.value === formData.category)?.icon as any}
                    size={20}
                    color={colors.primary}
                    style={styles.selectButtonIcon}
                  />
                )}
                <Text style={[styles.selectButtonText, { color: colors.text }]}>
                  {categories.find(c => c.value === formData.category)?.label || 'Sélectionner une catégorie'}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Méthode de paiement */}
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Méthode de paiement
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
              onPress={() => setShowPaymentModal(true)}
            >
              <View style={styles.selectButtonContent}>
                {formData.paymentMethod && (
                  <MaterialIcons
                    name={paymentMethods.find(p => p.value === formData.paymentMethod)?.icon as any}
                    size={20}
                    color={colors.primary}
                    style={styles.selectButtonIcon}
                  />
                )}
                <Text style={[styles.selectButtonText, { color: colors.text }]}>
                  {paymentMethods.find(p => p.value === formData.paymentMethod)?.label || 'Sélectionner un mode de paiement'}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sélecteur d'opérateur PayDunya */}
          {formData.paymentMethod === 'paydunya' && (
            <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
              <PayDunyaOperatorSelector
                onOperatorSelect={setSelectedPayDunyaOperator}
                selectedOperator={selectedPayDunyaOperator}
                placeholder="Choisir un opérateur PayDunya"
                showCountryFilter={true}
              />
            </View>
          )}

          {/* Message (optionnel) */}
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Message (optionnel)
            </Text>
            <TextInput
              ref={messageInputRef}
              style={[
                styles.messageInput,
                { 
                  color: colors.text,
                  borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 
                }
              ]}
              placeholder="Ajoutez un message personnel à votre don..."
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {formData.message?.length || 0}/500
            </Text>
          </View>

          {/* Dédicace - Cachée car on n'utilise plus cette fonctionnalité */}
          {false && (
          <View style={[styles.card, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Ajouter une dédicace
                </Text>
                <Text style={[styles.helperText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Dédier ce don à quelqu'un de spécial
                </Text>
              </View>
              <Switch
                value={hasDedication}
                onValueChange={setHasDedication}
                trackColor={{ false: dark ? COLORS.grayTie : COLORS.greyscale300, true: colors.primary + '50' }}
                thumbColor={hasDedication ? colors.primary : '#FFFFFF'}
              />
            </View>

            {hasDedication && (
              <View style={styles.dedicationContainer}>
                <TouchableOpacity
                  style={[styles.selectButton, { borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 }]}
                  onPress={() => setShowDedicationModal(true)}
                >
                  <Text style={[styles.selectButtonText, { color: colors.text }]}>
                    {dedicationTypes.find(d => d.value === dedicationType)?.label}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.dedicationInput,
                    { 
                      color: colors.text,
                      borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 
                    }
                  ]}
                  placeholder="Nom de la personne"
                  placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
                  value={dedicationName}
                  onChangeText={setDedicationName}
                />

                <TextInput
                  style={[
                    styles.dedicationMessageInput,
                    { 
                      color: colors.text,
                      borderColor: dark ? COLORS.grayTie : COLORS.greyscale300 
                    }
                  ]}
                  placeholder="Message (optionnel)"
                  placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
                  value={dedicationMessage}
                  onChangeText={setDedicationMessage}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Bouton de soumission */}
        <View style={[styles.submitContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: colors.primary,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="favorite" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Faire le don de {formatAmount(formData.amount)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Modals */}
        {renderCategoryModal()}
        {renderPaymentModal()}

        {/* Day of Week Modal */}
        <Modal
          visible={showDayOfWeekModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDayOfWeekModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Jour de la semaine
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDayOfWeekModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={daysOfWeek}
                keyExtractor={(item) => item.value.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      recurringDayOfWeek === item.value && {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                    onPress={() => {
                      setRecurringDayOfWeek(item.value);
                      setShowDayOfWeekModal(false);
                    }}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </View>
                    {recurringDayOfWeek === item.value && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Day of Month Modal */}
        <Modal
          visible={showDayOfMonthModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDayOfMonthModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Jour du mois
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDayOfMonthModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={daysOfMonth}
                keyExtractor={(item) => item.value.toString()}
                numColumns={4}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dayOfMonthItem,
                      recurringDayOfMonth === item.value && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setRecurringDayOfMonth(item.value);
                      setShowDayOfMonthModal(false);
                    }}
                  >
                    <Text style={[
                      styles.dayOfMonthText,
                      { 
                        color: recurringDayOfMonth === item.value ? '#FFFFFF' : colors.text 
                      }
                    ]}>
                      {item.value}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Currency Modal */}
        <Modal
          visible={showCurrencyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Devise
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCurrencyModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={currencies}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      formData.currency === item.value && {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, currency: item.value }));
                      setShowCurrencyModal(false);
                    }}
                  >
                    <Text style={[styles.currencySymbol, { color: colors.primary }]}>
                      {item.symbol}
                    </Text>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </View>
                    {formData.currency === item.value && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Frequency Modal */}
        <Modal
          visible={showFrequencyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFrequencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Fréquence
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFrequencyModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={frequencies}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      recurringFrequency === item.value && {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                    onPress={() => {
                      setRecurringFrequency(item.value);
                      setShowFrequencyModal(false);
                    }}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        {item.description}
                      </Text>
                    </View>
                    {recurringFrequency === item.value && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Dedication Type Modal */}
        <Modal
          visible={showDedicationModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDedicationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Type de dédicace
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDedicationModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={dedicationTypes}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      dedicationType === item.value && {
                        backgroundColor: colors.primary + '20',
                      },
                    ]}
                    onPress={() => {
                      setDedicationType(item.value as any);
                      setShowDedicationModal(false);
                    }}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                        {item.description}
                      </Text>
                    </View>
                    {dedicationType === item.value && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  amountDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectButtonIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 16,
    flex: 1,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  dedicationContainer: {
    marginTop: 16,
    gap: 12,
  },
  dedicationInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dedicationMessageInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  submitContainer: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 28 : 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 5,
    shadowColor: '#26335F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
  },
  optionIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
    marginRight: 12,
  },
  modeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  modeAlertText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  // Styles pour la récurrence
  recurrenceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  recurrenceSummaryText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  intervalContainer: {
    marginTop: 12,
  },
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  intervalLabel: {
    fontSize: 16,
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
  },
  limitOptionsContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  limitOption: {
    marginBottom: 12,
  },
  limitInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 8,
  },
  dayOfMonthItem: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dayOfMonthText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Styles vérification
  verifyContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  verifyCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  verifySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
    paddingVertical: 8,
  },
  verifyRowText: {
    flex: 1,
    fontSize: 14,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verifyActions: {
    marginTop: 16,
    alignSelf: 'stretch',
    gap: 10,
  },
  verifyPrimaryButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifySecondaryButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  verifySecondaryText: {
    fontWeight: '600',
  },
});

export default CreateDonationScreen; 