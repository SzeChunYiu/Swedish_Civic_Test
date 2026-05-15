/** Motion duration and easing tokens from DESIGN.md. */
export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
  easing: {
    standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
    press: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  pressedScale: 0.9,
  hoverScale: 1.05,
} as const;
