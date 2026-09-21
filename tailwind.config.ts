import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: "#C1502E",
          light: "#D97350",
          dark: "#9C3F24",
        },
        anthracite: {
          DEFAULT: "#1E1A17",
          light: "#2A2420",
          lighter: "#3A322C",
        },
        cream: {
          DEFAULT: "#F5F1E8",
          dark: "#EAE3D3",
          darker: "#DCD2B8",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-work-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1400px",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "bar-rise": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "star-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "bar-rise-1": "bar-rise 2.4s ease-in-out infinite",
        "bar-rise-2": "bar-rise 2.4s ease-in-out infinite 0.2s",
        "bar-rise-3": "bar-rise 2.4s ease-in-out infinite 0.4s",
        "bar-rise-4": "bar-rise 2.4s ease-in-out infinite 0.6s",
        marquee: "marquee 32s linear infinite",
        "star-pulse": "star-pulse 2.4s ease-in-out infinite",
      },
      backgroundImage: {
        grain: "url('/noise.svg')",
      },
    },
  },
  plugins: [],
};

export default config;
