export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: {
          DEFAULT: '#2D5BFF',
          50:  '#EEF2FF',
          100: '#C7D4FF',
          200: '#A0B4FF',
          500: '#2D5BFF',
          600: '#1A45E0',
          700: '#1033C0',
          800: '#0A22A0',
        },
        accent: {
          DEFAULT: '#4CC9F0',
          50:  '#E8F9FE',
          100: '#B8EDFB',
          500: '#4CC9F0',
          600: '#1BBDE8',
        },
        verified: '#4CC9F0'
      }
    }
  },
  plugins: []
};
