/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E5BFF',
          50: '#EBF1FF',
          100: '#D6E3FF',
          200: '#ADC7FF',
          300: '#85ABFF',
          400: '#5C8FFF',
          500: '#1E5BFF',
          600: '#0042E6',
          700: '#0031AD',
          800: '#002175',
          900: '#00103C',
        },
        secondary: {
          DEFAULT: '#F1A529',
          50: '#FEF6E8',
          100: '#FDEDD1',
          200: '#FBDBA3',
          300: '#F9C975',
          400: '#F7B747',
          500: '#F1A529',
          600: '#D48B0F',
          700: '#A16B0B',
          800: '#6D4808',
          900: '#3A2504',
        },
      },
    },
  },
  plugins: [],
}
