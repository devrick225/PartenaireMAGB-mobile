import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, images } from '../constants';
import Header from '../components/Header';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { useAuth } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';
import { showSuccess, showError } from '../store/slices/notificationSlice';

const Login = ({ navigation }) => {
  const [isChecked, setChecked] = useState(false);
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();  
  const { isAuthenticated, isLoading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const REMEMBER_KEY = 'auth_remember_me';
  const REMEMBER_EMAIL_KEY = 'auth_remember_email';

  // Clean errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Pré-remplir email si "se souvenir de moi"
  useEffect(() => {
    (async () => {
      try {
        const remember = await AsyncStorage.getItem(REMEMBER_KEY);
        const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
        const shouldRemember = remember === 'true';
        setChecked(shouldRemember);
        if (shouldRemember && savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
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
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    console.log('🔄 Tentative de connexion avec:', {
      email: formData.email,
      hasPassword: !!formData.password
    });

    if (!validateForm()) {
      // Show validation errors
      const errorMessages = Object.values(fieldErrors);
      console.log('❌ Erreurs de validation:', fieldErrors);
      if (errorMessages.length > 0) {
        dispatch(showError({
          title: 'Erreur de validation',
          message: errorMessages[0]
        }));
      }
      return;
    }

    console.log('✅ Validation réussie, appel API...');

    try {
      const result = await dispatch(loginUser({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      })).unwrap();
      
      // Gérer "se souvenir de moi"
      try {
        if (isChecked) {
          await AsyncStorage.setItem(REMEMBER_KEY, 'true');
          await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, formData.email.toLowerCase().trim());
        } else {
          await AsyncStorage.setItem(REMEMBER_KEY, 'false');
          await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch (e) {
        // noop
      }

      console.log('✅ Connexion réussie:', result);
      // Success is handled in the useEffect above
    } catch (err) {
      console.error('❌ Erreur de connexion complète:', err);
      // Error is automatically handled by Redux and displayed in useEffect
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
    <SafeAreaView style={[styles.area, {
      backgroundColor: colors.background }]}>
      <View style={[styles.container, {
        backgroundColor: colors.background
      }]}>
        <Header  showBackButton={false} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={images.logo}
              resizeMode='contain'
              style={styles.logo}
            />
          </View>
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Connectez-vous à votre compte</Text>
          <Input
            id="email"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon="email"
            keyboardType="email-address"
            value={formData.email}
            onInputChanged={(value) => handleInputChange('email', value)}
            placeholder="Entrez votre email"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <Input
            autoCapitalize="none"
            id="password"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon="lock"
            value={formData.password}
            onInputChanged={(value) => handleInputChange('password', value)}
            placeholder="Entrez votre mot de passe"
            autoCorrect={false}
            editable={!isLoading}
            showPasswordToggle={true}
            secureTextEntry={!showPassword}
          />
          <View style={styles.checkBoxContainer}>
            <View style={{ flexDirection: 'row' }}>
              <Checkbox
                style={styles.checkbox}
                value={isChecked}
                color={isChecked ? '#26335F' : dark ? '#26335F' : "gray"}
                onValueChange={setChecked}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.privacy, {
                  color: dark ? COLORS.white : COLORS.black
                }]}>Se souvenir de moi</Text>
              </View>
            </View>
          </View>
          <Button
            title={isLoading ? "Connexion..." : "Se connecter"}
            filled
            onPress={handleLogin}
            style={[styles.button, isLoading && styles.buttonDisabled]}
            isLoading={isLoading}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPasswordMethods")}
            disabled={isLoading}>
            <Text style={[styles.forgotPasswordBtnText, {
              opacity: isLoading ? 0.5 : 1,
              color: '#26335F'
            }]}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.bottomContainer}>
          <Text style={[styles.bottomLeft, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Vous n'avez pas de compte ?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Signup")}
            disabled={isLoading}>
            <Text style={[styles.bottomRight, {
              opacity: isLoading ? 0.5 : 1,
              color: '#26335F'
            }]}>{"  "}S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
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
    borderColor: '#26335F',
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
    color: '#26335F'
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
    color: '#26335F',
    textAlign: "center",
    marginTop: 12
  }
})

export default Login
