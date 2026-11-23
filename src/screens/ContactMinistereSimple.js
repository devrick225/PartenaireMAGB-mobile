import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
  Alert,
  Platform,
  Image,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../store/hooks';
import { showSuccess, showError } from '../store/slices/notificationSlice';
import apiService from '../services/apiService';
import openLink from '../utils/openLink';
import { useDS, AppText, Screen, HeroHeader, Card, Section, Row, InfoRow, Button, TextField, Sheet } from '../design/components';
import { spacing } from '../design/tokens';
const { width, height } = Dimensions.get('window');

// Coordonnées du Ministère de l'Agriculture et de l'Équipement Rural du Sénégal
const MINISTERE_LOCATION = {
  latitude: 14.6928,
  longitude: -17.4467,
  address: 'Abidjan, Cocodyrr',
};

// Informations de contact du ministère
const CONTACT_INFO = {
  name: 'Ministère d\'Adoration Geneviève Brou',
  address: 'Abidjan, Cocody',
  phone1: '0768306162',
  phone1Display: '07 68 30 61 62',
  phone2: '0555055454',
  phone2Display: '05 55 05 54 54',
  email: 'partenaireadorationgene.brou@gmail.com',
  website: 'https://www.genevievebrou.com/',
  horaires: {
    semaine: 'Lundi - Vendredi: 8h00 - 17h00',
    weekend: 'Samedi: 8h00 - 12h00',
    ferme: 'Dimanche: Fermé'
  }
};

