import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import { DASHBOARD_CONFIGS, DashboardType } from './dashboards';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface DashboardSelectorProps {
  navigation: any;
}

interface DashboardPreview {
  type: DashboardType;
  name: string;
  description: string;
  features: string[];
  gradient: string[];
  icon: string;
  preview: string; // URL ou chemin vers une image de prévisualisation
}

const DashboardSelector: React.FC<DashboardSelectorProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>('gridModern');

  const dashboardPreviews: DashboardPreview[] = [
    {
      type: 'gridModern',
      name: 'Grid Moderne',
      description: 'Design moderne avec animations et effets visuels',
      features: ['Animations fluides', 'Effets visuels', 'Badges interactifs', 'Design moderne'],
      gradient: ['#667eea', '#764ba2'],
      icon: 'grid-view',
      preview: 'grid-modern-preview',
    },
    {
      type: 'visual',
      name: 'Visuel & Emojis',
      description: 'Interface colorée avec emojis et layout créatif',
      features: ['Emojis expressifs', 'Layout masonry', 'Motifs décoratifs', 'Design ludique'],
      gradient: ['#FF6B6B', '#4ECDC4'],
      icon: 'emoji-emotions',
      preview: 'visual-preview',
    },
    {
      type: 'grid',
      name: 'Grid Classique',
      description: 'Layout en grille simple et efficace',
      features: ['Interface claire', 'Navigation simple', 'Cartes colorées', 'Actions rapides'],
      gradient: ['#4FACFE', '#00F2FE'],
      icon: 'dashboard',
      preview: 'grid-preview',
    },
    {
      type: 'modern',
      name: 'Moderne Complet',
      description: 'Dashboard avec statistiques détaillées',
      features: ['Statistiques avancées', 'Graphiques', 'Badges utilisateur', 'Historique détaillé'],
      gradient: ['#A8EDEA', '#FED6E3'],
      icon: 'analytics',
      preview: 'modern-preview',
    },
    {
      type: 'withAvatar',
      name: 'Centré Avatar',
      description: 'Interface centrée sur le profil utilisateur',
      features: ['Avatar personnalisé', 'Profil détaillé', 'Cartes utilisateur', 'Exemples d\'avatars'],
      gradient: ['#F093FB', '#F5576C'],
      icon: 'account-circle',
      preview: 'avatar-preview',
    },
  ];

  const handleSelectDashboard = async (dashboardType: DashboardType) => {
    try {
      // Sauvegarder la préférence de l'utilisateur
      await AsyncStorage.setItem('selectedDashboard', dashboardType);
      setSelectedDashboard(dashboardType);
      
      // Naviguer vers le dashboard sélectionné
      const dashboardRoutes = {
        grid: 'DashboardGrid',
        gridModern: 'DashboardGridModern',
        visual: 'DashboardVisual',
        modern: 'DashboardModern',
        withAvatar: 'DashboardWithAvatar',
      };

      navigation.navigate(dashboardRoutes[dashboardType]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder votre préférence');
    }
  };

  const renderDashboardCard = (dashboard: DashboardPreview, index: number) => (
    <TouchableOpacity
      key={dashboard.type}
      style={[
        styles.dashboardCard,
        selectedDashboard === dashboard.type && styles.selectedCard
      ]}
      onPress={() => handleSelectDashboard(dashboard.type)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={dashboard.gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Badge de sélection */}
        {selectedDashboard === dashboard.type && (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          </View>
        )}

        {/* Icône principale */}
        <View style={styles.cardIcon}>
          <MaterialIcons name={dashboard.icon as any} size={40} color="#FFFFFF" />
        </View>

        {/* Contenu */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{dashboard.name}</Text>
          <Text style={styles.cardDescription}>{dashboard.description}</Text>
          
          {/* Features */}
          <View style={styles.featuresContainer}>
            {dashboard.features.slice(0, 3).map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <MaterialIcons name="check" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bouton d'action */}
        <View style={styles.cardAction}>
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>
              {selectedDashboard === dashboard.type ? 'Sélectionné' : 'Choisir'}
            </Text>
            <MaterialIcons 
              name={selectedDashboard === dashboard.type ? "check" : "arrow-forward"} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Choisir votre Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Sélectionnez le style qui vous convient le mieux
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: colors.card }]}>
          <View style={styles.introIcon}>
            <MaterialIcons name="palette" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>
            Personnalisez votre expérience
          </Text>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Chaque dashboard offre une expérience unique. Vous pouvez changer à tout moment dans les paramètres.
          </Text>
        </View>

        {/* Liste des dashboards */}
        <View style={styles.dashboardsList}>
          {dashboardPreviews.map((dashboard, index) => renderDashboardCard(dashboard, index))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              const dashboardRoutes = {
                grid: 'DashboardGrid',
                gridModern: 'DashboardGridModern',
                visual: 'DashboardVisual',
                modern: 'DashboardModern',
                withAvatar: 'DashboardWithAvatar',
              };
              navigation.navigate(dashboardRoutes[selectedDashboard]);
            }}
          >
            <MaterialIcons name="launch" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Utiliser ce Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <MaterialIcons name="settings" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Paramètres
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  introIcon: {
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dashboardsList: {
    gap: 16,
    marginBottom: 24,
  },
  dashboardCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  selectedCard: {
    elevation: 8,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    transform: [{ scale: 1.02 }],
  },
  cardGradient: {
    padding: 20,
    minHeight: 180,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    zIndex: 2,
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardContent: {
    flex: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  cardAction: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 50,
  },
});

export default DashboardSelector;