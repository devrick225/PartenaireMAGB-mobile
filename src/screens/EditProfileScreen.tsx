import logger from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showApiError } from '../store/services/apiClient';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import userService from '../store/services/userService';
import { updateUser } from '../store/slices/authSlice';
import { RootState } from '../store';

import {
  useDS,
  AppText,
  Screen,
  HeroHeader,
  Card,
  TextField,
  Button,
  LoadingState,
  Sheet,
  IconName,
} from '../design/components';
import { radius, spacing, MIN_TOUCH } from '../design/tokens';
interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { c, dark } = useDS();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [profile, setProfile] = useState({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    country: user?.country || 'CI',
      city: user?.city || '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: 'single',
    occupation: '',
    address: {
      street: '',
      neighborhood: '',
      postalCode: '',
      state: '',
      country: 'CI'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    churchMembership: {
      isChurchMember: false
    },
    donationPreferences: {
      preferredAmount: '',
      preferredFrequency: 'monthly',
      preferredDay: '',
      preferredPaymentMethod: '',
      donationCategories: [] as string[]
    },
    familyInfo: {
      numberOfChildren: 0,
      children: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Country selection
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  
  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadProfile();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const response = await fetch('https://restcountries.com/v3.1/region/africa');
      const data = await response.json();
      
      const africaCountries = data.map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
        callingCode: country.idd?.root + (country.idd?.suffixes?.[0] || ''),
        flag: `https://flagsapi.com/${country.cca2}/flat/64.png`,
      })).sort((a: Country, b: Country) => a.name.localeCompare(b.name));

      setCountries(africaCountries);
      
      const defaultCountry = africaCountries.find((c: Country) => c.code === profile.country);
      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
      }
    } catch (error) {
      const fallbackCountries = [
        { code: 'CI', name: 'Côte d\'Ivoire', callingCode: '+225', flag: 'https://flagsapi.com/CI/flat/64.png' },
        { code: 'BF', name: 'Burkina Faso', callingCode: '+226', flag: 'https://flagsapi.com/BF/flat/64.png' },
        { code: 'ML', name: 'Mali', callingCode: '+223', flag: 'https://flagsapi.com/ML/flat/64.png' },
        { code: 'SN', name: 'Sénégal', callingCode: '+221', flag: 'https://flagsapi.com/SN/flat/64.png' },
      ];
      setCountries(fallbackCountries);
      const defaultCountry = fallbackCountries.find((c: Country) => c.code === profile.country);
      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
      }
    }
  };

  // Fonction pour formater la date en DD-MM-YYYY pour l'affichage
  const formatDateDisplay = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  // Fonction pour formater la date en YYYY-MM-DD pour le backend
  const formatDateBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fonction pour parser la date depuis une string DD-MM-YYYY
  const parseDateDisplay = (dateString: string): Date => {
    if (!dateString || dateString === 'NaN-NaN-NaN') return new Date();
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date();
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date();
    if (year < 1900 || year > new Date().getFullYear()) return new Date();
    if (month < 1 || month > 12) return new Date();
    if (day < 1 || day > 31) return new Date();
    
    return new Date(year, month - 1, day);
  };

  // Fonction pour parser la date depuis une string YYYY-MM-DD (backend)
  const parseDateBackend = (dateString: string): Date => {
    if (!dateString || dateString === 'NaN-NaN-NaN') return new Date();
    const parts = dateString.split('-');
    if (parts.length !== 3) return new Date();
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
    if (year < 1900 || year > new Date().getFullYear()) return new Date();
    if (month < 1 || month > 12) return new Date();
    if (day < 1 || day > 31) return new Date();
    
    return new Date(year, month - 1, day);
  };

  // Gestionnaire pour le changement de date
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Android : la boîte de dialogue se ferme d'elle-même ; iOS : on garde la roue ouverte
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDateDisplay(selectedDate);
      setProfile({...profile, dateOfBirth: formattedDate});
    }
  };

  // Fonction pour ouvrir le DatePicker
  const openDatePicker = () => {
    if (profile.dateOfBirth && profile.dateOfBirth !== 'NaN-NaN-NaN') {
      // Essayer de parser en DD-MM-YYYY d'abord, puis en YYYY-MM-DD
      try {
        const parsedDate = parseDateDisplay(profile.dateOfBirth);
        if (parsedDate.getFullYear() > 1900) {
          setSelectedDate(parsedDate);
        } else {
          setSelectedDate(new Date());
        }
      } catch {
        try {
          const parsedDate = parseDateBackend(profile.dateOfBirth);
          if (parsedDate.getFullYear() > 1900) {
            setSelectedDate(parsedDate);
          } else {
            setSelectedDate(new Date());
          }
        } catch {
          setSelectedDate(new Date());
        }
      }
    } else {
      setSelectedDate(new Date());
    }
    setShowDatePicker(true);
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getProfile();
      
      if (response.data?.data?.profile) {
        const profileData = response.data.data.profile;
        
        // Extraire le numéro de téléphone sans l'indicatif
        let phoneNumber = profileData.user?.phone || user?.phone || '';
        if (phoneNumber.startsWith('+225')) {
          phoneNumber = phoneNumber.substring(4);
        } else if (phoneNumber.startsWith('225')) {
          phoneNumber = phoneNumber.substring(3);
        }
        
        // Convertir la date de naissance du backend (YYYY-MM-DD) vers l'affichage (DD-MM-YYYY)
        let displayDateOfBirth = '';
        if (profileData.dateOfBirth && profileData.dateOfBirth !== 'NaN-NaN-NaN') {
          try {
            const backendDate = parseDateBackend(profileData.dateOfBirth);
            // Vérifier si la date est valide
            if (backendDate.getFullYear() > 1900 && backendDate.getFullYear() <= new Date().getFullYear()) {
              displayDateOfBirth = formatDateDisplay(backendDate);
            }
          } catch (error) {
            logger.log('Erreur parsing date backend:', error);
            displayDateOfBirth = '';
          }
        }

        setProfile({
          firstName: profileData.user?.firstName || user?.firstName || '',
          lastName: profileData.user?.lastName || user?.lastName || '',
          email: profileData.user?.email || user?.email || '',
          phone: phoneNumber,
          country: profileData.user?.country || user?.country || 'CI',
          city: profileData.user?.city || user?.city || '',
          dateOfBirth: displayDateOfBirth,
          gender: profileData.gender || '',
          maritalStatus: profileData.maritalStatus || 'single',
          occupation: profileData.occupation || '',
          address: {
            street: (profileData.address as any)?.street || '',
            neighborhood: (profileData.address as any)?.neighborhood || '',
            postalCode: (profileData.address as any)?.postalCode || '',
            state: (profileData.address as any)?.state || '',
            country: (profileData.address as any)?.country || 'CI'
          },
          emergencyContact: {
            name: (profileData.emergencyContact as any)?.name || '',
            relationship: (profileData.emergencyContact as any)?.relationship || '',
            phone: (profileData.emergencyContact as any)?.phone || '',
            email: (profileData.emergencyContact as any)?.email || ''
          },
          churchMembership: {
            isChurchMember: (profileData.churchMembership as any)?.isChurchMember || false
          },
          donationPreferences: {
            preferredAmount: String((profileData.donationPreferences as any)?.preferredAmount || ''),
            preferredFrequency: (profileData.donationPreferences as any)?.preferredFrequency || 'monthly',
            preferredDay: String((profileData.donationPreferences as any)?.preferredDay || ''),
            preferredPaymentMethod: (profileData.donationPreferences as any)?.preferredPaymentMethod || '',
            donationCategories: (profileData.donationPreferences as any)?.donationCategories || []
          },
          familyInfo: {
            numberOfChildren: (profileData.familyInfo as any)?.numberOfChildren || 0,
            children: (profileData.familyInfo as any)?.children || []
          }
        });
      }
    } catch (error: any) {
      logger.error('Erreur chargement profil:', error);
      showApiError(error, 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      
      // Convertir la date de naissance de l'affichage (DD-MM-YYYY) vers le backend (YYYY-MM-DD)
      let backendDateOfBirth = '';
      if (profile.dateOfBirth && profile.dateOfBirth !== 'NaN-NaN-NaN') {
        try {
          const displayDate = parseDateDisplay(profile.dateOfBirth);
          if (displayDate.getFullYear() > 1900) {
            backendDateOfBirth = formatDateBackend(displayDate);
          }
        } catch (error) {
          logger.log('Erreur parsing date display:', error);
          // Si le parsing échoue, essayer le format backend
          try {
            const backendDate = parseDateBackend(profile.dateOfBirth);
            if (backendDate.getFullYear() > 1900) {
              backendDateOfBirth = formatDateBackend(backendDate);
            }
          } catch (backendError) {
            logger.log('Erreur parsing date backend:', backendError);
            backendDateOfBirth = '';
          }
        }
      }
      
      // Téléphone : ne pas rajouter l'indicatif s'il est déjà présent (ex: numéro d'un autre pays que la CI)
      const rawPhone = (profile.phone || '').replace(/\s/g, '');
      const fullPhone = rawPhone.startsWith('+') || !selectedCountry
        ? rawPhone
        : `${selectedCountry.callingCode}${rawPhone}`;

      // Construire le payload selon le format demandé
      const payload = {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: fullPhone,
        city: (profile.city || '').trim(),
        country: selectedCountry?.code || profile.country,
        dateOfBirth: backendDateOfBirth,
        gender: profile.gender,
        maritalStatus: profile.maritalStatus,
        occupation: profile.occupation,
        "donationPreferences.preferredAmount": parseInt(profile.donationPreferences.preferredAmount) || 0,
        "donationPreferences.preferredFrequency": profile.donationPreferences.preferredFrequency,
        "donationPreferences.preferredDay": parseInt(profile.donationPreferences.preferredDay) || 1,
        "donationPreferences.preferredPaymentMethod": profile.donationPreferences.preferredPaymentMethod,
        "donationPreferences.donationCategories": profile.donationPreferences.donationCategories,
        "emergencyContact.name": profile.emergencyContact.name,
        "emergencyContact.relationship": profile.emergencyContact.relationship,
        "emergencyContact.phone": profile.emergencyContact.phone,
        "emergencyContact.email": profile.emergencyContact.email,
        "churchMembership.isChurchMember": profile.churchMembership.isChurchMember,
        "address.street": profile.address.street,
        "address.neighborhood": profile.address.neighborhood,
        "address.postalCode": profile.address.postalCode,
        "address.state": profile.address.state,
        "address.country": profile.address.country,
        "familyInfo.numberOfChildren": profile.familyInfo.numberOfChildren,
        "familyInfo.children": profile.familyInfo.children
      };
      
      const response = await userService.updateProfile(payload);
      
      if (response.data?.success) {
        // Utiliser ce que le serveur a réellement enregistré (dont le statut de vérification du téléphone)
        const saved = response.data.data?.user || {};
        const phoneChanged = !!saved.phone && saved.phone !== user?.phone;
        dispatch(updateUser({
          firstName: saved.firstName ?? profile.firstName,
          lastName: saved.lastName ?? profile.lastName,
          phone: saved.phone ?? fullPhone,
          country: saved.country ?? profile.country,
          city: saved.city ?? profile.city,
          ...(typeof saved.isPhoneVerified === 'boolean' ? { isPhoneVerified: saved.isPhoneVerified } : {}),
        }));

        navigation.goBack();
        if (phoneChanged && saved.isPhoneVerified === false) {
          Alert.alert(
            'Profil mis à jour',
            'Votre nouveau numéro doit être vérifié avant votre prochain don.',
            [
              { text: 'Plus tard', style: 'cancel' },
              { text: 'Vérifier', onPress: () => navigation.navigate('PhoneVerification') },
            ]
          );
        } else {
          Alert.alert('Profil mis à jour', 'Vos modifications ont été enregistrées.');
        }
      }
    } catch (error: any) {
      logger.error('Erreur mise à jour profil:', error?.message);
      const details = error.response?.data?.details;
      Alert.alert(
        'Erreur',
        (Array.isArray(details) && details[0]?.msg) || error.response?.data?.error || 'Impossible de mettre à jour le profil'
      );
    } finally {
      setIsSaving(false);
    }
  };


  // Champ texte de la charte
  const Field = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    placeholder: string = '',
    keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default',
    icon?: IconName,
    options: { editable?: boolean; hint?: string; autoCapitalize?: 'none' | 'words' | 'sentences' } = {}
  ) => (
    <TextField
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
      icon={icon}
      autoCapitalize={options.autoCapitalize ?? 'none'}
      editable={options.editable !== false}
      hint={options.hint}
      style={options.editable === false ? { color: c.mutedForeground } : undefined}
    />
  );

  // Choix unique en puces
  const Choices = (label: string, value: string, opts: { label: string; value: string }[], onSelect: (v: string) => void) => (
    <View style={{ gap: 6 }}>
      <AppText variant="smallStrong">{label}</AppText>
      <View style={styles.chips}>
        {opts.map(o => {
          const active = value === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSelect(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.chip, { backgroundColor: active ? c.primary : c.card, borderColor: active ? c.primary : c.border }]}
            >
              <AppText variant="smallStrong" color={active ? c.primaryForeground : c.foreground}>{o.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  // Champ « sélecteur » qui ouvre une fenêtre
  const Picker = (label: string, value: string | undefined, placeholder: string, icon: IconName, onPress: () => void, left?: React.ReactNode) => (
    <View style={{ gap: 6 }}>
      <AppText variant="smallStrong">{label}</AppText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${value || placeholder}`}
        style={({ pressed }) => [styles.select, { backgroundColor: c.card, borderColor: c.input, opacity: pressed ? 0.85 : 1 }]}
      >
        {left ?? <Ionicons name={icon} size={18} color={c.mutedForeground} />}
        <AppText variant="body" color={value ? c.foreground : c.mutedForeground} style={styles.flex} numberOfLines={1}>{value || placeholder}</AppText>
        <Ionicons name="chevron-down" size={18} color={c.mutedForeground} />
      </Pressable>
    </View>
  );

  const SectionCard = ({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) => (
    <Card style={{ gap: spacing.lg }}>
      <View style={styles.sectionHead}>
        <View style={[styles.iconTile, { backgroundColor: c.primarySoft }]}>
          <Ionicons name={icon} size={18} color={c.primary} />
        </View>
        <AppText variant="subtitle">{title}</AppText>
      </View>
      {children}
    </Card>
  );

  const hero = (
    <HeroHeader
      eyebrow="Mon compte"
      eyebrowIcon="person-outline"
      title="Modifier le profil"
      subtitle="Ces informations nous aident à mieux vous accompagner."
      onBack={() => navigation.goBack()}
    />
  );

  if (isLoading) {
    return (
      <Screen hero={hero}>
        <Card><LoadingState message="Chargement du profil…" /></Card>
      </Screen>
    );
  }

  const flag = selectedCountry ? <Image source={{ uri: selectedCountry.flag }} style={styles.flag} /> : undefined;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen hero={hero} footer={<Button title="Enregistrer" icon="checkmark" onPress={handleSave} loading={isSaving} />}>
        {/* Identité */}
        <Card style={styles.identity}>
          {(user as any)?.avatar ? (
            <Image source={{ uri: (user as any).avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.primarySoft }]}>
              <AppText variant="title" color={c.primary}>{user?.firstName?.[0]}{user?.lastName?.[0]}</AppText>
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="subtitle">{user?.firstName} {user?.lastName}</AppText>
            <Pressable onPress={() => navigation.navigate('ProfileImage')} accessibilityRole="button" style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
              <AppText variant="smallStrong" color={c.primary}>Changer la photo</AppText>
            </Pressable>
          </View>
        </Card>

        <SectionCard title="Informations personnelles" icon="person-outline">
          {Field('Prénom', profile.firstName, (text) => setProfile({ ...profile, firstName: text }), 'Votre prénom', 'default', 'person-outline', { autoCapitalize: 'words' })}
          {Field('Nom', profile.lastName, (text) => setProfile({ ...profile, lastName: text }), 'Votre nom', 'default', 'person-outline', { autoCapitalize: 'words' })}
          {Field('Email', profile.email, (text) => setProfile({ ...profile, email: text }), 'votre@email.com', 'email-address', 'mail-outline', {
            editable: false,
            hint: 'L\'email ne peut pas être modifié depuis l\'application. Contactez le support si besoin.',
          })}
          <View style={{ gap: 6 }}>
            <AppText variant="smallStrong">Téléphone</AppText>
            <View style={styles.phoneRow}>
              <View style={[styles.prefix, { backgroundColor: c.muted, borderColor: c.input }]}>
                {flag}
                <AppText variant="bodyStrong">{selectedCountry?.callingCode ?? '+'}</AppText>
              </View>
              <View style={styles.flex}>
                <TextField value={profile.phone} onChangeText={(text) => setProfile({ ...profile, phone: text })} placeholder="07 00 00 00 00" keyboardType="phone-pad" accessibilityLabel="Numéro de téléphone" />
              </View>
            </View>
          </View>
          {Picker('Pays', selectedCountry?.name, 'Choisir un pays', 'earth-outline', () => setShowCountryModal(true), flag)}
          {Field('Ville', profile.city, (text) => setProfile({ ...profile, city: text }), 'Votre ville', 'default', 'business-outline', { autoCapitalize: 'words' })}
          {Choices('Genre', profile.gender, [
            { label: 'Homme', value: 'male' },
            { label: 'Femme', value: 'female' },
            { label: 'Autre', value: 'other' },
          ], (value) => setProfile({ ...profile, gender: value }))}
          {Choices('Situation familiale', profile.maritalStatus, [
            { label: 'Célibataire', value: 'single' },
            { label: 'Marié(e)', value: 'married' },
            { label: 'Divorcé(e)', value: 'divorced' },
            { label: 'Veuf / veuve', value: 'widowed' },
          ], (value) => setProfile({ ...profile, maritalStatus: value }))}
          {Picker('Date de naissance', profile.dateOfBirth, 'Choisir une date', 'calendar-outline', openDatePicker)}
          {Field('Nombre d\'enfants', String(profile.familyInfo.numberOfChildren), (text) => setProfile({ ...profile, familyInfo: { ...profile.familyInfo, numberOfChildren: parseInt(text) || 0 } }), '0', 'numeric', 'people-outline')}
        </SectionCard>

        <SectionCard title="Adresse" icon="location-outline">
          {Field('Adresse', profile.address.street, (text) => setProfile({ ...profile, address: { ...profile.address, street: text } }), 'Rue, immeuble…', 'default', 'navigate-outline', { autoCapitalize: 'sentences' })}
          {Field('Quartier', profile.address.neighborhood, (text) => setProfile({ ...profile, address: { ...profile.address, neighborhood: text } }), 'Votre quartier', 'default', 'home-outline', { autoCapitalize: 'words' })}
          {Field('Boîte postale', profile.address.postalCode, (text) => setProfile({ ...profile, address: { ...profile.address, postalCode: text } }), 'Ex. 01 BP 2206 Abidjan 01', 'default', 'mail-outline')}
          {Field('Région', profile.address.state, (text) => setProfile({ ...profile, address: { ...profile.address, state: text } }), 'Région ou département', 'default', 'map-outline', { autoCapitalize: 'words' })}
        </SectionCard>

        <SectionCard title="Activité et église" icon="briefcase-outline">
          {Field('Profession', profile.occupation, (text) => setProfile({ ...profile, occupation: text }), 'Votre profession', 'default', 'briefcase-outline', { autoCapitalize: 'sentences' })}
          {Choices('Membre d\'une église', profile.churchMembership.isChurchMember ? 'yes' : 'no', [
            { label: 'Oui', value: 'yes' },
            { label: 'Non', value: 'no' },
          ], (value) => setProfile({ ...profile, churchMembership: { ...profile.churchMembership, isChurchMember: value === 'yes' } }))}
        </SectionCard>

        <SectionCard title="Préférences de don" icon="heart-outline">
          {Field('Montant habituel (FCFA)', profile.donationPreferences.preferredAmount, (text) => setProfile({ ...profile, donationPreferences: { ...profile.donationPreferences, preferredAmount: text } }), 'Ex. 10 000', 'numeric', 'cash-outline')}
          {Choices('Fréquence', profile.donationPreferences.preferredFrequency, [
            { label: 'Hebdomadaire', value: 'weekly' },
            { label: 'Mensuelle', value: 'monthly' },
            { label: 'Trimestrielle', value: 'quarterly' },
            { label: 'Annuelle', value: 'yearly' },
          ], (value) => setProfile({ ...profile, donationPreferences: { ...profile.donationPreferences, preferredFrequency: value } }))}
          {Field('Jour du mois', profile.donationPreferences.preferredDay, (text) => setProfile({ ...profile, donationPreferences: { ...profile.donationPreferences, preferredDay: text } }), 'Entre 1 et 31', 'numeric', 'calendar-outline')}
          {Choices('Moyen de paiement', profile.donationPreferences.preferredPaymentMethod, [
            { label: 'Mobile Money', value: 'mobile_money' },
            { label: 'Carte bancaire', value: 'card' },
            { label: 'Virement', value: 'bank_transfer' },
            { label: 'Espèces', value: 'cash' },
          ], (value) => setProfile({ ...profile, donationPreferences: { ...profile.donationPreferences, preferredPaymentMethod: value } }))}
          {Choices('Type de don', profile.donationPreferences.donationCategories.length > 0 ? profile.donationPreferences.donationCategories[0] : '', [
            { label: 'Mensuel', value: 'don_mensuel' },
            { label: 'Trimestriel', value: 'don_trimestriel' },
            { label: 'Semestriel', value: 'don_semestriel' },
            { label: 'Ponctuel', value: 'don_ponctuel' },
          ], (value) => setProfile({ ...profile, donationPreferences: { ...profile.donationPreferences, donationCategories: [value] } }))}
        </SectionCard>
      </Screen>

      {/* Date de naissance */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker value={selectedDate} mode="date" onChange={handleDateChange} maximumDate={new Date()} minimumDate={new Date(1900, 0, 1)} />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={() => setShowDatePicker(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: c.card }]}>
              <View style={styles.sheetHeader}>
                <AppText variant="title">Date de naissance</AppText>
                <Pressable onPress={() => setShowDatePicker(false)} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="bodyStrong" color={c.primary}>OK</AppText>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                locale="fr-FR"
                themeVariant={dark ? 'dark' : 'light'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Pays */}
      <Sheet visible={showCountryModal} title="Pays" onClose={() => setShowCountryModal(false)}>
        <Card padded={false}>
          {countries.map((item, i) => {
            const active = selectedCountry?.code === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => {
                  setSelectedCountry(item);
                  setProfile({ ...profile, country: item.code });
                  setShowCountryModal(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={({ pressed }) => [
                  styles.countryRow,
                  i < countries.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
                  (pressed || active) && { backgroundColor: c.primarySoft },
                ]}
              >
                <Image source={{ uri: item.flag }} style={styles.flag} />
                <AppText variant="body" style={styles.flex} numberOfLines={1}>{item.name}</AppText>
                <AppText variant="small" color={c.mutedForeground}>{item.callingCode}</AppText>
              </Pressable>
            );
          })}
        </Card>
      </Sheet>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconTile: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: MIN_TOUCH - 6, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  select: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  phoneRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  prefix: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 50, borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.md },
  flag: { width: 24, height: 16, borderRadius: 2 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export default EditProfileScreen;
