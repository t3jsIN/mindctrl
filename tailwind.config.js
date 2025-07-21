/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      // Add SF Pro font families
      fontFamily: {
        'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        'display': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'text': ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'sf-pro': ['SF Pro Display', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      // Add more font weights for SF Pro
      fontWeight: {
        'ultralight': '200',
        'thin': '100',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'heavy': '800',
        'black': '900'
      },
      // Keep your existing animations
      animation: {
        meteor: 'meteor 5s linear infinite',
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
        "shine-pulse": "shine-pulse var(--shine-pulse-duration) infinite linear",
      },
      // Keep your existing keyframes
      keyframes: {
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': {
            transform: 'rotate(215deg) translateX(-500px)',
            opacity: '0',
          },
        },
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        "shine-pulse": {
          "0%": {
            "background-position": "0% 0%",
          },
          "50%": {
            "background-position": "100% 100%",
          },
          "100%": {
            "background-position": "0% 0%",
          },
        },
      },
    },
  },
  plugins: [],
};