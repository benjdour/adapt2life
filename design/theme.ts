export const adapt2LifeTheme = {
  colors: {
    primary: "#0068B5",
    secondary: "#2FBF71",
    backgroundDark: "#0C0F12",
    backgroundLight: "#F5F8FA",
    textPrimaryDark: "#FFFFFF",
    textPrimaryLight: "#1E1E1E",
    textSecondary: "#6C757D",
    error: "#F25C54",
    warning: "#F5A623",
    success: "#2FBF71",
    info: "#5DA9E9",
  },
  gradients: {
    primary: "linear-gradient(135deg, #0068B5 0%, #2FBF71 100%)",
    subtle: "linear-gradient(90deg, #001F3F 0%, #0C0F12 100%)",
    accentGlow: "radial-gradient(circle at top, rgba(0,104,181,0.4), rgba(47,191,113,0))",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
  radii: {
    sm: 6,
    md: 12,
    lg: 20,
    "2xl": 32,
  },
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.1)",
    md: "0 4px 6px rgba(0,0,0,0.15)",
    lg: "0 10px 20px rgba(0,0,0,0.25)",
  },
  opacity: {
    overlay: 0.6,
    disabled: 0.5,
  },
  blur: {
    overlay: "12px",
    card: "4px",
  },
  animation: {
    microInteraction: { duration: 150, easing: "ease-out" },
    transition: { duration: 250, easing: "ease-in-out" },
    modal: { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    graph: { duration: 500, easing: "ease-in-out" },
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
  navigation: {
    sidebar: {
      expandedWidth: 280,
      collapsedWidth: 96,
    },
  },
  grid: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      largeDesktop: 4,
    },
    columnGap: 16,
    rowGap: 24,
  },
  dataViz: {
    sleep: ["#4B9AEF", "#8AD8F1", "#0068B5"],
    stress: ["#FF7C43", "#FFB74D"],
    activity: ["#2FBF71", "#A5E26A"],
  },
} as const;

export type Adapt2LifeTheme = typeof adapt2LifeTheme;
