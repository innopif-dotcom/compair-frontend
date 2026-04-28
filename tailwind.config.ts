import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "on-tertiary-fixed-variant": "#59422c",
        "surface-tint": "#526070",
        "surface-variant": "#e2e2e2",
        surface: "#f9f9f8",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#0e1d2b",
        "surface-container-low": "#f3f4f3",
        "on-tertiary": "#ffffff",
        "secondary-fixed": "#c6e9e9",
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#002020",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#b9c8db",
        secondary: "#436464",
        "error-container": "#ffdad6",
        "on-surface": "#1a1c1c",
        "on-secondary-container": "#486868",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#eeeeed",
        background: "#f9f9f8",
        "inverse-primary": "#b9c8db",
        "on-background": "#1a1c1c",
        "on-primary-fixed-variant": "#3a4858",
        "primary-container": "#253342",
        "outline-variant": "#c4c6cc",
        "on-secondary-fixed-variant": "#2c4c4c",
        "on-tertiary-container": "#b29579",
        "on-primary-container": "#8d9bad",
        "inverse-on-surface": "#f1f1f0",
        "tertiary-fixed": "#feddbe",
        "tertiary-container": "#422e19",
        "on-error": "#ffffff",
        "inverse-surface": "#2f3130",
        tertiary: "#2b1906",
        "secondary-container": "#c3e6e6",
        outline: "#74777c",
        "surface-bright": "#f9f9f8",
        "surface-container-highest": "#e2e2e2",
        "secondary-fixed-dim": "#aacdcd",
        error: "#ba1a1a",
        "on-surface-variant": "#44474c",
        "tertiary-fixed-dim": "#e1c1a3",
        "on-tertiary-fixed": "#291805",
        "surface-dim": "#dadad9",
        "surface-container-high": "#e8e8e7",
        primary: "#0f1e2c",
        "primary-fixed": "#d5e4f8"
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        xs: "4px",
        gutter: "24px",
        lg: "48px",
        sm: "12px",
        base: "8px",
        xl: "80px",
        "container-max": "1280px",
        md: "24px"
      },
      fontFamily: {
        "body-lg": ["Public Sans", "sans-serif"],
        h1: ["Public Sans", "sans-serif"],
        h2: ["Public Sans", "sans-serif"],
        "body-sm": ["Public Sans", "sans-serif"],
        "body-md": ["Public Sans", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        display: ["Public Sans", "sans-serif"]
      },
      fontSize: {
        "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        display: ["40px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }]
      },
      maxWidth: {
        "container-max": "1280px"
      },
      keyframes: {
        "scale-in": {
          "0%": { transform: "scale(0.96) translateY(-4px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        }
      },
      animation: {
        "scale-in": "scale-in 140ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 120ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
