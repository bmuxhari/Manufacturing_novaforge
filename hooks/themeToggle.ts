/**
 * Light / dark theme switch, shared by the navbar moon/sun button and the hero "Do not touch" effect.
 * Dark mode = data-theme="dark" on <html> (colours live in app/globals.css). The choice is saved in
 * localStorage and re-applied before the page paints by the small script in app/layout.tsx.
 */
export const THEME_STORAGE_KEY = "novaforge-theme";
const THEME_BAR_COLOURS = { light: "#ece2d0", dark: "#08080a" };

export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** Matches the phone browser bar colour to the current theme. */
export function syncThemeBarColour() {
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BAR_COLOURS[currentTheme()]);
}

/** Switches light ⇄ dark and remembers the choice. */
export function toggleTheme() {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  const root = document.documentElement;
  if (next === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode / storage blocked: the theme still switches, it just isn't remembered.
  }
  syncThemeBarColour();
}
