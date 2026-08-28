export const THEMES = ["navy", "charcoal", "black"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  navy: "Navy",
  charcoal: "Charcoal",
  black: "Black",
};

export const THEME_SWATCH: Record<Theme, string> = {
  navy: "#0c1222",
  charcoal: "#18181b",
  black: "#121214",
};

export const DEFAULT_THEME: Theme = "navy";
export const THEME_STORAGE_KEY = "gymlead_theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

// Inlined into a <script> tag at the top of <body> so the saved theme
// applies before first paint - avoids a flash of the default theme.
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (t === 'navy' || t === 'charcoal' || t === 'black') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;
