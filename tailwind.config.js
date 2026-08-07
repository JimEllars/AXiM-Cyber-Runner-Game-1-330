/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff007f',
          gold: '#ffb700',
          bg: '#0a0a12'
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}