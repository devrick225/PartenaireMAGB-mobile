import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import Avatar from './Avatar';
import UserCard from './UserCard';
import DashboardHeader from './DashboardHeader';

const AvatarDashboardDemo = () => {
  const { theme } = useTheme();
  
  // Récupérer l'utilisateur depuis Redux ou utiliser des données d'exemple
  const user = useSelector((state) => state.auth.user) || {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    avatar: null, // L'avatar sera récupéré depuis Cloudinary
    role: 'user',
    partnerLevel: 'or',
    totalDonations: 1250000,
    donationCount: 15,
    level: 5,
    points: 2500,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Header complet avec avatar */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          1. Header Dashboard avec Avatar
        </Text>
        <DashboardHeader
          user={user}
          onProfilePress={() => console.log('Profile pressed')}
          onNotificationPress={() => console.log('Notifications pressed')}
          onMenuPress={() => console.log('Menu pressed')}
          notificationCount={3}
        />

        <View style={styles.separator} />

        {/* Section 2: Carte utilisateur complète */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          2. Carte Utilisateur Complète
        </Text>
        <UserCard
          user={user}
          onPress={() => console.log('User card pressed')}
          onEditPress={() => console.log('Edit pressed')}
          showStats={true}
        />

        {/* Section 3: Carte utilisateur compacte */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          3. Carte Utilisateur Compacte
        </Text>
        <UserCard
          user={user}
          onPress={() => console.log('Compact card pressed')}
          compact={true}
          style={styles.compactCard}
        />

        {/* Section 4: Avatars de différentes tailles */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          4. Avatars - Différentes Tailles
        </Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatarItem}>
            <Avatar
              source={user.avatar}
              name={`${user.firstName} ${user.lastName}`}
              size={40}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              40px
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              source={user.avatar}
              name={`${user.firstName} ${user.lastName}`}
              size={60}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              60px
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              source={user.avatar}
              name={`${user.firstName} ${user.lastName}`}
              size={80}
              showStatus={true}
              isOnline={true}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              80px + Status
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              source={user.avatar}
              name={`${user.firstName} ${user.lastName}`}
              size={100}
              showBadge={true}
              badgeCount={5}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              100px + Badge
            </Text>
          </View>
        </View>

        {/* Section 5: Avatars avec initiales (sans image) */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          5. Avatars avec Initiales (Fallback)
        </Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatarItem}>
            <Avatar
              name="Marie Dupont"
              size={60}
              borderColor="#FF6B6B"
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              MD
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              name="Ahmed Ben Ali"
              size={60}
              borderColor="#4ECDC4"
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              AA
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              name="Sophie Martin"
              size={60}
              borderColor="#45B7D1"
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              SM
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              name="Pierre"
              size={60}
              borderColor="#96CEB4"
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              PI
            </Text>
          </View>
        </View>

        {/* Section 6: Intégration dans une liste */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          6. Liste d'Utilisateurs avec Avatars
        </Text>
        <View style={[styles.userList, { backgroundColor: theme.colors.card }]}>
          {[
            { name: 'Alice Johnson', role: 'Administrateur', amount: '250K' },
            { name: 'Bob Wilson', role: 'Modérateur', amount: '180K' },
            { name: 'Carol Brown', role: 'Utilisateur', amount: '95K' },
            { name: 'David Lee', role: 'Support', amount: '160K' },
          ].map((item, index) => (
            <View key={index} style={styles.userListItem}>
              <Avatar
                name={item.name}
                size={50}
                showStatus={true}
                isOnline={index % 2 === 0}
              />
              <View style={styles.userListInfo}>
                <Text style={[styles.userListName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.userListRole, { color: theme.colors.textSecondary }]}>
                  {item.role}
                </Text>
              </View>
              <Text style={[styles.userListAmount, { color: theme.colors.primary }]}>
                {item.amount} FCFA
              </Text>
            </View>
          ))}
        </View>

        {/* Section 7: Customisation avancée */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          7. Customisations Avancées
        </Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatarItem}>
            <Avatar
              name="VIP User"
              size={80}
              borderColor="#FFD700"
              showBorder={true}
              style={{ elevation: 8 }}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              VIP Gold
            </Text>
          </View>
          
          <View style={styles.avatarItem}>
            <Avatar
              name="Premium"
              size={80}
              borderColor="#C0C0C0"
              showStatus={true}
              isOnline={true}
              showBadge={true}
              badgeCount={99}
            />
            <Text style={[styles.avatarLabel, { color: theme.colors.textSecondary }]}>
              Premium
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
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  compactCard: {
    marginHorizontal: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  avatarItem: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  userList: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userListInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userListRole: {
    fontSize: 14,
  },
  userListAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 50,
  },
});

export default AvatarDashboardDemo; 