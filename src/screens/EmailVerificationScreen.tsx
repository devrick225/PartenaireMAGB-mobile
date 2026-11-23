import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../store/services/authService';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';
import { RootState } from '../store';
import { useOtpClipboard } from '../hooks/useOtpClipboard';
import { showApiError } from '../store/services/apiClient';

import { useDS, AppText, Screen, HeroHeader, Card, Button, CodeInput } from '../design/components';
import { spacing } from '../design/tokens';
interface EmailVerificationScreenProps {
  navigation: any;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<any[]>([]);

  // Auto-remplissage depuis le presse-papier (SMS/email OTP)
  useOtpClipboard({
    onCodeDetected: (digits) => {
      setCode(digits);
      // Vérification automatique après distribution
      handleVerifyCode(digits.join(''));
    },
  });

  useEffect(() => {
    startTimer();
    sendInitialCode();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
      await authService.sendEmailVerificationCode();
    } catch (error) {
      console.error('Erreur envoi code initial:', error);
      showApiError(error, 'Impossible d\'envoyer le code de vérification');
    } finally {
      setIsSending(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');
    const newCode = [...code];

    if (digits.length > 1) {
      // Code collé ou rempli automatiquement par iOS depuis le SMS / l'email : répartir les chiffres
      digits.slice(0, 6 - index).split('').forEach((d, i) => { newCode[index + i] = d; });
      setCode(newCode);
      const next = Math.min(index + digits.length, 5);
      inputRefs.current[next]?.focus();
    } else {
      newCode[index] = digits;
      setCode(newCode);

      // Passer au champ suivant automatiquement
      if (digits && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
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
    // Saisie auto du 6e chiffre + appui sur le bouton : éviter deux vérifications simultanées
    if (isLoading) return;
    const codeToVerify = verificationCode || code.join('');
    
    if (codeToVerify.length !== 6) {
      Alert.alert('Erreur', 'Veuillez saisir le code à 6 chiffres');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.verifyEmailCode(codeToVerify);
      
      if (response.data.success) {
        // Mettre à jour le store Redux
        dispatch(updateUser({ isEmailVerified: true }));
        
        Alert.alert(
          'Succès !',
          'Votre email a été vérifié avec succès',
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
      showApiError(error, 'Code de vérification invalide');
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
      await authService.sendEmailVerificationCode();
      Alert.alert('Succès', 'Un nouveau code a été envoyé par email');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      startTimer();
    } catch (error) {
      console.error('Erreur renvoi code:', error);
      showApiError(error, 'Impossible de renvoyer le code');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const incomplete = code.some(digit => digit === '');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        hero={
          <HeroHeader eyebrow="Vérification" eyebrowIcon="shield-checkmark-outline" title="Vérifier mon email" onBack={() => navigation.goBack()} />
        }
      >
        <Card style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="mail-unread-outline" size={36} color={c.primary} />
          </View>
          <AppText variant="body" color={c.mutedForeground} center>Nous avons envoyé un code à 6 chiffres à</AppText>
          <AppText variant="bodyStrong" color={c.primary} center selectable>{user?.email}</AppText>

          <CodeInput code={code} onChangeDigit={handleCodeChange} onKeyPress={handleKeyPress} inputRefs={inputRefs} editable={!isLoading} />

          <Button title="Vérifier" icon="checkmark-circle-outline" onPress={() => handleVerifyCode()} loading={isLoading} disabled={incomplete} />

          {timer > 0 ? (
            <AppText variant="small" color={c.mutedForeground} center accessibilityLiveRegion="polite">
              Renvoyer le code dans {formatTime(timer)}
            </AppText>
          ) : (
            <Pressable onPress={handleResendCode} disabled={isSending} accessibilityRole="button" style={styles.resend}>
              {isSending ? <ActivityIndicator size="small" color={c.primary} /> : <AppText variant="bodyStrong" color={c.primary}>Renvoyer le code</AppText>}
            </Pressable>
          )}
        </Card>

        <AppText variant="small" color={c.mutedForeground} center>Vous ne recevez rien ? Vérifiez vos courriers indésirables, puis renvoyez le code.</AppText>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', gap: spacing.md, paddingVertical: spacing.xl },
  iconCircle: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  resend: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
});

export default EmailVerificationScreen;
