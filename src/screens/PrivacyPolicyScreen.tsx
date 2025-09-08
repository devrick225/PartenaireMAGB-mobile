import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';

interface PrivacyPolicyScreenProps {
  navigation: any;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();

  const sections = [
    {
      title: 'Introduction',
      content: `Bienvenue sur PartenaireMAGB, l'application dédiée à la gestion des partenariats et à la facilitation des transactions au sein de la communauté MAGB. Cette Politique de Confidentialité a pour objectif de vous informer sur la manière dont nous collectons, utilisons, partageons et protégeons vos données personnelles. En utilisant PartenaireMAGB, vous acceptez les termes de cette politique.`,
    },
    {
      title: '1. Données Collectées',
      subsections: [
        {
          subtitle: '1.1 Informations d\'Inscription',
          content: `Lors de votre inscription sur PartenaireMAGB, nous collectons les informations nécessaires telles que votre nom, prénom, adresse e-mail, numéro de téléphone, et autres détails pertinents pour votre identification et la communication.`,
        },
        {
          subtitle: '1.2 Données de Paiement',
          content: `Pour les transactions électroniques, nous collectons les informations de paiement, y compris les détails de carte de crédit, de virement ou autres moyens de paiement. Ces données sont traitées de manière sécurisée.`,
        },
        {
          subtitle: '1.3 Données d\'Utilisation',
          content: `Nous recueillons des données sur votre interaction avec l'application, notamment les pages consultées, les transactions effectuées, et les fonctionnalités utilisées.`,
        },
      ],
    },
    {
      title: '2. Utilisation des Données',
      subsections: [
        {
          subtitle: '2.1 Traitement des Transactions',
          content: `Les informations de paiement sont utilisées exclusivement pour exécuter les transactions demandées via PartenaireMAGB.`,
        },
        {
          subtitle: '2.2 Communication',
          content: `Nous utilisons vos coordonnées pour vous envoyer des notifications relatives à votre compte, des mises à jour importantes, et des informations sur les services proposés.`,
        },
        {
          subtitle: '2.3 Amélioration des Services',
          content: `Les données d'utilisation nous aident à optimiser l'application et à personnaliser votre expérience utilisateur.`,
        },
      ],
    },
    {
      title: '3. Partage des Données',
      subsections: [
        {
          subtitle: '3.1 Fournisseurs de Services',
          content: `Nous pouvons partager vos données avec des prestataires tiers qui nous assistent dans la gestion de l'application (ex : traitement des paiements, hébergement des données). Ces partenaires sont tenus de respecter des obligations strictes de confidentialité.`,
        },
        {
          subtitle: '3.2 Conformité Légale',
          content: `Vos informations peuvent être divulguées si la loi l'exige ou pour protéger nos droits légaux, notamment en cas de requête judiciaire ou administrative.`,
        },
      ],
    },
    {
      title: '4. Sécurité des Données',
      content: `Nous mettons en œuvre des mesures techniques et organisationnelles robustes pour protéger vos données contre tout accès non autorisé, altération, ou destruction. Les transactions sont chiffrées et conformes aux standards de sécurité en vigueur.`,
    },
    {
      title: '5. Vos Droits',
      content: `Vous avez le droit :

• D'accéder à vos données personnelles
• De les rectifier ou les supprimer
• De vous opposer à leur utilisation pour des finalités spécifiques
• De retirer votre consentement à tout moment

Pour exercer ces droits, contactez-nous à l'adresse : contact@partenairemagb.com`,
    },
    {
      title: '6. Mises à Jour de la Politique',
      content: `Cette Politique de Confidentialité peut être modifiée pour refléter les évolutions de l'application ou les changements légaux. Les utilisateurs seront notifiés des mises à jour significatives.`,
    },
    {
      title: '7. Contact',
      content: `Pour toute question ou préoccupation concernant cette politique, veuillez nous écrire à : contact@partenairemagb.com`,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Politique de Confidentialité
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
              
              {section.content && (
                <Text style={[styles.sectionContent, { color: colors.text }]}>
                  {section.content}
                </Text>
              )}

              {section.subsections?.map((subsection, subIndex) => (
                <View key={subIndex} style={styles.subsection}>
                  <Text style={[styles.subsectionTitle, { color: colors.text }]}>
                    {subsection.subtitle}
                  </Text>
                  <Text style={[styles.subsectionContent, { color: colors.text }]}>
                    {subsection.content}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <Text style={[styles.lastUpdate, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Dernière mise à jour : 12 juillet 2025
          </Text>

          <Text style={[styles.acknowledgment, { color: colors.text }]}>
            En utilisant PartenaireMAGB, vous reconnaissez avoir lu et compris cette Politique de Confidentialité.
          </Text>

          <View style={styles.bottomPadding} />
        </View>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  subsection: {
    marginTop: 16,
    marginLeft: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subsectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  lastUpdate: {
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  acknowledgment: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PrivacyPolicyScreen; 