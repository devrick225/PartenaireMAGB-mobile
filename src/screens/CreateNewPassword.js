import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableWithoutFeedback, Modal } from 'react-native';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, icons, illustrations } from '../constants';
import Header from '../components/Header';
import { reducer } from '../utils/reducers/formReducers';
import { validateInput } from '../utils/actions/formActions';
import Input from '../components/Input';
import Checkbox from 'expo-checkbox';
import Button from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAppDispatch } from '../store/hooks';
import authService from '../store/services/authService';
import { showError, showSuccess } from '../store/slices/notificationSlice';

const isTestMode = true;

const initialState = {
  inputValues: {
    newPassword: isTestMode ? '**********' : '',
    confirmNewPassword: isTestMode ? '**********' : '',
  },
  inputValidities: {
    newPassword: false,
    confirmNewPassword: false,
  },
  formIsValid: false,
}

const CreateNewPassword = ({ navigation, route }) => {
  const { token } = route.params || {};
  const [formState, dispatchFormState] = useReducer(reducer, initialState);
  const [error, setError] = useState(null);
  const [isChecked, setChecked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { colors, dark } = useTheme();
  const dispatch = useAppDispatch();

  const inputChangedHandler = useCallback(
    (inputId, inputValue) => {
      const result = validateInput(inputId, inputValue)
      dispatchFormState({ inputId, validationResult: result, inputValue })
    },
    [dispatchFormState]
  )

  useEffect(() => {
    if (error) {
      Alert.alert('An error occured', error)
    }
  }, [error])

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Une lettre minuscule');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Une lettre majuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Un chiffre');
    }
    
    return errors;
  };

  const validateForm = () => {
    const errors = {};

    // New password validation
    if (!formState.inputValues.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else {
      const passwordErrors = validatePassword(formState.inputValues.newPassword);
      if (passwordErrors.length > 0) {
        errors.newPassword = `Mot de passe invalide: ${passwordErrors.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!formState.inputValues.confirmNewPassword) {
      errors.confirmNewPassword = 'Veuillez confirmer le mot de passe';
    } else if (formState.inputValues.newPassword !== formState.inputValues.confirmNewPassword) {
      errors.confirmNewPassword = 'Les mots de passe ne correspondent pas';
    }

    dispatchFormState({ inputValidities: errors });
    return Object.keys(errors).length === 0;
  };

  const handleResetPassword = async () => {
    console.log('🔄 Tentative de réinitialisation mot de passe avec token:', token);

    if (!token) {
      dispatch(showError({
        title: 'Erreur',
        message: 'Token de réinitialisation manquant. Veuillez refaire une demande de récupération.'
      }));
      navigation.navigate('ForgotPasswordMethods');
      return;
    }

    if (!validateForm()) {
      const errorMessages = Object.values(formState.inputValidities);
      if (errorMessages.length > 0) {
        dispatch(showError({
          title: 'Erreur de validation',
          message: errorMessages[0]
        }));
      }
      return;
    }

    setModalVisible(true);

    try {
      const result = await authService.resetPassword({
        token: token,
        password: formState.inputValues.newPassword
      });
      
      console.log('✅ Réinitialisation réussie:', result);
      
      dispatch(showSuccess({
        title: 'Succès',
        message: 'Votre mot de passe a été réinitialisé avec succès'
      }));
      
    } catch (error) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);
      
      dispatch(showError({
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de la réinitialisation'
      }));
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: COLORS.grayscale400 };
    
    const errors = validatePassword(password);
    const strength = ((4 - errors.length) / 4) * 100;
    
    if (strength < 25) return { strength, text: 'Très faible', color: COLORS.red };
    if (strength < 50) return { strength, text: 'Faible', color: COLORS.orange };
    if (strength < 75) return { strength, text: 'Moyen', color: COLORS.yellow };
    if (strength < 100) return { strength, text: 'Fort', color: COLORS.primary };
    return { strength, text: 'Très fort', color: COLORS.green };
  };

  const passwordStrength = getPasswordStrength(formState.inputValues.newPassword);

  // Render modal
  const renderModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContainer]}>
            <View style={[styles.modalSubContainer, {
              backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite
            }]}>
              <Image
                source={illustrations.passwordSuccess}
                resizeMode='contain'
                style={styles.modalIllustration}
              />
              <Text style={[styles.modalTitle, {
                color: dark ? COLORS.white : COLORS.black
              }]}>Mot de passe réinitialisé!</Text>
              <Text style={[styles.modalSubtitle, {
                color: dark ? COLORS.grayscale400 : COLORS.grayscale600
              }]}>
                Votre mot de passe a été réinitialisé avec succès. 
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
              <Button
                title="Se connecter"
                filled
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate("Login");
                }}
                style={{
                  width: "100%",
                  marginTop: 12
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Nouveau mot de passe" />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <Image
              source={dark ? illustrations.passwordSuccessDark : illustrations.newPassword}
              resizeMode='contain'
              style={styles.success}
            />
          </View>
          <Text style={[styles.title, {
            color: dark ? COLORS.white : COLORS.black
          }]}>Créez votre nouveau mot de passe</Text>
          <Input
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['newPassword']}
            autoCapitalize="none"
            id="newPassword"
            placeholder="Nouveau mot de passe"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon={icons.padlock}
            secureTextEntry={true}
          />
          <Input
            onInputChanged={inputChangedHandler}
            errorText={formState.inputValidities['confirmNewPassword']}
            autoCapitalize="none"
            id="confirmNewPassword"
            placeholder="Confirmer le nouveau mot de passe"
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
            icon={icons.padlock}
            secureTextEntry={true}
          />
        </ScrollView>
        <Button
          title="Réinitialiser le mot de passe"
          filled
          onPress={handleResetPassword}
          style={styles.button}
        />
        {renderModal()}
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white
  },
  success: {
    width: SIZES.width * 0.8,
    height: 250
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 52
  },
  title: {
    fontSize: 18,
    fontFamily: "medium",
    color: COLORS.black,
    marginVertical: 12
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
  },
  checkbox: {
    marginRight: 8,
    height: 16,
    width: 16,
    borderRadius: 4,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  privacy: {
    fontSize: 12,
    fontFamily: "regular",
    color: COLORS.black,
  },
  socialTitle: {
    fontSize: 19.25,
    fontFamily: "medium",
    color: COLORS.black,
    textAlign: "center",
    marginVertical: 26
  },
  socialBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "absolute",
    bottom: 12,
    right: 0,
    left: 0,
  },
  bottomLeft: {
    fontSize: 14,
    fontFamily: "regular",
    color: "black"
  },
  bottomRight: {
    fontSize: 16,
    fontFamily: "medium",
    color: COLORS.primary
  },
  button: {
    marginVertical: 6,
    width: SIZES.width - 32,
    borderRadius: 30
  },
  forgotPasswordBtnText: {
    fontSize: 16,
    fontFamily: "semiBold",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 12
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginVertical: 12
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "regular",
    color: COLORS.greyscale600,
    textAlign: "center",
    marginVertical: 12
  },
  modalContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  modalSubContainer: {
    height: 494,
    width: SIZES.width * 0.9,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalIllustration: {
    height: 180,
    width: 180,
    marginVertical: 22
  }
})

export default CreateNewPassword
