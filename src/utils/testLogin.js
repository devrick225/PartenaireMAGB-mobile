// Script de test pour vérifier la connexion Redux
// Utilisez ceci dans votre composant Login pour tester

export const testCredentials = {
  // Utilisez ces identifiants pour tester la connexion
  email: 'test@example.com',
  password: 'password123'
};

export const testLoginFlow = async (dispatch, loginUser, showSuccess, showError) => {
  try {
    console.log('🧪 Test de connexion Redux...');
    
    // Test avec de vraies données (remplacez par vos vrais identifiants)
    const testData = {
      email: 'admin@partenairemagb.com', // Remplacez par un vrai email
      password: 'motdepasse123' // Remplacez par un vrai mot de passe
    };

    console.log('📤 Envoi de la requête de connexion...');
    const result = await dispatch(loginUser(testData)).unwrap();
    
    console.log('✅ Connexion réussie:', result);
    
    dispatch(showSuccess({
      title: 'Test réussi',
      message: 'La connexion Redux fonctionne parfaitement!'
    }));
    
    return result;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    
    dispatch(showError({
      title: 'Test échoué',
      message: `Erreur: ${error.message || 'Connexion impossible'}`
    }));
    
    throw error;
  }
};

export const debugReduxState = (authState) => {
  console.log('🔍 État Redux actuel:', {
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    user: authState.user,
    token: authState.token ? 'Token présent' : 'Pas de token',
    error: authState.error
  });
};

export const checkAPIConnection = async () => {
  try {
    console.log('🌐 Test de connexion à l\'API...');
    
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API accessible:', data);
      return true;
    } else {
      console.error('❌ API erreur:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion API:', error);
    console.log('💡 Assurez-vous que votre serveur backend fonctionne sur le port 5000');
    return false;
  }
}; 