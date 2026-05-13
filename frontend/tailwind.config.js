/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F7F8FA',
          card: '#FFFFFF',
          ink: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
        },
        brand: {
          DEFAULT: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
        },
        ok: '#22C55E',
        warn: '#F59E0B',
        danger: '#EF4444',
        purple: '#8B5CF6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [import('tailwindcss-animate')],
};
