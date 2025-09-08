import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  TextInput
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, images } from '../constants';
import InputModern from '../components/InputModern';
import Checkbox from 'expo-checkbox';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

// Données des pays avec indicatifs
const countries = [
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮' },
  { code: 'GN', name: 'Guinée', dialCode: '+224', flag: '🇬🇳' },
  { code: 'MR', name: 'Mauritanie', dialCode: '+222', flag: '🇲🇷' },
  { code: 'GM', name: 'Gambie', dialCode: '+220', flag: '🇬🇲' },
  { code: 'GW', name: 'Guinée-Bissau', dialCode: '+245', flag: '🇬🇼' },
  { code: 'CV', name: 'Cap-Vert', dialCode: '+238', flag: '🇨🇻' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
];

// Options de genre
const genderOptions = [
  { value: 'male', label: 'Homme', icon: '👨', color: '#26335F' },
  { value: 'female', label: 'Femme', icon: '👩', color: '#D32235' },
  { value: 'other', label: 'Autre', icon: '👤', color: '#FFD61D' },
];

const SignupModern = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [currentStep, setCurrentStep] = useState(1);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Sénégal par défaut
  const [dynamicCountries, setDynamicCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  useEffect(() => {
    startAnimations();
    loadCountriesFromAPI();

    // Nettoyage lors du démontage du composant
    return () => {
      if (window.emailCheckTimeout) {
        clearTimeout(window.emailCheckTimeout);
      }
    };
  }, []);

  const loadCountriesFromAPI = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch('https://restcountries.com/v3.1/region/africa');
      const data = await response.json();

      const africaCountries = data.map((country) => ({
        code: country.cca2,
        name: country.name.common,
        dialCode: country.idd?.root + (country.idd?.suffixes?.[0] || ''),
        flag: country.flag,
      })).sort((a, b) => a.name.localeCompare(b.name));

      // Ajouter quelques pays européens et américains populaires
      const additionalCountries = [
        { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
        { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
        { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
        { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
        { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
        { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
      ];

      const allCountries = [...africaCountries, ...additionalCountries].sort((a, b) => a.name.localeCompare(b.name));
      setDynamicCountries(allCountries);

      // Définir le Sénégal comme pays par défaut s'il existe
      const defaultCountry = allCountries.find(c => c.code === 'SN') || allCountries[0];
      setSelectedCountry(defaultCountry);
      setFormData(prev => ({ ...prev, country: defaultCountry.name }));

    } catch (error) {
      console.error('Erreur lors du chargement des pays:', error);
      // Utiliser les pays statiques en cas d'erreur
      setDynamicCountries(countries);
    } finally {
      setLoadingCountries(false);
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateStep1 = () => {
    const errors = {};

    // Validation prénom
    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation nom
    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    // Validation email
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Validation téléphone
    if (!formData.phone) {
      errors.phone = 'Le numéro de téléphone est requis';
    } else {
      // Nettoyer le numéro de téléphone
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');

      // Validation basée sur le pays sélectionné
      if (selectedCountry.code === 'SN') {
        // Validation pour le Sénégal (format: 77/78/70/76/75 + 7 chiffres)
        if (!/^(77|78|70|76|75)\d{7}$/.test(cleanPhone)) {
          errors.phone = 'Format invalide. Ex: 77 123 45 67';
        }
      } else if (selectedCountry.code === 'FR') {
        // Validation pour la France (format: 06/07 + 8 chiffres)
        if (!/^(06|07)\d{8}$/.test(cleanPhone)) {
          errors.phone = 'Format invalide. Ex: 06 12 34 56 78';
        }
      } else {
        // Validation générique pour les autres pays
        if (!/^\d{8,15}$/.test(cleanPhone)) {
          errors.phone = 'Le numéro doit contenir entre 8 et 15 chiffres';
        }
      }
    }

    // Validation pays
    if (!formData.country) {
      errors.country = 'Le pays est requis';
    }

    // Validation ville
    if (!formData.city.trim()) {
      errors.city = 'La ville est requise';
    } else if (formData.city.trim().length < 2) {
      errors.city = 'La ville doit contenir au moins 2 caractères';
    }

    // Validation genre
    if (!formData.gender) {
      errors.gender = 'Le genre est requis';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors = {};

    // Validation mot de passe
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Validation confirmation mot de passe
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Validation conditions
    if (!isChecked) {
      errors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      const errorMessages = Object.values(fieldErrors);
      if (errorMessages.length > 0) {
        dispatch(showError({
          title: 'Erreur de validation',
          message: errorMessages[0]
        }));
      }
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données pour l'API
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: `${selectedCountry.dialCode}${formData.phone.replace(/\s/g, '')}`,
        country: formData.country,
        city: formData.city.trim(),
        gender: formData.gender,
        password: formData.password,
        // Champs additionnels si nécessaires
        role: 'partner', // Rôle par défaut pour les partenaires
        isPhoneVerified: false,
        isEmailVerified: false,
      };

      console.log('📤 Envoi des données d\'inscription:', signupData);

      // Appel à l'API d'inscription
      const response = await apiService.auth.register(signupData);

      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;

        // Sauvegarder les tokens si fournis
        if (token && refreshToken) {
          await apiService.setTokens(token, refreshToken);
        }

        dispatch(showSuccess({
          title: 'Inscription réussie ! 🎉',
          message: user.firstName ?
            `Bienvenue ${user.firstName} ! Votre compte partenaire a été créé avec succès.` :
            'Votre compte partenaire a été créé avec succès.'
        }));

        // Naviguer selon le statut de vérification
        setTimeout(() => {
          if (user.isEmailVerified && user.isPhoneVerified) {
            // Utilisateur complètement vérifié
            navigation.navigate("DashboardGridModern");
          } else if (!user.isEmailVerified) {
            // Email non vérifié - naviguer vers la vérification email
            navigation.navigate("EmailVerification", {
              email: user.email,
              userId: user.id,
              firstName: user.firstName
            });
          } else if (!user.isPhoneVerified) {
            // Téléphone non vérifié - naviguer vers la vérification SMS
            navigation.navigate("PhoneVerification", {
              phone: user.phone,
              userId: user.id,
              firstName: user.firstName
            });
          } else {
            // Par défaut, aller au dashboard
            navigation.navigate("DashboardGridModern");
          }
        }, 1500); // Délai pour permettre à l'utilisateur de voir le message de succès

      } else {
        // Gérer les erreurs de validation du serveur
        const errorMessage = response.data.message || 'Erreur lors de l\'inscription';
        dispatch(showError({
          title: 'Erreur d\'inscription',
          message: errorMessage
        }));
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription:', error);

      let errorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error.response) {
        // Erreur avec réponse du serveur
        const serverError = error.response.data;

        if (serverError.errors) {
          // Erreurs de validation spécifiques
          const validationErrors = Object.values(serverError.errors).flat();
          errorMessage = validationErrors[0] || errorMessage;
        } else if (serverError.message) {
          errorMessage = serverError.message;
        }

        // Gestion des erreurs spécifiques
        if (error.response.status === 409) {
          errorMessage = 'Un compte avec cet email existe déjà';
        } else if (error.response.status === 422) {
          errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
        }
      } else if (error.request) {
        // Erreur réseau
        errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
      }

      dispatch(showError({
        title: 'Erreur d\'inscription',
        message: errorMessage
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailAvailability = async (email) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;

    setEmailCheckLoading(true);
    try {
      // Vérifier si l'email existe déjà
      const response = await apiService.get(`/auth/check-email?email=${encodeURIComponent(email)}`);

      if (response.data.data.exists) {
        setFieldErrors(prev => ({
          ...prev,
          email: 'Un compte avec cet email existe déjà'
        }));
      } else {
        setFieldErrors(prev => ({
          ...prev,
          email: ''
        }));
      }
    } catch (error) {
      console.log('Erreur lors de la vérification de l\'email:', error);
      // Ne pas afficher d'erreur pour cette vérification optionnelle
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Vérification automatique de l'email après 1 seconde d'inactivité
    if (field === 'email') {
      clearTimeout(window.emailCheckTimeout);
      window.emailCheckTimeout = setTimeout(() => {
        checkEmailAvailability(value);
      }, 1000);
    }
  };

  const formatPhoneNumber = (phone, countryCode) => {
    const cleanPhone = phone.replace(/\D/g, '');

    switch (countryCode) {
      case 'SN':
        // Format sénégalais: 77 123 45 67
        if (cleanPhone.length >= 2) {
          return cleanPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
        }
        break;
      case 'FR':
        // Format français: 06 12 34 56 78
        if (cleanPhone.length >= 2) {
          return cleanPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5').trim();
        }
        break;
      default:
        // Format générique avec espaces tous les 3 chiffres
        return cleanPhone.replace(/(\d{3})/g, '$1 ').trim();
    }

    return cleanPhone;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value, selectedCountry.code);
    handleInputChange('phone', formatted);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      country: country.name,
      // Reformater le téléphone selon le nouveau pays
      phone: prev.phone ? formatPhoneNumber(prev.phone, country.code) : prev.phone
    }));
    setShowCountryModal(false);

    if (fieldErrors.country) {
      setFieldErrors(prev => ({ ...prev, country: '' }));
    }

    // Revalider le téléphone avec le nouveau format
    if (formData.phone && fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender: gender.value }));
    setShowGenderModal(false);

    if (fieldErrors.gender) {
      setFieldErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      // Réinitialiser les animations pour la nouvelle étape
      slideAnim.setValue(50);
      fadeAnim.setValue(0);
      startAnimations();
    } else {
      const errorMessages = Object.values(fieldErrors);
      if (errorMessages.length > 0) {
        dispatch(showError({
          title: 'Champs requis',
          message: errorMessages[0]
        }));
      }
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, { backgroundColor: currentStep >= 1 ? '#26335F' : 'rgba(38, 51, 95, 0.3)' }]} />
      <View style={[styles.stepLine, { backgroundColor: currentStep >= 2 ? '#26335F' : 'rgba(38, 51, 95, 0.3)' }]} />
      <View style={[styles.stepDot, { backgroundColor: currentStep >= 2 ? '#26335F' : 'rgba(38, 51, 95, 0.3)' }]} />
    </View>
  );

  const renderPersonalInfoStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        👤 Informations personnelles
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Commençons par vos informations de base
      </Text>

      <InputModern
        icon="person"
        placeholder="Prénom"
        value={formData.firstName}
        onInputChanged={(value) => handleInputChange('firstName', value)}
        autoCapitalize="words"
        editable={!isLoading}
        errorText={fieldErrors.firstName}
      />

      <InputModern
        icon="person-outline"
        placeholder="Nom de famille"
        value={formData.lastName}
        onInputChanged={(value) => handleInputChange('lastName', value)}
        autoCapitalize="words"
        editable={!isLoading}
        errorText={fieldErrors.lastName}
      />

      <View style={styles.emailInputContainer}>
        <InputModern
          icon="email"
          placeholder="Adresse email"
          value={formData.email}
          onInputChanged={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          errorText={fieldErrors.email}
        />
        {emailCheckLoading && (
          <View style={styles.emailCheckIndicator}>
            <MaterialIcons name="hourglass-empty" size={16} color="#26335F" />
            <Text style={styles.emailCheckText}>Vérification...</Text>
          </View>
        )}
        {formData.email && !fieldErrors.email && !emailCheckLoading && /\S+@\S+\.\S+/.test(formData.email) && (
          <View style={styles.emailCheckIndicator}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={[styles.emailCheckText, { color: '#4CAF50' }]}>Email disponible</Text>
          </View>
        )}
      </View>

      {/* Sélecteur de pays */}
      <TouchableOpacity
        style={[styles.selectorButton, { borderColor: fieldErrors.country ? '#D32235' : 'rgba(38, 51, 95, 0.2)' }]}
        onPress={() => setShowCountryModal(true)}
        disabled={isLoading}
      >
        <MaterialIcons name="public" size={20} color="rgba(38, 51, 95, 0.6)" />
        <Text style={[styles.selectorText, { color: formData.country ? colors.text : colors.textSecondary }]}>
          {formData.country ? `${selectedCountry.flag} ${formData.country}` : 'Sélectionner votre pays'}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="rgba(38, 51, 95, 0.6)" />
      </TouchableOpacity>
      {fieldErrors.country && <Text style={styles.fieldErrorText}>{fieldErrors.country}</Text>}

      <InputModern
        icon="location-city"
        placeholder="Ville"
        value={formData.city}
        onInputChanged={(value) => handleInputChange('city', value)}
        autoCapitalize="words"
        editable={!isLoading}
        errorText={fieldErrors.city}
      />

      {/* Champ téléphone avec indicatif */}
      <View style={[styles.phoneContainer, { borderColor: fieldErrors.phone ? '#D32235' : 'rgba(38, 51, 95, 0.2)' }]}>
        <View style={styles.dialCodeContainer}>
          <Text style={styles.dialCodeText}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
        </View>
        <View style={styles.phoneSeparator} />
        <TextInput
          style={[styles.phoneInput, { color: dark ? COLORS.white : COLORS.black }]}
          placeholder="Numéro de téléphone"
          placeholderTextColor={colors.textSecondary}
          value={formData.phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          editable={!isLoading}
          maxLength={selectedCountry.code === 'SN' ? 12 : selectedCountry.code === 'FR' ? 14 : 20}
        />
      </View>
      {fieldErrors.phone && <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>}

      {/* Sélecteur de genre */}
      <TouchableOpacity
        style={[styles.selectorButton, { borderColor: fieldErrors.gender ? '#D32235' : 'rgba(38, 51, 95, 0.2)' }]}
        onPress={() => setShowGenderModal(true)}
        disabled={isLoading}
      >
        <MaterialIcons name="person" size={20} color="rgba(38, 51, 95, 0.6)" />
        <Text style={[styles.selectorText, { color: formData.gender ? colors.text : colors.textSecondary }]}>
          {formData.gender ?
            `${genderOptions.find(g => g.value === formData.gender)?.icon} ${genderOptions.find(g => g.value === formData.gender)?.label}` :
            'Sélectionner votre genre'
          }
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="rgba(38, 51, 95, 0.6)" />
      </TouchableOpacity>
      {fieldErrors.gender && <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text>}

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: '#26335F',
            opacity: (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.country || !formData.city || !formData.gender) ? 0.5 : 1
          }
        ]}
        onPress={handleNextStep}
        disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.country || !formData.city || !formData.gender || isLoading}
      >
        <Text style={styles.nextButtonText}>Continuer</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSecurityStep = () => (
    <Animated.View
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        🔐 Sécurité du compte
      </Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Créez un mot de passe sécurisé pour votre compte
      </Text>

      <InputModern
        icon="lock"
        placeholder="Mot de passe"
        value={formData.password}
        onInputChanged={(value) => handleInputChange('password', value)}
        showPasswordToggle={true}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        errorText={fieldErrors.password}
      />

      <InputModern
        icon="lock-outline"
        placeholder="Confirmer le mot de passe"
        value={formData.confirmPassword}
        onInputChanged={(value) => handleInputChange('confirmPassword', value)}
        showPasswordToggle={true}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
        errorText={fieldErrors.confirmPassword}
      />

      {/* Conditions d'utilisation */}
      <View style={styles.termsContainer}>
        <View style={styles.checkboxRow}>
          <Checkbox
            style={styles.checkbox}
            value={isChecked}
            color={isChecked ? '#26335F' : dark ? '#26335F' : "gray"}
            onValueChange={setChecked}
          />
          <View style={styles.termsTextContainer}>
            <Text style={[styles.termsText, { color: colors.text }]}>
              J'accepte les{' '}
              <Text style={styles.termsLink}>conditions d'utilisation</Text>
              {' '}et la{' '}
              <Text style={styles.termsLink}>politique de confidentialité</Text>
            </Text>
          </View>
        </View>
        {fieldErrors.terms && (
          <Text style={styles.errorText}>{fieldErrors.terms}</Text>
        )}
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
          style={[styles.signupButton, { opacity: isLoading ? 0.7 : 1 }]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#26335F', '#1a2347']}
            style={styles.signupGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                <Text style={styles.signupButtonText}>Inscription...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.signupButtonText}>S'inscrire</Text>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderCountryModal = () => (
    <Modal
      visible={showCountryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCountryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner votre pays
            </Text>
            <TouchableOpacity
              onPress={() => setShowCountryModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {loadingCountries ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="hourglass-empty" size={24} color="#26335F" />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                  Chargement des pays...
                </Text>
              </View>
            ) : (
              (dynamicCountries.length > 0 ? dynamicCountries : countries).map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    selectedCountry?.code === country.code && { backgroundColor: '#26335F' + '20' }
                  ]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={[styles.countryName, { color: colors.text }]}>
                      {country.name}
                    </Text>
                    <Text style={[styles.countryCode, { color: colors.textSecondary }]}>
                      {country.dialCode}
                    </Text>
                  </View>
                  {selectedCountry?.code === country.code && (
                    <MaterialIcons name="check" size={20} color="#26335F" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderGenderModal = () => (
    <Modal
      visible={showGenderModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowGenderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Sélectionner votre genre
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenderModal(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.genderOptions}>
            {genderOptions.map((gender) => (
              <TouchableOpacity
                key={gender.value}
                style={[
                  styles.genderOption,
                  { backgroundColor: dark ? COLORS.dark2 : '#FFFFFF' },
                  formData.gender === gender.value && { borderColor: gender.color, borderWidth: 2 }
                ]}
                onPress={() => handleGenderSelect(gender)}
              >
                <Text style={styles.genderIcon}>{gender.icon}</Text>
                <Text style={[styles.genderLabel, { color: colors.text }]}>
                  {gender.label}
                </Text>
                {formData.gender === gender.value && (
                  <MaterialIcons name="check-circle" size={20} color={gender.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#26335F', '#1a2347']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Motifs décoratifs */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={images.logo}
                resizeMode='contain'
                style={styles.logo}
              />
            </View>
          </View>

          <Text style={styles.welcomeTitle}>
            Rejoignez-nous ! 🎉
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Créez votre compte partenaire en quelques étapes
          </Text>

          {renderStepIndicator()}
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.formContent}
      >
        <View style={[
          styles.formCard,
          { backgroundColor: dark ? COLORS.dark2 : '#FFFFFF' }
        ]}>
          {currentStep === 1 ? renderPersonalInfoStep() : renderSecurityStep()}
        </View>

        {/* Actions secondaires */}
        <Animated.View
          style={[
            styles.secondaryActions,
            { opacity: fadeAnim }
          ]}
        >
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Vous avez déjà un compte ?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={isLoading}
          >
            <Text style={[styles.footerLink, { opacity: isLoading ? 0.5 : 1 }]}>
              Se connecter maintenant
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modales */}
      {renderCountryModal()}
      {renderGenderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 80,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -20,
    right: 50,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  backHeaderButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logo: {
    width: 50,
    height: 50,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  formContainer: {
    flex: 1,
    marginTop: -20,
  },
  formContent: {
    padding: 20,
    paddingTop: 30,
  },
  formCard: {
    borderRadius: 24,
    padding: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 30,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
    minWidth: 200,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  termsContainer: {
    marginVertical: 20,
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
    height: 20,
    width: 20,
    borderRadius: 6,
    borderColor: '#26335F',
    borderWidth: 2,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: '#26335F',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#D32235',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 32,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  signupGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emailInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  emailCheckIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
    gap: 4,
  },
  emailCheckText: {
    fontSize: 12,
    color: '#26335F',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  }, xt: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryActions: {
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#26335F',
  },
  // Styles pour les sélecteurs
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16, // Uniformisé avec InputModern
    backgroundColor: 'rgba(38, 51, 95, 0.05)',
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  fieldErrorText: {
    color: '#D32235',
    fontSize: 12,
    marginTop: -12, // Rapprocher de l'élément au-dessus
    marginBottom: 16, // Uniformisé
    marginLeft: 4,
  },
  // Styles pour le téléphone avec indicatif
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16, // Uniformisé avec InputModern
    backgroundColor: 'rgba(38, 51, 95, 0.05)',
    minHeight: 56,
  },
  dialCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#26335F',
  },
  phoneSeparator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(38, 51, 95, 0.2)',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  // Styles pour les modales
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
  modalList: {
    maxHeight: height * 0.5,
  },
  // Styles pour les options de pays
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  countryFlag: {
    fontSize: 24,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
  },
  // Styles pour les options de genre
  genderOptions: {
    padding: 20,
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  genderIcon: {
    fontSize: 24,
  },
  genderLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupModern;