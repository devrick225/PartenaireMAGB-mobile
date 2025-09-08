import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES } from '../constants';
import Button from '../components/Button';
import { registerUser, clearError } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface SignupCompleteProps {
  navigation: any;
}

const SignupComplete: React.FC<SignupCompleteProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const { colors, dark } = useTheme();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'CI',
    city: '',
  });

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Country selection
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur d\'inscription', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/region/africa');
      const data = await response.json();

      const africaCountries = data.map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
        callingCode: country.idd?.root + (country.idd?.suffixes?.[0] || ''),
        flag: `https://flagsapi.com/${country.cca2}/flat/64.png`,
      })).sort((a: Country, b: Country) => a.name.localeCompare(b.name));

      setCountries(africaCountries);

      const defaultCountry = africaCountries.find((c: Country) => c.code === 'CI');
      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
      }
    } catch (error) {
      const fallbackCountries = [
        { code: 'CI', name: 'Côte d\'Ivoire', callingCode: '+225', flag: 'https://flagsapi.com/CI/flat/64.png' },
        { code: 'BF', name: 'Burkina Faso', callingCode: '+226', flag: 'https://flagsapi.com/BF/flat/64.png' },
        { code: 'ML', name: 'Mali', callingCode: '+223', flag: 'https://flagsapi.com/ML/flat/64.png' },
        { code: 'SN', name: 'Sénégal', callingCode: '+221', flag: 'https://flagsapi.com/SN/flat/64.png' },
      ];
      setCountries(fallbackCountries);
      setSelectedCountry(fallbackCountries[0]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (formData.phone.length < 8) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise';
    }

    if (!termsAccepted) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const registrationData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: selectedCountry?.callingCode + formData.phone,
      password: formData.password,
      country: selectedCountry?.code || 'CI',
      city: formData.city.trim(),
      language: 'fr',
      currency: 'XOF',
    };

    try {
      const result = await dispatch(registerUser(registrationData));

      if (registerUser.fulfilled.match(result)) {
        Alert.alert(
          'Inscription réussie !',
          'Votre compte a été créé avec succès. Veuillez vérifier votre email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Dashboard'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
    }
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    secureTextEntry?: boolean,
    keyboardType?: any,
    icon?: string,
    rightIcon?: React.ReactNode
  ) => (
    <View style={styles.inputContainer}>
      <View style={[styles.inputWrapper, {
        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
        borderColor: error ? COLORS.error : (dark ? COLORS.dark3 : COLORS.greyscale300)
      }]}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={dark ? COLORS.white : COLORS.grayscale400}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.textInput, {
            color: dark ? COLORS.white : COLORS.black,
            flex: rightIcon ? 0.9 : 1
          }]}
          placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.grayscale400}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {rightIcon}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.countryItem, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => {
        setSelectedCountry(item);
        handleInputChange('country', item.code);
        setShowCountryModal(false);
      }}
    >
      <Image source={{ uri: item.flag }} style={styles.flagImage} />
      <Text style={[styles.countryName, { color: dark ? COLORS.white : COLORS.black }]}>{item.name}</Text>
      <Text style={[styles.callingCode, { color: dark ? COLORS.grayTie : COLORS.greyscale400 }]}>{item.callingCode}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
            >
              <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: dark ? COLORS.grayTie : COLORS.greyscale400 }]}>
              Rejoignez notre communauté de donateurs
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Nom *</Text>
              {renderInput(
                'Votre nom',
                formData.lastName,
                (text) => handleInputChange('lastName', text),
                errors.lastName,
                false,
                'default',
                'person-outline'
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Prénom *</Text>
              {renderInput(
                'Votre prénom',
                formData.firstName,
                (text) => handleInputChange('firstName', text),
                errors.firstName,
                false,
                'default',
                'person-outline'
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Email *</Text>
              {renderInput(
                'votre@email.com',
                formData.email,
                (text) => handleInputChange('email', text),
                errors.email,
                false,
                'email-address',
                'mail-outline'
              )}
            </View>

            {/* Pays */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Pays *</Text>
              <TouchableOpacity
                style={[styles.countrySelector, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
                }]}
                onPress={() => setShowCountryModal(true)}
              >
                {selectedCountry && (
                  <>
                    <Image source={{ uri: selectedCountry.flag }} style={styles.selectedFlag} />
                    <Text style={[styles.selectedCountryText, { color: dark ? COLORS.white : COLORS.black }]}>
                      {selectedCountry.name}
                    </Text>
                  </>
                )}
                <Ionicons name="chevron-down" size={20} color={dark ? COLORS.grayTie : COLORS.grayscale400} />
              </TouchableOpacity>
            </View>

            {/* Ville */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Ville *</Text>
              {renderInput(
                'Votre ville',
                formData.city,
                (text) => handleInputChange('city', text),
                errors.city,
                false,
                'default',
                'location-outline'
              )}
            </View>

            {/* Téléphone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Téléphone *</Text>
              <View style={styles.phoneContainer}>
                <View style={[styles.phonePrefix, {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
                }]}>
                  {selectedCountry && (
                    <>
                      <Image source={{ uri: selectedCountry.flag }} style={styles.phoneFlagImage} />
                      <Text style={[styles.phonePrefixText, { color: dark ? COLORS.white : COLORS.black }]}>
                        {selectedCountry.callingCode}
                      </Text>
                    </>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  {renderInput(
                    '12345678',
                    formData.phone,
                    (text) => handleInputChange('phone', text),
                    errors.phone,
                    false,
                    'phone-pad'
                  )}
                </View>
              </View>
            </View>

            {/* Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Mot de passe *</Text>
              {renderInput(
                'Votre mot de passe',
                formData.password,
                (text) => handleInputChange('password', text),
                errors.password,
                !showPassword,
                'default',
                'lock-closed-outline',
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={dark ? COLORS.grayTie : COLORS.grayscale400}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Confirmation mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: dark ? COLORS.white : COLORS.black }]}>Confirmer le mot de passe *</Text>
              {renderInput(
                'Confirmez votre mot de passe',
                formData.confirmPassword,
                (text) => handleInputChange('confirmPassword', text),
                errors.confirmPassword,
                !showConfirmPassword,
                'default',
                'lock-closed-outline',
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={dark ? COLORS.grayTie : COLORS.grayscale400}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Conditions d'utilisation */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
              </View>
              <Text style={[styles.termsText, { color: dark ? COLORS.white : COLORS.black }]}>
                J'accepte les{' '}
                <Text style={[styles.termsLink, { color: COLORS.primary }]}>
                  conditions d'utilisation
                </Text>{' '}
                et la{' '}
                <Text style={[styles.termsLink, { color: COLORS.primary }]}>
                  politique de confidentialité
                </Text>
              </Text>
            </TouchableOpacity>

            {errors.terms && (
              <Text style={styles.errorText}>{errors.terms}</Text>
            )}

            {/* Bouton d'inscription */}
            <Button
              title={isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
              onPress={handleSubmit}
              filled
              style={[styles.submitButton, { opacity: isLoading ? 0.7 : 1 }]}
            />

            {/* Lien de connexion */}
            <View style={styles.loginLinkContainer}>
              <Text style={[styles.loginText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Vous avez déjà un compte ?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: COLORS.primary }]}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Modal de sélection de pays */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCountryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
              <View style={[styles.modalHeader, { borderBottomColor: dark ? COLORS.dark3 : COLORS.greyscale300 }]}>
                <Text style={[styles.modalTitle, { color: dark ? COLORS.white : COLORS.black }]}>Sélectionner un pays</Text>
                <TouchableOpacity
                  onPress={() => setShowCountryModal(false)}
                  style={[styles.modalCloseButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale300 }]}
                >
                  <Ionicons name="close" size={24} color={dark ? COLORS.white : COLORS.black} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={countries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'space-between',
    height: 50,
  },
  selectedFlag: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  selectedCountryText: {
    flex: 1,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minWidth: 100,
    height: 50,
  },
  phoneFlagImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 30,
  },
  loginLinkContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  flagImage: {
    width: 32,
    height: 32,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
  },
  callingCode: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignupComplete; 