import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggle: () => set((s) => ({ dark: !s.dark })),
    }),
    { name: 'travel-companion-theme' }
  )
);
