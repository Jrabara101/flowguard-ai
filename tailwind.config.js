/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0B0C0E',
          900: '#121316',
          850: '#16181F',
          800: '#1C1F28',
          750: '#232733',
          700: '#2A303F',
          600: '#3D4558',
          500: '#5A647D',
          400: '#8E98B0',
          300: '#CBD2E1',
          200: '#E4E8F1',
          100: '#F3F5F9',
        },
        gold: {
          600: '#B89225',
          500: '#D4AF37', // Paradigm Gold
          400: '#F5C542',
          300: '#FDE08B',
          200: '#FEF0C3',
          100: '#FFF9E6',
        },
        risk: {
          green: '#10B981',
          greenBg: '#064E3B',
          greenBorder: '#059669',
          amber: '#F59E0B',
          amberBg: '#78350F',
          amberBorder: '#D97706',
          red: '#EF4444',
          redBg: '#7F1D1D',
          redBorder: '#DC2626',
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px -5px rgba(212, 175, 55, 0.35)',
        'red-glow': '0 0 20px -5px rgba(239, 68, 68, 0.35)',
        'amber-glow': '0 0 20px -5px rgba(245, 158, 11, 0.35)',
        'green-glow': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
      }
    },
  },
  plugins: [],
}
