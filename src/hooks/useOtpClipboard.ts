/**
 * useOtpClipboard
 *
 * Surveille le presse-papier dès que l'écran est focalisé.
 * Si un code à 6 chiffres est détecté, le distribue dans le tableau `code`
 * et appelle optionnellement onCodeReady(code) pour une vérification automatique.
 */
import { useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { AppState, AppStateStatus } from 'react-native';

interface UseOtpClipboardOptions {
  onCodeDetected: (digits: string[]) => void;
  /** Si true, lit aussi le clipboard à la première montée du composant */
  readOnMount?: boolean;
}

const OTP_REGEX = /\b(\d{6})\b/;

export function useOtpClipboard({ onCodeDetected, readOnMount = true }: UseOtpClipboardOptions) {
  const lastChecked = useRef<string>('');

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      // Éviter de re-déclencher pour le même contenu
      if (!text || text === lastChecked.current) return;
      lastChecked.current = text;

      const match = text.match(OTP_REGEX);
      if (match) {
        const digits = match[1].split('');
        onCodeDetected(digits);
      }
    } catch {
      // Clipboard non disponible — ignorer silencieusement
    }
  };

  useEffect(() => {
    if (readOnMount) {
      checkClipboard();
    }

    // Vérifie aussi quand l'app revient au premier plan (l'utilisateur a copié
    // le code depuis une notif ou l'app SMS, puis bascule vers l'app)
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkClipboard();
      }
    });

    return () => subscription.remove();
  }, []);
}
