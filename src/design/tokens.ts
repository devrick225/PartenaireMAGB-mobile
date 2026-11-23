/**
 * Design tokens — alignés sur la charte du site web (PartenaireMAGB-frontend-new,
 * src/index.css). Les valeurs HSL du web sont converties en hexadécimal.
 *
 * Règle : les écrans n'utilisent plus de couleurs « en dur » ; ils passent par
 * useDS() qui renvoie la palette claire ou sombre.
 */

export const palette = {
  light: {
    background: '#F9F8F5', // hsl(40 25% 97%)
    foreground: '#221B32', // hsl(260 30% 15%)
    card: '#FFFFFF',
    primary: '#472A6F', // hsl(265 45% 30%) — violet MAGB
    primaryForeground: '#F6F4EE',
    primarySoft: 'rgba(71, 42, 111, 0.10)', // bg-primary/10 (pastilles d'icônes)
    primaryDeep: '#2F1C4A', // hsl(265 45% 20%) — fin du dégradé hero
    gold: '#E8B130', // hsl(42 80% 55%) — accent / secondaire
    goldDark: '#BD890F',
    goldSoft: 'rgba(232, 177, 48, 0.15)',
    onGold: '#221B32',
    muted: '#EEECE8',
    mutedForeground: '#6F677E',
    border: '#E5E2DC',
    input: '#DEDBD3',
    destructive: '#DC2828',
    destructiveSoft: '#FEE2E2',
    success: '#15803D',
    successSoft: '#DCFCE7',
    warning: '#C2410C',
    warningSoft: '#FFEDD5',
    info: '#1D4ED8',
    infoSoft: '#DBEAFE',
    overlay: 'rgba(34, 27, 50, 0.45)',
    heroText: '#FFFFFF',
    heroTextMuted: 'rgba(255, 255, 255, 0.75)',
    heroChip: 'rgba(255, 255, 255, 0.18)',
  },
  dark: {
    background: '#120E1B', // hsl(260 30% 8%)
    foreground: '#F6F4EE',
    card: '#1C1726', // hsl(260 25% 12%)
    primary: '#E8B130', // en sombre, l'accent principal devient l'or (comme le web)
    primaryForeground: '#18121F',
    primarySoft: 'rgba(232, 177, 48, 0.15)',
    primaryDeep: '#2F1C4A',
    gold: '#E8B130',
    goldDark: '#BD890F',
    goldSoft: 'rgba(232, 177, 48, 0.15)',
    onGold: '#18121F',
    muted: '#2B2537',
    mutedForeground: '#A89E8A',
    border: '#30293D',
    input: '#342D43',
    destructive: '#F87171',
    destructiveSoft: 'rgba(127, 29, 29, 0.35)',
    success: '#4ADE80',
    successSoft: 'rgba(20, 83, 45, 0.35)',
    warning: '#FB923C',
    warningSoft: 'rgba(124, 45, 18, 0.35)',
    info: '#60A5FA',
    infoSoft: 'rgba(30, 58, 138, 0.35)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    heroText: '#FFFFFF',
    heroTextMuted: 'rgba(255, 255, 255, 0.75)',
    heroChip: 'rgba(255, 255, 255, 0.15)',
  },
};

export type Palette = typeof palette.light;

/** Dégradé des en-têtes « hero » (from-primary via-primary/90 to-primary/70 côté web) */
export const heroGradient = {
  light: ['#472A6F', '#3B2360', '#2F1C4A'] as const,
  dark: ['#2F1C4A', '#241638', '#1C1726'] as const,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12, // --radius: 0.75rem
  xl: 16, // rounded-2xl : cartes et sections
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16, // marge latérale standard des écrans (px-4)
  xl: 24,
  xxl: 32,
};

/** Taille minimale d'une zone tactile (Apple HIG 44pt / Material 48dp) */
export const MIN_TOUCH = 44;

/** Polices chargées dans App.tsx (titres : Playfair Display, texte : Source Sans 3) */
export const fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingSemi: 'PlayfairDisplay_600SemiBold',
  regular: 'SourceSans3_400Regular',
  medium: 'SourceSans3_500Medium',
  semibold: 'SourceSans3_600SemiBold',
  bold: 'SourceSans3_700Bold',
};

export const typography = {
  display: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32 },
  title: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  amount: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30 },
};

export type TypographyVariant = keyof typeof typography;

/** Ombre légère des cartes (shadow-sm) */
export const cardShadow = {
  shadowColor: '#221B32',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 1,
};
