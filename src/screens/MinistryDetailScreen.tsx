import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import { selectCurrentMinistry } from '../store/slices/ministrySlice';
import { Ministry } from '../types/navigation';

const { width } = Dimensions.get('window');

const MinistryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { ministry: routeMinistry } = route.params;
  
  // Récupérer le ministère depuis Redux (si disponible) ou utiliser celui de la route
  const currentMinistry = useAppSelector(selectCurrentMinistry);
  const ministry = currentMinistry || routeMinistry;

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      general: 'Général',
      youth: 'Jeunesse',
      children: 'Enfants',
      women: 'Femmes',
      men: 'Hommes',
      music: 'Musique',
      prayer: 'Prières',
      evangelism: 'Évangélisation',
      social: 'Social',
      other: 'Autres'
    };
    return categories[category] || category;
  };

  const getDayLabel = (day: string) => {
    const days: { [key: string]: string } = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    };
    return days[day] || day;
  };

  const handleExternalLink = async () => {
    if (!ministry.externalLink) return;

    try {
      const supported = await Linking.canOpenURL(ministry.externalLink);
      if (supported) {
        await Linking.openURL(ministry.externalLink);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien');
    }
  };

  const handleContactPress = () => {
    if (!ministry.contactInfo) return;

    const { name, phone, email } = ministry.contactInfo;
    const contactOptions = [];

    if (phone) {
      contactOptions.push({
        text: `Appeler ${name || 'le contact'}`,
        onPress: () => Linking.openURL(`tel:${phone}`)
      });
    }

    if (email) {
      contactOptions.push({
        text: `Envoyer un email`,
        onPress: () => Linking.openURL(`mailto:${email}`)
      });
    }

    if (contactOptions.length > 0) {
      Alert.alert(
        `Contact - ${ministry.title}`,
        'Choisissez une option de contact',
        contactOptions
      );
    }
  };

  const handleShare = () => {
    const shareText = `${ministry.title}\n\n${ministry.description}`;
    // Ici vous pouvez implémenter le partage avec une bibliothèque comme expo-sharing
    Alert.alert('Partager', 'Fonctionnalité de partage à implémenter');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {ministry.title}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image du ministère */}
        {ministry.imageUrl && (
          <Image
            source={{ uri: ministry.imageUrl }}
            style={styles.ministryImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Titre et catégorie */}
          <View style={styles.titleSection}>
            <Text style={styles.ministryTitle}>{ministry.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {getCategoryLabel(ministry.category)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{ministry.description}</Text>
          </View>

          {/* Informations de réunion */}
          {ministry.meetingInfo && (ministry.meetingInfo.day || ministry.meetingInfo.time || ministry.meetingInfo.location) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Réunions</Text>
              <View style={styles.meetingInfo}>
                {ministry.meetingInfo.day && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {getDayLabel(ministry.meetingInfo.day)}
                    </Text>
                  </View>
                )}
                
                {ministry.meetingInfo.time && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {ministry.meetingInfo.time}
                    </Text>
                  </View>
                )}
                
                {ministry.meetingInfo.location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {ministry.meetingInfo.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Informations de contact */}
          {ministry.contactInfo && (ministry.contactInfo.name || ministry.contactInfo.phone || ministry.contactInfo.email) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.contactInfo}>
                {ministry.contactInfo.name && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {ministry.contactInfo.name}
                    </Text>
                  </View>
                )}
                
                {ministry.contactInfo.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {ministry.contactInfo.phone}
                    </Text>
                  </View>
                )}
                
                {ministry.contactInfo.email && (
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      {ministry.contactInfo.email}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            {ministry.contactInfo && (ministry.contactInfo.phone || ministry.contactInfo.email) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleContactPress}
              >
                <Ionicons name="call-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Contacter</Text>
              </TouchableOpacity>
            )}
            
            {ministry.externalLink && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleExternalLink}
              >
                <Ionicons name="open-outline" size={20} color="#007AFF" />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Voir le lien
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  ministryImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  ministryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  meetingInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  actionsSection: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

export default MinistryDetailScreen; 