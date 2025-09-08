import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { 
  useAuth, 
  useDonations, 
  useEvents, 
  useNotifications,
  useAppDispatch 
} from '../store/hooks';
import { 
  getDonations, 
  getMyDonations 
} from '../store/slices/donationSlice';
import { 
  getEvents, 
  getMyEvents 
} from '../store/slices/eventSlice';
import { 
  showSuccess, 
  showError 
} from '../store/slices/notificationSlice';
import Avatar from '../components/Avatar';
import { useUploadAvatarFileMutation } from '../store/services/avatarService';
import * as ImagePickerHelper from '../utils/ImagePickerHelper';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { 
    donations, 
    myDonations, 
    isLoading: donationsLoading 
  } = useDonations();
  const { 
    events, 
    myEvents, 
    isLoading: eventsLoading 
  } = useEvents();
  const { unreadCount } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarFileMutation();

  // Charger les données au montage du composant
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      // Charger les données en parallèle
      await Promise.all([
        dispatch(getDonations({ limit: 5 })),
        dispatch(getMyDonations()),
        dispatch(getEvents({ limit: 5 })),
        dispatch(getMyEvents()),
      ]);
    } catch (error) {
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de charger les données du tableau de bord'
      }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    
    dispatch(showSuccess({
      title: 'Actualisation',
      message: 'Données mises à jour avec succès'
    }));
  };

  const handleAvatarPress = () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Caméra', onPress: () => selectImage('camera') },
        { text: 'Galerie', onPress: () => selectImage('gallery') },
      ]
    );
  };

  const selectImage = async (source: 'camera' | 'gallery') => {
    try {
      const result = await ImagePickerHelper.pickImageWithOptimization({
        source,
        quality: 0.7,
        maxWidth: 400,
        maxHeight: 400,
        format: 'jpeg'
      });

      if (result && !result.cancelled && result.base64) {
        await handleUploadAvatar(result.base64);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de sélectionner l\'image'
      }));
    }
  };

  const handleUploadAvatar = async (base64Data: string) => {
    try {
      await uploadAvatar({ base64Data }).unwrap();
      
      dispatch(showSuccess({
        title: 'Succès',
        message: 'Photo de profil mise à jour avec succès'
      }));
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      dispatch(showError({
        title: 'Erreur',
        message: 'Impossible de mettre à jour la photo de profil'
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const StatCard = ({ title, value, subtitle, color = '#007AFF' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const QuickActionButton = ({ title, onPress, color = '#007AFF' }: {
    title: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Veuillez vous connecter</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête de bienvenue avec Avatar */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
            <Avatar
              imageUri={user?.avatar}
              name={`${user?.firstName || ''} ${user?.lastName || ''}`}
              size={70}
              showOnlineStatus={true}
              partnerLevel="or"
            />
            {isUploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>
              Bienvenue, {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.roleText}>
              Rôle: {user?.role?.toUpperCase()}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {unreadCount} notification{unreadCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Aperçu</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Mes Donations"
            value={myDonations.length}
            subtitle={`Total: ${formatCurrency(
              myDonations.reduce((sum, d) => sum + d.montant, 0)
            )}`}
            color="#4CAF50"
          />
          <StatCard
            title="Mes Événements"
            value={myEvents.length}
            subtitle="Organisés"
            color="#FF9800"
          />
          <StatCard
            title="Donations Récentes"
            value={donations.length}
            subtitle="Communauté"
            color="#9C27B0"
          />
          <StatCard
            title="Événements Disponibles"
            value={events.length}
            subtitle="À venir"
            color="#2196F3"
          />
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
        <View style={styles.actionsGrid}>
          <QuickActionButton
            title="Nouvelle Donation"
            onPress={() => console.log('Nouvelle donation')}
            color="#4CAF50"
          />
          <QuickActionButton
            title="Créer Événement"
            onPress={() => console.log('Créer événement')}
            color="#FF9800"
          />
          <QuickActionButton
            title="Voir Profil"
            onPress={() => console.log('Voir profil')}
            color="#2196F3"
          />
          <QuickActionButton
            title="Rapports"
            onPress={() => console.log('Rapports')}
            color="#9C27B0"
          />
        </View>
      </View>

      {/* Activité récente */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Activité Récente</Text>
        {(donationsLoading || eventsLoading) ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <View style={styles.activityList}>
            {myDonations.slice(0, 3).map((donation) => (
              <View key={donation.id} style={styles.activityItem}>
                <Text style={styles.activityTitle}>
                  Donation de {formatCurrency(donation.montant)}
                </Text>
                <Text style={styles.activityDate}>
                  {new Date(donation.dateCreation).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={[styles.activityStatus, {
                  color: donation.statut === 'completed' ? '#4CAF50' : '#FF9800'
                }]}>
                  {donation.statut}
                </Text>
              </View>
            ))}
            
            {myEvents.slice(0, 2).map((event) => (
              <View key={event.id} style={styles.activityItem}>
                <Text style={styles.activityTitle}>
                  Événement: {event.titre}
                </Text>
                <Text style={styles.activityDate}>
                  {new Date(event.dateDebut).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={[styles.activityStatus, {
                  color: event.statut === 'published' ? '#4CAF50' : '#FF9800'
                }]}>
                  {event.statut}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notificationBadge: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  activityItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default Dashboard; 