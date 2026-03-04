import { StyleSheet } from "react-native-unistyles";

const lightTheme = {
  colors: {
    background: "#F4F4F4",
    foreground: "#E6E6E6",
    typography: "#2C2C2C",
    dimmed: "#B2B2B2",
    contrast: "#2C2C2C",
    typographyContrast: "#F4F4F4",
    link: "#1E3799",
    light: "#F4F4F4",
    dark: "#2C2C2C",
    danger: "#FF5154",
    primary: "#6B9C00",
    warning: "#C78800",
  },
  fontFamily: "MomoTrustDisplay-Regular",
  gap: (v: number) => v * 8,
} as const;

const darkTheme = {
  colors: {
    background: "#0C0C0C",
    foreground: "#1B1B1B",
    typography: "#F4F4F4",
    dimmed: "#B2B2B2",
    contrast: "#F4F4F4",
    typographyContrast: "#0C0C0C",
    link: "#0C2461",
    light: "#F4F4F4",
    dark: "#0C0C0C",
    danger: "#FF5154",
    primary: "#6B9C00",
    warning: "#C78800",
  },
  fontFamily: "MomoTrustDisplay-Regular",
  gap: (v: number) => v * 8,
} as const;

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  xs: 0,
  sm: 300,
  md: 500,
  lg: 800,
  xl: 1200,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: {
    adaptiveThemes: true,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  breakpoints,
});
