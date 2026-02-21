import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  articleCount: number;
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  isPopular: boolean;
  views: number;
}

interface HelpCenterScreenProps {
  navigation: any;
}

const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ navigation }) => {
  const { colors, dark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories: HelpCategory[] = [
    {
      id: 'donations',
      title: 'Dons & Donations',
      icon: 'favorite',
      description: 'Comment faire des dons, gérer vos contributions',
      articleCount: 6,
    },
    {
      id: 'account',
      title: 'Mon Compte',
      icon: 'account-circle',
      description: 'Paramètres de compte, profil, préférences',
      articleCount: 6,
    },
    {
      id: 'payment',
      title: 'Paiements',
      icon: 'payment',
      description: 'Méthodes de paiement, reçus, problèmes de transaction',
      articleCount: 5,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      description: 'Gérer vos notifications et alertes',
      articleCount: 4,
    },
    {
      id: 'security',
      title: 'Sécurité',
      icon: 'security',
      description: 'Mots de passe, confidentialité, protection du compte',
      articleCount: 5,
    },
    {
      id: 'technical',
      title: 'Problèmes Techniques',
      icon: 'build',
      description: 'Bugs, problèmes de connexion, performance',
      articleCount: 6,
    },
  ];

  const articles: HelpArticle[] = [
    // ── DONS & DONATIONS ──────────────────────────────────────────────
    {
      id: 'd1',
      title: 'Comment faire un don ?',
      content: 'Pour faire un don, rendez-vous sur le tableau de bord et appuyez sur "Nouveau Don". Sélectionnez le montant souhaité, choisissez le type de don (Mensuelle, Trimestrielle, Semestrielle ou Ponctuel), puis sélectionnez votre méthode de paiement. Confirmez et vous recevrez une confirmation par email dès que le paiement est traité.',
      category: 'donations',
      isPopular: true,
      views: 1250,
    },
    {
      id: 'd2',
      title: 'Comment annuler un don récurrent ?',
      content: 'Accédez à l\'onglet "Dons Récurrents" depuis le menu principal. Trouvez le don que vous souhaitez annuler, appuyez dessus pour voir les détails puis sélectionnez "Gérer". Vous pourrez suspendre temporairement ou annuler définitivement le don récurrent. Une confirmation vous sera envoyée par email.',
      category: 'donations',
      isPopular: true,
      views: 678,
    },
    {
      id: 'd3',
      title: 'Quels types de dons sont disponibles ?',
      content: 'L\'application propose quatre types de dons :\n\n• Mensuelle : prélèvement automatique chaque mois.\n• Trimestrielle : prélèvement tous les 3 mois.\n• Semestrielle : prélèvement tous les 6 mois.\n• Ponctuel : don unique sans engagement récurrent.\n\nChoisissez le type qui correspond le mieux à votre capacité de contribution.',
      category: 'donations',
      isPopular: false,
      views: 520,
    },
    {
      id: 'd4',
      title: 'Mon don n\'a pas été enregistré, que faire ?',
      content: 'Si votre don n\'apparaît pas dans l\'historique après paiement, vérifiez d\'abord l\'onglet "Historique des paiements". Si le statut indique "Échoué" ou "En attente", attendez quelques minutes puis rafraîchissez la page. En cas de prélèvement bancaire effectif sans enregistrement, contactez immédiatement notre support à partenaireadorationgene.brou@gmail.com avec votre reçu de paiement.',
      category: 'donations',
      isPopular: false,
      views: 390,
    },
    {
      id: 'd5',
      title: 'Comment obtenir un reçu de don ?',
      content: 'Vos reçus sont automatiquement envoyés à votre adresse email après chaque don confirmé. Vous pouvez aussi les retrouver dans l\'onglet "Historique des paiements" : appuyez sur un paiement pour voir les détails complets incluant la date, le montant et la référence de transaction.',
      category: 'donations',
      isPopular: false,
      views: 310,
    },
    {
      id: 'd6',
      title: 'Comment modifier le montant d\'un don récurrent ?',
      content: 'Pour modifier le montant d\'un don récurrent, annulez d\'abord le don existant depuis l\'onglet "Dons Récurrents", puis créez un nouveau don avec le montant souhaité. La modification directe du montant n\'est pas encore disponible. Pour toute assistance, contactez notre support.',
      category: 'donations',
      isPopular: false,
      views: 245,
    },

    // ── MON COMPTE ────────────────────────────────────────────────────
    {
      id: 'a1',
      title: 'Comment modifier mes informations personnelles ?',
      content: 'Accédez à votre profil en appuyant sur votre avatar ou en allant dans "Paramètres > Mon Profil". Vous pouvez modifier votre prénom, nom, numéro de téléphone et adresse. Appuyez sur "Enregistrer" pour confirmer. Certains champs comme l\'email nécessitent une vérification supplémentaire.',
      category: 'account',
      isPopular: true,
      views: 840,
    },
    {
      id: 'a2',
      title: 'Comment changer mon mot de passe ?',
      content: 'Allez dans Paramètres > Sécurité > Changer le mot de passe. Saisissez votre mot de passe actuel, puis votre nouveau mot de passe deux fois pour confirmation. Votre nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre. En cas d\'oubli, utilisez "Mot de passe oublié" sur l\'écran de connexion.',
      category: 'account',
      isPopular: true,
      views: 980,
    },
    {
      id: 'a3',
      title: 'Comment changer ma photo de profil ?',
      content: 'Appuyez sur votre avatar depuis le tableau de bord ou depuis la page "Profil". Sélectionnez "Modifier la photo", choisissez une image depuis votre galerie ou prenez une nouvelle photo. La photo est mise à jour immédiatement après confirmation.',
      category: 'account',
      isPopular: false,
      views: 430,
    },
    {
      id: 'a4',
      title: 'Comment voir l\'historique de mes dons ?',
      content: 'Vous pouvez consulter l\'historique complet de vos paiements depuis le menu principal, section "Historique des paiements". Vous y trouverez la date, le montant, la catégorie et le statut de chaque transaction. Des filtres vous permettent de rechercher par statut ou par fournisseur de paiement.',
      category: 'account',
      isPopular: false,
      views: 560,
    },
    {
      id: 'a5',
      title: 'Comment gérer mes préférences de compte ?',
      content: 'Dans Paramètres > Préférences, vous pouvez configurer la langue de l\'application, le thème (clair ou sombre), la devise d\'affichage et vos préférences de communication. Toutes les modifications sont sauvegardées automatiquement.',
      category: 'account',
      isPopular: false,
      views: 290,
    },
    {
      id: 'a6',
      title: 'Comment supprimer mon compte ?',
      content: 'La suppression de compte est irréversible. Pour supprimer votre compte, contactez notre support à partenaireadorationgene.brou@gmail.com depuis l\'adresse email associée à votre compte. Notre équipe traitera votre demande sous 7 jours ouvrés. Notez que l\'historique de vos dons sera conservé à des fins comptables conformément à la réglementation.',
      category: 'account',
      isPopular: false,
      views: 180,
    },

    // ── PAIEMENTS ─────────────────────────────────────────────────────
    {
      id: 'p1',
      title: 'Méthodes de paiement acceptées',
      content: 'L\'application accepte actuellement les paiements via MoneyFusion qui centralise plusieurs moyens de paiement mobiles disponibles en Côte d\'Ivoire et dans la sous-région. D\'autres méthodes (Orange Money, MTN Mobile Money, Moov Money) pourront être disponibles selon votre région. Vérifiez les options affichées lors de votre don.',
      category: 'payment',
      isPopular: true,
      views: 720,
    },
    {
      id: 'p2',
      title: 'Que faire en cas d\'échec de paiement ?',
      content: 'En cas d\'échec de paiement :\n1. Vérifiez que le solde de votre compte mobile money est suffisant.\n2. Assurez-vous que le numéro de téléphone saisi est correct.\n3. Vérifiez votre connexion internet.\n4. Attendez quelques minutes et réessayez.\n\nSi le problème persiste et qu\'un montant a été débité, contactez notre support avec la référence de transaction.',
      category: 'payment',
      isPopular: true,
      views: 610,
    },
    {
      id: 'p3',
      title: 'Les paiements sont-ils sécurisés ?',
      content: 'Oui, tous les paiements sont traités par des plateformes sécurisées et certifiées. Nous n\'stockons jamais vos données bancaires ou de mobile money sur nos serveurs. Chaque transaction est chiffrée et tracée. En cas de doute sur une transaction, contactez immédiatement notre support.',
      category: 'payment',
      isPopular: false,
      views: 380,
    },
    {
      id: 'p4',
      title: 'Quel est le délai de traitement des paiements ?',
      content: 'La plupart des paiements mobile money sont traités instantanément. Un délai de quelques minutes peut survenir en cas de forte affluence. Les paiements affichés "En cours" peuvent prendre jusqu\'à 24h. Si votre paiement reste "En attente" plus de 24h, contactez le support avec la référence de transaction.',
      category: 'payment',
      isPopular: false,
      views: 275,
    },
    {
      id: 'p5',
      title: 'Comment obtenir une facture ou un justificatif ?',
      content: 'Chaque don confirmé génère automatiquement un reçu envoyé à votre email. Pour un justificatif officiel (pour déduction fiscale ou autre), contactez-nous à partenaireadorationgene.brou@gmail.com en précisant la date, le montant et la référence de votre don. Nous vous ferons parvenir un document officiel sous 48h.',
      category: 'payment',
      isPopular: false,
      views: 210,
    },

    // ── NOTIFICATIONS ─────────────────────────────────────────────────
    {
      id: 'n1',
      title: 'Comment modifier mes préférences de notifications ?',
      content: 'Dans Paramètres > Notifications, vous pouvez activer ou désactiver indépendamment : les notifications de confirmation de don, les rappels de dons récurrents, les annonces et actualités du ministère, et les newsletters. Chaque type peut être configuré par email ou par notification push.',
      category: 'notifications',
      isPopular: true,
      views: 432,
    },
    {
      id: 'n2',
      title: 'Je ne reçois pas les notifications push',
      content: 'Si vous ne recevez pas les notifications :\n1. Vérifiez que les notifications sont autorisées dans les paramètres de votre téléphone (Paramètres > Applications > PartenaireMAGB > Notifications).\n2. Assurez-vous que les notifications sont activées dans l\'application (Paramètres > Notifications).\n3. Vérifiez que votre téléphone n\'est pas en mode "Ne pas déranger".\n4. Redémarrez l\'application.',
      category: 'notifications',
      isPopular: false,
      views: 340,
    },
    {
      id: 'n3',
      title: 'Je reçois trop de notifications, comment les réduire ?',
      content: 'Vous pouvez personnaliser finement vos notifications dans Paramètres > Notifications. Désactivez uniquement les types qui vous dérangent (ex: newsletters) tout en conservant les confirmations de dons importantes. Vous pouvez aussi définir des plages horaires de silence dans les paramètres système de votre téléphone.',
      category: 'notifications',
      isPopular: false,
      views: 265,
    },
    {
      id: 'n4',
      title: 'Quels types de notifications puis-je recevoir ?',
      content: 'L\'application peut envoyer plusieurs types de notifications :\n\n• Confirmation de don : envoyée après chaque don réussi.\n• Rappel récurrent : rappel avant prélèvement d\'un don récurrent.\n• Actualités du ministère : informations et événements importants.\n• Newsletter : informations spirituelles et nouvelles du ministère.\n\nChaque type est configurable individuellement.',
      category: 'notifications',
      isPopular: false,
      views: 195,
    },

    // ── SÉCURITÉ ──────────────────────────────────────────────────────
    {
      id: 's1',
      title: 'Comment sécuriser mon compte ?',
      content: 'Pour bien sécuriser votre compte :\n\n• Utilisez un mot de passe unique et fort (8+ caractères, majuscule, chiffre, caractère spécial).\n• Ne partagez jamais vos identifiants avec qui que ce soit, même le support.\n• Déconnectez-vous sur les appareils partagés.\n• Vérifiez régulièrement votre historique de connexions.\n• Mettez à jour l\'application dès qu\'une nouvelle version est disponible.',
      category: 'security',
      isPopular: true,
      views: 890,
    },
    {
      id: 's2',
      title: 'Je suspecte une activité frauduleuse sur mon compte',
      content: 'En cas d\'activité suspecte (dons non effectués, connexions inconnues) :\n\n1. Changez immédiatement votre mot de passe.\n2. Déconnectez-vous de tous les appareils depuis Paramètres > Sécurité > Déconnecter tous les appareils.\n3. Contactez notre support en urgence à partenaireadorationgene.brou@gmail.com ou au 07 68 30 61 62.\n4. Si un paiement non autorisé a été effectué, contactez également votre opérateur mobile money.',
      category: 'security',
      isPopular: true,
      views: 540,
    },
    {
      id: 's3',
      title: 'Comment récupérer mon compte si j\'ai oublié mon mot de passe ?',
      content: 'Sur l\'écran de connexion, appuyez sur "Mot de passe oublié ?". Saisissez votre adresse email et vous recevrez un lien de réinitialisation. Le lien est valide 30 minutes. Si vous ne recevez pas l\'email, vérifiez vos spams ou contactez le support avec votre adresse email enregistrée.',
      category: 'security',
      isPopular: true,
      views: 760,
    },
    {
      id: 's4',
      title: 'Comment sont protégées mes données personnelles ?',
      content: 'Vos données personnelles sont stockées de manière sécurisée et chiffrée sur nos serveurs. Nous ne partageons jamais vos informations avec des tiers sans votre consentement explicite. Vos données de paiement (numéro mobile money) ne sont jamais conservées sur nos serveurs — elles transitent uniquement via les plateformes de paiement certifiées. Conformément aux réglementations, vous pouvez demander la suppression de vos données à tout moment.',
      category: 'security',
      isPopular: false,
      views: 420,
    },
    {
      id: 's5',
      title: 'Que faire si je reçois un email suspect au nom de PartenaireMAGB ?',
      content: 'Soyez vigilant face aux tentatives de phishing. Notre équipe ne vous demandera jamais votre mot de passe par email. Si vous recevez un email suspect :\n\n1. Ne cliquez sur aucun lien et ne téléchargez aucune pièce jointe.\n2. Vérifiez que l\'expéditeur utilise notre email officiel : partenaireadorationgene.brou@gmail.com\n3. Signalez-le-nous immédiatement.\n4. Si vous avez déjà cliqué, changez immédiatement votre mot de passe.',
      category: 'security',
      isPopular: false,
      views: 310,
    },

    // ── PROBLÈMES TECHNIQUES ──────────────────────────────────────────
    {
      id: 't1',
      title: 'Problème de connexion à l\'application',
      content: 'Si vous ne pouvez pas vous connecter :\n\n1. Vérifiez votre connexion internet (WiFi ou données mobiles).\n2. Assurez-vous d\'utiliser la bonne adresse email et le bon mot de passe.\n3. Essayez "Mot de passe oublié" si vous n\'êtes pas sûr du mot de passe.\n4. Forcez la fermeture de l\'application et relancez-la.\n5. Si le problème persiste, désinstallez et réinstallez l\'application.',
      category: 'technical',
      isPopular: true,
      views: 756,
    },
    {
      id: 't2',
      title: 'L\'application ne se charge pas ou est très lente',
      content: 'Si l\'application est lente ou ne se charge pas :\n\n1. Vérifiez la qualité de votre connexion internet.\n2. Fermez complètement l\'application et relancez-la.\n3. Libérez de la mémoire en fermant les autres applications en arrière-plan.\n4. Videz le cache de l\'application : Paramètres téléphone > Applications > PartenaireMAGB > Vider le cache.\n5. Vérifiez si une mise à jour est disponible sur le store.',
      category: 'technical',
      isPopular: true,
      views: 610,
    },
    {
      id: 't3',
      title: 'Comment mettre à jour l\'application ?',
      content: 'Pour mettre à jour l\'application, rendez-vous sur le Google Play Store (Android) ou l\'App Store (iOS), recherchez "PartenaireMAGB" et appuyez sur "Mettre à jour" si une mise à jour est disponible. Les mises à jour sont recommandées pour bénéficier des dernières améliorations et corrections de sécurité. Activez les mises à jour automatiques pour ne jamais manquer une mise à jour.',
      category: 'technical',
      isPopular: false,
      views: 380,
    },
    {
      id: 't4',
      title: 'Les données ne se synchronisent pas',
      content: 'Si vos données (dons, profil) ne se mettent pas à jour :\n\n1. Tirez vers le bas sur l\'écran concerné pour forcer le rafraîchissement.\n2. Vérifiez votre connexion internet.\n3. Déconnectez-vous puis reconnectez-vous à l\'application.\n4. Si le problème persiste après reconnexion, contactez le support en précisant la version de l\'application et le modèle de votre téléphone.',
      category: 'technical',
      isPopular: false,
      views: 295,
    },
    {
      id: 't5',
      title: 'Comment signaler un bug ou un problème ?',
      content: 'Pour signaler un bug, contactez notre support technique à partenaireadorationgene.brou@gmail.com ou via l\'écran "Nous contacter" dans l\'application. Précisez dans votre message :\n\n• Le modèle de votre téléphone et la version Android/iOS.\n• La version de l\'application.\n• Une description précise du problème.\n• Si possible, une capture d\'écran.\n\nNous traitons chaque signalement sous 48h.',
      category: 'technical',
      isPopular: false,
      views: 220,
    },
    {
      id: 't6',
      title: 'L\'application plante ou se ferme toute seule',
      content: 'Si l\'application se ferme inopinément :\n\n1. Mettez à jour l\'application vers la dernière version disponible.\n2. Redémarrez votre téléphone.\n3. Vérifiez que votre téléphone dispose d\'au moins 500 Mo d\'espace libre.\n4. Désinstallez puis réinstallez l\'application.\n\nSi le problème persiste, signalez-le avec le modèle de votre téléphone et la version Android/iOS à notre support.',
      category: 'technical',
      isPopular: false,
      views: 185,
    },
  ];

  const popularArticles = articles.filter(article => article.isPopular);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderCategory = ({ item }: { item: HelpCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        {
          backgroundColor: selectedCategory === item.id
            ? colors.primary + '20'
            : (dark ? COLORS.dark2 : COLORS.white),
          borderColor: selectedCategory === item.id
            ? colors.primary
            : 'transparent',
        },
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
          <MaterialIcons name={item.icon as any} size={24} color={colors.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.categoryDescription, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            {item.description}
          </Text>
        </View>
        <View style={styles.categoryMeta}>
          <Text style={[styles.articleCount, { color: colors.primary }]}>
            {item.articleCount}
          </Text>
          <MaterialIcons
            name={selectedCategory === item.id ? 'expand-less' : 'expand-more'}
            size={24}
            color={dark ? COLORS.grayTie : COLORS.gray}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderArticle = ({ item }: { item: HelpArticle }) => {
    const isExpanded = expandedArticle === item.id;
    
    return (
      <View style={[styles.articleCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <TouchableOpacity
          onPress={() => setExpandedArticle(isExpanded ? null : item.id)}
          style={styles.articleHeader}
        >
          <View style={styles.articleTitleContainer}>
            <Text style={[styles.articleTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {false && item.isPopular && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.popularText}>Populaire</Text>
              </View>
            )}
          </View>
          {/*  
          <View style={styles.articleMeta}>
            <Text style={[styles.viewCount, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {item.views} vues
            </Text>
            <MaterialIcons
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={24}
              color={dark ? COLORS.grayTie : COLORS.gray}
            />
          </View>
          */}
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.articleContent}>
            <Text style={[styles.articleText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
              {item.content}
            </Text>
            {/*
            <View style={styles.articleActions}>
              <TouchableOpacity style={styles.helpfulButton}>
                <MaterialIcons name="thumb-up" size={16} color={colors.primary} />
                <Text style={[styles.helpfulText, { color: colors.primary }]}>
                  Utile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.helpfulButton}>
                <MaterialIcons name="share" size={16} color={dark ? COLORS.grayTie : COLORS.gray} />
                <Text style={[styles.helpfulText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                  Partager
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        )}
      </View>
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Centre d'aide</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ContactSupport')}
          style={[styles.contactButton, { backgroundColor: colors.primary }]}
        >
          <MaterialIcons name="support-agent" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={[styles.searchContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <MaterialIcons name="search" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher dans l'aide..."
            placeholderTextColor={dark ? COLORS.grayTie : COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={24} color={dark ? COLORS.grayTie : COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Articles populaires */}
        {!searchQuery && !selectedCategory && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-up" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Articles populaires
              </Text>
            </View>
            <FlatList
              data={popularArticles}
              renderItem={renderArticle}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Catégories */}
        {!searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="category" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Catégories d'aide
              </Text>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Résultats de recherche ou articles de catégorie */}
        {(searchQuery || selectedCategory) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="article" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {searchQuery
                  ? `Résultats pour "${searchQuery}"`
                  : `Articles - ${categories.find(c => c.id === selectedCategory)?.title}`
                }
              </Text>
              {selectedCategory && (
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Text style={[styles.clearFilter, { color: colors.primary }]}>
                    Voir tout
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredArticles}
              renderItem={renderArticle}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={48} color={dark ? COLORS.grayTie : COLORS.gray} />
                  <Text style={[styles.emptyText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Aucun article trouvé
                  </Text>
                  <Text style={[styles.emptySubtext, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
                    Essayez d'autres mots-clés ou contactez le support
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {/* Contact support */}
        <View style={[styles.contactSection, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.contactHeader}>
            <MaterialIcons name="help-outline" size={24} color={colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Besoin d'aide supplémentaire ?
            </Text>
          </View>
          <Text style={[styles.contactText, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Notre équipe de support est là pour vous aider 24h/24 et 7j/7
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ContactSupport')}
            style={[styles.contactSupportButton, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="support-agent" size={20} color="#FFFFFF" />
            <Text style={styles.contactSupportText}>Contacter le support</Text>
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
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  clearFilter: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
  },
  categoryMeta: {
    alignItems: 'center',
  },
  articleCount: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  articleCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  articleTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  articleMeta: {
    alignItems: 'flex-end',
  },
  viewCount: {
    fontSize: 12,
    marginBottom: 4,
  },
  articleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  articleText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 16,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  contactSection: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  contactSupportText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default HelpCenterScreen; 