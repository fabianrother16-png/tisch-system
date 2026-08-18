/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warme Erdtöne + Anthrazit + Holz-Optik, passend zum Handwerk
        sand: {
          50: '#FBF8F3',
          100: '#F6F0E6',
          200: '#EDE3D1',
          300: '#DFCFAF',
        },
        ink: {
          50: '#F4F3F1',
          200: '#B8B4AC',
          400: '#726C60',
          600: '#413D35',
          800: '#26241F',
          900: '#1A1815',
          950: '#121110',
        },
        clay: {
          50: '#FDF3EE',
          100: '#FBE4D8',
          200: '#F3C3A8',
          300: '#E49E75',
          400: '#D67D4F',
          500: '#C1653C',
          600: '#A44F2C',
          700: '#83401F',
          800: '#5E2E17',
        },
        moss: {
          400: '#8A9878',
          500: '#6F7F5C',
          600: '#586448',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(26, 24, 21, 0.25)',
        card: '0 2px 10px rgba(26, 24, 21, 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(193,101,60,0.35)' },
          '50%': { boxShadow: '0 0 0 10px rgba(193,101,60,0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in 0.6s ease-out both',
        float: 'float 5s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}
