import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { requestMediaLibraryPermission, requestCameraPermission } from './permissions';

/**
 * Lancer le sélecteur d'images avec options d'édition.
 *
 * Android 13+ : expo-image-picker utilise le sélecteur système (Android Photo
 * Picker) qui ne nécessite aucune permission de stockage — on n'appelle donc
 * pas requestMediaLibraryPermission sur Android.
 * iOS : NSPhotoLibraryUsageDescription est déclarée dans app.json ; la
 * permission est demandée via requestMediaLibraryPermission.
 */
export const launchImagePicker = async (options = {}) => {
  try {
    // Only request the media library permission on iOS — the Android system
    // photo picker handles its own access without needing READ_MEDIA_IMAGES.
    if (Platform.OS === 'ios') {
      const granted = await requestMediaLibraryPermission();
      if (!granted) return null;
    }

    const defaultOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    };

    const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      const optimizedImage = await optimizeImage(image.uri);
      return optimizedImage;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la sélection d\'image:', error);
    throw error;
  }
};

/**
 * Lancer la caméra pour prendre une photo
 */
export const launchCamera = async (options = {}) => {
  try {
    const granted = await requestCameraPermission();
    if (!granted) return null;

    const defaultOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      ...options
    };

    const result = await ImagePicker.launchCameraAsync(defaultOptions);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      const optimizedImage = await optimizeImage(image.uri);
      return optimizedImage;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la prise de photo:', error);
    throw error;
  }
};

/**
 * Afficher un picker pour choisir entre galerie et caméra
 */
export const showImagePickerOptions = () => {
  return new Promise((resolve) => {
    Alert.alert(
      'Choisir une photo',
      'D\'où souhaitez-vous prendre la photo ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => resolve(null)
        },
        {
          text: 'Galerie',
          onPress: async () => {
            try {
              const imageUri = await launchImagePicker();
              resolve(imageUri);
            } catch (error) {
              console.error('Erreur galerie:', error);
              resolve(null);
            }
          }
        },
        {
          text: 'Caméra',
          onPress: async () => {
            try {
              const imageUri = await launchCamera();
              resolve(imageUri);
            } catch (error) {
              console.error('Erreur caméra:', error);
              resolve(null);
            }
          }
        }
      ]
    );
  });
};

/**
 * Optimiser une image pour l'upload (redimensionner et compresser)
 */
export const optimizeImage = async (uri, maxWidth = 400, maxHeight = 400) => {
  try {
    const optimizedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: maxWidth, height: maxHeight } }
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true // Nécessaire pour l'upload en base64
      }
    );

    return {
      uri: optimizedImage.uri,
      base64: optimizedImage.base64,
      width: optimizedImage.width,
      height: optimizedImage.height
    };
  } catch (error) {
    console.error('Erreur lors de l\'optimisation:', error);
    // Retourner l'image originale si l'optimisation échoue
    return { uri };
  }
};

/**
 * Sélectionner et optimiser une image depuis la galerie ou la caméra.
 * Utilisé par Dashboard.tsx.
 * @param {object} options
 * @param {'camera'|'gallery'} options.source
 * @param {number} [options.quality]
 * @param {number} [options.maxWidth]
 * @param {number} [options.maxHeight]
 * @param {string} [options.format]
 */
export const pickImageWithOptimization = async ({
  source = 'gallery',
  quality = 0.8,
  maxWidth = 400,
  maxHeight = 400,
} = {}) => {
  try {
    let result = null;

    if (source === 'camera') {
      result = await launchCamera({ quality });
    } else {
      result = await launchImagePicker({ quality });
    }

    if (!result) return null;

    // optimizeImage already ran inside launchImagePicker / launchCamera,
    // but re-run with the caller's dimensions if they differ from defaults.
    if (result.uri && (maxWidth !== 400 || maxHeight !== 400)) {
      return await optimizeImage(result.uri, maxWidth, maxHeight);
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la sélection avec optimisation:', error);
    throw error;
  }
};

/**
 * Convertir une image en base64 avec prefix pour l'upload
 */
export const convertToBase64WithPrefix = (base64Data) => {
  if (!base64Data) return null;
  
  // Ajouter le prefix data:image/jpeg;base64, si pas déjà présent
  if (!base64Data.startsWith('data:image/')) {
    return `data:image/jpeg;base64,${base64Data}`;
  }
  
  return base64Data;
};
