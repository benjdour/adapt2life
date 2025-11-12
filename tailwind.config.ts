import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./design/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2.5rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "#0068B5",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2FBF71",
          foreground: "#0C0F12",
        },
        muted: {
          DEFAULT: "#15191C",
          foreground: "#6C757D",
        },
        info: "#5DA9E9",
        success: "#2FBF71",
        warning: "#F5A623",
        error: "#F25C54",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0068B5 0%, #2FBF71 100%)",
        "gradient-subtle": "linear-gradient(90deg, #001F3F 0%, #0C0F12 100%)",
        "gradient-accent": "radial-gradient(circle at top, rgba(0,104,181,0.4), rgba(47,191,113,0))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-heading)", ...defaultTheme.fontFamily.sans],
        accent: ["var(--font-accent)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        "2xl": "32px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.1)",
        md: "0 4px 6px rgba(0,0,0,0.15)",
        lg: "0 10px 20px rgba(0,0,0,0.25)",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.3s ease-in-out both",
      },
    },
  },
  plugins: [],
};

export default config;
