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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, illustrations } from '../constants';
import apiClient from '../store/services/apiClient';

interface ResetPasswordWithSmsCodeScreenProps {
  navigation: any;
  route: any;
}

const ResetPasswordWithSmsCodeScreen: React.FC<ResetPasswordWithSmsCodeScreenProps> = ({ navigation, route }) => {
  const { colors, dark } = useTheme();
  const { phone } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const codeInputRefs = useRef<TextInput[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
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

  const handleResetPassword = async () => {
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
        Alert.alert(
          'Succès',
          'Votre mot de passe a été réinitialisé avec succès',
          [
            {
              text: 'Se connecter',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur reset password SMS:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la réinitialisation';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Erreur', errorMessage);
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
      Alert.alert('Erreur', 'Impossible d\'envoyer un nouveau code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header avec bouton retour */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackToLogin}
              style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500 }]}
            >
              <MaterialIcons 
                name="arrow-back" 
                size={24} 
                color={dark ? COLORS.white : COLORS.black} 
              />
            </TouchableOpacity>
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
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
            Code SMS reçu
          </Text>
          
          <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
            Entrez le code de vérification envoyé au {formatPhoneDisplay(phone)} et votre nouveau mot de passe
          </Text>

          {/* Code de vérification */}
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: dark ? COLORS.white : COLORS.black }]}>
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
                      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                      borderColor: digit ? COLORS.primary : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      color: dark ? COLORS.white : COLORS.black,
                    }
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(index);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  editable={!isLoading}
                />
              ))}
            </View>
          </View>

          {/* Nouveau mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.black }]}>
              Nouveau mot de passe
            </Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              borderColor: dark ? COLORS.dark3 : COLORS.greyscale500 
            }]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
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
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmer le mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.black }]}>
              Confirmer le mot de passe
            </Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              borderColor: dark ? COLORS.dark3 : COLORS.greyscale500 
            }]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
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
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Exigences du mot de passe */}
          <View style={styles.requirementsContainer}>
            <Text style={[styles.requirementsTitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Le mot de passe doit contenir :
            </Text>
            <Text style={[styles.requirement, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              • Au moins 8 caractères
            </Text>
            <Text style={[styles.requirement, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              • Une lettre majuscule et une minuscule
            </Text>
            <Text style={[styles.requirement, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
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
              Demander un nouveau code SMS
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
      </View>
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
    fontFamily: 'bold',
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

export default ResetPasswordWithSmsCodeScreen;
