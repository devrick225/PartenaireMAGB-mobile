import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, clearError } from '../store/slices/authSlice';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import { RootState, AppDispatch } from '../store';

import { useDS, AppText, Card, Button, IconButton, TextField, Sheet } from '../design/components';
import { radius, spacing, MIN_TOUCH } from '../design/tokens';
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
  const { c, gradient } = useDS();
  const insets = useSafeAreaInsets();

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
      dispatch(showError({ title: 'Erreur d\'inscription', message: error }));
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

  const validateForm = (): { [key: string]: string } => {
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
    return newErrors;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    const validationErrors = validateForm();
    const messages = Object.values(validationErrors);
    if (messages.length > 0) {
      // Le champ en erreur peut être hors de l'écran : on affiche aussi une notification
      dispatch(showError({ title: 'Formulaire incomplet', message: messages[0] }));
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
        // Pas de navigation.navigate('Dashboard') : cet écran n'existe pas dans AuthNavigator.
        // RootNavigator affiche automatiquement l'app dès que isAuthenticated passe à true.
        dispatch(showSuccess({
          title: 'Inscription réussie !',
          message: 'Votre compte a été créé. Pensez à vérifier votre email.'
        }));
      }
    } catch (error) {
      logger.error('Erreur d\'inscription:', error);
    }
  };


  const eye = (visible: boolean, toggle: () => void) => (
    <Pressable onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} style={styles.eye}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.mutedForeground} />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: c.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {/* En-tête de marque */}
        <LinearGradient colors={gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <IconButton icon="chevron-back" tone="hero" onPress={() => navigation.goBack()} accessibilityLabel="Retour" />
          <AppText variant="display" color="#FFFFFF" accessibilityRole="header" style={{ marginTop: spacing.md }}>Créer un compte</AppText>
          <AppText variant="body" color="rgba(255,255,255,0.8)">Rejoignez la communauté des partenaires MAGB.</AppText>
        </LinearGradient>

        <View style={styles.body}>
          <Card style={{ gap: spacing.lg }}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <TextField label="Prénom *" placeholder="Votre prénom" value={formData.firstName} onChangeText={(t) => handleInputChange('firstName', t)} error={errors.firstName} autoCapitalize="words" textContentType="givenName" autoComplete="name-given" />
              </View>
              <View style={styles.flex}>
                <TextField label="Nom *" placeholder="Votre nom" value={formData.lastName} onChangeText={(t) => handleInputChange('lastName', t)} error={errors.lastName} autoCapitalize="words" textContentType="familyName" autoComplete="name-family" />
              </View>
            </View>
            <TextField label="Email *" icon="mail-outline" placeholder="vous@exemple.com" value={formData.email} onChangeText={(t) => handleInputChange('email', t)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" autoComplete="email" />

            <View style={{ gap: 6 }}>
              <AppText variant="smallStrong">Pays *</AppText>
              <Pressable
                onPress={() => setShowCountryModal(true)}
                accessibilityRole="button"
                accessibilityLabel={`Pays : ${selectedCountry?.name ?? 'à choisir'}`}
                style={({ pressed }) => [styles.select, { backgroundColor: c.card, borderColor: c.input, opacity: pressed ? 0.85 : 1 }]}
              >
                {selectedCountry ? <Image source={{ uri: selectedCountry.flag }} style={styles.flag} /> : <ActivityIndicator size="small" color={c.primary} />}
                <AppText variant="body" style={styles.flex} numberOfLines={1} color={selectedCountry ? c.foreground : c.mutedForeground}>
                  {selectedCountry?.name ?? 'Chargement des pays…'}
                </AppText>
                <Ionicons name="chevron-down" size={18} color={c.mutedForeground} />
              </Pressable>
            </View>

            <TextField label="Ville *" icon="business-outline" placeholder="Votre ville" value={formData.city} onChangeText={(t) => handleInputChange('city', t)} error={errors.city} autoCapitalize="words" textContentType="addressCity" />

            <View style={{ gap: 6 }}>
              <AppText variant="smallStrong">Téléphone *</AppText>
              <View style={styles.row}>
                <View style={[styles.prefix, { backgroundColor: c.muted, borderColor: c.input }]}>
                  {selectedCountry ? <Image source={{ uri: selectedCountry.flag }} style={styles.flag} /> : null}
                  <AppText variant="bodyStrong">{selectedCountry?.callingCode ?? '+'}</AppText>
                </View>
                <View style={styles.flex}>
                  <TextField placeholder="07 00 00 00 00" value={formData.phone} onChangeText={(t) => handleInputChange('phone', t)} error={errors.phone} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" accessibilityLabel="Numéro de téléphone" />
                </View>
              </View>
            </View>

            <TextField
              label="Mot de passe *"
              icon="lock-closed-outline"
              placeholder="Au moins 8 caractères"
              value={formData.password}
              onChangeText={(t) => handleInputChange('password', t)}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              right={eye(showPassword, () => setShowPassword(!showPassword))}
            />
            <TextField
              label="Confirmer le mot de passe *"
              icon="lock-closed-outline"
              placeholder="Retapez le mot de passe"
              value={formData.confirmPassword}
              onChangeText={(t) => handleInputChange('confirmPassword', t)}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
              right={eye(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
            />

            <Pressable
              style={styles.terms}
              onPress={() => setTermsAccepted(!termsAccepted)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
            >
              <View style={[styles.checkbox, { borderColor: errors.terms ? c.destructive : termsAccepted ? c.primary : c.input, backgroundColor: termsAccepted ? c.primary : 'transparent' }]}>
                {termsAccepted ? <Ionicons name="checkmark" size={16} color={c.primaryForeground} /> : null}
              </View>
              <AppText variant="small" style={styles.flex}>
                J'accepte les <AppText variant="smallStrong" color={c.primary}>conditions d'utilisation</AppText> et la{' '}
                <AppText variant="smallStrong" color={c.primary}>politique de confidentialité</AppText>.
              </AppText>
            </Pressable>
            {errors.terms ? <AppText variant="small" color={c.destructive}>{errors.terms}</AppText> : null}

            <Button title="Créer mon compte" variant="gold" icon="person-add-outline" onPress={handleSubmit} loading={isLoading} />
          </Card>

          <View style={styles.loginRow}>
            <AppText variant="body" color={c.mutedForeground}>Déjà inscrit ? </AppText>
            <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="link" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
              <AppText variant="bodyStrong" color={c.primary}>Se connecter</AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Sheet visible={showCountryModal} title="Pays" onClose={() => setShowCountryModal(false)}>
        <Card padded={false}>
          {countries.map((item, i) => {
            const active = selectedCountry?.code === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => {
                  setSelectedCountry(item);
                  handleInputChange('country', item.code);
                  setShowCountryModal(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={({ pressed }) => [
                  styles.countryRow,
                  i < countries.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                  (pressed || active) && { backgroundColor: c.primarySoft },
                ]}
              >
                <Image source={{ uri: item.flag }} style={styles.flag} />
                <AppText variant="body" style={styles.flex} numberOfLines={1}>{item.name}</AppText>
                <AppText variant="small" color={c.mutedForeground}>{item.callingCode}</AppText>
              </Pressable>
            );
          })}
        </Card>
      </Sheet>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl + spacing.sm },
  body: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  prefix: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  flag: { width: 24, height: 16, borderRadius: 2 },
  eye: { padding: 4 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: MIN_TOUCH },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52 },
});

export default SignupComplete;
