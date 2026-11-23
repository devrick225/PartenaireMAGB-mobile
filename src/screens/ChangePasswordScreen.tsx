import logger from '../utils/logger';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../store/services/apiClient';
import { updateTokens } from '../store/slices/authSlice';
import { showError, showSuccess } from '../store/slices/notificationSlice';
import { getSavedCredentials, REMEMBER_PASSWORD_KEY } from '../utils/biometricAuth';
import * as SecureStore from 'expo-secure-store';

import { useDS, AppText, Screen, HeroHeader, Card, TextField, Button } from '../design/components';
import { spacing } from '../design/tokens';
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
  const { c } = useDS();
  const dispatch = useDispatch();
  const newPasswordRef = React.useRef<React.ElementRef<typeof TextInput>>(null);
  const confirmPasswordRef = React.useRef<React.ElementRef<typeof TextInput>>(null);
  
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


  const PasswordField = (
    label: string,
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    showField: keyof typeof showPasswords,
    placeholder: string,
    extra: { inputRef?: React.RefObject<React.ElementRef<typeof TextInput> | null>; onSubmitEditing?: () => void; isLast?: boolean; isNew?: boolean } = {}
  ) => (
    <TextField
      label={label}
      icon="lock-closed-outline"
      inputRef={extra.inputRef}
      placeholder={placeholder}
      secureTextEntry={!showPasswords[showField]}
      value={formData[field]}
      onChangeText={(text) => updateFormData(field, text)}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType={extra.isNew ? 'newPassword' : 'password'}
      autoComplete={extra.isNew ? 'new-password' : 'current-password'}
      returnKeyType={extra.isLast ? 'done' : 'next'}
      blurOnSubmit={!!extra.isLast}
      onSubmitEditing={extra.onSubmitEditing}
      editable={!isLoading}
      error={errors[field]}
      right={
        <Pressable
          onPress={() => togglePasswordVisibility(showField)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPasswords[showField] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          <Ionicons name={showPasswords[showField] ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.mutedForeground} />
        </Pressable>
      }
    />
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        hero={
          <HeroHeader
            eyebrow="Sécurité"
            eyebrowIcon="shield-checkmark-outline"
            title="Changer le mot de passe"
            subtitle="Vos autres appareils seront déconnectés."
            onBack={() => navigation.goBack()}
          />
        }
        footer={<Button title="Changer le mot de passe" icon="lock-closed-outline" onPress={handleSubmit} loading={isLoading} />}
      >
        <Card style={{ gap: spacing.lg }}>
          {PasswordField('Mot de passe actuel', 'currentPassword', 'current', 'Votre mot de passe actuel', {
            onSubmitEditing: () => newPasswordRef.current?.focus(),
          })}
          {PasswordField('Nouveau mot de passe', 'newPassword', 'new', 'Au moins 8 caractères', {
            inputRef: newPasswordRef,
            isNew: true,
            onSubmitEditing: () => confirmPasswordRef.current?.focus(),
          })}
          {PasswordField('Confirmer le nouveau mot de passe', 'confirmPassword', 'confirm', 'Retapez le nouveau mot de passe', {
            inputRef: confirmPasswordRef,
            isNew: true,
            isLast: true,
            onSubmitEditing: handleSubmit,
          })}
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="overline" color={c.mutedForeground}>Votre nouveau mot de passe doit</AppText>
          {CRITERIA.map(({ label, test }) => {
            const ok = test(formData.newPassword);
            return (
              <View key={label} style={styles.criterion} accessible accessibilityLabel={`${label} : ${ok ? 'respecté' : 'non respecté'}`}>
                <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={ok ? c.success : c.mutedForeground} />
                <AppText variant="small" color={ok ? c.success : c.mutedForeground}>{label}</AppText>
              </View>
            );
          })}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  criterion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

export default ChangePasswordScreen;
