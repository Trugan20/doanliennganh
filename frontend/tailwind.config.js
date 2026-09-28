/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dental: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e8fd',
          300: '#7dd4fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        mint: {
          50:  '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,.04), 0 4px 16px 0 rgba(0,0,0,.06)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,.06), 0 12px 32px -4px rgba(14,165,233,.18)',
        'glow': '0 0 24px rgba(14,165,233,.35)',
      },
      backgroundImage: {
        'gradient-dental': 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0c4a6e 0%, #134e4a 100%)',
      },
      animation: {
        'fade-in': 'fadeIn .4s ease both',
        'slide-up': 'slideUp .4s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(.4,0,.6,1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}