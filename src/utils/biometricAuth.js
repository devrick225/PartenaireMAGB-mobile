// Connexion biométrique (Face ID / Touch ID / empreinte) — logique partagée Login + Paramètres
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export const REMEMBER_KEY = 'auth_remember_me';
export const REMEMBER_EMAIL_KEY = 'auth_remember_email';
// Mot de passe stocké chiffré (Keychain iOS / Keystore Android), jamais dans AsyncStorage
export const REMEMBER_PASSWORD_KEY = 'auth_remember_password';
// 'true' / 'false' ; absent = suit "Se souvenir de moi" (comportement d'origine)
export const BIOMETRIC_ENABLED_KEY = 'auth_biometric_enabled';

/** Le téléphone a-t-il la biométrie, et est-elle configurée ? Renvoie le libellé à afficher. */
export async function getBiometricSupport() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware) return { available: false, enrolled: false, label: 'Face ID' };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let label = Platform.OS === 'ios' ? 'Face ID' : 'la biométrie';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      label = Platform.OS === 'ios' ? 'Face ID' : 'la reconnaissance faciale';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      label = Platform.OS === 'ios' ? 'Touch ID' : "l'empreinte digitale";
    }
    return { available: true, enrolled: isEnrolled, label };
  } catch (e) {
    return { available: false, enrolled: false, label: 'Face ID' };
  }
}

/** La connexion biométrique est-elle activée ? */
export async function isBiometricEnabled() {
  try {
    const flag = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    if (flag === 'true') return true;
    if (flag === 'false') return false;
    return (await AsyncStorage.getItem(REMEMBER_KEY)) === 'true';
  } catch (e) {
    return false;
  }
}

export async function setBiometricEnabled(enabled) {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/** Identifiants enregistrés (ou null) */
export async function getSavedCredentials() {
  try {
    const email = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(REMEMBER_PASSWORD_KEY);
    return email && password ? { email, password } : null;
  } catch (e) {
    return null; // SecureStore indisponible (ex: web)
  }
}

/**
 * Après une connexion réussie : garder les identifiants si "Se souvenir de moi"
 * OU si la biométrie est activée, sinon les effacer.
 */
export async function saveCredentialsAfterLogin(email, password, remember) {
  try {
    await AsyncStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
    const flag = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const keep = remember || flag === 'true';
    if (keep) {
      await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email);
      await SecureStore.setItemAsync(REMEMBER_PASSWORD_KEY, password);
    } else {
      await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(REMEMBER_PASSWORD_KEY);
    }
  } catch (e) {
    // noop
  }
}

/** Demande Face ID / Touch ID. Renvoie { success, cancelled } */
export async function authenticateBiometric(promptMessage = 'Connexion à PARTENAIRE MAGB') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Annuler',
    fallbackLabel: 'Utiliser le code',
  });
  const cancelled = !result.success &&
    ['user_cancel', 'system_cancel', 'app_cancel'].includes(result.error);
  return { success: result.success, cancelled };
}

/** Désactivation de Face ID : on efface le mot de passe sauf si "Se souvenir de moi" le garde */
export async function disableBiometric() {
  await setBiometricEnabled(false);
  try {
    const remember = (await AsyncStorage.getItem(REMEMBER_KEY)) === 'true';
    if (!remember) {
      await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      await SecureStore.deleteItemAsync(REMEMBER_PASSWORD_KEY);
    }
  } catch (e) {
    // noop
  }
}
