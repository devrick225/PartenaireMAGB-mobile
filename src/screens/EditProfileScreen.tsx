import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import userService from '../store/services/userService';
import { updateUser } from '../store/slices/authSlice';
import { RootState } from '../store';

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
  const { colors, dark } = useTheme();
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
      donationCategories: []
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
    setShowDatePicker(false);
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
            console.log('Erreur parsing date backend:', error);
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
      console.error('Erreur chargement profil:', error);
      Alert.alert('Erreur', error.response?.data?.error || 'Impossible de charger le profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
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
          console.log('Erreur parsing date display:', error);
          // Si le parsing échoue, essayer le format backend
          try {
            const backendDate = parseDateBackend(profile.dateOfBirth);
            if (backendDate.getFullYear() > 1900) {
              backendDateOfBirth = formatDateBackend(backendDate);
            }
          } catch (backendError) {
            console.log('Erreur parsing date backend:', backendError);
            backendDateOfBirth = '';
          }
        }
      }
      
      // Construire le payload selon le format demandé
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: selectedCountry ? `${selectedCountry.callingCode}${profile.phone}` : profile.phone,
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
        dispatch(updateUser({
          ...user,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: selectedCountry ? `${selectedCountry.callingCode}${profile.phone}` : profile.phone,
          country: profile.country,
          city: profile.city,
        }));
        
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', error.response?.data?.error || 'Impossible de mettre à jour le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    placeholder: string = '',
    keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default',
    icon?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, { 
        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
        borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
      }]}>
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={dark ? COLORS.white : COLORS.grayscale400} 
            style={styles.inputIcon}
          />
        )}
      <TextInput
          style={[styles.textInput, { color: dark ? COLORS.white : COLORS.black }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
          placeholderTextColor={dark ? COLORS.grayTie : COLORS.grayscale400}
        keyboardType={keyboardType}
          autoCapitalize="none"
      />
      </View>
    </View>
  );

  const renderCountrySelector = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Pays</Text>
      <TouchableOpacity
        style={[styles.countrySelector, { 
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
        }]}
        onPress={() => setShowCountryModal(true)}
      >
        {selectedCountry && (
          <>
            <Image source={{ uri: selectedCountry.flag }} style={styles.selectedFlag} />
            <Text style={[styles.selectedCountryText, { color: dark ? COLORS.white : COLORS.black }]}>
              {selectedCountry.name}
            </Text>
          </>
        )}
        <Ionicons name="chevron-down" size={20} color={dark ? COLORS.grayTie : COLORS.grayscale400} />
      </TouchableOpacity>
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Téléphone</Text>
      <View style={styles.phoneContainer}>
        <View style={[styles.phonePrefix, { 
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
        }]}>
          {selectedCountry && (
            <>
              <Image source={{ uri: selectedCountry.flag }} style={styles.phoneFlagImage} />
              <Text style={[styles.phonePrefixText, { color: dark ? COLORS.white : COLORS.black }]}>
                {selectedCountry.callingCode}
              </Text>
            </>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={[styles.inputWrapper, { 
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
          }]}>
            <TextInput
              style={[styles.textInput, { color: dark ? COLORS.white : COLORS.black }]}
              value={profile.phone}
              onChangeText={(text) => setProfile({...profile, phone: text})}
              placeholder="12345678"
              placeholderTextColor={dark ? COLORS.grayTie : COLORS.grayscale400}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.countryItem, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
      onPress={() => {
        setSelectedCountry(item);
        setProfile({...profile, country: item.code});
        setShowCountryModal(false);
      }}
    >
      <Image source={{ uri: item.flag }} style={styles.flagImage} />
      <Text style={[styles.countryName, { color: dark ? COLORS.white : COLORS.black }]}>{item.name}</Text>
      <Text style={[styles.callingCode, { color: dark ? COLORS.grayTie : COLORS.gray }]}>{item.callingCode}</Text>
    </TouchableOpacity>
  );

  const renderSelectField = (
    label: string,
    value: string,
    options: { label: string; value: string }[],
    onSelect: (value: string) => void,
    icon?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[
        styles.selectContainer,
        { backgroundColor: dark ? COLORS.dark2 : COLORS.white, borderColor: dark ? COLORS.dark3 : COLORS.greyscale300 }
      ]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              { color: value === option.value ? colors.primary : colors.text }
            ]}>
              {option.label}
            </Text>
            {value === option.value && (
              <MaterialIcons name="check" size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Chargement du profil...
        </Text>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Modifier le profil</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Section Avatar */}
        <View style={[styles.avatarSection, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.avatarContainer}>
            {(user as any)?.avatar ? (
              <Image 
                source={{ uri: (user as any).avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.avatarEditButton}>
              <MaterialIcons name="camera-alt" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarText, { color: colors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>

        {/* Informations personnelles */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Informations personnelles
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
          {renderInputField(
              'Prénom',
              profile.firstName,
              (text) => setProfile({...profile, firstName: text}),
              'Votre prénom',
              'default',
              'person-outline'
          )}
          
          {renderInputField(
              'Nom',
              profile.lastName,
              (text) => setProfile({...profile, lastName: text}),
              'Votre nom',
              'default',
              'person-outline'
          )}
          
          {renderInputField(
            'Email',
              profile.email,
              (text) => setProfile({...profile, email: text}),
              'votre@email.com',
              'email-address',
              'mail-outline'
          )}
            
            {renderPhoneInput()}
            
            {renderCountrySelector()}
          
          {renderInputField(
              'Ville',
              profile.city,
              (text) => setProfile({...profile, city: text}),
              'Votre ville',
              'default',
              'location-outline'
            )}
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Informations personnelles
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
            {renderSelectField(
              'Genre',
              profile.gender,
              [
                { label: 'Homme', value: 'male' },
                { label: 'Femme', value: 'female' },
                { label: 'Autre', value: 'other' },
              ],
              (value) => setProfile({...profile, gender: value}),
              'person-outline'
            )}
            
            {renderSelectField(
              'Statut marital',
              profile.maritalStatus,
              [
                { label: 'Célibataire', value: 'single' },
                { label: 'Marié(e)', value: 'married' },
                { label: 'Divorcé(e)', value: 'divorced' },
                { label: 'Veuf/Veuve', value: 'widowed' },
              ],
              (value) => setProfile({...profile, maritalStatus: value}),
              'favorite-outline'
          )}
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Date de naissance</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, { 
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                borderColor: dark ? COLORS.dark3 : COLORS.greyscale300
              }]}
              onPress={openDatePicker}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={dark ? COLORS.white : COLORS.grayscale400} 
                style={styles.inputIcon}
              />
              <Text style={[
                styles.datePickerText, 
                { color: profile.dateOfBirth ? (dark ? COLORS.white : COLORS.black) : (dark ? COLORS.grayTie : COLORS.grayscale400) }
              ]}>
                {profile.dateOfBirth || 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {renderInputField(
              'Adresse',
              profile.address.street,
              (text) => setProfile({...profile, address: {...profile.address, street: text}}),
              'Votre adresse complète',
              'default',
              'location-outline'
            )}

            {renderInputField(
              'Quartier',
              profile.address.neighborhood,
              (text) => setProfile({...profile, address: {...profile.address, neighborhood: text}}),
              'Votre quartier',
              'default',
              'home-outline'
            )}

            {renderInputField(
              'Code postal',
              profile.address.postalCode,
              (text) => setProfile({...profile, address: {...profile.address, postalCode: text}}),
              'Code postal',
              'default',
              'mail-outline'
            )}

            {renderInputField(
              'État/Région',
              profile.address.state,
              (text) => setProfile({...profile, address: {...profile.address, state: text}}),
              'État ou région',
              'default',
              'map-outline'
            )}
          </View>
        </View>

        {/* Informations professionnelles */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="work" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Informations professionnelles
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
          {renderInputField(
              'Profession',
            profile.occupation,
              (text) => setProfile({...profile, occupation: text}),
              'Votre profession',
              'default',
              'briefcase-outline'
          )}
          </View>
        </View>

        {/* Informations de l'église */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="church" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Informations de l'église
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
          {renderSelectField(
              'Membre d\'église',
              profile.churchMembership.isChurchMember ? 'yes' : 'no',
            [
                { label: 'Oui', value: 'yes' },
                { label: 'Non', value: 'no' },
              ],
              (value) => setProfile({...profile, churchMembership: {...profile.churchMembership, isChurchMember: value === 'yes'}}),
              'home-outline'
            )}
          </View>
        </View>

        {/* Préférences de don */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="favorite" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Préférences de don
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
          {renderInputField(
              'Montant préféré',
              profile.donationPreferences.preferredAmount,
              (text) => setProfile({...profile, donationPreferences: {...profile.donationPreferences, preferredAmount: text}}),
              'Montant en XOF',
              'numeric',
              'heart-outline'
          )}
          
          {renderSelectField(
              'Fréquence de don',
              profile.donationPreferences.preferredFrequency,
              [
                { label: 'Hebdomadaire', value: 'weekly' },
                { label: 'Mensuel', value: 'monthly' },
                { label: 'Trimestriel', value: 'quarterly' },
                { label: 'Annuel', value: 'yearly' },
              ],
              (value) => setProfile({...profile, donationPreferences: {...profile.donationPreferences, preferredFrequency: value}}),
              'repeat-outline'
            )}

            {renderInputField(
              'Jour de don',
              profile.donationPreferences.preferredDay,
              (text) => setProfile({...profile, donationPreferences: {...profile.donationPreferences, preferredDay: text}}),
              'Jour du mois (1-31)',
              'numeric',
              'calendar-outline'
            )}

            {renderSelectField(
              'Méthode de paiement',
              profile.donationPreferences.preferredPaymentMethod,
            [
                { label: 'Carte bancaire', value: 'card' },
                { label: 'Mobile Money', value: 'mobile_money' },
                { label: 'Virement bancaire', value: 'bank_transfer' },
                { label: 'Espèces', value: 'cash' },
            ],
              (value) => setProfile({...profile, donationPreferences: {...profile.donationPreferences, preferredPaymentMethod: value}}),
              'credit-card-outline'
            )}

            {renderSelectField(
              'Catégories de don',
              profile.donationPreferences.donationCategories.length > 0 ? profile.donationPreferences.donationCategories[0] : '',
              [
                { label: 'Mensuelle', value: 'don_mensuel' },
                { label: 'Trimestrielle', value: 'don_trimestriel' },
                { label: 'Semestrielle', value: 'don_semestriel' },
                { label: 'Ponctuel', value: 'don_ponctuel' },
              ],
              (value) => setProfile({...profile, donationPreferences: {...profile.donationPreferences, donationCategories: [value]}}),
              'attach-money-outline'
            )}
          </View>
        </View>

        {/* Informations familiales */}
        <View style={[styles.section, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="family-restroom" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Informations familiales
            </Text>
          </View>
          
          <View style={styles.sectionContent}>
          {renderInputField(
              'Nombre d\'enfants',
              String(profile.familyInfo.numberOfChildren),
              (text) => setProfile({...profile, familyInfo: { ...profile.familyInfo, numberOfChildren: parseInt(text) || 0 }}),
              'Nombre d\'enfants',
              'numeric',
              'people-outline'
          )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}

      {/* Country Selector Modal */}
      <Modal
        visible={showCountryModal}
        onRequestClose={() => setShowCountryModal(false)}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCountryModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 0,
    flex: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    minHeight: 50,
    alignItems: 'center',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    margin: 4,
  },
  selectOptionText: {
    fontSize: 14,
    marginRight: 8,
  },
  bottomPadding: {
    height: 20,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 8,
  },
  selectedFlag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  selectedCountryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginRight: 8,
  },
  phoneFlagImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  flagImage: {
    width: 30,
    height: 20,
    marginRight: 12,
    borderRadius: 4,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  callingCode: {
    fontSize: 14,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalList: {
    paddingVertical: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
});

export default EditProfileScreen;