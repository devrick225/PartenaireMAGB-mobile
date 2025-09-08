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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import apiClient from '../store/services/apiClient';

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderPasswordInput = (
    label: string,
    field: string,
    showField: keyof typeof showPasswords,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[
        styles.passwordInputContainer,
        {
          borderColor: errors[field] ? '#FF5722' : (dark ? COLORS.dark3 : COLORS.greyscale300),
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
        },
      ]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
          secureTextEntry={!showPasswords[showField]}
          value={formData[field as keyof typeof formData]}
          onChangeText={(text) => updateFormData(field, text)}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => togglePasswordVisibility(showField)}
          style={styles.passwordToggle}
        >
          <MaterialIcons
            name={showPasswords[showField] ? 'visibility' : 'visibility-off'}
            size={24}
            color={dark ? COLORS.grayTie : COLORS.gray}
          />
        </TouchableOpacity>
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Changer le mot de passe</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.instructionsHeader}>
            <MaterialIcons name="security" size={24} color={colors.primary} />
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              Sécurité du mot de passe
            </Text>
          </View>
          <Text style={[styles.instructionsText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Votre nouveau mot de passe doit contenir au moins 8 caractères avec une combinaison de lettres majuscules, minuscules et de chiffres.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={[styles.formCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          {renderPasswordInput(
            'Mot de passe actuel',
            'currentPassword',
            'current',
            'Entrez votre mot de passe actuel'
          )}

          {renderPasswordInput(
            'Nouveau mot de passe',
            'newPassword',
            'new',
            'Entrez votre nouveau mot de passe'
          )}

          {renderPasswordInput(
            'Confirmer le nouveau mot de passe',
            'confirmPassword',
            'confirm',
            'Confirmez votre nouveau mot de passe'
          )}
        </View>

        {/* Critères de mot de passe */}
        <View style={[styles.criteriaCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.criteriaTitle, { color: colors.text }]}>
            Critères du mot de passe
          </Text>
          
          <View style={styles.criteriaList}>
            <View style={styles.criteriaItem}>
              <MaterialIcons
                name={formData.newPassword.length >= 8 ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={formData.newPassword.length >= 8 ? '#4CAF50' : (dark ? COLORS.grayTie : COLORS.gray)}
              />
              <Text style={[
                styles.criteriaText,
                {
                  color: formData.newPassword.length >= 8
                    ? '#4CAF50'
                    : (dark ? COLORS.grayTie : COLORS.gray),
                },
              ]}>
                Au moins 8 caractères
              </Text>
            </View>

            <View style={styles.criteriaItem}>
              <MaterialIcons
                name={/[A-Z]/.test(formData.newPassword) ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={/[A-Z]/.test(formData.newPassword) ? '#4CAF50' : (dark ? COLORS.grayTie : COLORS.gray)}
              />
              <Text style={[
                styles.criteriaText,
                {
                  color: /[A-Z]/.test(formData.newPassword)
                    ? '#4CAF50'
                    : (dark ? COLORS.grayTie : COLORS.gray),
                },
              ]}>
                Une lettre majuscule
              </Text>
            </View>

            <View style={styles.criteriaItem}>
              <MaterialIcons
                name={/[a-z]/.test(formData.newPassword) ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={/[a-z]/.test(formData.newPassword) ? '#4CAF50' : (dark ? COLORS.grayTie : COLORS.gray)}
              />
              <Text style={[
                styles.criteriaText,
                {
                  color: /[a-z]/.test(formData.newPassword)
                    ? '#4CAF50'
                    : (dark ? COLORS.grayTie : COLORS.gray),
                },
              ]}>
                Une lettre minuscule
              </Text>
            </View>

            <View style={styles.criteriaItem}>
              <MaterialIcons
                name={/\d/.test(formData.newPassword) ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={/\d/.test(formData.newPassword) ? '#4CAF50' : (dark ? COLORS.grayTie : COLORS.gray)}
              />
              <Text style={[
                styles.criteriaText,
                {
                  color: /\d/.test(formData.newPassword)
                    ? '#4CAF50'
                    : (dark ? COLORS.grayTie : COLORS.gray),
                },
              ]}>
                Un chiffre
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bouton de soumission */}
      <View style={[styles.submitSection, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="lock-outline" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  instructionsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 12,
    marginTop: 4,
  },
  criteriaCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  criteriaList: {
    gap: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: 14,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
  submitSection: {
    padding: 20,
    paddingTop: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChangePasswordScreen; 