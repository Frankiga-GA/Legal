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
          black: 'var(--brand-black)',  /* Main background */
          dark: 'var(--brand-dark)',    /* Cards and Modals */
          gray: 'var(--brand-gray)',    /* Borders */
          accent: 'var(--brand-accent)',/* Secondary text */
          gold: 'var(--brand-gold)',    /* Primary actions */
          ivory: 'var(--brand-ivory)',  /* Primary text */
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in-up': 'fadeInUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 500ms ease-out both',
        'fade-in-slow': 'fadeIn 700ms ease-out both',
        'float-slow': 'floatSlow 14s ease-in-out infinite',
        'float-slower': 'floatSlow 22s ease-in-out infinite reverse',
        'float-slowest': 'floatSlow 30s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
