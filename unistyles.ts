import { StyleSheet } from "react-native-unistyles";

const lightTheme = {
  colors: {
    background: "#FCFAF8",
    foreground: "#EDEAE6",
    typography: "#1B140C",
    dimmed: "#ECE8E4",
    tint: "#9A734C",
    activeTint: "#1B140C",
    link: "#1E3799",
    danger: "#FF5154",
    primary: "#6B9C00",
  },
  fontFamily: "MomoTrustDisplay-Regular",
  gap: (v: number) => v * 8,
} as const;

const darkTheme = {
  colors: {
    background: "#0C0C0C",
    foreground: "#1B1B1B",
    typography: "#FFFFFF",
    dimmed: "#BFBFBF",
    tint: "#787878",
    activeTint: "#FFFFFF",
    link: "#0C2461",
    danger: "#FF5154",
    primary: "#6B9C00",
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
