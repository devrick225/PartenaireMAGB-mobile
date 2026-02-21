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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import donationService, { CreateDonationData, InitializePaymentData } from '../store/services/donationService';
import paymentService from '../store/services/paymentService';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { checkAuthStatus } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

interface CreateDonationScreenModernProps {
  navigation: any;
  route?: {
    params?: {
      mode?: 'new' | 'existing_donation' | 'retry_failed' | 'pay_occurrence';
      donationData?: any;
      previousDonationData?: any;
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
  emoji: string;
  gradient: string[];
}

interface PaymentMethodOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  emoji: string;
  gradient: string[];
}

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  flag: string;
}

const CreateDonationScreenModern: React.FC<CreateDonationScreenModernProps> = ({ navigation, route }) => {
  const { dark, colors } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));

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

  // Form states
  const [formData, setFormData] = useState<CreateDonationData>({
    amount: occurrenceData.amount || 0,
    currency: occurrenceData.currency || 'XOF',
    category: occurrenceData.category || 'don_mensuel',
    type: initialType || 'one_time',
    paymentMethod: '',
    message: '',
    isAnonymous: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Recurring donation states
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [isUnlimited, setIsUnlimited] = useState(true);

  const amountInputRef = useRef<TextInput>(null);
  const messageInputRef = useRef<TextInput>(null);

  // Configuration moderne des catégories
  const categories: CategoryOption[] = [
    {
      value: 'don_mensuel',
      label: 'Mensuelle',
      icon: 'calendar-today',
      description: 'Contribution mensuelle régulière',
      emoji: '📅',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      value: 'don_trimestriel',
      label: 'Trimestrielle',
      icon: 'date-range',
      description: 'Contribution tous les 3 mois',
      emoji: '🗓️',
      gradient: ['#4FACFE', '#00F2FE'],
    },
    {
      value: 'don_semestriel',
      label: 'Semestrielle',
      icon: 'event-repeat',
      description: 'Contribution tous les 6 mois',
      emoji: '📆',
      gradient: ['#4ECDC4', '#44A08D'],
    },
    {
      value: 'don_ponctuel',
      label: 'Ponctuel',
      icon: 'favorite',
      description: 'Don unique, sans engagement',
      emoji: '💝',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },
  ];

  const paymentMethods: PaymentMethodOption[] = [
    {
      value: 'moneyfusion',
      label: 'MoneyFusion',
      icon: 'account-balance-wallet',
      description: 'Paiement mobile sécurisé',
      emoji: '💳',
      gradient: ['#4FACFE', '#00F2FE'],
    },
  ];

  const currencies: CurrencyOption[] = [
    { value: 'XOF', label: 'Franc CFA', symbol: 'CFA', flag: '🇸🇳' },
    { value: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
    { value: 'USD', label: 'Dollar US', symbol: '$', flag: '🇺🇸' },
  ];

  const steps = [
    { id: 1, title: 'Montant', icon: 'monetization-on', description: 'Choisir le montant' },
    { id: 2, title: 'Catégorie', icon: 'category', description: 'Type de don' },
    { id: 3, title: 'Paiement', icon: 'payment', description: 'Méthode de paiement' },
    { id: 4, title: 'Confirmation', icon: 'check-circle', description: 'Finaliser' },
  ];

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

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

  const validateForm = () => {
    if (formData.amount < 200) {
      Alert.alert('Erreur', 'Le montant minimum est de 200');
      return false;
    }
    if (!formData.paymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setShowSuccessAnimation(true);

    try {
      // Créer le don
      const response = await donationService.createDonation(formData);
      
      if (response.data.success) {
        const donation = response.data.data.donation;
        
        // Initialiser le paiement
        const paymentData: InitializePaymentData = {
          donationId: donation.id,
          provider: 'moneyfusion',
          paymentMethod: 'moneyfusion',
        };

        const paymentResponse = await donationService.initializePayment(paymentData);
        
        if (paymentResponse.data.success) {
          const paymentInfo = paymentResponse.data.data;
          const paymentUrl = paymentInfo.paymentUrl;
          
          if (paymentUrl) {
            Alert.alert(
              '🎉 Don créé avec succès !',
              `Votre don de ${formatAmount(formData.amount)} a été créé.\n\nVous allez être redirigé vers la page de paiement MoneyFusion.`,
              [
                {
                  text: 'Annuler',
                  style: 'cancel',
                  onPress: () => navigation.navigate('DashboardGridModern'),
                },
                {
                  text: 'Continuer le paiement',
                  onPress: async () => {
                    try {
                      await Linking.openURL(paymentUrl);
                      navigation.replace('PaymentVerification', {
                        paymentId: paymentInfo.paymentId,
                        donationId: donation.id,
                        transactionId: paymentInfo.transactionId,
                        paymentUrl: paymentUrl,
                      });
                    } catch (error) {
                      console.error('Erreur ouverture URL:', error);
                      Alert.alert('Erreur', 'Impossible d\'ouvrir la page de paiement. Veuillez réessayer.');
                      navigation.navigate('DashboardGridModern');
                    }
                  },
                },
              ]
            );
          }
        } else {
          Alert.alert('Erreur', 'Erreur lors de l\'initialisation du paiement');
        }
      } else {
        Alert.alert('Erreur', 'Erreur lors de la création du don');
      }
    } catch (error: any) {
      console.error('Erreur création don:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || error.message || 'Une erreur est survenue lors de la création du don'
      );
    } finally {
      setIsLoading(false);
      setShowSuccessAnimation(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: currentStep >= step.id ? colors.primary : 'transparent',
              borderColor: currentStep >= step.id ? colors.primary : colors.border,
            }
          ]}>
            <MaterialIcons
              name={step.icon as any}
              size={16}
              color={currentStep >= step.id ? '#FFFFFF' : colors.textSecondary}
            />
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: currentStep > step.id ? colors.primary : colors.border }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderAmountStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.amountCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.amountHeader}>
          <Text style={styles.amountEmoji}>💰</Text>
          <Text style={styles.amountTitle}>Montant du don</Text>
          <Text style={styles.amountSubtitle}>Choisissez le montant de votre contribution</Text>
        </View>

        <View style={styles.amountInputContainer}>
          <TextInput
            ref={amountInputRef}
            style={styles.amountInput}
            value={formData.amount > 0 ? formData.amount.toString() : ''}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor="rgba(255,255,255,0.7)"
            keyboardType="numeric"
            maxLength={10}
          />
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencyEmoji}>
              {currencies.find(c => c.value === formData.currency)?.flag || '🇸🇳'}
            </Text>
            <Text style={styles.currencyText}>
              {currencies.find(c => c.value === formData.currency)?.symbol || 'CFA'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {formData.amount > 0 && (
          <Animated.View style={styles.amountPreview}>
            <Text style={styles.amountPreviewText}>
              {formatAmount(formData.amount)}
            </Text>
          </Animated.View>
        )}

        {/* Montants suggérés */}
        <View style={styles.suggestedAmounts}>
          <Text style={styles.suggestedTitle}>Montants suggérés</Text>
          <View style={styles.suggestedGrid}>
            {[1000, 5000, 10000, 25000, 50000, 100000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.suggestedButton,
                  formData.amount === amount && styles.suggestedButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, amount }))}
              >
                <Text style={[
                  styles.suggestedButtonText,
                  formData.amount === amount && styles.suggestedButtonTextActive
                ]}>
                  {new Intl.NumberFormat('fr-FR').format(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        onPress={() => setCurrentStep(2)}
        disabled={formData.amount < 200}
      >
        <Text style={styles.nextButtonText}>Continuer</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategoryStep = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        🎯 Choisir la catégorie
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Sélectionnez le type de don qui correspond à votre intention
      </Text>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryCard,
              formData.category === category.value && styles.categoryCardActive
            ]}
            onPress={() => setFormData(prev => ({ ...prev, category: category.value }))}
          >
            <LinearGradient
              colors={category.gradient}
              style={styles.categoryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryTitle}>{category.label}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              
              {formData.category === category.value && (
                <View style={styles.categoryCheckmark}>
                  <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => setCurrentStep(1)}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentStep(3)}
          disabled={!formData.category}
        >
          <Text style={styles.nextButtonText}>Continuer</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderPaymentStep = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        💳 Méthode de paiement
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Choisissez votre méthode de paiement préférée
      </Text>

      <View style={styles.paymentMethods}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[
              styles.paymentCard,
              formData.paymentMethod === method.value && styles.paymentCardActive
            ]}
            onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
          >
            <LinearGradient
              colors={method.gradient}
              style={styles.paymentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.paymentHeader}>
                <Text style={styles.paymentEmoji}>{method.emoji}</Text>
                <Text style={styles.paymentTitle}>{method.label}</Text>
              </View>
              <Text style={styles.paymentDescription}>{method.description}</Text>
              
              {formData.paymentMethod === method.value && (
                <View style={styles.paymentCheckmark}>
                  <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type de don */}
      <View style={[styles.donationTypeCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.donationTypeTitle, { color: colors.text }]}>
          Type de don
        </Text>
        <View style={styles.donationTypeOptions}>
          <TouchableOpacity
            style={[
              styles.donationTypeOption,
              formData.type === 'one_time' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, type: 'one_time' }))}
          >
            <MaterialIcons
              name="favorite"
              size={20}
              color={formData.type === 'one_time' ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.donationTypeText,
              { color: formData.type === 'one_time' ? colors.primary : colors.text }
            ]}>
              Don unique
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.donationTypeOption,
              formData.type === 'recurring' && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => setFormData(prev => ({ ...prev, type: 'recurring' }))}
          >
            <MaterialIcons
              name="repeat"
              size={20}
              color={formData.type === 'recurring' ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.donationTypeText,
              { color: formData.type === 'recurring' ? colors.primary : colors.text }
            ]}>
              Don récurrent
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => setCurrentStep(2)}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentStep(4)}
          disabled={!formData.paymentMethod}
        >
          <Text style={styles.nextButtonText}>Continuer</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderConfirmationStep = () => (
    <Animated.View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        ✅ Confirmation
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Vérifiez les détails de votre don avant de finaliser
      </Text>

      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.confirmationCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.confirmationHeader}>
          <Text style={styles.confirmationEmoji}>🎉</Text>
          <Text style={styles.confirmationTitle}>Récapitulatif de votre don</Text>
        </View>

        <View style={styles.confirmationDetails}>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Montant:</Text>
            <Text style={styles.confirmationValue}>{formatAmount(formData.amount)}</Text>
          </View>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Catégorie:</Text>
            <Text style={styles.confirmationValue}>
              {categories.find(c => c.value === formData.category)?.label}
            </Text>
          </View>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Paiement:</Text>
            <Text style={styles.confirmationValue}>
              {paymentMethods.find(p => p.value === formData.paymentMethod)?.label}
            </Text>
          </View>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Type:</Text>
            <Text style={styles.confirmationValue}>
              {formData.type === 'one_time' ? 'Don unique' : 'Don récurrent'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Message optionnel */}
      <View style={[styles.messageCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.messageTitle, { color: colors.text }]}>
          💬 Message (optionnel)
        </Text>
        <TextInput
          ref={messageInputRef}
          style={[styles.messageInput, { color: colors.text, borderColor: colors.border }]}
          value={formData.message}
          onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
          placeholder="Ajoutez un message personnel..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => setCurrentStep(3)}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Finaliser le don</Text>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderCurrencyModal = () => (
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
              Choisir la devise
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
                  styles.currencyOption,
                  formData.currency === item.value && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, currency: item.value }));
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={styles.currencyFlag}>{item.flag}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={[styles.currencyLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                    {item.symbol}
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
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderAmountStep();
      case 2:
        return renderCategoryStep();
      case 3:
        return renderPaymentStep();
      case 4:
        return renderConfirmationStep();
      default:
        return renderAmountStep();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header moderne */}
        <LinearGradient
          colors={dark ? ['#1a1a2e', '#16213e'] : ['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>
                {mode === 'existing_donation' ? '💳 Initier le paiement' :
                 mode === 'retry_failed' ? '🔄 Réessayer le don' :
                 mode === 'pay_occurrence' ? '📅 Paiement d\'occurrence' : '💝 Nouveau don'}
              </Text>
              <Text style={styles.headerSubtitleText}>
                {steps.find(s => s.id === currentStep)?.description}
              </Text>
            </View>
          </View>

          {renderStepIndicator()}
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {renderCurrencyModal()}

        {/* Animation de succès */}
        {showSuccessAnimation && (
          <View style={styles.successOverlay}>
            <Animated.View style={[styles.successAnimation, { opacity: fadeAnim }]}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successText}>Création en cours...</Text>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </Animated.View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 30,
    height: 2,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 36 : 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  amountCard: {
    borderRadius: 24,
    padding: 30,
    marginBottom: 30,
    overflow: 'hidden',
  },
  amountHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  amountEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  amountTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  amountSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  currencyEmoji: {
    fontSize: 16,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  amountPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountPreviewText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  suggestedAmounts: {
    marginTop: 20,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  suggestedButton: {
    width: (width - 100) / 3,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    alignItems: 'center',
  },
  suggestedButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  suggestedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  suggestedButtonTextActive: {
    color: '#FFFFFF',
  },
  categoriesGrid: {
    gap: 16,
    marginBottom: 30,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  categoryCardActive: {
    elevation: 8,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.02 }],
  },
  categoryGradient: {
    padding: 20,
    minHeight: 120,
    position: 'relative',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  categoryCheckmark: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  paymentMethods: {
    gap: 16,
    marginBottom: 30,
  },
  paymentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  paymentCardActive: {
    elevation: 8,
    shadowOpacity: 0.25,
    transform: [{ scale: 1.02 }],
  },
  paymentGradient: {
    padding: 20,
    position: 'relative',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  paymentCheckmark: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  donationTypeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  donationTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  donationTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  donationTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  donationTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confirmationDetails: {
    gap: 16,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  confirmationLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  confirmationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  currencyFlag: {
    fontSize: 24,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencySymbol: {
    fontSize: 14,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successAnimation: {
    alignItems: 'center',
    gap: 20,
  },
  successEmoji: {
    fontSize: 64,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CreateDonationScreenModern;