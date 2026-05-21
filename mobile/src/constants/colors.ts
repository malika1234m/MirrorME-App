export const Colors = {
  // Core backgrounds
  background: "#080808",
  surface: "#111111",
  card: "#161616",
  cardElevated: "#1C1C1E",
  border: "#242424",
  borderLight: "#2E2E2E",

  // Brand
  primary: "#C8FF00",
  primaryDim: "#A8D900",
  primaryGlow: "rgba(200,255,0,0.15)",
  primarySubtle: "rgba(200,255,0,0.08)",

  // Accent
  accent: "#FF3CAC",
  accentDim: "rgba(255,60,172,0.15)",
  accentBlue: "#8B5CF6",
  accentBlueSubtle: "rgba(139,92,246,0.12)",

  // Semantic
  white: "#FFFFFF",
  success: "#00E676",
  warning: "#FFD60A",
  error: "#FF453A",
  info: "#0A84FF",

  // Text hierarchy
  text: {
    primary: "#FFFFFF",
    secondary: "#8E8E93",
    tertiary: "#636366",
    inverse: "#080808",
    accent: "#C8FF00",
  },

  // Overlays
  overlay: {
    dark: "rgba(0,0,0,0.75)",
    medium: "rgba(0,0,0,0.5)",
    light: "rgba(0,0,0,0.25)",
    card: "rgba(22,22,22,0.92)",
  },

  // Gradients (typed for LinearGradient)
  gradient: {
    primary: ["#C8FF00", "#78D500"] as [string, string],
    accent: ["#FF3CAC", "#8B5CF6"] as [string, string],
    accentThree: ["#FF3CAC", "#8B5CF6", "#2B86C5"] as [string, string, string],
    dark: ["rgba(8,8,8,0)", "rgba(8,8,8,0.95)"] as [string, string],
    darkFull: ["#080808", "#111111"] as [string, string],
    card: ["rgba(22,22,22,0)", "rgba(22,22,22,1)"] as [string, string],
    shine: ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0)"] as [string, string, string],
    skeleton: ["#1C1C1E", "#242424", "#1C1C1E"] as [string, string, string],
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const Typography = {
  // Display
  display: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.8, lineHeight: 40 },
  title1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, lineHeight: 28 },
  title3: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.2, lineHeight: 24 },

  // Body
  bodyLarge: { fontSize: 17, fontWeight: "400" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },

  // Labels
  labelLarge: { fontSize: 15, fontWeight: "600" as const, letterSpacing: 0.1 },
  label: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.1 },
  labelSmall: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: "400" as const, letterSpacing: 0.2 },
} as const;
