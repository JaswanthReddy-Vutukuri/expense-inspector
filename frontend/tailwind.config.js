/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'ei-bg':       '#f8fafc',
        'ei-surface':  '#ffffff',
        'ei-border':   '#e2e8f0',
        'ei-muted':    '#94a3b8',
        'ei-text':     '#0f172a',
        'ei-subtle':   '#475569',
        'ei-accent':   '#6366f1',
        'ei-accent-d': '#4f46e5',
        'ei-indigo':   '#818cf8',
        'ei-emerald':  '#10b981',
        'ei-rose':     '#ef4444',
        'ei-amber':    '#f59e0b',
        'ei-cyan':     '#38bdf8',
        'ei-dark':     '#0f172a',
        'ei-dark-s':   '#1e293b',
        'ei-dark-b':   '#334155',
      },
      fontFamily: {
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-in-out',
        'slide-up':    'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-dot':  'bounceDot 1.4s infinite ease-in-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':           { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
