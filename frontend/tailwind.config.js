export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary:  { DEFAULT: '#1D6F42', 50: '#E8F5EE', 100: '#C6E6D1', 200: '#A3D4B8', 500: '#1D6F42', 600: '#165934', 700: '#0F3D24', 800: '#092918' },
        accent:   { DEFAULT: '#F59E0B', 50: '#FFFBEB', 500: '#F59E0B', 600: '#D97706' },
        verified: '#059669'
      }
    }
  },
  plugins: []
};