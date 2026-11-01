// Shared motion language for the Projects section: long, soft ease-outs and no bounce.
// 'expo.out' is GSAP's built-in curve closest to cubic-bezier(0.16, 1, 0.3, 1); the CSS side uses that
// exact bezier (see .ease-cinema in index.css).
export const EASE = 'expo.out'
export const EASE_IN = 'power2.in'

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches
export const prefersReducedMotion = () => query('(prefers-reduced-motion: reduce)')
// Hover effects only where there is a real hovering pointer (not touch screens)
export const canHover = () => query('(hover: hover) and (pointer: fine)')
