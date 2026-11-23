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
import apiClient from '../store/services/apiClient';
import { showApiError } from '../store/services/apiClient';

import { useDS, AuthScreen, AppText, Button, ChoiceCard, TextField } from '../design/components';
import { spacing } from '../design/tokens';
interface ForgotPasswordCodeScreenProps {
  navigation: any;
}

const ForgotPasswordCodeScreen: React.FC<ForgotPasswordCodeScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/request-password-reset-code', {
        email: email.toLowerCase().trim()
      });

      if (response.data.success) {
        // Email normalisé (minuscules, sans espaces) transmis à l'écran suivant et pour le renvoi du code
        navigation.navigate('ResetPasswordWithCodeScreen', { email: email.toLowerCase().trim() });
        Alert.alert(
          'Code envoyé',
          'Si cet email est associé à un compte, vous allez recevoir un code (valable 10 minutes). Pensez à vérifier vos spams.'
        );
      }
    } catch (error: any) {
      console.error('Erreur demande code reset:', error);
      showApiError(error, 'Une erreur est survenue lors de l\'envoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  // Retour à l'écran précédent (choix email / SMS) plutôt que tout recommencer depuis la connexion
  const handleBackToLogin = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <AuthScreen
      title="Code par email"
      subtitle="Saisissez votre adresse email : nous vous envoyons un code de réinitialisation."
      icon="mail-outline"
      onBack={handleBackToLogin}
    >
      <TextField
        label="Adresse email"
        icon="mail-outline"
        placeholder="vous@exemple.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
        editable={!isLoading}
        returnKeyType="send"
        onSubmitEditing={handleRequestCode}
      />
      <Button title="Envoyer le code" icon="send" onPress={handleRequestCode} loading={isLoading} disabled={!email.trim()} />
      <Button title="Retour à la connexion" variant="ghost" onPress={handleBackToLogin} />
    </AuthScreen>
  );
};

export default ForgotPasswordCodeScreen;
