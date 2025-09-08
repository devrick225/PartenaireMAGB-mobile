import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, Ionicons, Octicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import userService from '../store/services/userService';
import { updateUser, logoutUser } from '../store/slices/authSlice';
import { RootState } from '../store';
import PartnerIdDisplay from '../components/PartnerIdDisplay';
import RefreshableHeader from '../components/RefreshableHeader';

interface UserProfile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    avatar?: string;
    role: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    totalDonations: number;
    donationCount: number;
    badges: Array<{
      name: string;
      icon: string;
      earnedAt: string;
    }>;
  };
  occupation?: string;
  employer?: string;
  completionPercentage: number;
}

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      console.log('🔍 Profile:', response.data.data.profile);
      
      if (response.data?.data?.profile) {
        setProfile(response.data.data.profile);
      } else {
        throw new Error('Données de profil invalides');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert(
        'Erreur', 
        error.response?.data?.error || 'Impossible de charger le profil. Veuillez réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadProfile();
    } catch (error: any) {
      console.error('Erreur lors du refresh du profil:', error);
      Alert.alert(
        'Erreur', 
        error.response?.data?.error || 'Impossible d\'actualiser le profil. Veuillez réessayer.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await userService.uploadAvatar(formData);
      
      if (response.data?.success) {
        // Mettre à jour le profil local
        await loadProfile();
        
        // Mettre à jour le store Redux avec la nouvelle URL d'avatar
        if (response.data?.data?.avatarUrl) {
          dispatch(updateUser({ avatar: response.data.data.avatarUrl }));
        }
        
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('Erreur upload avatar:', error);
      Alert.alert(
        'Erreur', 
        error.response?.data?.error || 'Impossible de mettre à jour la photo de profil. Veuillez réessayer.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          onPress: async () => {
            try {
              setIsLoading(true);
              await dispatch(logoutUser() as any);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderInfoItem = (icon: string, label: string, value: string | undefined, verified?: boolean) => (
    <View style={styles.infoItem}>
      <MaterialIcons name={icon as any} size={20} color={colors.primary} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {value || 'Non renseigné'}
        </Text>
      </View>
      {verified !== undefined && (
        <MaterialIcons
          name={verified ? 'verified' : 'cancel'}
          size={20}
          color={verified ? '#4CAF50' : '#FF5722'}
        />
      )}
    </View>
  );

  const renderActionItem = (icon: string, title: string, subtitle: string, onPress: () => void, iconColor?: string) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionIcon}>
        <MaterialIcons name={icon as any} size={22} color={iconColor || colors.primary} />
      </View>
      <View style={styles.actionContent}>
        <Text style={[styles.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.actionSubtitle, { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={dark ? COLORS.grayscale400 : COLORS.greyscale600} />
    </TouchableOpacity>
  );

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement du profil...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RefreshableHeader
        title="Mon Profil"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={true}
        onRefreshPress={onRefresh}
        isRefreshing={isRefreshing}
        showSettingsButton={true}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.primary, colors.primary + '90']}
          style={styles.profileHeader}
        >
          <TouchableOpacity
            onPress={handleImagePicker}
            style={styles.avatarContainer}
            disabled={isUploading}
          >
            {profile?.user?.avatar ? (
              <Image source={{ uri: profile.user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </View>
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileRole}>
            {user?.role?.toUpperCase()}
          </Text>
        </LinearGradient>

        {/* Profile Stats */}
        <View style={[styles.statsContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profile?.user?.donationCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }]}>Dons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profile?.completionPercentage || 0}%
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }]}>Profil complété</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {profile?.user?.badges?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }]}>Badges</Text>
          </View>
        </View>

        {/* Partner ID Display */}
        {user?.partnerId && (
          <View style={styles.partnerIdContainer}>
            <PartnerIdDisplay
              partnerId={user.partnerId}
              partnerLevel={user.partnerLevel}
              partnerLevelDetails={user.partnerLevelDetails}
              variant="card"
              showCopyButton={true}
              showLevel={true}
            />
          </View>
        )}

        {/* Personal Information */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Informations personnelles
          </Text>
          
          {renderInfoItem('email', 'Email', profile?.user?.email, profile?.user?.isEmailVerified)}
          {renderInfoItem('phone', 'Téléphone', profile?.user?.phone, profile?.user?.isPhoneVerified)}
          {renderInfoItem('location-city', 'Ville', profile?.user?.city)}
          {renderInfoItem('public', 'Pays', profile?.user?.country)}
          {renderInfoItem('work', 'Profession', profile?.occupation)}
        </View>

        {/* Badges */}
        {profile?.user?.badges && profile.user.badges.length > 0 && (
          <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mes badges
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesContainer}>
                {profile.user.badges.map((badge, index) => (
                  <View key={index} style={[styles.badgeItem, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200 }]}>
                    <Text style={styles.badgeIcon}>{badge.icon || '🏆'}</Text>
                    <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                      {badge.name}
                    </Text>
                    <Text style={[styles.badgeDate, { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }]}>
                      {formatDate(badge.earnedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions
          </Text>
          
          {renderActionItem(
            'edit',
            'Modifier mon profil',
            'Mettre à jour mes informations',
            () => navigation.navigate('EditProfile')
          )}
          
          {renderActionItem(
            'security',
            'Changer le mot de passe',
            'Sécuriser mon compte',
            () => navigation.navigate('ChangePassword')
          )}
          
          {renderActionItem(
            'description',
            'Mes Documents',
            'Télécharger reçus et échéanciers',
            () => navigation.navigate('Documents')
          )}
          
          {renderActionItem(
            'settings',
            'Paramètres',
            'Gérer mes préférences',
            () => navigation.navigate('Settings')
          )}
          
          {renderActionItem(
            'logout',
            'Déconnexion',
            'Se déconnecter de l\'application',
            handleLogout,
            '#FF5722'
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  profileHeader: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  badgeItem: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDate: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
  partnerIdContainer: {
    margin: 20,
    marginTop: 0,
    marginBottom: 10,
  },
});

export default ProfileScreen;