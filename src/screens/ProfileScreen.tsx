import logger from '../utils/logger';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  HeroChip,
  IconButton,
  Card,
  Section,
  Row,
  StatCard,
  Badge,
  LoadingState,
} from '../design/components';
import { spacing } from '../design/tokens';
import userService from '../store/services/userService';
import { updateUser } from '../store/slices/authSlice';
import useLogout from '../hooks/useLogout';
import { showApiError } from '../store/services/apiClient';
import { RootState } from '../store';
import PartnerIdDisplay from '../components/PartnerIdDisplay';
import { requestMediaLibraryPermission } from '../utils/permissions';

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
  route?: { params?: { asTab?: boolean } };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { c } = useDS();
  const dispatch = useDispatch();
  const { logout } = useLogout();
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
      
      if (response.data?.data?.profile) {
        setProfile(response.data.data.profile);
      } else {
        throw new Error('Données de profil invalides');
      }
    } catch (error: any) {
      logger.error('Erreur lors du chargement du profil:', error);
      showApiError(error, 'Impossible de charger le profil. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadProfile();
    } catch (error: any) {
      logger.error('Erreur lors du refresh du profil:', error);
      showApiError(error, 'Impossible d\'actualiser le profil. Veuillez réessayer.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const granted = await requestMediaLibraryPermission();
      if (!granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // MediaTypeOptions est déprécié
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('Erreur sélection image:', error);
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
      logger.error('Erreur upload avatar:', error);
      showApiError(error, 'Impossible de mettre à jour la photo de profil. Veuillez réessayer.');
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
          // logout → RootNavigator bascule automatiquement vers AuthNavigator
          // (en cas d'échec réseau, useLogout force la déconnexion locale)
          onPress: () => logout(),
        },
      ]
    );
  };


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const ROLE_LABELS: Record<string, string> = {
    user: 'Partenaire',
    admin: 'Administrateur',
    moderator: 'Modérateur',
    treasurer: 'Trésorier',
    support_agent: 'Agent support',
  };
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Mon profil';
  const emailVerified = user?.isEmailVerified ?? profile?.user?.isEmailVerified;
  const phoneVerified = user?.isPhoneVerified ?? profile?.user?.isPhoneVerified;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const verifiedBadge = (ok?: boolean, onPress?: () => void) =>
    ok ? (
      <Badge label="Vérifié" tone="success" icon="checkmark-circle" />
    ) : (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Vérifier" hitSlop={6}>
        <Badge label="À vérifier" tone="warning" icon="alert-circle" />
      </Pressable>
    );

  const hero = (
    <HeroHeader
      eyebrow={ROLE_LABELS[user?.role as string] ?? 'Partenaire'}
      eyebrowIcon="person-outline"
      title={fullName}
      subtitle={profile?.user?.email ?? user?.email}
      onBack={route?.params?.asTab ? undefined : () => navigation.goBack()}
      right={<IconButton icon="settings-outline" tone="hero" accessibilityLabel="Paramètres" onPress={() => navigation.navigate('Settings')} />}
    >
      <View style={styles.heroRow}>
        <Pressable
          onPress={handleImagePicker}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="Changer ma photo de profil"
          style={[styles.avatarWrap, { borderColor: c.gold }]}
        >
          {profile?.user?.avatar || user?.avatar ? (
            <Image source={{ uri: (profile?.user?.avatar || user?.avatar) as string }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.heroChip }]}>
              <AppText variant="title" color={c.heroText}>{initials || '?'}</AppText>
            </View>
          )}
          {isUploading ? (
            <View style={styles.uploading}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
          <View style={[styles.camera, { backgroundColor: c.gold }]}>
            <Ionicons name="camera" size={14} color={c.onGold} />
          </View>
        </Pressable>
        <View style={[styles.flex, styles.chips]}>
          {user?.partnerId ? <HeroChip icon="id-card-outline" label={`ID ${user.partnerId}`} /> : null}
          {user?.partnerLevel ? <HeroChip icon="trophy" label={`Niveau ${String(user.partnerLevel)}`} /> : null}
        </View>
      </View>
    </HeroHeader>
  );

  if (isLoading && !profile) {
    return (
      <Screen hero={hero}>
        <Card>
          <LoadingState message="Chargement du profil…" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      hero={hero}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
    >
      <View style={styles.row3}>
        <StatCard tinted tone="primary" icon="heart-outline" label="Dons" value={profile?.user?.donationCount || 0} />
        <StatCard tinted tone="success" icon="person-circle-outline" label="Profil" value={`${profile?.completionPercentage || 0}%`} />
        <StatCard tinted tone="warning" icon="ribbon-outline" label="Badges" value={profile?.user?.badges?.length || 0} />
      </View>

      <Section title="Informations personnelles">
        <Row
          icon="mail-outline"
          label="Email"
          sublabel={profile?.user?.email ?? user?.email ?? 'Non renseigné'}
          right={verifiedBadge(emailVerified, () => navigation.navigate('EmailVerification'))}
        />
        <Row
          icon="call-outline"
          label="Téléphone"
          sublabel={profile?.user?.phone ?? user?.phone ?? 'Non renseigné'}
          right={verifiedBadge(phoneVerified, () => navigation.navigate('PhoneVerification'))}
        />
        <Row icon="business-outline" label="Ville" sublabel={profile?.user?.city || 'Non renseignée'} />
        <Row icon="earth-outline" label="Pays" sublabel={profile?.user?.country || 'Non renseigné'} />
        <Row icon="briefcase-outline" label="Profession" sublabel={profile?.occupation || 'Non renseignée'} last />
      </Section>

      {profile?.user?.badges && profile.user.badges.length > 0 ? (
        <Section title="Mes badges">
          {profile.user.badges.map((badge, index) => (
            <Row
              key={`${badge.name}-${index}`}
              icon="ribbon-outline"
              label={badge.name}
              sublabel={badge.earnedAt ? `Obtenu le ${formatDate(badge.earnedAt)}` : undefined}
              last={index === profile.user.badges.length - 1}
            />
          ))}
        </Section>
      ) : null}

      <Section title="Mon compte">
        <Row icon="create-outline" label="Modifier mon profil" onPress={() => navigation.navigate('EditProfile')} chevron />
        <Row icon="lock-closed-outline" label="Changer le mot de passe" onPress={() => navigation.navigate('ChangePassword')} chevron />
        <Row icon="document-text-outline" label="Mes reçus et documents" onPress={() => navigation.navigate('Documents')} chevron />
        <Row icon="settings-outline" label="Paramètres" onPress={() => navigation.navigate('Settings')} chevron last />
      </Section>

      <Section>
        <Row icon="log-out-outline" label="Se déconnecter" destructive onPress={handleLogout} last />
      </Section>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  avatarWrap: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, padding: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 36 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  uploading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 38, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  row3: { flexDirection: 'row', gap: spacing.sm },
});

export default ProfileScreen;
