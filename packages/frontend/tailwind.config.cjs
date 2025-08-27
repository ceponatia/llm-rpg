// Tailwind configuration

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        twilight: {
          50: '#f5f7fa',
          100: '#eaeef5',
          200: '#cdd6e6',
          300: '#aebcd6',
          400: '#8093bd',
          500: '#536aa4',
          600: '#3c4f84',
          700: '#2f3e67',
          800: '#243051',
          900: '#192138',
          950: '#0f1625'
        },
        accent: {
          400: '#d889ff',
          500: '#b464f5',
          600: '#8a42cc'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(180,100,245,0.3), 0 0 12px -2px rgba(180,100,245,0.45)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
