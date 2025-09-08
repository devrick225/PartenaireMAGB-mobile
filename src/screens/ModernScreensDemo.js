import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS, images } from '../constants';

const { width } = Dimensions.get('window');

const ModernScreensDemo = ({ navigation }) => {
  const { colors, dark } = useTheme();

  const modernScreens = [
    {
      id: 'LoginModern',
      title: 'Connexion Moderne',
      description: 'Écran de connexion avec design épuré et animations',
      icon: 'login',
      gradient: ['#26335F', '#1a2347'],
      route: 'LoginModern',
      features: ['Animations fluides', 'InputModern', 'Actions rapides'],
    },
    {
      id: 'SignupModern',
      title: 'Inscription Moderne',
      description: 'Inscription en 2 étapes avec validation complète',
      icon: 'person-add',
      gradient: ['#D32235', '#B02A3A'],
      route: 'SignupModern',
      features: ['Processus guidé', 'Sélecteurs visuels', 'Validation temps réel'],
    },
    {
      id: 'DashboardGridModern',
      title: 'Dashboard Grid Moderne',
      description: 'Dashboard principal avec grille et bordures colorées',
      icon: 'dashboard',
      gradient: ['#FFD61D', '#E6C119'],
      route: 'DashboardGridModern',
      features: ['Grille 2x5', 'Bordures colorées', 'Actions rapides'],
    },
    {
      id: 'CreateDonationScreenModern',
      title: 'Création Don Moderne',
      description: 'Processus de don en 4 étapes avec design moderne',
      icon: 'favorite',
      gradient: ['#26335F', '#D32235'],
      route: 'CreateDonationScreenModern',
      features: ['4 étapes guidées', 'Montants suggérés', 'Confirmation visuelle'],
    },
    {
      id: 'DashboardVisual',
      title: 'Dashboard Visuel',
      description: 'Dashboard avec emojis et layout masonry',
      icon: 'palette',
      gradient: ['#4ECDC4', '#44A08D'],
      route: 'DashboardVisual',
      features: ['Emojis expressifs', 'Layout masonry', 'Design ludique'],
    },
    {
      id: 'DashboardSelector',
      title: 'Sélecteur Dashboard',
      description: 'Interface pour choisir son style de dashboard',
      icon: 'tune',
      gradient: ['#F093FB', '#F5576C'],
      route: 'DashboardSelector',
      features: ['Prévisualisations', 'Sauvegarde préférences'],
    },
  ];

  const renderScreenCard = (screen, index) => (
    <TouchableOpacity
      key={screen.id}
      style={styles.screenCard}
      onPress={() => navigation.navigate(screen.route)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={screen.gradient}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Icône principale */}
        <View style={styles.cardIcon}>
          <MaterialIcons name={screen.icon} size={32} color="#FFFFFF" />
        </View>

        {/* Contenu */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{screen.title}</Text>
          <Text style={styles.cardDescription}>{screen.description}</Text>
          
          {/* Features */}
          <View style={styles.featuresContainer}>
            {screen.features.slice(0, 2).map((feature, idx) => (
              <View key={idx} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Flèche */}
        <View style={styles.cardArrow}>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#26335F', '#1a2347']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Écrans Modernes</Text>
            <Text style={styles.headerSubtitle}>
              Découvrez tous les écrans avec le nouveau design
            </Text>
          </View>

          <View style={styles.logoContainer}>
            <Image
              source={images.logo}
              resizeMode='contain'
              style={styles.logo}
            />
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{modernScreens.length}</Text>
            <Text style={styles.statLabel}>Écrans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Couleurs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Moderne</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Palette de couleurs */}
      <View style={styles.colorPalette}>
        <Text style={[styles.paletteTitle, { color: colors.text }]}>
          🎨 Palette Officielle
        </Text>
        <View style={styles.colorsRow}>
          <View style={styles.colorItem}>
            <View style={[styles.colorCircle, { backgroundColor: '#26335F' }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Primary</Text>
            <Text style={[styles.colorCode, { color: colors.textSecondary }]}>#26335F</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorCircle, { backgroundColor: '#FFD61D' }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Secondary</Text>
            <Text style={[styles.colorCode, { color: colors.textSecondary }]}>#FFD61D</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorCircle, { backgroundColor: '#D32235' }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Tertiary</Text>
            <Text style={[styles.colorCode, { color: colors.textSecondary }]}>#D32235</Text>
          </View>
        </View>
      </View>

      {/* Liste des écrans */}
      <ScrollView
        style={styles.screensContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.screensContent}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📱 Écrans Disponibles
        </Text>
        
        {modernScreens.map((screen, index) => renderScreenCard(screen, index))}

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ Actions Rapides
          </Text>
          
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: dark ? COLORS.dark2 : '#FFFFFF' }]}
              onPress={() => navigation.navigate('DashboardSelector')}
            >
              <MaterialIcons name="tune" size={24} color="#26335F" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Choisir Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: dark ? COLORS.dark2 : '#FFFFFF' }]}
              onPress={() => navigation.navigate('LoginModern')}
            >
              <MaterialIcons name="login" size={24} color="#D32235" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>
                Test Connexion
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 30,
    height: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  colorPalette: {
    padding: 20,
    paddingBottom: 10,
  },
  paletteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorItem: {
    alignItems: 'center',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  colorCode: {
    fontSize: 10,
  },
  screensContainer: {
    flex: 1,
  },
  screensContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  screenCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  featureTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    marginTop: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 50,
  },
});

export default ModernScreensDemo;