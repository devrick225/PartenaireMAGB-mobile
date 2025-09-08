import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, SIZES, illustrations } from '../constants';

interface ForgotPasswordMethodScreenProps {
  navigation: any;
}

const ForgotPasswordMethodScreen: React.FC<ForgotPasswordMethodScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();

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
            Réinitialiser le mot de passe
          </Text>
          
          <Text style={[styles.subtitle, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
            Choisissez comment vous souhaitez recevoir votre code de réinitialisation
          </Text>

          {/* Options de méthode */}
          <View style={styles.methodsContainer}>
            {/* Option Email */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
                }
              ]}
              onPress={handleEmailMethod}
            >
              <View style={[styles.methodIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <MaterialIcons 
                  name="email" 
                  size={32} 
                  color={COLORS.primary} 
                />
              </View>
              <View style={styles.methodContent}>
                <Text style={[styles.methodTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                  Par Email
                </Text>
                <Text style={[styles.methodDescription, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                  Recevez le code de réinitialisation sur votre adresse email
                </Text>
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
              />
            </TouchableOpacity>

            {/* Option SMS */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  borderColor: dark ? COLORS.dark3 : COLORS.greyscale300,
                }
              ]}
              onPress={handleSmsMethod}
            >
              <View style={[styles.methodIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <MaterialIcons 
                  name="sms" 
                  size={32} 
                  color={COLORS.primary} 
                />
              </View>
              <View style={styles.methodContent}>
                <Text style={[styles.methodTitle, { color: dark ? COLORS.white : COLORS.black }]}>
                  Par SMS
                </Text>
                <Text style={[styles.methodDescription, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                  Recevez le code de réinitialisation sur votre téléphone
                </Text>
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
              />
            </TouchableOpacity>
          </View>

          {/* Note de sécurité */}
          <View style={[styles.securityNote, { 
            backgroundColor: dark ? COLORS.dark3 : COLORS.tansparentPrimary,
            borderColor: dark ? COLORS.dark3 : COLORS.primary + '30',
          }]}>
            <MaterialIcons 
              name="security" 
              size={20} 
              color={COLORS.primary} 
              style={styles.securityIcon}
            />
            <Text style={[styles.securityText, { color: dark ? COLORS.grayscale400 : COLORS.primary }]}>
              Pour votre sécurité, le code expirera dans 10 minutes
            </Text>
          </View>

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
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  methodsContainer: {
    marginBottom: 32,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
    color: COLORS.black,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.grayscale700,
    lineHeight: 20,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  securityIcon: {
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'regular',
    lineHeight: 20,
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

export default ForgotPasswordMethodScreen; 