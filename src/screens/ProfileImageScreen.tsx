import logger from '../utils/logger';
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { requestCameraPermission } from '../utils/permissions';
import userService from '../store/services/userService';
import { RootState } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { showApiError } from '../store/services/apiClient';

import { useDS, AppText, Screen, HeroHeader, Card, Section, Row } from '../design/components';
import { spacing } from '../design/tokens';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileImageScreenProps {
  navigation: any;
}

const ProfileImageScreen: React.FC<ProfileImageScreenProps> = ({ navigation }) => {
  const { c } = useDS();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(user?.avatar || null);

  const requestPermissions = async () => {
    return await requestCameraPermission();
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
        mediaTypes: ['images'], // MediaTypeOptions est déprécié
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Choisir une image depuis la galerie
  const pickImage = async () => {
    // No storage permission needed — expo-image-picker uses the Android
    // system photo picker on Android 13+, and NSPhotoLibraryUsageDescription
    // covers iOS without a runtime gate here.
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // MediaTypeOptions est déprécié
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Erreur lors de la sélection d\'image:', error);
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
      logger.error('Erreur upload avatar:', error);
      showApiError(error, 'image');
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
              logger.error('Erreur suppression avatar:', error);
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

  const avatarSize = Math.min(200, screenWidth * 0.5);

  return (
    <Screen
      hero={
        <HeroHeader eyebrow="Mon compte" eyebrowIcon="person-circle-outline" title="Photo de profil" onBack={() => navigation.goBack()} />
      }
    >
      <Card style={styles.center}>
        <Pressable
          onPress={() => (imageUri ? setShowImageModal(true) : showImageOptions())}
          accessibilityRole="button"
          accessibilityLabel={imageUri ? 'Voir la photo en grand' : 'Ajouter une photo'}
          style={[styles.avatarRing, { borderColor: c.gold, width: avatarSize + 8, height: avatarSize + 8, borderRadius: (avatarSize + 8) / 2 }]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }} />
          ) : (
            <View style={[styles.placeholder, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: c.primarySoft }]}>
              <AppText variant="display" color={c.primary} style={{ fontSize: avatarSize / 3, lineHeight: avatarSize / 2.6 }}>{getInitials()}</AppText>
            </View>
          )}
          {isUploading ? (
            <View style={[styles.uploading, { borderRadius: avatarSize / 2 }]}>
              <ActivityIndicator color="#FFFFFF" size="large" />
            </View>
          ) : null}
          <View style={[styles.editBadge, { backgroundColor: c.gold }]}>
            <Ionicons name="camera" size={18} color={c.onGold} />
          </View>
        </Pressable>
        <AppText variant="title" center>{user?.firstName} {user?.lastName}</AppText>
        <AppText variant="small" color={c.mutedForeground} center>{user?.email}</AppText>
      </Card>

      <Section title="Actions">
        <Row
          icon="camera-outline"
          label={imageUri ? 'Changer la photo' : 'Ajouter une photo'}
          sublabel="Prendre une photo ou choisir dans la galerie"
          onPress={isUploading ? undefined : showImageOptions}
          chevron
          last={!imageUri}
        />
        {imageUri ? <Row icon="expand-outline" label="Voir en grand" onPress={() => setShowImageModal(true)} chevron last /> : null}
      </Section>

      <AppText variant="caption" color={c.mutedForeground} center>
        Votre photo est visible par l'équipe du ministère sur votre profil partenaire.
      </AppText>

      <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.viewer}>
          <Pressable style={styles.close} onPress={() => setShowImageModal(false)} accessibilityRole="button" accessibilityLabel="Fermer" hitSlop={10}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </Pressable>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.full} resizeMode="contain" /> : null}
        </View>
      </Modal>

      {isLoading ? (
        <View style={[styles.loading, { backgroundColor: c.overlay }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  avatarRing: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  uploading: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', right: 8, bottom: 8, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', top: 56, right: 20, zIndex: 2, padding: 8 },
  full: { width: screenWidth, height: screenHeight * 0.75 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});

export default ProfileImageScreen;
