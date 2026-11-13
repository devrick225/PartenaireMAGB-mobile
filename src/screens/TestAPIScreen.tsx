import logger from '../utils/logger';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import paymentService from '../store/services/paymentService';
import { Linking } from 'react-native';
import { buildPaymentReturnDeepLink } from '../utils/deepLinkScheme';

interface TestAPIScreenProps {
  navigation: any;
}

const TestAPIScreen: React.FC<TestAPIScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [donationIdInput, setDonationIdInput] = useState('');

  const addLog = (msg: string) =>
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);

  // Charger le dernier paiement pour remplir l'ID automatiquement
  const fetchLastPayment = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getPayments({ limit: 1 });
      const payments = response.data.data?.payments;
      if (!payments?.length) {
        addLog('⚠️ Aucun paiement trouvé');
        return;
      }
      const p = payments[0];
      const donId = p.donation?._id || p.donation || '';
      setDonationIdInput(donId);
      addLog(`✅ Dernier paiement: ${p._id}`);
      addLog(`   Donation: ${donId} | Statut: ${p.status} | Provider: ${p.provider}`);
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Simuler le retour de paiement via deep link
  const simulate = async (status: 'completed' | 'failed' | 'pending') => {
    const donationId = donationIdInput.trim();
    if (!donationId) {
      Alert.alert('ID requis', 'Appuie sur ↺ ou colle un ID de donation.');
      return;
    }

    const deepLink = buildPaymentReturnDeepLink(donationId)
      .replace('status=pending', `status=${status}`);

    addLog(`🔗 Deep link (${status}): ${deepLink}`);

    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
        addLog('✅ Deep link déclenché');
      } else {
        addLog('❌ Deep link non reconnu');
      }
    } catch (error: any) {
      addLog(`❌ ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simuler paiement</Text>
        <TouchableOpacity onPress={() => setLogs([])} style={styles.backBtn}>
          <MaterialIcons name="delete-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Champ ID */}
        <Text style={[styles.label, { color: colors.text }]}>ID de donation</Text>
        <View style={[styles.inputRow, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Colle un ID de donation..."
            placeholderTextColor={COLORS.gray}
            value={donationIdInput}
            onChangeText={setDonationIdInput}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={fetchLastPayment} style={styles.refreshBtn}>
            {isLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <MaterialIcons name="refresh" size={22} color={colors.primary} />
            }
          </TouchableOpacity>
        </View>

        {/* Boutons de simulation */}
        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>
          Simuler le retour de paiement
        </Text>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => simulate('completed')}
          >
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.simBtnText}>Succès</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#FF9800' }]}
            onPress={() => simulate('pending')}
          >
            <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
            <Text style={styles.simBtnText}>En attente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simBtn, { backgroundColor: '#F44336' }]}
            onPress={() => simulate('failed')}
          >
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.simBtnText}>Échec</Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        {logs.length > 0 && (
          <>
            <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>
              Logs
            </Text>
            {logs.map((log, i) => (
              <View key={i} style={[styles.logEntry, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
                <Text style={[styles.logText, { color: colors.text }]}>{log}</Text>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2,
  },
  input: { flex: 1, fontSize: 13, paddingVertical: 12 },
  refreshBtn: { padding: 8 },
  btnRow: { flexDirection: 'row', gap: 10 },
  simBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 10, gap: 6,
  },
  simBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  logEntry: { padding: 10, borderRadius: 8, marginBottom: 6 },
  logText: { fontSize: 11, fontFamily: 'monospace', lineHeight: 15 },
});

export default TestAPIScreen;
