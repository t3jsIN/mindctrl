/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        'sf-pro': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'sf-text': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'meteor': 'meteor 5s linear infinite',
        'border-beam': 'border-beam var(--duration) infinite linear',
        'shine-pulse': 'shine-pulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        meteor: {
          '0%': { 
            transform: 'rotate(215deg) translateX(0)',
            opacity: '1',
          },
          '70%': { 
            opacity: '1',
          },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
        'border-beam': {
          '0%': {
            'offset-distance': '0%',
          },
          '100%': {
            'offset-distance': '100%',
          },
        },
        'shine-pulse': {
          '0%': {
            'background-position': '0% 0%',
          },
          '50%': {
            'background-position': '100% 100%',
          },
          '100%': {
            'background-position': '0% 0%',
          },
        },
      },
    },
  },
  plugins: [],
}