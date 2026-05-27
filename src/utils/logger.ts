/**
 * Système de logging conditionnel
 * Les logs sont affichés uniquement en mode développement
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log d'information (console.log)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log d'erreur (console.error)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  /**
   * Log d'avertissement (console.warn)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log d'information (console.info)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log de debug (console.debug)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log de groupe (console.group)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Fin de groupe (console.groupEnd)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Log avec préfixe coloré pour les paiements
   */
  payment: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log('💳 [Payment]', message, ...args);
    }
  },

  /**
   * Log avec préfixe coloré pour MoneyFusion
   */
  moneyfusion: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log('🔵 [MoneyFusion]', message, ...args);
    }
  },

  /**
   * Log de succès
   */
  success: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', message, ...args);
    }
  },

  /**
   * Log d'échec
   */
  failure: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log('❌', message, ...args);
    }
  },
};

export default logger;
