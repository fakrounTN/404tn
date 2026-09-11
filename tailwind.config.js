/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0B0C0D',
          elevated: '#111214',
          subtle: '#17191B',
          card: '#141618',
        },
        surface: {
          50: '#F7F6F2',
          100: '#F1F0EC',
          200: '#E4E2DC',
          300: '#C8C6BE',
          400: '#9D9C96',
          500: '#73726C',
          600: '#4D4C47',
          700: '#32312E',
          800: '#1E1E1C',
          900: '#131415',
          950: '#0B0C0D',
        },
        crimson: {
          DEFAULT: '#C93636',
          muted: '#9E2A2A',
          glow: 'rgba(201, 54, 54, 0.15)',
          border: 'rgba(201, 54, 54, 0.35)',
        },
        sand: {
          DEFAULT: '#D4C5B0',
          muted: '#9B9080',
          dark: '#3A362F',
        },
        paper: {
          bg: '#FAF8F5',
          elevated: '#FFFFFF',
          subtle: '#F2EFE9',
          main: '#141517',
          primary: '#141517',
          muted: '#4A4D54',
          dim: '#6F737D',
          border: '#E5E0D8',
          'border-strong': '#CCC6BC',
          red: '#B91C1C',
          crimson: '#B91C1C',
          sand: '#854D0E',
        }
      },
      fontFamily: {
        editorial: ['"Newsreader"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      letterSpacing: {
        editorial: '-0.03em',
        meta: '0.12em',
        wideMeta: '0.2em',
      },
      lineHeight: {
        editorial: '1.12',
      },
    },
  },
  plugins: [],
}
