import type { Config } from 'tailwindcss'
import { site } from './src/config/site'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: site.colors.bg,
        // Accent colours come from the active colour theme (see the theme blocks in index.css)
        red: 'rgb(var(--c-red) / <alpha-value>)',
        ember: 'rgb(var(--c-ember) / <alpha-value>)',
        blood: 'rgb(var(--c-blood) / <alpha-value>)',
        signal: 'rgb(var(--c-signal) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgb(var(--c-red) / 0.7), inset 0 0 12px -6px rgb(var(--c-red))',
      },
    },
  },
} satisfies Config
