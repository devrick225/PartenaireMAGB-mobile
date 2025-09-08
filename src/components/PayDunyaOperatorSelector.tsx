import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import {
  PAYDUNYA_OPERATORS,
  PAYDUNYA_CARD_OPTION,
  PAYDUNYA_SUPPORTED_COUNTRIES,
  PaymentOperator,
  getOperatorsByCountry,
  getOperatorById,
} from '../constants/paymentMethods';

interface PayDunyaOperatorSelectorProps {
  onOperatorSelect: (operator: PaymentOperator) => void;
  selectedOperator?: PaymentOperator;
  disabled?: boolean;
  placeholder?: string;
  showCountryFilter?: boolean;
}

const PayDunyaOperatorSelector: React.FC<PayDunyaOperatorSelectorProps> = ({
  onOperatorSelect,
  selectedOperator,
  disabled = false,
  placeholder = 'Sélectionner un opérateur',
  showCountryFilter = true,
}) => {
  const { dark, colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 56,
    },
    selectorDisabled: {
      opacity: 0.5,
    },
    selectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    operatorInfo: {
      marginLeft: 12,
      flex: 1,
    },
    operatorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    operatorDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    placeholder: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    chevron: {
      marginLeft: 8,
    },
    
    // Modal styles
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    
    // Country filter styles
    countryFilter: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    countryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    countryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    countryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    countryChipText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 4,
    },
    countryChipTextSelected: {
      color: colors.surface,
    },
    
    // Operator list styles
    operatorsList: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    operatorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    operatorSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight || colors.primary + '10',
    },
    operatorFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    operatorDetails: {
      flex: 1,
    },
    operatorMainName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    operatorCountry: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    operatorIcon: {
      marginLeft: 12,
    },
    
    // Card option styles
    cardSection: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
  });

  const filteredOperators = selectedCountry
    ? getOperatorsByCountry(selectedCountry)
    : PAYDUNYA_OPERATORS;

  const handleOperatorPress = (operator: PaymentOperator) => {
    onOperatorSelect(operator);
    setIsModalVisible(false);
  };

  const handleCountryPress = (countryCode: string) => {
    setSelectedCountry(selectedCountry === countryCode ? null : countryCode);
  };

  const renderOperatorItem = ({ item }: { item: PaymentOperator }) => {
    const isSelected = selectedOperator?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.operatorItem, isSelected && styles.operatorSelected]}
        onPress={() => handleOperatorPress(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.operatorFlag}>{item.flag}</Text>
        <View style={styles.operatorDetails}>
          <Text style={styles.operatorMainName}>{item.name}</Text>
          <Text style={styles.operatorCountry}>{item.country}</Text>
        </View>
        <MaterialIcons
          name={item.icon as any}
          size={24}
          color={item.color}
          style={styles.operatorIcon}
        />
      </TouchableOpacity>
    );
  };

  const renderCountryChip = (country: { code: string; name: string; flag: string }) => {
    const isSelected = selectedCountry === country.code;

    return (
      <TouchableOpacity
        key={country.code}
        style={[
          styles.countryChip,
          isSelected && styles.countryChipSelected,
        ]}
        onPress={() => handleCountryPress(country.code)}
        activeOpacity={0.7}
      >
        <Text>{country.flag}</Text>
        <Text
          style={[
            styles.countryChipText,
            isSelected && styles.countryChipTextSelected,
          ]}
        >
          {country.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSelector = () => (
    <TouchableOpacity
      style={[
        styles.selector,
        disabled && styles.selectorDisabled,
      ]}
      onPress={() => !disabled && setIsModalVisible(true)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.selectorContent}>
        {selectedOperator ? (
          <>
            <Text style={{ fontSize: 24 }}>{selectedOperator.flag}</Text>
            <View style={styles.operatorInfo}>
              <Text style={styles.operatorName}>{selectedOperator.name}</Text>
              <Text style={styles.operatorDescription}>
                {selectedOperator.description}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </View>
      <MaterialIcons
        name="keyboard-arrow-down"
        size={24}
        color={colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Opérateur de paiement PayDunya</Text>
      {renderSelector()}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un opérateur</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Country Filter */}
              {showCountryFilter && (
                <View style={styles.countryFilter}>
                  <Text style={styles.countryTitle}>Filtrer par pays</Text>
                  <View style={styles.countryRow}>
                    {PAYDUNYA_SUPPORTED_COUNTRIES.map(renderCountryChip)}
                  </View>
                </View>
              )}

              {/* Card Option */}
              <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Carte bancaire</Text>
                <View style={styles.operatorsList}>
                  <TouchableOpacity
                    style={[
                      styles.operatorItem,
                      selectedOperator?.id === PAYDUNYA_CARD_OPTION.id && styles.operatorSelected,
                    ]}
                    onPress={() => handleOperatorPress(PAYDUNYA_CARD_OPTION)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.operatorFlag}>{PAYDUNYA_CARD_OPTION.flag}</Text>
                    <View style={styles.operatorDetails}>
                      <Text style={styles.operatorMainName}>{PAYDUNYA_CARD_OPTION.name}</Text>
                      <Text style={styles.operatorCountry}>{PAYDUNYA_CARD_OPTION.description}</Text>
                    </View>
                    <MaterialIcons
                      name={PAYDUNYA_CARD_OPTION.icon as any}
                      size={24}
                      color={PAYDUNYA_CARD_OPTION.color}
                      style={styles.operatorIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mobile Money Operators */}
              <Text style={styles.sectionTitle}>Mobile Money</Text>
              <View style={styles.operatorsList}>
                <FlatList
                  data={filteredOperators}
                  renderItem={renderOperatorItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PayDunyaOperatorSelector;