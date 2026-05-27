import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { requestMediaLibraryPermission, requestCameraPermission } from './permissions';

/**
 * Lancer le sélecteur d'images avec options d'édition
 */
export const launchImagePicker = async (options = {}) => {
  try {
    const granted = await requestMediaLibraryPermission();
    if (!granted) return null;

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
