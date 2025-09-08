import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useUploadAvatarBase64Mutation } from '../store/services/avatarService';
import userService from '../store/services/userService';
import apiService from '../services/apiService';
import { API_BASE_URL } from '../config/api';

const AvatarUploadTest = () => {
  const [uploadAvatarRTK] = useUploadAvatarBase64Mutation();
  const [isTestingUserService, setIsTestingUserService] = useState(false);
  const [isTestingApiService, setIsTestingApiService] = useState(false);

  // Image de test en base64 (1x1 pixel)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  const testRTKQuery = async () => {
    try {
      console.log('🔍 Test RTK Query - URL:', `${API_BASE_URL}/users/upload-avatar-base64`);
      
      const response = await uploadAvatarRTK({
        imageData: testImageBase64,
        filename: 'test_rtk.png'
      }).unwrap();
      
      console.log('✅ RTK Query test réussi:', response);
      Alert.alert('✅ RTK Query', 'Test réussi !');
    } catch (error) {
      console.error('❌ RTK Query test échoué:', error);
      Alert.alert('❌ RTK Query', `Échec: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const testUserService = async () => {
    try {
      setIsTestingUserService(true);
      console.log('🔍 Test UserService - URL:', `${API_BASE_URL}/users/upload-avatar`);
      
      // Simuler FormData pour test
      const formData = new FormData();
      formData.append('avatar', {
        uri: 'test://image.jpg',
        type: 'image/jpeg',
        name: 'test_userservice.jpg',
      });

      const response = await userService.uploadAvatar(formData);
      
      console.log('✅ UserService test réussi:', response.data);
      Alert.alert('✅ UserService', 'Test réussi !');
    } catch (error) {
      console.error('❌ UserService test échoué:', error);
      Alert.alert('❌ UserService', `Échec: ${error.response?.data?.error || error.message || 'Erreur inconnue'}`);
    } finally {
      setIsTestingUserService(false);
    }
  };

  const testApiService = async () => {
    try {
      setIsTestingApiService(true);
      console.log('🔍 Test ApiService - URL:', `${API_BASE_URL}/users/upload-avatar-base64`);
      
      const response = await apiService.users.uploadAvatarBase64(testImageBase64, 'test_apiservice.png');
      
      console.log('✅ ApiService test réussi:', response.data);
      Alert.alert('✅ ApiService', 'Test réussi !');
    } catch (error) {
      console.error('❌ ApiService test échoué:', error);
      Alert.alert('❌ ApiService', `Échec: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsTestingApiService(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Test Final - Upload Avatar</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Problème résolu !</Text>
        <Text style={styles.infoText}>
          • userService.ts corrigé : /users/upload-avatar{'\n'}
          • Configuration centralisée partout{'\n'}
          • Plus d'erreur 404 normalement
        </Text>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Tests des 3 méthodes :</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.rtkButton]}
          onPress={testRTKQuery}
        >
          <Text style={styles.buttonText}>
            Test RTK Query (avatarService)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.userServiceButton]}
          onPress={testUserService}
          disabled={isTestingUserService}
        >
          <Text style={styles.buttonText}>
            {isTestingUserService ? 'Test UserService...' : 'Test UserService (corrigé)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.apiServiceButton]}
          onPress={testApiService}
          disabled={isTestingApiService}
        >
          <Text style={styles.buttonText}>
            {isTestingApiService ? 'Test ApiService...' : 'Test ApiService (nouveau)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.urlSection}>
        <Text style={styles.urlTitle}>URLs utilisées :</Text>
        <Text style={styles.urlText}>Base: {API_BASE_URL}</Text>
        <Text style={styles.urlText}>RTK: /users/upload-avatar-base64</Text>
        <Text style={styles.urlText}>UserService: /users/upload-avatar</Text>
        <Text style={styles.urlText}>ApiService: /users/upload-avatar-base64</Text>
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
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  infoBox: {
    backgroundColor: '#d4edda',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeft: 4,
    borderLeftColor: '#28a745',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#155724',
    lineHeight: 18,
  },
  testSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  testButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  rtkButton: {
    backgroundColor: '#28a745',
  },
  userServiceButton: {
    backgroundColor: '#007bff',
  },
  apiServiceButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  urlSection: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
  },
  urlTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  urlText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
});

export default AvatarUploadTest; 