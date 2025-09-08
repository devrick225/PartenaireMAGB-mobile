import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAppDispatch } from "../store/hooks";
import { useAuth } from "../store/hooks";
import { checkAuthStatus, setInitialized } from "../store/slices/authSlice";
import { COLORS } from "../constants";

// Navigators
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let timeoutId;

    const initializeApp = async () => {
      // Check authentication status on app start
      if (!isInitialized && !isInitializing) {
        setIsInitializing(true);
        console.log('🔄 Vérification du statut d\'authentification...');
        
        // Set a safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.log('⏰ Timeout de vérification d\'auth - initialisation forcée');
          dispatch(setInitialized(true));
        }, 8000); // 8 secondes max
        
        try {
          await dispatch(checkAuthStatus()).unwrap();
          console.log('✅ Vérification d\'auth terminée avec succès');
        } catch (error) {
          console.log('❌ Erreur lors de la vérification d\'auth:', error);
          // Force l'initialisation même en cas d'erreur
          dispatch(setInitialized(true));
        } finally {
          clearTimeout(timeoutId);
          setIsInitializing(false);
        }
      }
    };

    initializeApp();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [dispatch, isInitialized, isInitializing]);

  // Show loading screen while checking auth status
  if (!isInitialized) {
    console.log('🔄 État de chargement:', { isInitialized, isLoading, isInitializing });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  console.log('🔍 État d\'authentification final:', {
    isAuthenticated,
    isInitialized,
    isLoading
  });

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});

export default RootNavigator; 