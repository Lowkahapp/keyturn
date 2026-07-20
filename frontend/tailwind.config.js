export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: {
          DEFAULT: '#0078d7',
          50:  '#E6F2FC',
          100: '#B3D6F5',
          200: '#80BAEE',
          500: '#0078d7',
          600: '#0062B0',
          700: '#004C8A',
          800: '#003663',
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