import logger from '../utils/logger';
import React, { useState, useRef } from 'react';
import {
  View,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, illustrations } from '../constants';
import apiClient, { showApiError } from '../store/services/apiClient';
import { useOtpClipboard } from '../hooks/useOtpClipboard';
import * as SecureStore from 'expo-secure-store';
import { getSavedCredentials, REMEMBER_PASSWORD_KEY } from '../utils/biometricAuth';

import { IconButton } from '../design/components';
import { useDS } from '../design/components';
import { palette } from '../design/tokens';
interface ResetPasswordWithCodeScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordWithCodeScreen: React.FC<ResetPasswordWithCodeScreenProps> = ({ navigation, route }) => {
  const { c, dark } = useDS();
  // Compatibilité avec les styles historiques : primary reste violet (texte blanc dessus)
  const colors = { primary: palette.light.primary, text: c.foreground, textSecondary: c.mutedForeground, background: c.background, card: c.card, surface: c.muted, border: c.border, primaryLight: c.primarySoft, secondary: c.gold };
  const { email } = route.params;

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

  const codeInputRefs = useRef<TextInput[]>([]);

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


  // Met à jour le mot de passe mémorisé (Se souvenir de moi / Face ID) s'il s'agit du même compte
  const syncSavedPassword = async () => {
    try {
      const saved = await getSavedCredentials();
      if (saved && saved.email === email.toLowerCase().trim()) {
        await SecureStore.setItemAsync(REMEMBER_PASSWORD_KEY, newPassword);
      }
    } catch (e) {
      // noop
    }
  };

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
      const response = await apiClient.post('/auth/reset-password-with-code', {
        email,
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
      logger.error('Erreur reset password:', error);
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
      const response = await apiClient.post('/auth/request-password-reset-code', {
        email
      });

      if (response.data.success) {
        Alert.alert('Nouveau code envoyé', 'Un nouveau code a été envoyé à votre email');
        setCode(['', '', '', '', '', '']);
      }
    } catch (error: any) {
      logger.error('Erreur nouveau code:', error);
      showApiError(error, 'Impossible d\'envoyer un nouveau code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header avec bouton retour */}
          <View style={styles.header}>
            <IconButton icon="chevron-back" onPress={handleBackToLogin} accessibilityLabel="Retour" />
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={dark ? illustrations.passwordSuccessDark : illustrations.newPassword}
              resizeMode="contain"
              style={styles.illustration}
            />
          </View>

          {/* Titre et description */}
          <Text style={[styles.title, { color: c.foreground }]}>
            Réinitialiser le mot de passe
          </Text>
          
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Entrez le code de vérification envoyé à {email} et votre nouveau mot de passe
          </Text>

          {/* Code de vérification */}
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: c.foreground }]}>
              Code de vérification
            </Text>
            <View style={styles.codeInputsContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: c.card,
                      borderColor: digit ? COLORS.primary : (c.border),
                      color: c.foreground,
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(index);
                    }
                  }}
                  keyboardType="number-pad"
                  // Le 1er champ accepte 6 chiffres : permet le collage et le remplissage auto iOS
                  maxLength={index === 0 ? 6 : 1}
                  textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  selectTextOnFocus
                  textAlign="center"
                  editable={!isLoading}
                />
              ))}
            </View>
          </View>

          {/* Nouveau mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: c.foreground }]}>
              Nouveau mot de passe
            </Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: c.muted,
              borderColor: c.border 
            }]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={c.mutedForeground} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: c.foreground 
                }]}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={c.mutedForeground}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={c.mutedForeground} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmer le mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: c.foreground }]}>
              Confirmer le mot de passe
            </Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: c.muted,
              borderColor: c.border 
            }]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={c.mutedForeground} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: c.foreground 
                }]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={c.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color={c.mutedForeground} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Exigences du mot de passe */}
          <View style={styles.requirementsContainer}>
            <Text style={[styles.requirementsTitle, { color: c.mutedForeground }]}>
              Le mot de passe doit contenir :
            </Text>
            <Text style={[styles.requirement, { color: c.mutedForeground }]}>
              • Au moins 8 caractères
            </Text>
            <Text style={[styles.requirement, { color: c.mutedForeground }]}>
              • Une lettre majuscule et une minuscule
            </Text>
            <Text style={[styles.requirement, { color: c.mutedForeground }]}>
              • Au moins un chiffre
            </Text>
          </View>

          {/* Bouton de réinitialisation */}
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: COLORS.primary,
                opacity: (code.join('').length !== 6 || !newPassword || !confirmPassword || isLoading) ? 0.7 : 1 
              }
            ]}
            onPress={handleResetPassword}
            disabled={code.join('').length !== 6 || !newPassword || !confirmPassword || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
            )}
          </TouchableOpacity>

          {/* Lien pour nouveau code */}
          <TouchableOpacity
            style={styles.newCodeContainer}
            onPress={handleRequestNewCode}
            disabled={isLoading}
          >
            <Text style={[styles.newCodeText, { color: COLORS.primary }]}>
              Demander un nouveau code
            </Text>
          </TouchableOpacity>

          {/* Lien retour connexion */}
          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.backToLoginText, { color: COLORS.primary }]}>
              Retour à la connexion
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.greyscale500,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  illustration: {
    width: SIZES.width * 0.6,
    height: 160,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: 12,
  },
  codeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'semiBold',
    backgroundColor: COLORS.white,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: COLORS.greyscale500,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.black,
  },
  requirementsContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: 'semiBold',
    color: COLORS.grayscale700,
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    marginBottom: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold',
  },
  newCodeContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  newCodeText: {
    fontSize: 14,
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
});

export default ResetPasswordWithCodeScreen;
