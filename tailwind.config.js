/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          purple: '#9B51E0',
        },
        team: {
          ferrari: '#DC0000',
          mercedes: '#00D2BE',
          redbull: '#0600EF',
          mclaren: '#FF8700',
          aston: '#006F62',
          alpine: '#0090FF',
          williams: '#005AFF',
          alphatauri: '#2B4562',
          alfa: '#900000',
          haas: '#FFFFFF',
          sauber: '#52E252',
          rb: '#6692FF',
        },
        surface: '#0E0E1A',
        muted: '#1A1A2E',
        textMuted: '#A0A0B0',
      },
      fontFamily: {
        f1: ['Orbitron', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};