import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from './Avatar';
import UserCard from './UserCard';
import DashboardHeader from './DashboardHeader';

/**
 * 🎯 SHOWCASE - Avatar dans Dashboard
 * 
 * Ce composant démontre toutes les utilisations possibles
 * de l'avatar dans votre dashboard moderne.
 */
const AvatarShowcase = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedExample, setSelectedExample] = useState('header');
  
  // Données utilisateur (depuis Redux ou mock)
  const user = useSelector((state) => state.auth.user) || {
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie.dupont@example.com',
    avatar: null, // URL Cloudinary après upload
    role: 'user',
    partnerLevel: 'or',
    totalDonations: 850000,
    donationCount: 18,
    level: 4,
    points: 2150,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  const examples = [
    { id: 'header', title: '📱 Header Dashboard', icon: 'dashboard' },
    { id: 'card', title: '🎫 Carte Utilisateur', icon: 'person' },
    { id: 'compact', title: '📋 Liste Compacte', icon: 'list' },
    { id: 'sizes', title: '📏 Différentes Tailles', icon: 'photo-size-select-actual' },
    { id: 'initials', title: '🔤 Initiales Auto', icon: 'text-fields' },
  ];

  const renderExample = () => {
    switch (selectedExample) {
      case 'header':
        return (
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
              Header Dashboard avec Avatar
            </Text>
            <DashboardHeader
              user={user}
              onProfilePress={() => console.log('Profile pressed')}
              onNotificationPress={() => console.log('Notifications')}
              onMenuPress={() => console.log('Menu')}
              notificationCount={5}
            />
          </View>
        );

      case 'card':
        return (
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
              Carte Utilisateur Complète
            </Text>
            <UserCard
              user={user}
              onPress={() => console.log('User card pressed')}
              onEditPress={() => console.log('Edit pressed')}
              showStats={true}
            />
          </View>
        );

      case 'compact':
        return (
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
              Liste d'Utilisateurs Compacte
            </Text>
            {[
              { ...user, firstName: 'Marie', partnerLevel: 'or' },
              { ...user, firstName: 'Ahmed', partnerLevel: 'argent' },
              { ...user, firstName: 'Sophie', partnerLevel: 'bronze' },
              { ...user, firstName: 'Pierre', partnerLevel: 'classique' },
            ].map((u, index) => (
              <UserCard
                key={index}
                user={u}
                compact={true}
                onPress={() => console.log(`User ${u.firstName} pressed`)}
                showEditButton={false}
                style={styles.compactItem}
              />
            ))}
          </View>
        );

      case 'sizes':
        return (
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
              Avatars - Différentes Tailles
            </Text>
            <View style={styles.sizesContainer}>
              {[40, 50, 60, 80, 100].map((size) => (
                <View key={size} style={styles.sizeItem}>
                  <Avatar
                    source={user.avatar}
                    name={`${user.firstName} ${user.lastName}`}
                    size={size}
                    borderColor={theme.colors.primary}
                    showStatus={size >= 60}
                    isOnline={true}
                    showBadge={size >= 80}
                    badgeCount={3}
                  />
                  <Text style={[styles.sizeLabel, { color: theme.colors.textSecondary }]}>
                    {size}px
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'initials':
        return (
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
              Initiales Automatiques (Sans Image)
            </Text>
            <View style={styles.initialsContainer}>
              {[
                { name: 'Marie Dupont', color: '#FF6B6B' },
                { name: 'Ahmed Ben Ali', color: '#4ECDC4' },
                { name: 'Sophie Martin', color: '#45B7D1' },
                { name: 'Pierre', color: '#96CEB4' },
                { name: 'Lisa Johnson', color: '#FECA57' },
                { name: 'Carlos Rodriguez', color: '#FF9FF3' },
              ].map((person, index) => (
                <View key={index} style={styles.initialItem}>
                  <Avatar
                    name={person.name}
                    size={70}
                    borderColor={person.color}
                    showBorder={true}
                  />
                  <Text style={[styles.initialName, { color: theme.colors.textSecondary }]}>
                    {person.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Navigation des exemples */}
      <View style={[styles.nav, { backgroundColor: theme.colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {examples.map((example) => (
            <TouchableOpacity
              key={example.id}
              style={[
                styles.navItem,
                selectedExample === example.id && {
                  backgroundColor: theme.colors.primary + '20',
                },
              ]}
              onPress={() => setSelectedExample(example.id)}
            >
              <MaterialIcons
                name={example.icon}
                size={20}
                color={
                  selectedExample === example.id
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.navText,
                  {
                    color:
                      selectedExample === example.id
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {example.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenu de l'exemple */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderExample()}
        
        {/* Instructions d'utilisation */}
        <View style={[styles.instructions, { backgroundColor: theme.colors.card }]}>
          <MaterialIcons name="info" size={24} color={theme.colors.primary} />
          <View style={styles.instructionText}>
            <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>
              💡 Comment utiliser
            </Text>
            <Text style={[styles.instructionContent, { color: theme.colors.textSecondary }]}>
              1. Importez le composant : `import Avatar from '../components/Avatar'`{'\n'}
              2. Utilisez-le avec vos données utilisateur{'\n'}
              3. L'avatar gère automatiquement les images et initiales{'\n'}
              4. Personnalisez taille, bordures et badges selon vos besoins
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  nav: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    gap: 6,
  },
  navText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  exampleContainer: {
    padding: 16,
  },
  exampleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  compactItem: {
    marginVertical: 4,
  },
  sizesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  sizeItem: {
    alignItems: 'center',
    gap: 8,
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  initialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  initialItem: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  initialName: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 80,
  },
  instructions: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpace: {
    height: 50,
  },
});

export default AvatarShowcase; 