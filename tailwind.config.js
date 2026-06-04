/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#09090b',  /* zinc-950 - Main background */
          dark: '#18181b',   /* zinc-900 - Cards and Modals */
          gray: '#27272a',   /* zinc-800 - Borders */
          accent: '#a1a1aa', /* zinc-400 - Secondary text */
          gold: '#e4e4e7',   /* zinc-200 - Primary actions (was blue) */
          ivory: '#f4f4f5',  /* zinc-100 - Primary text */
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
