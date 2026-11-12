/** True when the visitor asked their OS for less motion. Browser only. */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on devices with a real mouse (not touch). Browser only. */
export function hasFinePointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
