/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bubble: {
          light: '#E0F2FE',
          mid: '#C7D2FE',
          dark: '#A78BFA'
        }
      },
      backgroundImage: {
        'gradient-bubble': 'linear-gradient(135deg, #BFDBFE 0%, #C7D2FE 50%, #E9D5FF 100%)',
      },
      fontFamily: {
        rounded: ['system-ui', 'ui-rounded', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol']
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
