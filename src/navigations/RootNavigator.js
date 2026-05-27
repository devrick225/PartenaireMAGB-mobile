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
      if (!isInitialized && !isInitializing) {
        setIsInitializing(true);
        
        // Timeout de sécurité pour éviter un chargement infini
        timeoutId = setTimeout(() => {
          dispatch(setInitialized(true));
        }, 8000);
        
        try {
          await dispatch(checkAuthStatus()).unwrap();
        } catch (error) {
          dispatch(setInitialized(true));
        } finally {
          clearTimeout(timeoutId);
          setIsInitializing(false);
        }
      }
    };

    initializeApp();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dispatch, isInitialized, isInitializing]);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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