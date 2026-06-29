import { create } from "zustand";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  storeTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  initialized: boolean;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  init: () => void;
}

const ORDER: Theme[] = ["system", "light", "dark"];

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getStoredTheme(),
  resolvedTheme: resolveTheme(getStoredTheme()),
  initialized: false,

  setTheme: (theme) => {
    storeTheme(theme);
    const resolvedTheme = applyTheme(theme);
    set({ theme, resolvedTheme });
  },

  cycleTheme: () => {
    const current = get().theme;
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    get().setTheme(next);
  },

  init: () => {
    if (get().initialized) return;
    const theme = getStoredTheme();
    const resolvedTheme = applyTheme(theme);
    set({ theme, resolvedTheme, initialized: true });

    // React to OS theme changes while the user is on "system".
    if (typeof window !== "undefined" && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        if (get().theme === "system") {
          const resolved = getSystemTheme();
          applyTheme("system");
          set({ resolvedTheme: resolved });
        }
      };
      if (media.addEventListener) media.addEventListener("change", onChange);
      else media.addListener(onChange);
    }
  },
}));
