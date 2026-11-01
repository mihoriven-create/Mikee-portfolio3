// Colour themes. Each one sets the accent variables defined in index.css; the choice is remembered
// in this browser and applied before first paint by the small script in index.html.
export const THEMES = [
  { id: 'crimson', label: 'Crimson', swatch: '#ff2a1f' },
  { id: 'cobalt', label: 'Cobalt', swatch: '#2f8bff' },
  { id: 'emerald', label: 'Emerald', swatch: '#10be6e' },
  { id: 'violet', label: 'Violet', swatch: '#a050ff' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

const KEY = 'mjb-theme'
// Fired on window whenever the theme changes, so every control showing the theme stays in step
export const THEME_CHANGE = 'mjb-theme-change'

export function getTheme(): ThemeId {
  const current = document.documentElement.dataset.theme
  return THEMES.some((t) => t.id === current) ? (current as ThemeId) : 'crimson'
}

export const themeLabel = (id: ThemeId) => THEMES.find((t) => t.id === id)!.label

// The theme after the current one, wrapping round (used by the hero orb)
export function nextTheme(): ThemeId {
  const i = THEMES.findIndex((t) => t.id === getTheme())
  return THEMES[(i + 1) % THEMES.length].id
}

export function setTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  window.dispatchEvent(new Event(THEME_CHANGE))
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // storage blocked (private mode): the theme still applies for this visit
  }
}
