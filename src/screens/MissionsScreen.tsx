import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../constants';
import RefreshableHeader from '../components/RefreshableHeader';
import openLink from '../utils/openLink';

import { useDS, AppText, Screen, HeroHeader, Card, Button } from '../design/components';
import { radius, spacing } from '../design/tokens';
interface MissionsScreenProps {
  navigation: any;
}

const MissionsScreen: React.FC<MissionsScreenProps> = ({ navigation }) => {
  const { c } = useDS();

  const handleContact = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      openLink('tel:+2250768306162');
    } else if (type === 'email') {
      openLink('mailto:partenaireadorationgene.brou@gmail.com');
    }
  };

  const Block = ({ icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.head}>
        <View style={[styles.tile, { backgroundColor: c.primarySoft }]}>
          <Ionicons name={icon} size={20} color={c.primary} />
        </View>
        <AppText variant="subtitle" accessibilityRole="header" style={styles.flex}>{title}</AppText>
      </View>
      {children}
    </Card>
  );

  const Highlight = ({ children }: { children: string }) => (
    <View style={[styles.highlight, { backgroundColor: c.goldSoft, borderLeftColor: c.gold }]}>
      <AppText variant="bodyStrong">{children}</AppText>
    </View>
  );

  const ACTIVITIES = [
    { icon: 'happy-outline', text: 'L\'évangélisation de nos jeunes et enfants en leur permettant de participer gratuitement à nos activités' },
    { icon: 'school-outline', text: 'La formation des jeunes, des femmes et des hommes pour en faire des leaders chrétiens' },
    { icon: 'musical-notes-outline', text: 'L\'organisation des grands rassemblements annuels d\'adoration (RIA, Concert des femmes, etc.)' },
  ];

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Partenaire MAGB"
          eyebrowIcon="globe-outline"
          title="Nos missions"
          subtitle="Soutenir l'œuvre de Dieu ensemble."
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Block icon="flag-outline" title="Notre objectif">
        <AppText variant="body" color={c.mutedForeground}>
          La plateforme MAGB vise à rassembler des millions de personnes à travers le monde entier autour d'un seul et même objectif :
        </AppText>
        <Highlight>Soutenir financièrement les activités du Ministère d'Adoration Geneviève Brou afin de gagner plus d'âmes pour le Christ</Highlight>
      </Block>

      <Block icon="list-outline" title="Nos activités">
        {ACTIVITIES.map(a => (
          <View key={a.text} style={styles.activity}>
            <Ionicons name={a.icon as any} size={20} color={c.primary} style={{ marginTop: 1 }} />
            <AppText variant="body" style={styles.flex}>{a.text}</AppText>
          </View>
        ))}
      </Block>

      <Block icon="person-outline" title="Le ministère">
        <AppText variant="body" color={c.mutedForeground}>Le ministère d'Adoration Geneviève Brou de la chantre Geneviève Brou dans sa soif de voir plus de personnes sauvées par JESUS CHRIST de Nazareth à travers le monde. Les actions menées sur le terrain sont nombreuses et plurielles qui nécessitent beaucoup de moyens financiers. Les Partenaires MAGB vient répondre à ce besoin.</AppText>
      </Block>

      <Block icon="hand-left-outline" title="Qu'est-ce qu'un partenaire ?">
        <AppText variant="body" color={c.mutedForeground}>C'est un donateur dans le champ de DIEU. Il est un coparticipant avec le ministère dans l'œuvre de la quête aux âmes sauvées et aux vies transformées.</AppText>
        <Highlight>En un mot, c'est un bâtisseur du royaume de DIEU.</Highlight>
      </Block>

      <Button title="Devenir partenaire : faire un don" variant="gold" icon="heart" onPress={() => navigation.navigate('CreateDonation', { initialType: 'one_time' })} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  highlight: { borderLeftWidth: 3, borderRadius: radius.md, padding: spacing.md },
  activity: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
});

export default MissionsScreen;
