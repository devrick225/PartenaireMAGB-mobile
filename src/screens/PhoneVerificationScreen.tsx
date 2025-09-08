import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import authService from '../store/services/authService';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';
import { RootState } from '../store';

interface PhoneVerificationScreenProps {
  navigation: any;
}

const PhoneVerificationScreen: React.FC<PhoneVerificationScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    startTimer();
    sendInitialCode();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => {
    setTimer(60); // 60 secondes
    setCanResend(false);
  };

  const sendInitialCode = async () => {
    try {
      setIsSending(true);
      const response = await authService.sendPhoneVerificationCode();
      
      // En mode développement, afficher le code reçu
      if (process.env.NODE_ENV === 'development' && (response.data as any).code) {
        Alert.alert(
          'Code SMS (Dev)', 
          `Votre code: ${(response.data as any).code}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur envoi code initial:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le code de vérification');
    } finally {
      setIsSending(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Empêcher la saisie de plusieurs caractères
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Passer au champ suivant automatiquement
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Vérifier automatiquement si tous les champs sont remplis
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir le code à 6 chiffres');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.verifyPhoneCode(codeToVerify);
      
      if (response.data.success) {
        // Mettre à jour le store Redux
        dispatch(updateUser({ isPhoneVerified: true }));
        
        Alert.alert(
          'Succès !',
          'Votre numéro de téléphone a été vérifié avec succès',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur vérification code:', error);
      const message = error.response?.data?.error || 'Code de vérification invalide';
      Alert.alert('Erreur', message);
      // Réinitialiser le code en cas d'erreur
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setIsSending(true);
      const response = await authService.sendPhoneVerificationCode();
      
      // En mode développement, afficher le code reçu
      if (process.env.NODE_ENV === 'development' && (response.data as any).code) {
        Alert.alert(
          'Code SMS (Dev)', 
          `Votre code: ${(response.data as any).code}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Succès', 'Un nouveau code a été envoyé par SMS');
      }
      
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      startTimer();
    } catch (error) {
      console.error('Erreur renvoi code:', error);
      Alert.alert('Erreur', 'Impossible de renvoyer le code');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhone = (phone: string) => {
    // Masquer partiellement le numéro pour la sécurité
    if (phone.length > 4) {
      return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    return phone;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Vérification SMS</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <LinearGradient
              colors={[colors.primary + '20', colors.primary + '10']}
              style={styles.illustrationBackground}
            >
              <MaterialIcons name="sms" size={80} color={colors.primary} />
            </LinearGradient>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={[styles.title, { color: colors.text }]}>
              Vérifiez votre téléphone
            </Text>
            <Text style={[styles.subtitle, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              Nous avons envoyé un code à 6 chiffres au
            </Text>
            <Text style={[styles.phone, { color: colors.primary }]}>
              {formatPhone(user?.phone || '')}
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: colors.text }]}>
              Entrez le code de vérification
            </Text>
            <View style={styles.codeInputs}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                      borderColor: digit ? colors.primary : (dark ? COLORS.dark3 : COLORS.greyscale300),
                      color: colors.text,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>
          </View>

          {/* Timer and Resend */}
          <View style={styles.timerSection}>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Renvoyer le code dans {formatTime(timer)}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isSending}
                style={styles.resendButton}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.resendText, { color: colors.primary }]}>
                    Renvoyer le code
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            onPress={() => handleVerifyCode()}
            disabled={isLoading || code.some(digit => digit === '')}
            style={[
              styles.verifyButton,
              {
                backgroundColor: isLoading || code.some(digit => digit === '') 
                  ? (dark ? COLORS.dark3 : COLORS.greyscale300)
                  : colors.primary,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Vérifier</Text>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={[styles.helpText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Vous ne recevez pas le code ? Vérifiez que votre téléphone est allumé ou{' '}
            <Text style={{ color: colors.primary }} onPress={handleResendCode}>
              renvoyez-le
            </Text>
          </Text>

          {/* Dev Mode Notice */}
          {process.env.NODE_ENV === 'development' && (
            <View style={[styles.devNotice, { backgroundColor: dark ? COLORS.dark3 : COLORS.warning + '20' }]}>
              <MaterialIcons name="info" size={16} color={colors.primary} />
              <Text style={[styles.devNoticeText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                Mode développement : Le code SMS s'affichera dans une alerte
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  illustrationBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  phone: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeContainer: {
    marginBottom: 30,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: 'bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  devNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  devNoticeText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default PhoneVerificationScreen; 