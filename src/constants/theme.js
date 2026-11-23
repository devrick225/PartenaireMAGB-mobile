import { Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export const COLORS = {
    primary: '#472A6F', // violet MAGB (charte frontend-new)
    secondary: '#E8B130', // or
    tertiary: "#6C4DDA",
    success: "#16A34A",
    black: "#181A20",
    black2: "#1D272F",
    info: "#246BFD",
    warning: "#FACC15",
    error: "#DC2828",
    disabled: "#D8D8D8",
    white: "#FFFFFF",
    secondaryWhite: "#F8F8F8",
    tertiaryWhite: "#F7F7F7",
    greeen: "#16A34A",
    green: "#16A34A",
    red: "#DC2828",
    secondaryWhite: '#F9F8F5',
    tertiaryWhite: '#F4F2EE',
    gray: "#6F677E", // texte secondaire (contraste AA sur fond clair)
    gray2: "#30293D",
    gray3: "#8A8296",
    dark1: "#120E1B",
    dark2: "#1C1726",
    dark3: "#30293D",
    greyscale900: "#221B32",
    greyScale800: "#424242",
    grayscale700: "#616161",
    grayscale400: "#BDBDBD",
    greyscale300: "#E5E2DC",
    greyscale500: "#FAFAFA",
    greyscale600: "#757575",
    grayscale200: "#EEECE8",
    grayscale100: "#F4F2EE",
    tansparentPrimary: "rgba(71, 42, 111, 0.10)",
    transparentSecondary: "rgba(108,77,218, .15)",
    transparentTertiary: "rgba(51, 94, 247, .1)",
    transparentRed: "rgba(255,62,61, .15)",
    transparentWhite: "rgba(255,255,255, .2)",
    transparentWhite2: "rgba(255,255,255, .5)",
    blackTie: "#474747",
    grayTie: '#A89E8A'
};

export const SIZES = {
    // Global SIZES
    base: 8,
    font: 14,
    radius: 30,
    padding: 8,
    padding2: 12,
    padding3: 16,

    // FONTS Sizes
    largeTitle: 50,
    h1: 36,
    h2: 22,
    h3: 16,
    h4: 14,
    body1: 30,
    body2: 20,
    body3: 16,
    body4: 14,

    // App Dimensions
    width,
    height,
};

export const FONTS = {
    largeTitle: { fontFamily: 'black', fontSize: SIZES.largeTitle, lineHeight: 55, color: "black" },
    h1: { fontFamily: 'bold', fontSize: SIZES.h1, lineHeight: 36, color: "black" },
    h2: { fontFamily: 'bold', fontSize: SIZES.h2, lineHeight: 30, color: "black" },
    h3: { fontFamily: 'bold', fontSize: SIZES.h3, lineHeight: 22, color: "black" },
    h4: { fontFamily: 'bold', fontSize: SIZES.h4, lineHeight: 20 },
    body1: { fontFamily: 'regular', fontSize: SIZES.body1, lineHeight: 36, color: "black" },
    body2: { fontFamily: 'regular', fontSize: SIZES.body2, lineHeight: 30, color: "black" },
    body3: { fontFamily: 'regular', fontSize: SIZES.body3, lineHeight: 22, color: "black" },
    body4: { fontFamily: 'regular', fontSize: SIZES.body4, lineHeight: 20, color: "black" },
};



const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;