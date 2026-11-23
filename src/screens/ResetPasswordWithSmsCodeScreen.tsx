import React, { useState, useRef } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, illustrations } from '../constants';
import apiClient, { showApiError } from '../store/services/apiClient';
import { useOtpClipboard } from '../hooks/useOtpClipboard';

import { useDS, AuthScreen, AppText, Button, TextField, CodeInput } from '../design/components';
import { spacing } from '../design/tokens';

interface ResetPasswordWithSmsCodeScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordWithSmsCodeScreen: React.FC<ResetPasswordWithSmsCodeScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const { phone } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);

  // Auto-remplissage depuis le presse-papier
  useOtpClipboard({
    onCodeDetected: (digits) => {
      setCode(digits);
    },
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const codeInputRefs = useRef<any[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');

    // Code collé ou rempli automatiquement par iOS (SMS / email) : répartir les 6 chiffres
    if (digits.length > 1) {
      const newCode = [...code];
      digits.slice(0, 6 - index).split('').forEach((d, i) => { newCode[index + i] = d; });
      setCode(newCode);
      const next = Math.min(index + digits.length, 5);
      codeInputRefs.current[next]?.focus();
      if (newCode.every(Boolean)) codeInputRefs.current[next]?.blur();
      return;
    }

    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);

    // Auto-focus next input
    if (digits && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (code[index] === '' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && hasNumbers;
  };

  const formatPhoneDisplay = (phone: string) => {
    // Masquer une partie du numéro pour la sécurité
    if (phone.length > 6) {
      const start = phone.substring(0, 4);
      const end = phone.substring(phone.length - 2);
      return start + '***' + end;
    }
    return phone;
  };


  // Compte identifié par téléphone : on ne peut pas savoir si le mot de passe mémorisé est le sien.
  // La prochaine connexion avec mot de passe le remplacera automatiquement.
  const syncSavedPassword = async () => {};

  const handleResetPassword = async () => {
    if (isLoading) return;
    const enteredCode = code.join('');
    
    if (enteredCode.length !== 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code de vérification complet');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        'Mot de passe invalide',
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/reset-password-with-sms-code', {
        phone,
        code: enteredCode,
        newPassword
      });

      if (response.data.success) {
        await syncSavedPassword();
        // Retour direct à la connexion (l'alerte seule bloquait le parcours si on la fermait sans le bouton)
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        Alert.alert('Mot de passe réinitialisé', 'Connectez-vous avec votre nouveau mot de passe.');
      }
    } catch (error: any) {
      console.error('Erreur reset password SMS:', error);
      showApiError(error, 'Une erreur est survenue lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleRequestNewCode = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const response = await apiClient.post('/auth/request-password-reset-sms-code', {
        phone
      });

      if (response.data.success) {
        Alert.alert('Nouveau code envoyé', 'Un nouveau code a été envoyé par SMS');
        setCode(['', '', '', '', '', '']);
      }
    } catch (error: any) {
      console.error('Erreur nouveau code SMS:', error);
      showApiError(error, 'Impossible d\'envoyer un nouveau code');
    } finally {
      setIsLoading(false);
    }
  };

  const eye = (visible: boolean, toggle: () => void) => (
    <Pressable onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
      <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={c.mutedForeground} />
    </Pressable>
  );
  const CRITERIA = [
    { label: 'Au moins 8 caractères', ok: newPassword.length >= 8 },
    { label: 'Une majuscule et une minuscule', ok: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: 'Au moins un chiffre', ok: /\d/.test(newPassword) },
  ];

  return (
    <AuthScreen
      title="Nouveau mot de passe"
      subtitle={`Saisissez le code envoyé au ${formatPhoneDisplay(phone)} et choisissez un nouveau mot de passe.`}
      icon="key-outline"
      onBack={handleBackToLogin}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button title="Demander un nouveau code SMS" variant="ghost" icon="refresh" onPress={handleRequestNewCode} disabled={isLoading} />
          <Button title="Retour à la connexion" variant="ghost" onPress={handleBackToLogin} />
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <AppText variant="smallStrong">Code de vérification</AppText>
        <CodeInput
          code={code}
          onChangeDigit={handleCodeChange}
          onKeyPress={(key, index) => { if (key === 'Backspace') handleBackspace(index); }}
          inputRefs={codeInputRefs as any}
          editable={!isLoading}
        />
      </View>
      <TextField
        label="Nouveau mot de passe"
        icon="lock-closed-outline"
        placeholder="Au moins 8 caractères"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showNewPassword}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        editable={!isLoading}
        right={eye(showNewPassword, () => setShowNewPassword(!showNewPassword))}
      />
      <TextField
        label="Confirmer le mot de passe"
        icon="lock-closed-outline"
        placeholder="Retapez le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        autoComplete="new-password"
        editable={!isLoading}
        error={confirmPassword && confirmPassword !== newPassword ? 'Les mots de passe ne correspondent pas.' : undefined}
        right={eye(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
      />
      <View style={{ gap: 6 }}>
        {CRITERIA.map(cr => (
          <View key={cr.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name={cr.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={cr.ok ? c.success : c.mutedForeground} />
            <AppText variant="small" color={cr.ok ? c.success : c.mutedForeground}>{cr.label}</AppText>
          </View>
        ))}
      </View>
      <Button
        title="Réinitialiser le mot de passe"
        onPress={handleResetPassword}
        loading={isLoading}
        disabled={code.join('').length !== 6 || !newPassword || !confirmPassword}
      />
    </AuthScreen>
  );
};

export default ResetPasswordWithSmsCodeScreen;
