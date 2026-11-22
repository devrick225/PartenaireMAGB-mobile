import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Onboarding Screens
import Onboarding1 from "../screens/Onboarding1";
import Onboarding2 from "../screens/Onboarding2";
import Onboarding3 from "../screens/Onboarding3";
import Onboarding4 from "../screens/Onboarding4";
import Welcome from "../screens/Welcome";

// Auth Screens
import Login from "../screens/Login";
import SignupComplete from "../screens/SignupComplete";

// Forgot Password Flow - Nouveaux écrans modernes
import ForgotPasswordMethodScreen from "../screens/ForgotPasswordMethodScreen";
import ForgotPasswordCodeScreen from "../screens/ForgotPasswordCodeScreen";
import ForgotPasswordSmsScreen from "../screens/ForgotPasswordSmsScreen";
import ResetPasswordWithCodeScreen from "../screens/ResetPasswordWithCodeScreen";
import ResetPasswordWithSmsCodeScreen from "../screens/ResetPasswordWithSmsCodeScreen";

// Anciens écrans (gardés pour compatibilité)

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const [isFirstLaunch, setIsFirstLaunch] = React.useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value == null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    return null; // Loading state
  }

  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? 'Onboarding1' : 'Login'}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      {/* Onboarding Flow */}
      <Stack.Screen name="Onboarding1" component={Onboarding1} />
      <Stack.Screen name="Onboarding2" component={Onboarding2} />
      <Stack.Screen name="Onboarding3" component={Onboarding3} />
      <Stack.Screen name="Onboarding4" component={Onboarding4} />
      <Stack.Screen name="Welcome" component={Welcome} />

      {/* Authentication Flow */}
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={SignupComplete} />

      {/* Forgot Password Flow */}
      <Stack.Screen name="ForgotPasswordMethods" component={ForgotPasswordMethodScreen} />
      <Stack.Screen name="ForgotPasswordCodeScreen" component={ForgotPasswordCodeScreen} />
      <Stack.Screen name="ForgotPasswordSmsScreen" component={ForgotPasswordSmsScreen} />
      <Stack.Screen name="ResetPasswordWithCodeScreen" component={ResetPasswordWithCodeScreen} />
      <Stack.Screen name="ResetPasswordWithSmsCodeScreen" component={ResetPasswordWithSmsCodeScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator; 