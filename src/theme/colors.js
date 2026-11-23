import { COLORS } from '../constants'

// NB: de nombreux écrans/composants lisent colors.card, colors.border,
// colors.textSecondary, colors.surface, colors.secondary et colors.primaryLight
// via useTheme(). Ces clés doivent toutes être présentes ici, sinon ces
// composants reçoivent `undefined` (fond/bordure/texte invisibles).
export const lightColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    primaryLight: 'rgba(71, 42, 111, 0.10)',
    text: '#221B32',
    textSecondary: COLORS.gray,
    background: '#F9F8F5', // fond crème de la charte
    card: COLORS.white,
    surface: COLORS.secondaryWhite,
    border: COLORS.greyscale300,
}

export const darkColors = {
    // Les anciens écrans posent du texte blanc sur `primary` : on garde le violet
    // (le design system src/design gère l'or en sombre pour les écrans refondus).
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    primaryLight: 'rgba(232, 177, 48, 0.15)',
    text: '#F6F4EE',
    textSecondary: COLORS.grayscale400,
    background: COLORS.dark1,
    card: COLORS.dark2,
    surface: COLORS.dark3,
    border: COLORS.dark3,
}