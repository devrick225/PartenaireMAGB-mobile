import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, illustrations } from '../constants';

import { useDS, AuthScreen, AppText, Button, ChoiceCard, TextField } from '../design/components';
import { spacing } from '../design/tokens';
interface ForgotPasswordMethodScreenProps {
  navigation: any;
}

const ForgotPasswordMethodScreen: React.FC<ForgotPasswordMethodScreenProps> = ({ navigation }) => {
  const { c } = useDS();

  const handleBackToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleEmailMethod = () => {
    navigation.navigate('ForgotPasswordCodeScreen');
  };

  const handleSmsMethod = () => {
    navigation.navigate('ForgotPasswordSmsScreen');
  };

  return (
    <AuthScreen
      title="Mot de passe oublié"
      subtitle="Comment souhaitez-vous recevoir votre code de réinitialisation ?"
      icon="key-outline"
      onBack={handleBackToLogin}
    >
      <ChoiceCard icon="mail-outline" title="Par email" description="Recevez le code sur votre adresse email." selected={false} onPress={handleEmailMethod} />
      <ChoiceCard icon="chatbubble-ellipses-outline" title="Par SMS" description="Recevez le code sur votre téléphone." selected={false} onPress={handleSmsMethod} />
      <Button title="Retour à la connexion" variant="ghost" onPress={handleBackToLogin} />
    </AuthScreen>
  );
};

export default ForgotPasswordMethodScreen;
