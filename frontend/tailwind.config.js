/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design System Core Tokens
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          active: '#166534',
          deep: '#14532D',
          soft: '#F0FDF4',
        },
        'deep-green': '#14532D',
        'soft-green': '#F0FDF4',
        surface: {
          DEFAULT: '#F7F9F5',
          card: '#FFFFFF',
          cream: '#FEFCE8',
          muted: '#F1F5F0',
        },
        cream: '#FEFCE8',
        info: {
          DEFAULT: '#2563EB',
          light: '#EFF6FF',
          dark: '#1D4ED8',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
          dark: '#B91C1C',
        },
        content: {
          DEFAULT: '#17201A',
          muted: '#64748B',
          subtle: '#94A3B8',
        },
        // Legacy compatibility tokens
        kisan: {
          green: {
            50: '#F0FDF4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
          },
          deep: '#14532D',
          soft: '#F0FDF4',
          cream: '#FEFCE8',
          blue: '#2563EB',
          orange: '#F59E0B',
          red: '#DC2626',
          text: '#17201A',
          muted: '#64748B',
          bg: '#F7F9F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'section-title': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        body: ['14px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '16px' }],
        metric: ['32px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      borderRadius: {
        xl: '0.75rem',    // 12px for inputs/buttons
        '2xl': '1rem',    // 16px for cards
        '3xl': '1.5rem',  // 24px for hero cards
        full: '9999px',   // for badges
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

