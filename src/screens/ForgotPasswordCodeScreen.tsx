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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, illustrations } from '../constants';
import apiClient from '../store/services/apiClient';

interface ForgotPasswordCodeScreenProps {
  navigation: any;
}

const ForgotPasswordCodeScreen: React.FC<ForgotPasswordCodeScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
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
        Alert.alert(
          'Code envoyé',
          'Un code de réinitialisation a été envoyé à votre adresse email',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('ResetPasswordWithCodeScreen', { email });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur demande code reset:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'envoi du code';
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
              source={dark ? illustrations.passwordDark : illustrations.password}
              resizeMode="contain"
              style={styles.illustration}
            />
          </View>

          {/* Titre et description */}
          <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.black }]}>
            Mot de passe oublié ?
          </Text>
          
          <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
            Entrez votre adresse email et nous vous enverrons un code de réinitialisation
          </Text>

          {/* Champ email */}
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              borderColor: dark ? COLORS.dark3 : COLORS.greyscale500 
            }]}>
              <MaterialIcons 
                name="email" 
                size={20} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                placeholder="Adresse email"
                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Bouton d'envoi */}
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: COLORS.primary,
                opacity: (!email.trim() || isLoading) ? 0.7 : 1 
              }
            ]}
            onPress={handleRequestCode}
            disabled={!email.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Envoyer le code</Text>
            )}
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
    width: SIZES.width * 0.7,
    height: 200,
  },
  title: {
    fontSize: 28,
    fontFamily: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
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
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backToLoginText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.primary,
  },
});

export default ForgotPasswordCodeScreen; 