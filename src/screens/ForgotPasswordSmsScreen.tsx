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

interface ForgotPasswordSmsScreenProps {
  navigation: any;
}

const ForgotPasswordSmsScreen: React.FC<ForgotPasswordSmsScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string) => {
    // Supprimer tous les espaces et caractères spéciaux
    let formatted = phone.replace(/\D/g, '');
    
    // Si le numéro commence par 0, remplacer par le code pays
    if (formatted.startsWith('0')) {
      formatted = '225' + formatted.substring(1); // Code pays Côte d'Ivoire
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
        Alert.alert(
          'Code envoyé',
          'Un code de réinitialisation a été envoyé par SMS à votre téléphone',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('ResetPasswordWithSmsCodeScreen', { phone: formattedPhone });
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur demande code reset SMS:', error);
      
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

  const handleBackToMethods = () => {
    navigation.goBack();
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
              onPress={handleBackToMethods}
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
            Réinitialisation par SMS
          </Text>
          
          <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
            Entrez votre numéro de téléphone et nous vous enverrons un code de réinitialisation par SMS
          </Text>

          {/* Champ téléphone */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.black }]}>
              Numéro de téléphone
            </Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
              borderColor: dark ? COLORS.dark3 : COLORS.greyscale500 
            }]}>
              <MaterialIcons 
                name="phone" 
                size={20} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { 
                  color: dark ? COLORS.white : COLORS.black 
                }]}
                placeholder="+225 XX XX XX XX XX"
                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Note d'information */}
          <View style={[styles.infoNote, { 
            backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
            borderColor: dark ? COLORS.dark3 : COLORS.primary + '30',
          }]}>
            <MaterialIcons 
              name="info" 
              size={20} 
              color={COLORS.primary} 
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: dark ? COLORS.grayscale400 : COLORS.primary }]}>
              Assurez-vous que votre téléphone peut recevoir des SMS. Les frais SMS standard peuvent s'appliquer.
            </Text>
          </View>

          {/* Bouton d'envoi */}
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: COLORS.primary,
                opacity: (!phone.trim() || isLoading) ? 0.7 : 1 
              }
            ]}
            onPress={handleRequestCode}
            disabled={!phone.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Envoyer le code SMS</Text>
            )}
          </TouchableOpacity>

          {/* Lien pour changer de méthode */}
          <TouchableOpacity
            style={styles.changeMethodContainer}
            onPress={() => navigation.navigate('ForgotPasswordCodeScreen')}
          >
            <Text style={[styles.changeMethodText, { color: COLORS.primary }]}>
              Préférer recevoir par email ?
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'regular',
    lineHeight: 20,
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
  changeMethodContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  changeMethodText: {
    fontSize: 14,
    fontFamily: 'semiBold',
    color: COLORS.primary,
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

export default ForgotPasswordSmsScreen; 