// Maze route and how the page sections map onto it. Shared by the 3D scene and the page (kept
// free of three.js so the page bundle stays small).

// The maze, seen from above (start at the bottom, heading -z), as [x, z] floor points:
// forward → turn LEFT → turn RIGHT → turn RIGHT → turn LEFT → the end of the maze.
export type P2 = [number, number]
export const CAMERA_START_Z = 10
export const TURNS: P2[] = [
  [0, -30], // left
  [-30, -30], // right
  [-30, -60], // right
  [0, -60], // left
]
export const CAMERA_ROUTE: P2[] = [[0, CAMERA_START_Z], ...TURNS, [0, -88]]

// Length of the camera's curve through CAMERA_ROUTE (rounded corners), and where along it the
// middle of each turn falls. Scene/layout.ts warns in development if these drift from the geometry.
export const ROUTE_LENGTH = 153.2
export const TURN_AT = [39.4, 68.2, 97.0, 125.8]

// Each turn is taken as one section's heading comes into view. Sections without a turn
// (the hero, The Approach) walk down the first corridor; Contact walks to the end of the maze.
export const TURN_SECTIONS = ['work', 'capabilities', 'about', 'feedback'] as const
export const END_SECTION = 'contact'
