import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import { selectCurrentMinistry } from '../store/slices/ministrySlice';
import { Ministry } from '../types/navigation';
import openLink from '../utils/openLink';

import { useDS, AppText, Screen, HeroHeader, IconButton, Card, InfoRow, Badge, Button } from '../design/components';
import { radius, spacing } from '../design/tokens';

const MinistryDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const { c } = useDS();
  const route = useRoute<any>();
  const { ministry: routeMinistry } = route.params;
  
  // Récupérer le ministère depuis Redux (si disponible) ou utiliser celui de la route
  const currentMinistry = useAppSelector(selectCurrentMinistry);
  const ministry = currentMinistry || routeMinistry;

  const getCategoryLabel = (category: string) => {
    const categories: { [key: string]: string } = {
      general: 'Général',
      youth: 'Jeunesse',
      children: 'Enfants',
      women: 'Femmes',
      men: 'Hommes',
      music: 'Musique',
      prayer: 'Prières',
      evangelism: 'Évangélisation',
      social: 'Social',
      other: 'Autres'
    };
    return categories[category] || category;
  };

  const getDayLabel = (day: string) => {
    const days: { [key: string]: string } = {
      lundi: 'Lundi',
      mardi: 'Mardi',
      mercredi: 'Mercredi',
      jeudi: 'Jeudi',
      vendredi: 'Vendredi',
      samedi: 'Samedi',
      dimanche: 'Dimanche'
    };
    return days[day] || day;
  };

  const handleExternalLink = async () => {
    if (!ministry.externalLink) return;

    await openLink(ministry.externalLink);
  };

  const handleContactPress = () => {
    if (!ministry.contactInfo) return;

    const { name, phone, email } = ministry.contactInfo;
    const contactOptions = [];

    if (phone) {
      contactOptions.push({
        text: `Appeler ${name || 'le contact'}`,
        onPress: () => { openLink(`tel:${phone}`); }
      });
    }

    if (email) {
      contactOptions.push({
        text: `Envoyer un email`,
        onPress: () => { openLink(`mailto:${email}`); }
      });
    }

    if (contactOptions.length > 0) {
      Alert.alert(
        `Contact - ${ministry.title}`,
        'Choisissez une option de contact',
        contactOptions
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${ministry.title}\n\n${ministry.description}${ministry.externalLink ? `\n\n${ministry.externalLink}` : ''}` });
    } catch {
      Alert.alert('Partage impossible', 'Réessayez dans un instant.');
    }
  };

  const meeting = ministry.meetingInfo;
  const hasMeeting = !!meeting && !!(meeting.day || meeting.time || meeting.location);
  const contact = ministry.contactInfo;
  const hasContact = !!contact && !!(contact.name || contact.phone || contact.email);
  const canContact = !!contact && !!(contact.phone || contact.email);

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow={getCategoryLabel(ministry.category)}
          eyebrowIcon="people-outline"
          title={ministry.title}
          onBack={() => navigation.goBack()}
          right={<IconButton icon="share-outline" tone="hero" accessibilityLabel="Partager" onPress={handleShare} />}
        />
      }
      footer={
        canContact || ministry.externalLink ? (
          <View style={styles.footer}>
            {canContact ? <Button title="Contacter" icon="call-outline" onPress={handleContactPress} fullWidth={false} style={styles.flex} /> : null}
            {ministry.externalLink ? <Button title="En savoir plus" variant="outline" icon="open-outline" onPress={handleExternalLink} fullWidth={false} style={styles.flex} /> : null}
          </View>
        ) : undefined
      }
    >
      {ministry.imageUrl ? (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          <Image source={{ uri: ministry.imageUrl }} style={styles.image} resizeMode="cover" accessibilityLabel={`Image du ministère ${ministry.title}`} />
        </Card>
      ) : null}

      <Card style={{ gap: spacing.sm }}>
        <Badge label={getCategoryLabel(ministry.category)} tone="primary" />
        <AppText variant="body" selectable>{ministry.description}</AppText>
      </Card>

      {hasMeeting ? (
        <Card>
          <AppText variant="overline" color={c.mutedForeground} style={styles.title}>Rencontres</AppText>
          {meeting.day ? <InfoRow label="Jour" value={getDayLabel(meeting.day)} /> : null}
          {meeting.time ? <InfoRow label="Heure" value={meeting.time} /> : null}
          {meeting.location ? <InfoRow label="Lieu" value={meeting.location} last /> : null}
        </Card>
      ) : null}

      {hasContact ? (
        <Card>
          <AppText variant="overline" color={c.mutedForeground} style={styles.title}>Contact</AppText>
          {contact.name ? <InfoRow label="Responsable" value={contact.name} /> : null}
          {contact.phone ? <InfoRow label="Téléphone" value={contact.phone} /> : null}
          {contact.email ? <InfoRow label="Email" value={contact.email} last /> : null}
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  image: { width: '100%', height: 200, borderRadius: radius.xl },
  title: { marginBottom: spacing.xs },
});

export default MinistryDetailScreen;
