import logger from '../utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import apiClient from '../store/services/apiClient';
import { updateTokens } from '../store/slices/authSlice';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import { getSavedCredentials, REMEMBER_PASSWORD_KEY } from '../utils/biometricAuth';
import * as SecureStore from 'expo-secure-store';

// Critères affichés en direct sous le formulaire
const CRITERIA = [
  { label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { label: 'Une lettre majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Une lettre minuscule', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p: string) => /\d/.test(p) },
];

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const newPasswordRef = React.useRef<TextInput>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!newErrors.newPassword && formData.currentPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    const validationErrors = validateForm();
    const messages = Object.values(validationErrors);
    if (messages.length > 0) {
      dispatch(showError({ title: 'Formulaire incomplet', message: messages[0] }) as any);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Le serveur ferme toutes les sessions et renvoie de nouveaux tokens :
      // il faut les enregistrer, sinon l'utilisateur est déconnecté au prochain appel
      const newToken = response.data?.data?.token;
      const newRefreshToken = response.data?.data?.refreshToken;
      if (newToken && newRefreshToken) {
        await apiClient.setTokens(newToken, newRefreshToken);
        dispatch(updateTokens({ token: newToken, refreshToken: newRefreshToken }));
      }

      // Mettre à jour le mot de passe mémorisé (Se souvenir de moi / Face ID)
      try {
        if (await getSavedCredentials()) {
          await SecureStore.setItemAsync(REMEMBER_PASSWORD_KEY, formData.newPassword);
        }
      } catch (e) {
        // noop
      }

      dispatch(showSuccess({
        title: 'Mot de passe modifié',
        message: 'Vos autres appareils ont été déconnectés.',
      }) as any);
      navigation.goBack();
    } catch (error: any) {
      logger.error('Erreur changement mot de passe:', error?.response?.status);
      const data = error.response?.data;
      const errorMessage =
        data?.details?.[0]?.msg || data?.error || data?.message || 'Erreur lors du changement de mot de passe';
      if (data?.error === 'Mot de passe actuel incorrect') {
        setErrors(prev => ({ ...prev, currentPassword: data.error }));
      }
      dispatch(showError({ title: 'Erreur', message: errorMessage }) as any);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderPasswordInput = (
    label: string,
    field: string,
    showField: keyof typeof showPasswords,
    placeholder: string,
    extra: {
      inputRef?: React.RefObject<TextInput | null>;
      onSubmitEditing?: () => void;
      isLast?: boolean;
      isNew?: boolean;
    } = {}
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[
        styles.passwordInputContainer,
        {
          borderColor: errors[field] ? '#FF5722' : (dark ? COLORS.dark3 : COLORS.greyscale300),
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
        },
      ]}>
        <TextInput
          ref={extra.inputRef as any}
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
          secureTextEntry={!showPasswords[showField]}
          value={formData[field as keyof typeof formData]}
          onChangeText={(text) => updateFormData(field, text)}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={extra.isNew ? 'newPassword' : 'password'}
          autoComplete={extra.isNew ? 'new-password' : 'current-password'}
          returnKeyType={extra.isLast ? 'done' : 'next'}
          blurOnSubmit={!!extra.isLast}
          onSubmitEditing={extra.onSubmitEditing}
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={() => togglePasswordVisibility(showField)}
          style={styles.passwordToggle}
          hitSlop={10}
          accessibilityLabel={showPasswords[showField] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          <MaterialIcons
            name={showPasswords[showField] ? 'visibility' : 'visibility-off'}
            size={24}
            color={dark ? COLORS.grayTie : COLORS.gray}
          />
        </TouchableOpacity>
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Changer le mot de passe</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.instructionsHeader}>
            <MaterialIcons name="security" size={24} color={colors.primary} />
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              Sécurité du mot de passe
            </Text>
          </View>
          <Text style={[styles.instructionsText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Votre nouveau mot de passe doit contenir au moins 8 caractères avec une combinaison de lettres majuscules, minuscules et de chiffres.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={[styles.formCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          {renderPasswordInput(
            'Mot de passe actuel',
            'currentPassword',
            'current',
            'Entrez votre mot de passe actuel',
            { onSubmitEditing: () => newPasswordRef.current?.focus() }
          )}

          {renderPasswordInput(
            'Nouveau mot de passe',
            'newPassword',
            'new',
            'Entrez votre nouveau mot de passe',
            { inputRef: newPasswordRef, isNew: true, onSubmitEditing: () => confirmPasswordRef.current?.focus() }
          )}

          {renderPasswordInput(
            'Confirmer le nouveau mot de passe',
            'confirmPassword',
            'confirm',
            'Confirmez votre nouveau mot de passe',
            { inputRef: confirmPasswordRef, isNew: true, isLast: true, onSubmitEditing: handleSubmit }
          )}
        </View>

        {/* Critères de mot de passe */}
        <View style={[styles.criteriaCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.criteriaTitle, { color: colors.text }]}>
            Critères du mot de passe
          </Text>
          
          <View style={styles.criteriaList}>
            {CRITERIA.map(({ label, test }) => {
              const ok = test(formData.newPassword);
              const color = ok ? '#4CAF50' : (dark ? COLORS.grayTie : COLORS.gray);
              return (
                <View key={label} style={styles.criteriaItem}>
                  <MaterialIcons name={ok ? 'check-circle' : 'radio-button-unchecked'} size={16} color={color} />
                  <Text style={[styles.criteriaText, { color }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bouton de soumission */}
      <View style={[styles.submitSection, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="lock-outline" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  instructionsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 12,
    marginTop: 4,
  },
  criteriaCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  criteriaList: {
    gap: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 24,
  },
  submitSection: {
    padding: 20,
    paddingTop: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen; 