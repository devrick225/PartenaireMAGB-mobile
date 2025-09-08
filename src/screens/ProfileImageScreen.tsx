import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import userService from '../store/services/userService';
import { RootState } from '../store';
import { updateUser } from '../store/slices/authSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileImageScreenProps {
  navigation: any;
}

const ProfileImageScreen: React.FC<ProfileImageScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(user?.avatar || null);

  // Demander les permissions pour la caméra et la galerie
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'Nous avons besoin des permissions pour accéder à votre caméra et à vos photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Afficher les options pour choisir une image
  const showImageOptions = () => {
    const options = [
      'Prendre une photo',
      'Choisir depuis la galerie',
      ...(imageUri ? ['Supprimer la photo'] : []),
      'Annuler'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: imageUri ? 2 : -1,
        },
        (buttonIndex) => {
          handleImageOptionSelection(buttonIndex, options);
        }
      );
    } else {
      // Pour Android, utiliser un Alert
      Alert.alert(
        'Photo de profil',
        'Choisissez une option',
        [
          { text: 'Prendre une photo', onPress: () => handleImageOptionSelection(0, options) },
          { text: 'Choisir depuis la galerie', onPress: () => handleImageOptionSelection(1, options) },
          ...(imageUri ? [{ text: 'Supprimer la photo', onPress: () => handleImageOptionSelection(2, options), style: 'destructive' }] : []),
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const handleImageOptionSelection = (buttonIndex: number, options: string[]) => {
    if (buttonIndex === options.length - 1) return; // Annuler

    switch (buttonIndex) {
      case 0:
        takePicture();
        break;
      case 1:
        pickImage();
        break;
      case 2:
        if (imageUri) {
          removeImage();
        }
        break;
    }
  };

  // Prendre une photo avec la caméra
  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Choisir une image depuis la galerie
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Télécharger l'image vers le serveur
  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      
      // Créer un FormData pour l'upload
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri,
        name: filename || 'avatar.jpg',
        type,
      } as any);

      // Appeler le service pour uploader l'image
      const response = await userService.uploadAvatar(formData);
      
      if (response.data.success) {
        const newAvatarUrl = response.data.data.avatarUrl;
        setImageUri(newAvatarUrl);
        
        // Mettre à jour l'utilisateur dans le store
        dispatch(updateUser({ avatar: newAvatarUrl }));
        
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
      }
    } catch (error: any) {
      console.error('Erreur upload avatar:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Impossible de télécharger l\'image'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Supprimer l'image de profil
  const removeImage = () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              await userService.removeAvatar();
              
              setImageUri(null);
              dispatch(updateUser({ avatar: null }));
              
              Alert.alert('Succès', 'Photo de profil supprimée');
            } catch (error: any) {
              console.error('Erreur suppression avatar:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la photo');
            } finally {
              setIsUploading(false);
            }
          }
        }
      ]
    );
  };

  // Générer les initiales pour l'avatar par défaut
  const getInitials = () => {
    if (!user?.firstName && !user?.lastName) return '?';
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  };

  // Rendu de l'avatar
  const renderAvatar = (size: number = 120) => {
    if (imageUri) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}
          onError={() => {
            console.log('Erreur chargement image');
            setImageUri(null);
          }}
        />
      );
    }

    return (
      <View
        style={[
          styles.avatarPlaceholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
          }
        ]}
      >
        <Text
          style={[
            styles.avatarInitials,
            { fontSize: size * 0.4 }
          ]}
        >
          {getInitials()}
        </Text>
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Photo de profil
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Avatar principal */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => imageUri && setShowImageModal(true)}
            disabled={!imageUri}
          >
            {renderAvatar(200)}
          </TouchableOpacity>
          
          {/* Bouton d'édition */}
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={showImageOptions}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="edit" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Informations utilisateur */}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {user?.email}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: dark ? COLORS.dark2 : COLORS.white }
            ]}
            onPress={showImageOptions}
            disabled={isUploading}
          >
            <MaterialIcons name="photo-camera" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              {imageUri ? 'Modifier la photo' : 'Ajouter une photo'}
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: dark ? COLORS.dark2 : COLORS.white }
              ]}
              onPress={() => setShowImageModal(true)}
            >
              <MaterialIcons name="fullscreen" size={24} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Voir en grand
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal pour voir l'image en grand */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            >
              <MaterialIcons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>
            
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Indicateur de chargement global */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatarImage: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
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
});

export default ProfileImageScreen;