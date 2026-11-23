import logger from '../utils/logger';
import React, { useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, illustrations } from '../constants';
import apiClient, { showApiError } from '../store/services/apiClient';

import { useDS, AuthScreen, AppText, Button, ChoiceCard, TextField } from '../design/components';
import { spacing } from '../design/tokens';
interface ForgotPasswordSmsScreenProps {
  navigation: any;
}

const ForgotPasswordSmsScreen: React.FC<ForgotPasswordSmsScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string) => {
    // Supprimer tous les espaces et caractères spéciaux
    let formatted = phone.replace(/\D/g, '');
    
    // Côte d'Ivoire : depuis 2021 les numéros ont 10 chiffres et le 0 initial en fait partie
    // (+225 07 79 03 80 69 est enregistré "+2250779038069" à l'inscription).
    // On ajoute donc l'indicatif SANS retirer le 0, sinon le numéro ne correspond à aucun compte.
    if (formatted.startsWith('00')) {
      formatted = formatted.substring(2); // 00225... -> 225...
    } else if (formatted.startsWith('0')) {
      formatted = '225' + formatted;
    }
    
    // Ajouter le + si pas présent
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  };

  const handleRequestCode = async () => {
    if (!phone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    if (!validatePhone(formattedPhone)) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/request-password-reset-sms-code', {
        phone: formattedPhone
      });

      if (response.data.success) {
        // Navigation directe (avec l'alerte, fermer en touchant à côté sur Android bloquait le parcours)
        navigation.navigate('ResetPasswordWithSmsCodeScreen', { phone: formattedPhone });
        Alert.alert(
          'Code envoyé',
          'Si ce numéro est associé à un compte, vous allez recevoir un code par SMS (valable 10 minutes).'
        );
      }
    } catch (error: any) {
      logger.error('Erreur demande code reset SMS:', error);
      
      showApiError(error, 'Une erreur est survenue lors de l\'envoi du code');
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

  const handleBackToMethods = () => {
    navigation.goBack();
  };

  return (
    <AuthScreen
      title="Code par SMS"
      subtitle="Saisissez votre numéro : nous vous envoyons un code de réinitialisation par SMS."
      icon="chatbubble-ellipses-outline"
      onBack={handleBackToMethods}
    >
      <TextField
        label="Numéro de téléphone"
        icon="call-outline"
        placeholder="+225 07 00 00 00 00"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCorrect={false}
        textContentType="telephoneNumber"
        autoComplete="tel"
        editable={!isLoading}
        hint="Votre téléphone doit pouvoir recevoir des SMS. Des frais d'opérateur peuvent s'appliquer."
      />
      <Button title="Envoyer le code" icon="send" onPress={handleRequestCode} loading={isLoading} disabled={!phone.trim()} />
      <Button title="Retour à la connexion" variant="ghost" onPress={handleBackToLogin} />
    </AuthScreen>
  );
};

export default ForgotPasswordSmsScreen;
