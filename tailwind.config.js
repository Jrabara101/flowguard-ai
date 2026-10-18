/** @type {import('tailwindcss').Config} */
// Light admin theme modelled on Frest: grey canvas, white cards, one blue accent, three risk colours.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#5A8DEE', dark: '#4475D4', soft: '#E5EDFC' },
        canvas: '#F2F2F6',
        subtle: '#F4F6F8',
        line: '#DFE3E7',
        ink: '#304156',
        body: '#475F7B',
        muted: '#62778E',
        high: { DEFAULT: '#FF5B5C', text: '#C62828', soft: '#FFE5E5' },
        medium: { DEFAULT: '#FDAC41', text: '#935400', soft: '#FFF0DB' },
        low: { DEFAULT: '#39DA8A', text: '#16794A', soft: '#DCF8EA' },
      },
      fontFamily: {
        heading: ['Rubik', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 14px rgba(38, 60, 85, 0.08)',
        pop: '0 10px 30px rgba(38, 60, 85, 0.22)',
        primary: '0 2px 6px rgba(90, 141, 238, 0.4)',
      },
      zIndex: { drawer: '40', modal: '50', toast: '60' },
    },
  },
  plugins: [],
}
