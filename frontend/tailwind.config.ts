import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F1B2D',
          green: '#22C55E',
          red: '#EF4444',
          amber: '#F59E0B',
        },
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(34, 197, 94, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
