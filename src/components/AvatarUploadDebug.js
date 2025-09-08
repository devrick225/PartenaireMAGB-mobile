import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useUploadAvatarBase64Mutation } from '../store/services/avatarService';
import apiService from '../services/apiService';
import { API_BASE_URL, currentConfig } from '../config/api';

const AvatarUploadDebug = () => {
  const [uploadAvatarRTK, { isLoading: isLoadingRTK, error: errorRTK }] = useUploadAvatarBase64Mutation();
  const [isLoadingDirect, setIsLoadingDirect] = useState(false);
  const [errorDirect, setErrorDirect] = useState(null);

  const testUploadRTK = async () => {
    console.log('🔍 Debug RTK Query - API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Debug RTK Query - Full URL sera:', `${API_BASE_URL}/users/upload-avatar-base64`);
    
    try {
      // Image de test en base64 (1x1 pixel transparent)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const uploadData = {
        imageData: testImageBase64,
        filename: 'test_avatar_rtk.png'
      };

      console.log('🔍 Debug RTK - Données envoyées:', {
        imageDataLength: testImageBase64.length,
        filename: uploadData.filename
      });

      const response = await uploadAvatarRTK(uploadData).unwrap();
      
      console.log('✅ Debug RTK - Réponse reçue:', response);
      Alert.alert('Succès RTK Query', 'Test d\'upload RTK Query réussi !');
      
    } catch (error) {
      console.error('❌ Debug RTK - Erreur:', error);
      Alert.alert('Erreur RTK Query', `Échec du test RTK: ${error.message || JSON.stringify(error)}`);
    }
  };

  const testUploadDirect = async () => {
    console.log('🔍 Debug Service Direct - Config:', apiService.getConfig());
    
    setIsLoadingDirect(true);
    setErrorDirect(null);

    try {
      // Image de test en base64 (1x1 pixel transparent)
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      console.log('🔍 Debug Direct - Utilisation du service unifié');

      // Test avec la méthode de convenance
      const response = await apiService.users.uploadAvatarBase64(testImageBase64, 'test_avatar_direct.png');
      
      console.log('✅ Debug Direct - Réponse reçue:', response.data);
      Alert.alert('Succès Service Direct', 'Test d\'upload avec service unifié réussi !');
      
    } catch (error) {
      console.error('❌ Debug Direct - Erreur:', error);
      setErrorDirect(error);
      Alert.alert('Erreur Service Direct', `Échec du test direct: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsLoadingDirect(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Avatar Upload - Comparaison</Text>
      
      {/* Configuration actuelle */}
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Configuration actuelle :</Text>
        <Text style={styles.info}>URL: {API_BASE_URL}</Text>
        <Text style={styles.info}>Timeout: {currentConfig.timeout}ms</Text>
        <Text style={styles.info}>Retry: {currentConfig.retryAttempts} tentatives</Text>
        <Text style={styles.info}>Logs: {currentConfig.enableLogging ? 'Activés' : 'Désactivés'}</Text>
      </View>

      {/* Test RTK Query */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>1. Test RTK Query (existant)</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonRTK, isLoadingRTK && styles.buttonDisabled]}
          onPress={testUploadRTK}
          disabled={isLoadingRTK}
        >
          <Text style={styles.buttonText}>
            {isLoadingRTK ? 'Test RTK en cours...' : 'Tester RTK Query'}
          </Text>
        </TouchableOpacity>
        
        {errorRTK && (
          <Text style={styles.error}>
            Erreur RTK: {JSON.stringify(errorRTK, null, 2)}
          </Text>
        )}
      </View>

      {/* Test Service Direct */}
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>2. Test Service Unifié (nouveau)</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonDirect, isLoadingDirect && styles.buttonDisabled]}
          onPress={testUploadDirect}
          disabled={isLoadingDirect}
        >
          <Text style={styles.buttonText}>
            {isLoadingDirect ? 'Test Direct en cours...' : 'Tester Service Unifié'}
          </Text>
        </TouchableOpacity>
        
        {errorDirect && (
          <Text style={styles.error}>
            Erreur Direct: {JSON.stringify(errorDirect, null, 2)}
          </Text>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.instructionsTitle}>Instructions :</Text>
        <Text style={styles.instructions}>
          • Test 1 utilise RTK Query (configuration centralisée){'\n'}
          • Test 2 utilise le service unifié avec méthodes de convenance{'\n'}
          • Les deux devraient fonctionner identiquement{'\n'}
          • Vérifiez les logs de la console pour plus de détails
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  configSection: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  info: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  testSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonRTK: {
    backgroundColor: '#4CAF50',
  },
  buttonDirect: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
  },
  instructionsSection: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instructions: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default AvatarUploadDebug; 