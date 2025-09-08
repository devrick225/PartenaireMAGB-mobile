const axios = require('axios');

// URLs à tester
const URLS_TO_TEST = [
  'http://localhost:5000/api',
  'https://9720-196-47-134-21.ngrok-free.app/api',
  // Ajoutez d'autres URLs si nécessaire
];

async function testConnection() {
  console.log('🔍 Test de connectivité API...\n');

  for (const baseURL of URLS_TO_TEST) {
    console.log(`📡 Test de: ${baseURL}`);
    
    try {
      // Test simple GET
      const response = await axios.get(`${baseURL}/auth/me`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ ${baseURL} - Connecté (Status: ${response.status})`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️  ${baseURL} - Serveur répond (Status: ${error.response.status})`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${baseURL} - Serveur non disponible (ECONNREFUSED)`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`❌ ${baseURL} - Domaine non trouvé (ENOTFOUND)`);
      } else {
        console.log(`❌ ${baseURL} - Erreur: ${error.message}`);
      }
    }
    console.log('');
  }

  // Test de login
  console.log('🔑 Test de login...');
  const testCredentials = {
    email: 'test@example.com',
    password: 'test123'
  };

  for (const baseURL of URLS_TO_TEST) {
    try {
      const response = await axios.post(`${baseURL}/auth/login`, testCredentials, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`✅ Login test ${baseURL} - Success`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`✅ Login endpoint ${baseURL} - Fonctionne (401 = identifiants invalides)`);
      } else if (error.response) {
        console.log(`⚠️  Login endpoint ${baseURL} - Status: ${error.response.status}`);
      } else {
        console.log(`❌ Login endpoint ${baseURL} - Erreur: ${error.message}`);
      }
    }
  }
}

testConnection(); 