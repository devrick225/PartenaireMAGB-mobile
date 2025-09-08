import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../theme/ThemeProvider';

interface PartnerIdDisplayProps {
  partnerId: string;
  partnerLevel?: 'classique' | 'bronze' | 'argent' | 'or';
  partnerLevelDetails?: {
    name: string;
    range: string;
    minAmount: number;
    maxAmount: number;
    color: string;
    icon: string;
  };
  variant?: 'card' | 'inline' | 'compact';
  showCopyButton?: boolean;
  showLevel?: boolean;
}

const PartnerIdDisplay: React.FC<PartnerIdDisplayProps> = ({
  partnerId,
  partnerLevel = 'classique',
  partnerLevelDetails,
  variant = 'card',
  showCopyButton = true,
  showLevel = true,
}) => {
  const { colors, dark } = useTheme();

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(partnerId);
      Alert.alert(
        'Copié !',
        `ID Partenaire ${partnerId} copié dans le presse-papier`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Erreur copie:', error);
      Alert.alert(
        'Erreur',
        'Impossible de copier l\'ID Partenaire',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const getLevelColor = () => {
    if (partnerLevelDetails?.color) {
      return partnerLevelDetails.color;
    }
    
    const levelColors = {
      classique: '#8B5CF6', // Violet
      bronze: '#CD7F32',    // Bronze
      argent: '#C0C0C0',    // Argent
      or: '#FFD700',        // Or
    };
    
    return levelColors[partnerLevel] || levelColors.classique;
  };

  const formatPartnerId = (id: string) => {
    if (!id) return 'Non attribué';
    
    // Formatage pour améliorer la lisibilité : AB12-CDEF-GH
    if (id.length === 10) {
      return `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8)}`;
    }
    return id;
  };

  const styles = StyleSheet.create({
    // Card variant
    cardContainer: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary + '20',
      marginVertical: 8,
    },
    
    // Inline variant
    inlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      paddingVertical: 4,
    },
    
    // Compact variant
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: variant === 'card' ? 8 : 0,
    },
    
    titleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    
    icon: {
      marginRight: 8,
    },
    
    title: {
      fontSize: variant === 'card' ? 16 : variant === 'inline' ? 14 : 12,
      fontWeight: '600',
      color: colors.text,
    },
    
    partnerIdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: dark ? colors.background + '80' : colors.background + '40',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: variant === 'card' ? 8 : 6,
      marginTop: variant === 'card' ? 8 : 0,
      marginLeft: variant === 'inline' ? 8 : 0,
    },
    
    partnerIdText: {
      fontSize: variant === 'card' ? 18 : variant === 'inline' ? 16 : 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
    
    copyButton: {
      marginLeft: 8,
      padding: 4,
    },
    
    levelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: variant === 'card' ? 12 : 0,
      marginLeft: variant === 'inline' ? 12 : 0,
    },
    
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    
    levelIcon: {
      marginRight: 4,
    },
    
    levelText: {
      fontSize: variant === 'card' ? 12 : 10,
      fontWeight: '600',
      color: colors.surface,
    },
    
    levelDetails: {
      fontSize: variant === 'card' ? 11 : 9,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  const renderContent = () => (
    <>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <MaterialIcons
            name="badge"
            size={variant === 'card' ? 20 : variant === 'inline' ? 16 : 14}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>ID Partenaire</Text>
        </View>
      </View>

      <View style={styles.partnerIdContainer}>
        <Text style={styles.partnerIdText}>
          {formatPartnerId(partnerId)}
        </Text>
        {showCopyButton && (
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <MaterialIcons
              name="copy-all"
              size={variant === 'card' ? 20 : 16}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {false && showLevel && partnerLevel && (
        <View style={styles.levelContainer}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor() + (variant === 'compact' ? 'CC' : '') },
            ]}
          >
            <MaterialIcons
              name={partnerLevelDetails?.icon || 'star'}
              size={variant === 'card' ? 12 : 10}
              color={colors.surface}
              style={styles.levelIcon}
            />
            <Text style={styles.levelText}>
              {partnerLevelDetails?.name || `Niveau ${partnerLevel}`}
            </Text>
          </View>
          {variant === 'card' && partnerLevelDetails?.range && (
            <Text style={styles.levelDetails}>
              {partnerLevelDetails.range}
            </Text>
          )}
        </View>
      )}
    </>
  );

  // Rendu selon la variante
  switch (variant) {
    case 'inline':
      return (
        <View style={styles.inlineContainer}>
          {renderContent()}
        </View>
      );
    
    case 'compact':
      return (
        <View style={styles.compactContainer}>
          {renderContent()}
        </View>
      );
    
    default: // card
      return (
        <View style={styles.cardContainer}>
          {renderContent()}
        </View>
      );
  }
};

export default PartnerIdDisplay;