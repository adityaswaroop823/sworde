/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds — warm dark, "anthracite/forge"
        obsidian: {
          50: '#22252E',
          100: '#1B1E26',
          200: '#16181F',
          300: '#11131A',
          400: '#0D0F15',
          500: '#0A0C11'
        },
        // Text on dark — warm bone/parchment
        bone: {
          50: '#FAF6EC',
          100: '#EFE9D8',
          200: '#DDD4BB',
          300: '#B5AB91',
          400: '#7E7665',
          500: '#5A5448'
        },
        // Accent — ember (forge fire amber/gold)
        ember: {
          300: '#F8C97A',
          400: '#F0AE5A',
          500: '#E2924A',
          600: '#C57935',
          700: '#945A24'
        },
        // Secondary — cool steel
        steel: {
          400: '#7FA8C0',
          500: '#5C89A4',
          600: '#456B85'
        },
        // Edge / hairline borders
        edge: {
          DEFAULT: '#262932',
          strong: '#343843',
          soft: '#1F2129'
        },
        // States
        rust: '#C75450', // danger
        sage: '#7FA67C' // success
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        display: [
          'Inter Variable',
          'Inter',
          '-apple-system',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.04em'
      },
      borderRadius: {
        none: '0',
        sharp: '2px',
        edge: '4px',
        forge: '6px',
        plate: '10px'
      },
      boxShadow: {
        plate: '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.4)',
        ember: '0 0 0 1px rgba(226, 146, 74, 0.25), 0 6px 24px -4px rgba(226, 146, 74, 0.18)',
        deep: '0 24px 48px -16px rgba(0, 0, 0, 0.5), 0 8px 16px -8px rgba(0, 0, 0, 0.4)'
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.025 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        'hairline-grid':
          'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '32px 32px'
      }
    }
  },
  plugins: []
}
