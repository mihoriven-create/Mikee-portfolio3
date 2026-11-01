import { CloudLightning, CloudOff, Flower2, Leaf, Snowflake, Sun } from 'lucide-react'

// Seasonal weather, switched with the button beside the hero orb (and the one riding with the
// travelling orb). It is a separate layer from the colour themes, so every season works with every
// theme. The choice is remembered in this browser.
export const SEASONS = [
  { id: 'off', label: 'Weather off', icon: CloudOff },
  { id: 'spring', label: 'Spring', icon: Flower2 },
  { id: 'summer', label: 'Summer', icon: Sun },
  { id: 'autumn', label: 'Autumn', icon: Leaf },
  { id: 'winter', label: 'Winter', icon: Snowflake },
  { id: 'storm', label: 'Rain & thunder', icon: CloudLightning },
] as const

export type SeasonId = (typeof SEASONS)[number]['id']

const KEY = 'mjb-weather'
// Fired on window whenever the season changes, so the button and the weather layer stay in step
export const WEATHER_CHANGE = 'mjb-weather-change'

let current: SeasonId = (() => {
  try {
    const saved = localStorage.getItem(KEY)
    return SEASONS.some((s) => s.id === saved) ? (saved as SeasonId) : 'off'
  } catch {
    return 'off'
  }
})()

export const getSeason = () => current

export const seasonLabel = (id: SeasonId) => SEASONS.find((s) => s.id === id)!.label
export const seasonIcon = (id: SeasonId) => SEASONS.find((s) => s.id === id)!.icon

// The season after the current one, wrapping round through "off"
export function nextSeason(): SeasonId {
  const i = SEASONS.findIndex((s) => s.id === current)
  return SEASONS[(i + 1) % SEASONS.length].id
}

export function setSeason(id: SeasonId) {
  current = id
  window.dispatchEvent(new Event(WEATHER_CHANGE))
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // storage blocked (private mode): the season still applies for this visit
  }
}
