import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import RefreshableHeader from '../components/RefreshableHeader';

interface MissionsScreenProps {
  navigation: any;
}

const MissionsScreen: React.FC<MissionsScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();

  const handleContact = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      Linking.openURL('tel:+22500000000'); // Remplacez par le vrai numéro
    } else if (type === 'email') {
      Linking.openURL('mailto:contact@partenairemagb.com'); // Remplacez par le vrai email
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RefreshableHeader
        title="Missions"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        showRefreshButton={false}
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Titre principal */}
        <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="church" size={48} color="#FFFFFF" />
          <Text style={styles.mainTitle}>MISSIONS PARTENAIRE MAGB</Text>
          <Text style={styles.subtitle}>Soutenir l'œuvre de Dieu ensemble</Text>
        </View>

        {/* Section Objectif */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <Feather name="target" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notre Objectif</Text>
          </View>
          
          <Text style={[styles.paragraph, { color: colors.text }]}>
            La plateforme MAGB vise à rassembler des millions de personnes à travers le monde entier autour d'un seul et même objectif :
          </Text>
          
          <Text style={[styles.highlightText, { color: colors.primary }]}>
            Soutenir financièrement les activités du Ministère d'Adoration Geneviève Brou afin de gagner plus d'âmes pour le Christ
          </Text>
        </View>

        {/* Section Activités */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="list-alt" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nos Activités</Text>
          </View>
          
          <View style={styles.activitiesList}>
            <View style={styles.activityItem}>
              <MaterialIcons name="child-care" size={20} color={colors.primary} />
              <Text style={[styles.activityText, { color: colors.text }]}>
                L'évangélisation de nos jeunes et enfants en leur permettant de participer gratuitement à nos activités
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <MaterialIcons name="school" size={20} color={colors.primary} />
              <Text style={[styles.activityText, { color: colors.text }]}>
                La formation des jeunes, des femmes et des hommes pour en faire des leaders chrétiens
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <Text style={[styles.activityText, { color: colors.text }]}>
                L'organisation des grands rassemblements annuels d'adoration (RIA, Concert des femmes, etc.)
              </Text>
            </View>
          </View>
        </View>

        {/* Section Ministère */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Le Ministère</Text>
          </View>
          
          <Text style={[styles.paragraph, { color: colors.text }]}>
            Le ministère d'Adoration Geneviève Brou de la chantre Geneviève Brou dans sa soif de voir plus de personnes sauvées par JESUS CHRIST de Nazareth à travers le monde. Les actions menées sur le terrain sont nombreuses et plurielles qui nécessitent beaucoup de moyens financiers. Les Partenaires MAGB vient répondre à ce besoin.
          </Text>
        </View>

        {/* Section Qu'est-ce qu'un Partenaire */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="handshake" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Qu'est-ce qu'un Partenaire</Text>
          </View>
          
          <Text style={[styles.paragraph, { color: colors.text }]}>
            C'est un donateur dans le champ de DIEU. Il est un coparticipant avec le ministère dans l'œuvre de la quête aux âmes sauvées et aux vies transformées.
          </Text>
          
          <Text style={[styles.highlightText, { color: colors.primary }]}>
            En un mot, c'est un bâtisseur du royaume de DIEU.
          </Text>
        </View>

        {/* Section Contact 
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="contact-support" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Partenaire MAGB</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}>
                Adresse Postale
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('phone')}
            >
              <MaterialIcons name="phone" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>
                Tél: +225 00 00 00 00
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <MaterialIcons name="email" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>
                Email: contact@partenairemagb.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>
*/}
        {/* Bouton d'action 
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateDonation', { initialType: 'one_time' })}
        >
          <MaterialIcons name="favorite" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Devenir Partenaire</Text>
        </TouchableOpacity>
        */}

        <View style={styles.bottomPadding} />
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
  contentContainer: {
    padding: 20,
  },
  headerCard: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  activitiesList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 20,
  },
});

export default MissionsScreen;
