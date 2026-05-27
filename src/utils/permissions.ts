import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type PermissionType = 'camera' | 'mediaLibrary';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

const PERMISSION_MESSAGES: Record<PermissionType, { title: string; message: string; settingsMessage: string }> = {
  camera: {
    title: 'Permission caméra requise',
    message: 'PartenaireMAGB a besoin d\'accéder à votre caméra pour prendre des photos.',
    settingsMessage: 'L\'accès à la caméra a été refusé. Veuillez l\'activer dans les paramètres de votre téléphone pour utiliser cette fonctionnalité.',
  },
  mediaLibrary: {
    title: 'Permission galerie requise',
    message: 'PartenaireMAGB a besoin d\'accéder à vos photos pour sélectionner une image.',
    settingsMessage: 'L\'accès à la galerie a été refusé. Veuillez l\'activer dans les paramètres de votre téléphone pour utiliser cette fonctionnalité.',
  },
};

const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

const showSettingsAlert = (type: PermissionType) => {
  const { title, settingsMessage } = PERMISSION_MESSAGES[type];
  Alert.alert(
    title,
    settingsMessage,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Ouvrir les paramètres', onPress: openAppSettings },
    ]
  );
};

async function checkAndRequestPermission(type: PermissionType): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { granted: true, canAskAgain: true };
  }

  const getStatus = type === 'camera'
    ? ImagePicker.getCameraPermissionsAsync
    : ImagePicker.getMediaLibraryPermissionsAsync;

  const requestPermission = type === 'camera'
    ? ImagePicker.requestCameraPermissionsAsync
    : ImagePicker.requestMediaLibraryPermissionsAsync;

  const currentStatus = await getStatus();

  if (currentStatus.granted) {
    return { granted: true, canAskAgain: true };
  }

  if (!currentStatus.canAskAgain) {
    showSettingsAlert(type);
    return { granted: false, canAskAgain: false };
  }

  const { granted, canAskAgain } = await requestPermission();

  if (!granted) {
    if (!canAskAgain) {
      showSettingsAlert(type);
    } else {
      Alert.alert(
        PERMISSION_MESSAGES[type].title,
        PERMISSION_MESSAGES[type].message,
        [{ text: 'OK' }]
      );
    }
    return { granted: false, canAskAgain };
  }

  return { granted: true, canAskAgain: true };
}

export async function requestCameraPermission(): Promise<boolean> {
  const result = await checkAndRequestPermission('camera');
  return result.granted;
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const result = await checkAndRequestPermission('mediaLibrary');
  return result.granted;
}

export async function requestCameraAndMediaPermissions(): Promise<boolean> {
  const cameraResult = await checkAndRequestPermission('camera');
  if (!cameraResult.granted) return false;

  const mediaResult = await checkAndRequestPermission('mediaLibrary');
  return mediaResult.granted;
}
