/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      borderRadius: {
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
      colors: {
        slate: {
          950: '#000000',
          900: '#000000',
          800: '#222222',
        }
      }
    },
  },
  plugins: [],
}
