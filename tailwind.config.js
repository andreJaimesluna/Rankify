/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8a2ce2',
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#dccfff',
          300: '#c4a8ff',
          400: '#a875ff',
          500: '#8a2ce2',
          600: '#7c22d9',
          700: '#6b1dc4',
          800: '#5a199f',
          900: '#4b1782',
        },
        dark: {
          DEFAULT: '#1a1a2e',
          50: '#f4f4f6',
          100: '#e4e4e9',
          200: '#c9c9d3',
          300: '#a3a3b3',
          400: '#74748a',
          500: '#595970',
          600: '#4a4a5e',
          700: '#3d3d4f',
          800: '#2d2d3f',
          900: '#1a1a2e',
          950: '#0f0f1a',
        },
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        gold: '#ffd700',
        silver: '#c0c0c0',
        bronze: '#cd7f32',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
