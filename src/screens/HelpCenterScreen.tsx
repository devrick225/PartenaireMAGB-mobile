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
      articleCount: 8,
    },
    {
      id: 'account',
      title: 'Mon Compte',
      icon: 'account-circle',
      description: 'Paramètres de compte, sécurité, profil',
      articleCount: 12,
    },
    {
      id: 'payment',
      title: 'Paiements',
      icon: 'payment',
      description: 'Méthodes de paiement, factures, remboursements',
      articleCount: 6,
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
      description: 'Mots de passe, authentification, confidentialité',
      articleCount: 7,
    },
    {
      id: 'technical',
      title: 'Problèmes Techniques',
      icon: 'build',
      description: 'Bugs, problèmes de connexion, performance',
      articleCount: 9,
    },
  ];

  const articles: HelpArticle[] = [
    {
      id: '1',
      title: 'Comment faire un don ?',
      content: 'Pour faire un don, allez dans l\'onglet Dashboard et cliquez sur "Nouveau don". Choisissez le montant, la catégorie et la méthode de paiement. Confirmez votre don et vous recevrez une confirmation par email.',
      category: 'donations',
      isPopular: true,
      views: 1250,
    },
    {
      id: '2',
      title: 'Comment changer mon mot de passe ?',
      content: 'Allez dans Paramètres > Sécurité > Changer le mot de passe. Entrez votre mot de passe actuel puis votre nouveau mot de passe. Le nouveau mot de passe doit contenir au moins 8 caractères avec une majuscule, une minuscule et un chiffre.',
      category: 'account',
      isPopular: true,
      views: 980,
    },
    {
      id: '3',
      title: 'Problème de connexion à l\'application',
      content: 'Si vous ne pouvez pas vous connecter, vérifiez votre connexion internet, assurez-vous d\'utiliser la bonne adresse email et mot de passe. Si le problème persiste, utilisez "Mot de passe oublié" ou contactez le support.',
      category: 'technical',
      isPopular: true,
      views: 756,
    },
    {
      id: '4',
      title: 'Comment modifier mes préférences de notification ?',
      content: 'Dans Paramètres > Notifications, vous pouvez activer/désactiver les notifications par email ou SMS pour les dons, rappels et newsletters selon vos préférences.',
      category: 'notifications',
      isPopular: false,
      views: 432,
    },
    {
      id: '5',
      title: 'Comment annuler un don récurrent ?',
      content: 'Allez dans votre profil, section "Dons récurrents". Trouvez le don que vous souhaitez annuler et cliquez sur "Gérer". Vous pourrez alors suspendre ou annuler définitivement le don récurrent.',
      category: 'donations',
      isPopular: true,
      views: 678,
    },
    {
      id: '6',
      title: 'Méthodes de paiement acceptées',
      content: 'Nous acceptons les cartes bancaires (Visa, Mastercard), les virements bancaires, les portefeuilles mobiles (Orange Money, MTN Money) et les cryptomonnaies dans certaines régions.',
      category: 'payment',
      isPopular: false,
      views: 345,
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