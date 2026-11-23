import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

import { useDS, AppText, Screen, HeroHeader, IconButton, Card, Section, Button, EmptyState } from '../design/components';
import { cardShadow, radius, spacing, typography } from '../design/tokens';
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
  const { c } = useDS();
  
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

  const Article = ({ item, last }: { item: HelpArticle; last: boolean }) => {
    const open = expandedArticle === item.id;
    return (
      <View style={!last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border } : undefined}>
        <Pressable
          onPress={() => setExpandedArticle(open ? null : item.id)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => [styles.articleHead, pressed && { backgroundColor: c.muted }]}
        >
          <AppText variant="bodyStrong" style={styles.flex}>{item.title}</AppText>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.mutedForeground} />
        </Pressable>
        {open ? (
          <AppText variant="body" color={c.mutedForeground} style={styles.articleBody} selectable>{item.content}</AppText>
        ) : null}
      </View>
    );
  };

  const ArticleList = ({ items }: { items: HelpArticle[] }) => (
    <>{items.map((a, i) => <Article key={a.id} item={a} last={i === items.length - 1} />)}</>
  );

  const selected = categories.find(cat => cat.id === selectedCategory);

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Support"
          eyebrowIcon="help-buoy-outline"
          title="Centre d'aide"
          subtitle="Réponses aux questions les plus fréquentes."
          onBack={() => navigation.goBack()}
          right={<IconButton icon="headset-outline" tone="hero" accessibilityLabel="Contacter le support" onPress={() => navigation.navigate('ContactSupport')} />}
        />
      }
    >
      <View style={[styles.search, cardShadow, { backgroundColor: c.card, borderColor: c.border }]}>
        <Ionicons name="search" size={18} color={c.mutedForeground} />
        <TextInput
          style={[styles.searchInput, typography.body, { color: c.foreground }]}
          placeholder="Rechercher une question…"
          placeholderTextColor={c.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          maxFontSizeMultiplier={1.4}
          accessibilityLabel="Rechercher dans l'aide"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel="Effacer la recherche" hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={c.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {searchQuery || selectedCategory ? (
        <Section
          title={searchQuery ? `Résultats pour « ${searchQuery} »` : selected?.title}
          action={
            selectedCategory && !searchQuery ? (
              <Pressable onPress={() => setSelectedCategory(null)} accessibilityRole="button" hitSlop={8}>
                <AppText variant="smallStrong" color={c.primary}>Toutes les catégories</AppText>
              </Pressable>
            ) : undefined
          }
        >
          {filteredArticles.length === 0 ? (
            <EmptyState icon="search-outline" title="Aucun article trouvé" message="Essayez d'autres mots-clés ou contactez le support." />
          ) : (
            <ArticleList items={filteredArticles} />
          )}
        </Section>
      ) : (
        <>
          {popularArticles.length > 0 ? (
            <Section title="Questions fréquentes">
              <ArticleList items={popularArticles} />
            </Section>
          ) : null}
          <Section title="Catégories">
            {categories.map((cat, i) => {
              const count = articles.filter(a => a.category === cat.id).length;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.title}, ${count} article${count > 1 ? 's' : ''}`}
                  style={({ pressed }) => [styles.catRow, i < categories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }, pressed && { backgroundColor: c.muted }]}
                >
                  <View style={[styles.tile, { backgroundColor: c.primarySoft }]}>
                    <MaterialIcons name={cat.icon as any} size={20} color={c.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{cat.title}</AppText>
                    <AppText variant="small" color={c.mutedForeground} numberOfLines={2}>{cat.description}</AppText>
                  </View>
                  <AppText variant="smallStrong" color={c.primary}>{count}</AppText>
                  <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
                </Pressable>
              );
            })}
          </Section>
        </>
      )}

      <Card style={{ gap: spacing.md }}>
        <AppText variant="subtitle">Besoin d'aide supplémentaire ?</AppText>
        <AppText variant="small" color={c.mutedForeground}>Notre équipe de support est là pour vous aider.</AppText>
        <Button title="Contacter le support" icon="headset-outline" onPress={() => navigation.navigate('ContactSupport')} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, minHeight: 48 },
  searchInput: { flex: 1, paddingVertical: 10 },
  articleHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 56 },
  articleBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 64 },
  tile: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

export default HelpCenterScreen;
