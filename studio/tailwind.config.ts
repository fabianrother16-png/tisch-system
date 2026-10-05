import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

// Gleiche Markenfarben wie die SICHTWERK-Website (../tailwind.config.ts).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: { DEFAULT: "#C1502E", light: "#D97350", dark: "#9C3F24" },
        anthracite: { DEFAULT: "#1E1A17", light: "#2A2420", lighter: "#3A322C" },
        cream: { DEFAULT: "#F5F1E8", dark: "#EAE3D3", darker: "#DCD2B8" },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};

export default config;
