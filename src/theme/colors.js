import { COLORS } from '../constants'

// NB: de nombreux écrans/composants lisent colors.card, colors.border,
// colors.textSecondary, colors.surface, colors.secondary et colors.primaryLight
// via useTheme(). Ces clés doivent toutes être présentes ici, sinon ces
// composants reçoivent `undefined` (fond/bordure/texte invisibles).
export const lightColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    primaryLight: 'rgba(38, 51, 95, 0.1)',
    text: COLORS.dark1,
    textSecondary: COLORS.gray,
    background: COLORS.white,
    card: COLORS.white,
    surface: COLORS.secondaryWhite,
    border: COLORS.greyscale300,
}

export const darkColors = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    primaryLight: 'rgba(38, 51, 95, 0.35)',
    text: COLORS.white,
    textSecondary: COLORS.grayscale400,
    background: COLORS.dark1,
    card: COLORS.dark2,
    surface: COLORS.dark3,
    border: COLORS.dark3,
}