import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { COLORS } from '../constants';
import apiClient from '../store/services/apiClient';
import paymentService from '../store/services/paymentService';

interface TestAPIScreenProps {
  navigation: any;
}

const TestAPIScreen: React.FC<TestAPIScreenProps> = ({ navigation }) => {
  const { dark, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const testAPIConnection = async () => {
    setIsLoading(true);
    addLog('🚀 Test de connexion API...');
    
    try {
      const response = await apiClient.get('/health');
      addLog(`✅ API connectée - Statut: ${response.status}`);
      addLog(`📋 Réponse: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      addLog(`❌ Erreur connexion API: ${error.message}`);
      addLog(`📋 Détails: ${JSON.stringify(error.response?.data || 'Pas de réponse')}`);
    }
    
    setIsLoading(false);
  };

  const testPaymentsList = async () => {
    setIsLoading(true);
    addLog('💳 Test liste des paiements...');
    
    try {
      const response = await paymentService.getPayments({ limit: 3 });
      addLog(`✅ Paiements récupérés - Statut: ${response.status}`);
      addLog(`📋 Nombre: ${response.data.data?.payments?.length || 0}`);
      addLog(`📋 Structure: ${JSON.stringify(response.data).substring(0, 200)}...`);
    } catch (error: any) {
      addLog(`❌ Erreur paiements: ${error.message}`);
      addLog(`📋 Détails: ${JSON.stringify(error.response?.data || 'Pas de réponse')}`);
    }
    
    setIsLoading(false);
  };

  const testPaymentVerification = async () => {
    setIsLoading(true);
    addLog('🔍 Test vérification paiement...');
    
    try {
      // D'abord récupérer un paiement
      const paymentsResponse = await paymentService.getPayments({ limit: 1 });
      const payments = paymentsResponse.data.data?.payments;
      
      if (!payments || payments.length === 0) {
        addLog('⚠️ Aucun paiement trouvé pour tester');
        setIsLoading(false);
        return;
      }
      
      const payment = payments[0];
      addLog(`🎯 Test avec paiement ID: ${payment._id}`);
      addLog(`📋 Provider: ${payment.provider}, Status: ${payment.status}`);
      
      // Tester la vérification
      const verifyResponse = await paymentService.verifyPayment(payment._id);
      addLog(`✅ Vérification OK - Statut HTTP: ${verifyResponse.status}`);
      addLog(`📋 Structure réponse: ${JSON.stringify(verifyResponse.data).substring(0, 300)}...`);
      
    } catch (error: any) {
      addLog(`❌ Erreur vérification: ${error.message}`);
      addLog(`📋 Status HTTP: ${error.response?.status || 'N/A'}`);
      addLog(`📋 Données erreur: ${JSON.stringify(error.response?.data || 'Pas de données')}`);
    }
    
    setIsLoading(false);
  };

  const testSpecificPayment = () => {
    Alert.prompt(
      'Test paiement spécifique',
      'Entrez l\'ID du paiement à tester:',
      async (paymentId) => {
        if (paymentId) {
          setIsLoading(true);
          addLog(`🎯 Test paiement spécifique: ${paymentId}`);
          
          try {
            const response = await paymentService.verifyPayment(paymentId);
            addLog(`✅ Vérification réussie - Statut: ${response.status}`);
            addLog(`📋 Réponse: ${JSON.stringify(response.data)}`);
          } catch (error: any) {
            addLog(`❌ Erreur: ${error.message}`);
            addLog(`📋 Détails: ${JSON.stringify(error.response?.data || 'Pas de données')}`);
          }
          
          setIsLoading(false);
        }
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Test API
        </Text>
        <TouchableOpacity
          onPress={clearLogs}
          style={[styles.backButton, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
        >
          <MaterialIcons name="clear" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Test Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.primary }]}
          onPress={testAPIConnection}
          disabled={isLoading}
        >
          <MaterialIcons name="wifi" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Connexion API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#2196F3' }]}
          onPress={testPaymentsList}
          disabled={isLoading}
        >
          <MaterialIcons name="list" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Liste Paiements</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#FF9800' }]}
          onPress={testPaymentVerification}
          disabled={isLoading}
        >
          <MaterialIcons name="verified" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Vérification Auto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#9C27B0' }]}
          onPress={testSpecificPayment}
          disabled={isLoading}
        >
          <MaterialIcons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Test Paiement Spécifique</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Test en cours...
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>
          Logs de test ({testResults.length})
        </Text>
        
        {testResults.map((result, index) => (
          <View key={index} style={[styles.logEntry, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
            <Text style={[styles.logText, { color: colors.text }]}>
              {result}
            </Text>
          </View>
        ))}
        
        {testResults.length === 0 && (
          <Text style={[styles.noLogs, { color: dark ? COLORS.grayTie : COLORS.gray }]}>
            Aucun test effectué. Appuyez sur un bouton pour commencer.
          </Text>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  buttonsContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  logEntry: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  noLogs: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 40,
  },
});

export default TestAPIScreen; 