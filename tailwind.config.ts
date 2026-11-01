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
        // The theme's accent everywhere except White, where it is warm yellow (see index.css)
        pop: 'rgb(var(--c-pop) / <alpha-value>)',
        'pop-text': 'rgb(var(--c-pop-text) / <alpha-value>)',
        // Text on a solid accent background: white, or near-black for the light accents
        'on-accent': 'rgb(var(--c-on-accent) / <alpha-value>)',
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