const ContactMinistereSimple = ({ navigation }) => {
  const { c } = useDS();
  const dispatch = useAppDispatch();
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [showEmailForm, setShowEmailForm] = useState(false);
  const formScrollRef = useRef(null);
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePhoneCall = (phoneNumber, phoneDisplay) => {
    Alert.alert(
      'Appeler le Ministère',
      `Voulez-vous appeler le ${phoneDisplay} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => { openLink(`tel:${phoneNumber}`); }
        }
      ]
    );
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Contact depuis l\'application PartenaireMAGB');
    const body = encodeURIComponent('Bonjour,\n\nJe vous contacte depuis l\'application mobile PartenaireMAGB.\n\n');
    openLink(`mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`);
  };

  const handleWebsite = () => {
    openLink(CONTACT_INFO.website);
  };

  const handleOpenMap = () => {
    const { latitude, longitude } = MINISTERE_LOCATION;
    
    Alert.alert(
      'Ouvrir la carte',
      'Choisissez votre application de navigation préférée',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Google Maps',
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            openLink(googleMapsUrl);
          }
        },
        {
          text: 'Apple Plans',
          onPress: () => {
            const appleMapsUrl = `http://maps.apple.com/?q=${latitude},${longitude}`;
            openLink(appleMapsUrl);
          }
        }
      ]
    );
  };

  const handleDirections = () => {
    const { latitude, longitude } = MINISTERE_LOCATION;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(Ministère d'Adoration Geneviève Brou)`
    });
    
    Linking.openURL(url).catch(() => {
        // Fallback vers Google Maps web
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        openLink(googleMapsUrl);
    });
  };

  const handleSendCustomEmail = async () => {
    if (!emailForm.name || !emailForm.email || !emailForm.subject || !emailForm.message) {
      dispatch(showError({
        title: 'Champs requis',
        message: 'Veuillez remplir tous les champs'
      }));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(emailForm.email)) {
      dispatch(showError({
        title: 'Email invalide',
        message: 'Veuillez saisir une adresse email valide'
      }));
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel à l'API pour envoyer le message de contact
      const contactData = {
        name: emailForm.name.trim(),
        email: emailForm.email.toLowerCase().trim(),
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
        type: 'ministere_contact',
        recipient: 'ministere_agriculture'
      };

      console.log('📤 Envoi du message de contact:', contactData);

      // Utiliser l'endpoint de contact du ministère
      const response = await fetch(`${apiService.getConfig().baseURL}/contact/ministere`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        dispatch(showSuccess({
          title: 'Message envoyé ! 📧',
          message: 'Votre message a été transmis au Ministère de l\'Agriculture. Vous recevrez une réponse sous 48h.'
        }));
        
        setShowEmailForm(false);
        setEmailForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      
      let errorMessage = 'Impossible d\'envoyer le message. Veuillez réessayer.';
      
      if (error.message && error.message !== 'Erreur lors de l\'envoi') {
        errorMessage = error.message;
      }
      
      dispatch(showError({
        title: 'Erreur d\'envoi',
        message: errorMessage
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      hero={
        <HeroHeader
          eyebrow="Le ministère"
          eyebrowIcon="call-outline"
          title="Nous contacter"
          subtitle={CONTACT_INFO.name}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <Card style={{ gap: spacing.md }}>
        <View style={styles.addressRow}>
          <View style={[styles.tile, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="location-outline" size={22} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{CONTACT_INFO.name}</AppText>
            <AppText variant="small" color={c.mutedForeground}>{CONTACT_INFO.address}</AppText>
          </View>
        </View>
        <View style={styles.row}>
          <Button title="Itinéraire" icon="navigate-outline" onPress={handleDirections} fullWidth={false} style={styles.flex} />
          <Button title="Voir la carte" variant="outline" icon="map-outline" onPress={handleOpenMap} fullWidth={false} style={styles.flex} />
        </View>
      </Card>

      <Section title="Coordonnées">
        <Row icon="call-outline" label="Téléphone 1" sublabel={CONTACT_INFO.phone1Display} onPress={() => handlePhoneCall(CONTACT_INFO.phone1, CONTACT_INFO.phone1Display)} chevron />
        <Row icon="call-outline" label="Téléphone 2" sublabel={CONTACT_INFO.phone2Display} onPress={() => handlePhoneCall(CONTACT_INFO.phone2, CONTACT_INFO.phone2Display)} chevron />
        <Row icon="mail-outline" label="Email officiel" sublabel={CONTACT_INFO.email} onPress={handleEmail} chevron />
        <Row icon="globe-outline" label="Site web" sublabel={CONTACT_INFO.website.replace(/^https?:\/\//, '')} onPress={handleWebsite} chevron last />
      </Section>

      <Card>
        <AppText variant="overline" color={c.mutedForeground} style={{ marginBottom: spacing.xs }}>Horaires d'ouverture</AppText>
        <InfoRow label="Semaine" value={CONTACT_INFO.horaires.semaine.replace(/^Lundi - Vendredi:\s*/, 'Lun – ven : ')} />
        <InfoRow label="Samedi" value={CONTACT_INFO.horaires.weekend.replace(/^Samedi:\s*/, '')} />
        <InfoRow label="Dimanche" value="Fermé" valueColor={c.destructive} last />
      </Card>

      <Button title="Nous écrire" variant="gold" icon="create-outline" onPress={() => setShowEmailForm(true)} />

      <Sheet visible={showEmailForm} title="Nous écrire" onClose={() => setShowEmailForm(false)}>
        <View style={[styles.recipient, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="send-outline" size={16} color={c.primary} />
          <AppText variant="small" color={c.primary} style={styles.flex} numberOfLines={1}>À : {CONTACT_INFO.email}</AppText>
        </View>
        <TextField label="Nom complet" icon="person-outline" placeholder="Votre nom et prénom" value={emailForm.name} onChangeText={(v) => setEmailForm(prev => ({ ...prev, name: v }))} editable={!isLoading} autoCapitalize="words" />
        <TextField label="Adresse email" icon="mail-outline" placeholder="vous@exemple.com" value={emailForm.email} onChangeText={(v) => setEmailForm(prev => ({ ...prev, email: v }))} keyboardType="email-address" autoCapitalize="none" editable={!isLoading} />
        <TextField label="Objet" icon="pricetag-outline" placeholder="Sujet de votre message" value={emailForm.subject} onChangeText={(v) => setEmailForm(prev => ({ ...prev, subject: v }))} editable={!isLoading} />
        <TextField
          label="Message"
          placeholder="Rédigez votre message…"
          value={emailForm.message}
          onChangeText={(v) => setEmailForm(prev => ({ ...prev, message: v }))}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          editable={!isLoading}
          style={{ minHeight: 120 }}
          hint={`${emailForm.message.length}/1000`}
        />
        <Button title="Envoyer le message" icon="send" onPress={handleSendCustomEmail} loading={isLoading} />
        <AppText variant="caption" color={c.mutedForeground} center>Nous vous répondrons dans les plus brefs délais.</AppText>
      </Sheet>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: 12, padding: spacing.md },
});

export default ContactMinistereSimple;
