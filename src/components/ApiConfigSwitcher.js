import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { switchEnvironment, currentConfig } from '../config/api';
import apiService from '../services/apiService';

const ApiConfigSwitcher = () => {
  const environments = [
    {
      key: 'development',
      label: '🚧 Development (Ngrok)',
      description: 'URL ngrok pour développement',
    },
    {
      key: 'localhost',
      label: '🏠 Localhost',
      description: 'Serveur local port 5000',
      customConfig: {
        baseURL: 'http://localhost:5000/api',
        timeout: 10000,
        retryAttempts: 3,
        enableLogging: true,
      }
    },
    {
      key: 'staging',
      label: '🧪 Staging',
      description: 'Serveur de test',
    },
    {
      key: 'production',
      label: '🌍 Production',
      description: 'Serveur de production',
    },
  ];

  const switchToEnvironment = (env) => {
    try {
      let newConfig;
      
      if (env.customConfig) {
        // Configuration personnalisée (ex: localhost)
        apiService.updateConfig(env.customConfig);
        newConfig = env.customConfig;
      } else {
        // Configuration prédéfinie
        newConfig = switchEnvironment(env.key);
        apiService.updateConfig(newConfig);
      }

      console.log(`🔄 Switched to ${env.label}:`, newConfig);
      
      Alert.alert(
        'Configuration changée',
        `Maintenant connecté à : ${env.label}\nURL: ${newConfig.baseURL}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Erreur changement config:', error);
      Alert.alert('Erreur', `Impossible de changer vers ${env.label}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Commutateur d'environnement API</Text>
      
      {/* Configuration actuelle */}
      <View style={styles.currentConfigSection}>
        <Text style={styles.currentConfigTitle}>Configuration actuelle :</Text>
        <Text style={styles.currentConfigText}>URL: {currentConfig.baseURL}</Text>
        <Text style={styles.currentConfigText}>Timeout: {currentConfig.timeout}ms</Text>
        <Text style={styles.currentConfigText}>Logs: {currentConfig.enableLogging ? 'ON' : 'OFF'}</Text>
      </View>

      {/* Options d'environnement */}
      <Text style={styles.sectionTitle}>Changer d'environnement :</Text>
      
      {environments.map((env) => (
        <TouchableOpacity
          key={env.key}
          style={[
            styles.envButton,
            currentConfig.baseURL?.includes(env.key === 'localhost' ? 'localhost' : env.key) && styles.envButtonActive
          ]}
          onPress={() => switchToEnvironment(env)}
        >
          <Text style={[
            styles.envButtonLabel,
            currentConfig.baseURL?.includes(env.key === 'localhost' ? 'localhost' : env.key) && styles.envButtonLabelActive
          ]}>
            {env.label}
          </Text>
          <Text style={[
            styles.envButtonDescription,
            currentConfig.baseURL?.includes(env.key === 'localhost' ? 'localhost' : env.key) && styles.envButtonDescriptionActive
          ]}>
            {env.description}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>ℹ️ Instructions :</Text>
        <Text style={styles.instructions}>
          • Changez d'environnement en tapant sur un bouton{'\n'}
          • La configuration s'applique immédiatement{'\n'}
          • Tous les appels API utilisent la nouvelle URL{'\n'}
          • Utile pour tester différents serveurs
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  currentConfigSection: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeft: 4,
    borderLeftColor: '#4CAF50',
  },
  currentConfigTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  currentConfigText: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#34495e',
  },
  envButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  envButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  envButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
  },
  envButtonLabelActive: {
    color: '#1976D2',
  },
  envButtonDescription: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  envButtonDescriptionActive: {
    color: '#1565C0',
  },
  instructionsSection: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeft: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#f57c00',
  },
  instructions: {
    fontSize: 12,
    color: '#ef6c00',
    lineHeight: 18,
  },
});

export default ApiConfigSwitcher;
