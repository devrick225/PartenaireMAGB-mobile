import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { 
  showImagePickerOptions, 
  convertToBase64WithPrefix 
} from '../utils/ImagePickerHelper';
import { useUploadAvatarBase64Mutation } from '../store/services/avatarService';

const AvatarUpload = ({ 
  currentAvatar, 
  onAvatarUpdate, 
  size = 120,
  showEditIcon = true,
  disabled = false 
}) => {
  const { theme, isDarkMode } = useTheme();
  const [uploadAvatar, { isLoading }] = useUploadAvatarBase64Mutation();
  const [localImageUri, setLocalImageUri] = useState(null);

  const getAvatarSource = () => {
    // Priorité : image locale > avatar utilisateur > avatar par défaut
    if (localImageUri) {
      return { uri: localImageUri };
    }
    if (currentAvatar) {
      return { uri: currentAvatar };
    }
    return require('../../assets/images/avatar.jpeg'); // Image par défaut
  };

  const handleImagePicker = async () => {
    if (disabled || isLoading) return;

    try {
      const result = await showImagePickerOptions();
      
      if (result && result.uri) {
        // Afficher immédiatement l'image sélectionnée
        setLocalImageUri(result.uri);
        
        // Préparer les données pour l'upload
        const base64WithPrefix = convertToBase64WithPrefix(result.base64);
        
        if (!base64WithPrefix) {
          Alert.alert('Erreur', 'Impossible de traiter l\'image sélectionnée');
          setLocalImageUri(null);
          return;
        }

        // Envoyer l'image au serveur
        const uploadData = {
          imageData: base64WithPrefix,
          filename: `avatar_${Date.now()}.jpg`
        };

        const response = await uploadAvatar(uploadData).unwrap();
        
        if (response.success) {
          // Mettre à jour l'avatar dans le composant parent
          if (onAvatarUpdate) {
            onAvatarUpdate(response.data.avatarUrl);
          }
          
          Alert.alert(
            'Succès', 
            'Photo de profil mise à jour avec succès !',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      setLocalImageUri(null); // Réinitialiser en cas d'erreur
      
      const errorMessage = error?.data?.error || 
                          error?.message || 
                          'Erreur lors de la mise à jour de la photo de profil';
      
      Alert.alert('Erreur', errorMessage);
    }
  };

  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2
  };

  const iconSize = Math.max(16, size * 0.2);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.avatarContainer,
          avatarSize,
          {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.card
          },
          disabled && styles.disabled
        ]}
        onPress={handleImagePicker}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        <Image
          source={getAvatarSource()}
          style={[
            styles.avatar,
            avatarSize
          ]}
          resizeMode="cover"
        />
        
        {/* Overlay de chargement */}
        {isLoading && (
          <View style={[styles.loadingOverlay, avatarSize]}>
            <ActivityIndicator 
              size="large" 
              color={theme.colors.primary} 
            />
          </View>
        )}
        
        {/* Icône d'édition */}
        {showEditIcon && !isLoading && (
          <View style={[
            styles.editIcon,
            {
              backgroundColor: theme.colors.primary,
              width: iconSize * 1.8,
              height: iconSize * 1.8,
              borderRadius: iconSize * 0.9,
              bottom: size * 0.05,
              right: size * 0.05
            }
          ]}>
            <MaterialIcons
              name="camera-alt"
              size={iconSize}
              color="#FFFFFF"
            />
          </View>
        )}
      </TouchableOpacity>
      
      {/* Texte d'aide */}
      <Text style={[
        styles.helpText,
        { 
          color: theme.colors.textSecondary,
          fontSize: size > 100 ? 14 : 12
        }
      ]}>
        Touchez pour changer la photo
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  avatar: {
    backgroundColor: '#E5E5E5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  helpText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default AvatarUpload; 