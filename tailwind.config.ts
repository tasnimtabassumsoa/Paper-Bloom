import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9f3c16',
        'primary-container': '#bf542c',
        'on-primary': '#ffffff',
        secondary: '#476553',
        'secondary-container': '#c7e8d1',
        'on-secondary': '#ffffff',
        surface: '#f6fbf5',
        'surface-warm': '#faf6f0',
        'surface-card': '#ffffff',
        'surface-muted': '#eef4ed',
        'on-surface': '#181d1a',
        'on-surface-muted': '#575e59',
        'outline-variant': '#dec0b7',
        'outline-subtle': '#eadcd6',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Noto Sans Bengali"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
