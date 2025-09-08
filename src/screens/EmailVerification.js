import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

const EmailVerification = ({ navigation, route }) => {
  const { email, userId, firstName } = route.params;
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    startAnimations();
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    try {
      await apiService.post('/auth/resend-verification-email', { email });
      
      dispatch(showSuccess({
        title: 'Email envoyé !',
        message: 'Un nouvel email de vérification a été envoyé.'
      }));
      
      setCountdown(60); // 60 secondes avant de pouvoir renvoyer
      
    } catch (error) {
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible d\'envoyer l\'email. Veuillez réessayer.'
      }));
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.get('/auth/me');
      
      if (response.data.data.isEmailVerified) {
        dispatch(showSuccess({
          title: 'Email vérifié ! ✅',
          message: 'Votre email a été vérifié avec succès.'
        }));
        
        setTimeout(() => {
          navigation.navigate('DashboardGridModern');
        }, 1500);
      } else {
        dispatch(showError({
          title: 'Email non vérifié',
          message: 'Votre email n\'a pas encore été vérifié. Vérifiez votre boîte mail.'
        }));
      }
    } catch (error) {
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de vérifier le statut. Veuillez réessayer.'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Passer la vérification',
      'Vous pourrez vérifier votre email plus tard dans les paramètres. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Continuer', 
          onPress: () => navigation.navigate('DashboardGridModern')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#26335F', '#1a2347']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="mark-email-unread" size={60} color="#FFD61D" />
          </View>
          
          <Text style={styles.title}>
            Vérifiez votre email 📧
          </Text>
          
          <Text style={styles.subtitle}>
            {firstName ? `Salut ${firstName} !` : 'Bonjour !'} Nous avons envoyé un lien de vérification à :
          </Text>
          
          <Text style={styles.emailText}>
            {email}
          </Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.instructionsCard}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>
            Instructions :
          </Text>
          
          <View style={styles.instructionItem}>
            <MaterialIcons name="looks-one" size={24} color="#26335F" />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Ouvrez votre boîte mail
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <MaterialIcons name="looks-two" size={24} color="#26335F" />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Cliquez sur le lien de vérification
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <MaterialIcons name="looks-3" size={24} color="#26335F" />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              Revenez ici et cliquez sur "Vérifier"
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleCheckVerification}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#26335F', '#1a2347']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
              ) : (
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Vérification...' : 'Vérifier maintenant'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { 
                borderColor: colors.border,
                opacity: (resendLoading || countdown > 0) ? 0.5 : 1 
              }
            ]}
            onPress={handleResendEmail}
            disabled={resendLoading || countdown > 0}
          >
            <MaterialIcons 
              name="refresh" 
              size={20} 
              color={colors.text} 
            />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {countdown > 0 
                ? `Renvoyer dans ${countdown}s`
                : resendLoading 
                  ? 'Envoi...'
                  : 'Renvoyer l\'email'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkipForNow}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              Passer pour le moment
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD61D',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  instructionsCard: {
    backgroundColor: 'rgba(38, 51, 95, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default EmailVerification;