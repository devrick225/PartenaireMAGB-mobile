import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import { useCallback } from 'react'
import { FONTS } from './src/constants/fonts'
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display'
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3'
import AppNavigation from './src/navigations/AppNavigation'
import { ThemeProvider } from './src/theme/ThemeProvider'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './src/store'
import ToastNotification from './src/components/ToastNotification'

// Ne pas ignorer les logs — ils sont essentiels pour détecter les bugs
// LogBox.ignoreAllLogs() a été retiré intentionnellement

SplashScreen.preventAutoHideAsync()

export default function App() {
  // Urbanist (anciens écrans) + Playfair Display / Source Sans 3 (charte frontend-new, src/design)
  const [fontsLoaded] = useFonts({
    ...FONTS,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SafeAreaProvider onLayout={onLayoutRootView}>
            <AppNavigation />
            <ToastNotification />
          </SafeAreaProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
