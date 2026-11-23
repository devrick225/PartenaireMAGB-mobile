import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

import RefreshableHeader from '../components/RefreshableHeader';
import { useDS, AppText, Screen, HeroHeader, Card } from '../design/components';
import { spacing } from '../design/tokens';
interface PrivacyPolicyScreenProps {
  navigation: any;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  const { c } = useDS();

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

Pour exercer ces droits, contactez-nous à l'adresse : partenaireadorationgene.brou@gmail.com`,
    },
    {
      title: '6. Mises à Jour de la Politique',
      content: `Cette Politique de Confidentialité peut être modifiée pour refléter les évolutions de l'application ou les changements légaux. Les utilisateurs seront notifiés des mises à jour significatives.`,
    },
    {
      title: '7. Contact',
      content: `Pour toute question ou préoccupation concernant cette politique, veuillez nous écrire à : partenaireadorationgene.brou@gmail.com`,
    },
  ];

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Informations légales"
          eyebrowIcon="document-lock-outline"
          title="Politique de confidentialité"
          subtitle="Comment Partenaire MAGB protège vos données."
          onBack={() => navigation.goBack()}
        />
      }
    >
      {sections.map((section: any, index: number) => (
        <Card key={index} style={{ gap: spacing.sm }}>
          <AppText variant="subtitle" accessibilityRole="header">{section.title}</AppText>
          {section.content ? <AppText variant="body" color={c.mutedForeground} selectable>{section.content}</AppText> : null}
          {(section.subsections || []).map((sub: any, i: number) => (
            <View key={i} style={{ gap: 4, marginTop: spacing.xs }}>
              <AppText variant="bodyStrong">{sub.subtitle}</AppText>
              <AppText variant="body" color={c.mutedForeground} selectable>{sub.content}</AppText>
            </View>
          ))}
        </Card>
      ))}
      <AppText variant="caption" color={c.mutedForeground} center>
        Dernière mise à jour : 12 juillet 2025.{'\n'}En utilisant Partenaire MAGB, vous reconnaissez avoir lu et compris cette politique de confidentialité.
      </AppText>
    </Screen>
  );
};

export default PrivacyPolicyScreen;
