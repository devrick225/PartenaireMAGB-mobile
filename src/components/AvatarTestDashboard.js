import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from './Avatar';

/**
 * 🧪 TEST SIMPLE - Avatar avec nom dans dashboard
 * 
 * Ce composant montre exactement ce que vous aurez
 * dans votre DashboardModern.tsx après intégration
 */
const AvatarTestDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  
  // Simulations de données utilisateur
  const user = {
    firstName: 'Marie',
    lastName: 'Dupont',
    avatar: null, // null = affichera les initiales MD
  };

  const userStats = {
    level: 4,
    partnerLevel: 'or',
    partnerLevelDetails: {
      color: '#FFD700', // Or
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        🎯 Test Avatar Dashboard
      </Text>

      {/* Header similaire à DashboardModern.tsx */}
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
            Bonjour, {user.firstName} 👋
          </Text>
          <Text style={[styles.welcomeSubtext, { color: theme.colors.textSecondary }]}>
            Voici un aperçu de vos contributions
          </Text>
        </View>
        
        {/* Avatar moderne avec nom - EXACTEMENT comme dans votre dashboard */}
        <TouchableOpacity 
          style={styles.avatarSection}
          onPress={() => console.log('Navigation vers ProfileSettings')}
          activeOpacity={0.8}
        >
          <Avatar
            source={user.avatar} // null = initiales automatiques
            name={`${user.firstName} ${user.lastName}`}
            size={70}
            borderColor={userStats.partnerLevelDetails?.color || theme.colors.primary}
            showStatus={true}
            isOnline={true}
            showBorder={true}
          />
          <View style={styles.userInfoSection}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user.firstName} {user.lastName}
            </Text>
            <View style={styles.levelBadge}>
              <MaterialIcons name="star" size={14} color={theme.colors.primary} />
              <Text style={[styles.levelText, { color: theme.colors.primary }]}>
                Niveau {userStats.level}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Exemples d'avatars avec différents noms */}
      <View style={[styles.examplesSection, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.exampleTitle, { color: theme.colors.text }]}>
          Exemples avec différents noms :
        </Text>
        
        <View style={styles.exampleRow}>
          <View style={styles.exampleItem}>
            <Avatar
              name="Ahmed Ben Ali"
              size={50}
              borderColor="#4ECDC4"
              showStatus={true}
              isOnline={true}
            />
            <Text style={[styles.exampleName, { color: theme.colors.textSecondary }]}>
              Ahmed Ben Ali
            </Text>
          </View>
          
          <View style={styles.exampleItem}>
            <Avatar
              name="Sophie Martin"
              size={50}
              borderColor="#FF6B6B"
              showBadge={true}
              badgeCount={2}
            />
            <Text style={[styles.exampleName, { color: theme.colors.textSecondary }]}>
              Sophie Martin
            </Text>
          </View>
          
          <View style={styles.exampleItem}>
            <Avatar
              name="Pierre"
              size={50}
              borderColor="#96CEB4"
            />
            <Text style={[styles.exampleName, { color: theme.colors.textSecondary }]}>
              Pierre
            </Text>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={[styles.instructionsSection, { backgroundColor: theme.colors.card }]}>
        <MaterialIcons name="info" size={24} color={theme.colors.primary} />
        <View style={styles.instructionText}>
          <Text style={[styles.instructionTitle, { color: theme.colors.text }]}>
            ✅ Prêt à intégrer !
          </Text>
          <Text style={[styles.instructionContent, { color: theme.colors.textSecondary }]}>
            • Copiez le code du header dans votre DashboardModern.tsx{'\n'}
            • L'avatar affichera automatiquement les initiales{'\n'}
            • Après upload Cloudinary, l'image remplacera les initiales{'\n'}
            • Le nom s'affiche élégamment à côté de l'avatar
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoSection: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  examplesSection: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exampleItem: {
    alignItems: 'center',
    gap: 8,
  },
  exampleName: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
  instructionsSection: {
    flexDirection: 'row',
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
});

export default AvatarTestDashboard; 