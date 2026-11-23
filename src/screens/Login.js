import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REMEMBER_KEY,
  getBiometricSupport,
  isBiometricEnabled,
  getSavedCredentials,
  saveCredentialsAfterLogin,
  authenticateBiometric,
} from '../utils/biometricAuth';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Card, Button as DSButton, useDS } from '../design/components';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';
import { showSuccess, showError } from '../store/slices/notificationSlice';

const Login = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const { colors, dark } = useTheme();
  const { c, gradient } = useDS();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();  
  const { isAuthenticated, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  // Connexion biométrique (Face ID / Touch ID / empreinte)
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Face ID');

  // Clean errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Pré-remplir email + mot de passe si "se souvenir de moi", et proposer Face ID si activé
  useEffect(() => {
    (async () => {
      try {
        const shouldRemember = (await AsyncStorage.getItem(REMEMBER_KEY)) === 'true';
        setChecked(shouldRemember);
        const saved = await getSavedCredentials();

        if (shouldRemember && saved) {
          setFormData(prev => ({ ...prev, email: saved.email, password: saved.password }));
        }

        // Bouton Face ID : activé dans les paramètres + identifiants enregistrés + biométrie configurée
        if (saved && (await isBiometricEnabled())) {
          const support = await getBiometricSupport();
          if (support.available && support.enrolled) {
            setBiometricLabel(support.label);
            setBiometricAvailable(true);
          }
        }
      } catch (e) {
        // noop
      }
    })();
  }, []);

  // Show authentication errors
  useEffect(() => {
    if (error) {
      dispatch(showError({
        title: 'Erreur de connexion',
        message: error
      }));
    }
  }, [error, dispatch]);

  // Redirect after successful login
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(showSuccess({
        title: 'Connexion réussie',
        message: 'Bienvenue dans PARTENAIRE MAGB'
      }));
      // Navigation is now handled automatically by RootNavigator
    }
  }, [isAuthenticated, dispatch]);

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setFieldErrors(errors);
    // Retourne les erreurs directement : l'état fieldErrors n'est pas encore à jour à ce moment-là
    return errors;
  };

  const handleLogin = async () => {
    console.log('🔄 Tentative de connexion avec:', {
      email: formData.email,
      hasPassword: !!formData.password
    });

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // Show validation errors
      const errorMessages = Object.values(errors);
      console.log('❌ Erreurs de validation:', errors);
      if (errorMessages.length > 0) {
        dispatch(showError({
          title: 'Erreur de validation',
          message: errorMessages[0]
        }));
      }
      return;
    }

    console.log('✅ Validation réussie, appel API...');
    await performLogin(formData.email, formData.password, isChecked);
  };

  // Appel API de connexion + gestion de "se souvenir de moi"
  const performLogin = async (rawEmail, password, remember) => {
    const email = rawEmail.toLowerCase().trim();
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();

      // Gérer "se souvenir de moi" / Face ID
      await saveCredentialsAfterLogin(email, password, remember);

      // Ne jamais logger le résultat complet : il contient les tokens JWT et les données perso
      if (__DEV__) console.log('✅ Connexion réussie pour l\'utilisateur', result?.data?.user?.id);
      // Success is handled in the useEffect above
    } catch (err) {
      console.error('❌ Erreur de connexion complète:', err);
      // Error is automatically handled by Redux and displayed in useEffect
    }
  };

  // Connexion avec Face ID / Touch ID / empreinte en utilisant les identifiants enregistrés
  const handleBiometricLogin = async () => {
    try {
      const auth = await authenticateBiometric();
      if (!auth.success) {
        // Annulation volontaire : pas de message d'erreur
        if (!auth.cancelled) {
          dispatch(showError({
            title: 'Authentification échouée',
            message: 'Impossible de vérifier votre identité. Connectez-vous avec votre mot de passe.'
          }));
        }
        return;
      }

      const saved = await getSavedCredentials();
      if (!saved) {
        setBiometricAvailable(false);
        dispatch(showError({
          title: 'Identifiants introuvables',
          message: 'Connectez-vous une fois avec votre mot de passe pour réactiver ' + biometricLabel + '.'
        }));
        return;
      }

      await performLogin(saved.email, saved.password, isChecked);
    } catch (e) {
      console.error('❌ Erreur biométrie:', e);
      dispatch(showError({
        title: 'Erreur',
        message: 'La connexion biométrique a échoué. Utilisez votre mot de passe.'
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleForgotPassword = () => {
    // Navigate to password recovery screen
    Alert.alert(
      'Mot de passe oublié',
      'Cette fonctionnalité sera bientôt disponible'
    );
  };

  const handleRegister = () => {
    // Navigate to registration screen
    Alert.alert(
      'Inscription',
      'Naviguer vers l\'écran d\'inscription'
    );
  };


  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* En-tête de marque (hero du site) */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 32, paddingBottom: 56, paddingHorizontal: 24, alignItems: 'center' }}
        >
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Image source={images.logo} resizeMode="contain" style={{ width: 64, height: 64 }} />
          </View>
          <AppText variant="display" color="#FFFFFF" center accessibilityRole="header">Bon retour</AppText>
          <AppText variant="body" color="rgba(255,255,255,0.8)" center style={{ marginTop: 4 }}>
            Connectez-vous à votre espace Partenaire MAGB
          </AppText>
        </LinearGradient>

        {/* Formulaire */}
        <View style={{ paddingHorizontal: 16, marginTop: -28, flex: 1 }}>
          <Card style={{ gap: 4 }}>
            <AppText variant="smallStrong">Email</AppText>
            <Input
              id="email"
              placeholderTextColor={c.mutedForeground}
              icon="email"
              keyboardType="email-address"
              value={formData.email}
              onInputChanged={(value) => handleInputChange('email', value)}
              placeholder="vous@exemple.com"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Email"
            />
            <AppText variant="smallStrong" style={{ marginTop: 8 }}>Mot de passe</AppText>
            <Input
              autoCapitalize="none"
              id="password"
              placeholderTextColor={c.mutedForeground}
              icon="lock"
              value={formData.password}
              onInputChanged={(value) => handleInputChange('password', value)}
              placeholder="Votre mot de passe"
              autoCorrect={false}
              editable={!isLoading}
              showPasswordToggle={true}
              secureTextEntry={!showPassword}
              accessibilityLabel="Mot de passe"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}
                onPress={() => setChecked(!isChecked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <Checkbox style={styles.checkbox} value={isChecked} color={isChecked ? c.primary : c.mutedForeground} onValueChange={setChecked} />
                <AppText variant="small">Se souvenir de moi</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPasswordMethods")}
                disabled={isLoading}
                accessibilityRole="link"
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <AppText variant="smallStrong" color={c.primary}>Mot de passe oublié ?</AppText>
              </TouchableOpacity>
            </View>
            <DSButton title={isLoading ? "Connexion…" : "Se connecter"} onPress={handleLogin} loading={isLoading} />
            {biometricAvailable && (
              <DSButton
                title={`Se connecter avec ${biometricLabel}`}
                variant="outline"
                icon={biometricLabel.includes('empreinte') || biometricLabel === 'Touch ID' ? 'finger-print' : 'scan'}
                onPress={handleBiometricLogin}
                disabled={isLoading}
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingBottom: insets.bottom + 24 }}>
          <AppText variant="body" color={c.mutedForeground}>Pas encore de compte ? </AppText>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")} disabled={isLoading} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
            <AppText variant="bodyStrong" color={c.primary}>S'inscrire</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
};

const styles = StyleSheet.create({
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#472A6F',
  },
  biometricButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'semiBold',
    color: '#472A6F',
  },
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32
  },
  title: {
    fontSize: 28,
    fontFamily: "bold",
    color: COLORS.black,
    textAlign: "center"
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  checkBoxContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
  },
  checkbox: {
    marginRight: 8,
    height: 16,
    width: 16,
    borderRadius: 4,
    borderColor: '#472A6F',
    borderWidth: 2,
  },
  privacy: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
  },
  socialTitle: {
    fontSize: 19.25,
    fontFamily: "medium",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 26
  },
  socialBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "absolute",
    bottom: 12,
    right: 0,
    left: 0,
  },
  bottomLeft: {
    fontSize: 14,
    fontFamily: "regular",
    color: "black"
  },
  bottomRight: {
    fontSize: 16,
    fontFamily: "medium",
    color: '#472A6F'
  },
  button: {
    marginVertical: 6,
    width: SIZES.width - 32,
    borderRadius: 30
  },
  buttonDisabled: {
    opacity: 0.7
  },
  forgotPasswordBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: '#472A6F',
    textAlign: "center",
    marginTop: 12
  }
})

export default Login
