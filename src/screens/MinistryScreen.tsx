import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchAllMinistries,
  fetchMinistriesByCategory,
  fetchMinistryStats,
  setSelectedCategory,
  selectAllMinistries,
  selectMinistryStats,
  selectMinistryCategories,
  selectSelectedCategory,
  selectMinistryLoading,
  selectMinistryError,
  clearError
} from '../store/slices/ministrySlice';
import { Ministry } from '../types/navigation';

const { width } = Dimensions.get('window');

const MinistryScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  // Sélecteurs Redux
  const ministries = useAppSelector(selectAllMinistries);
  const stats = useAppSelector(selectMinistryStats);
  const categories = useAppSelector(selectMinistryCategories);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const loading = useAppSelector(selectMinistryLoading);
  const error = useAppSelector(selectMinistryError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchMinistryStats()).unwrap(),
        selectedCategory === 'all' 
          ? dispatch(fetchAllMinistries({})).unwrap()
          : dispatch(fetchMinistriesByCategory(selectedCategory)).unwrap()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleMinistryPress = (ministry: Ministry) => {
    (navigation as any).navigate('MinistryDetail', { ministry });
  };

  const handleExternalLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir ce lien');
    }
  };

  const handleContactPress = (ministry: Ministry) => {
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

  const renderCategoryButton = (category: any) => (
    <TouchableOpacity
      key={category.key}
      style={[
        styles.categoryButton,
        selectedCategory === category.key && styles.categoryButtonActive
      ]}
      onPress={() => handleCategoryPress(category.key)}
    >
      <Ionicons
        name={category.icon as any}
        size={20}
        color={selectedCategory === category.key ? '#fff' : '#666'}
      />
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.key && styles.categoryButtonTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  const renderMinistryCard = (ministry: Ministry) => (
    <TouchableOpacity
      key={ministry._id}
      style={styles.ministryCard}
      onPress={() => handleMinistryPress(ministry)}
    >
      {ministry.imageUrl && (
        <Image
          source={{ uri: ministry.imageUrl }}
          style={styles.ministryImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.ministryContent}>
        <Text style={styles.ministryTitle}>{ministry.title}</Text>
        <Text style={styles.ministryDescription} numberOfLines={3}>
          {ministry.description}
        </Text>
        
        <View style={styles.ministryActions}>
          {ministry.contactInfo && (ministry.contactInfo.phone || ministry.contactInfo.email) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleContactPress(ministry)}
            >
              <Ionicons name="call-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Contact</Text>
            </TouchableOpacity>
          )}
          
          {ministry.externalLink && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExternalLink(ministry.externalLink!)}
            >
              <Ionicons name="open-outline" size={16} color="#007AFF" />
              <Text style={styles.actionButtonText}>Lien</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ministères</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des ministères...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ministères</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Aperçu</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statLabel}>Actifs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {categories.length - 1}
                </Text>
                <Text style={styles.statLabel}>Catégories</Text>
              </View>
            </View>
          </View>
        )}

        {/* Catégories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Liste des ministères */}
        <View style={styles.ministriesContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Tous les ministères' : 
             categories.find(c => c.key === selectedCategory)?.label}
          </Text>
          
          {ministries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                Aucun ministère trouvé dans cette catégorie
              </Text>
            </View>
          ) : (
            ministries.map(renderMinistryCard)
          )}
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
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  ministriesContainer: {
    paddingBottom: 20,
  },
  ministryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  ministryImage: {
    width: '100%',
    height: 200,
  },
  ministryContent: {
    padding: 16,
  },
  ministryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ministryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  ministryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default MinistryScreen; 