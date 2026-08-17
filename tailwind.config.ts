import type { Config } from "tailwindcss";

// ---------------------------------------------------------------------------
// Design-Tokens für "Fliesen Khalil"
// Farbpalette angelehnt an Fliesen & Naturstein: warmes Terrakotta trifft auf
// ein kühles Schiefer-/Naturstein-Blau. Wer die Marke später anpassen will,
// muss nur hier die Hex-Werte austauschen – der Rest der Seite zieht sich
// die Farben ausschließlich aus diesen Tokens.
// ---------------------------------------------------------------------------
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: "#FCF1E9",
          100: "#F8DFC9",
          200: "#F0BC93",
          300: "#E6985C",
          400: "#D97C3D",
          500: "#C1622D", // Primärfarbe (CTAs, Akzente)
          600: "#A34F24",
          700: "#7E3D1E",
          800: "#5E2E17",
          900: "#402011",
        },
        slate: {
          50: "#EEF2F5",
          100: "#D8E0E7",
          200: "#B2C1CD",
          300: "#8AA1B1",
          400: "#5E7C90",
          500: "#3E5B70", // Sekundärfarbe (Naturstein-Blau)
          600: "#304B5E",
          700: "#243A4A",
          800: "#1A2A35",
          900: "#101B22",
        },
        sand: {
          50: "#FFFDFA",
          100: "#FBF6EE",
          200: "#F4EADA",
          300: "#EBDBC0",
          400: "#DCC49D",
        },
        charcoal: {
          DEFAULT: "#2A2620",
          light: "#4A443A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "tile-grid":
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        tile: "48px 48px",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(42, 38, 32, 0.25)",
        card: "0 4px 20px -4px rgba(42, 38, 32, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
