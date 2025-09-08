import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/notificationSlice';

const ResetPasswordHandler = ({ navigation, route }) => {
  const { token } = route.params || {};
  const [isValidating, setIsValidating] = useState(true);
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    validateTokenAndNavigate();
  }, []);

  const validateTokenAndNavigate = async () => {
    console.log('🔄 Validation du token de réinitialisation:', token);
    
    if (!token) {
      console.log('❌ Token manquant');
      dispatch(showError({
        title: 'Lien invalide',
        message: 'Le lien de réinitialisation est invalide ou incomplet'
      }));
      
      setTimeout(() => {
        navigation.replace('ForgotPasswordMethods');
      }, 2000);
      return;
    }

    // Simulate token validation delay
    setTimeout(() => {
      setIsValidating(false);
      
      // Navigate to CreateNewPassword with the token
      navigation.replace('CreateNewPassword', { token });
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <ActivityIndicator 
            size="large" 
            color={COLORS.primary} 
            style={styles.spinner}
          />
          
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Validation du lien</Text>
          
          <Text style={[styles.subtitle, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>
            Nous vérifions la validité de votre lien de réinitialisation...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinner: {
    marginBottom: 32
  },
  title: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 12
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.grayscale700,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32
  }
});

export default ResetPasswordHandler; 