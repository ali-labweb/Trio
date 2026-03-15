import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  dark: boolean;
  useFahrenheit: boolean;
  useMiles: boolean;
  toggleDark: () => void;
  toggleTempUnit: () => void;
  toggleDistUnit: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      useFahrenheit: true,
      useMiles: true,
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      toggleTempUnit: () => set((s) => ({ useFahrenheit: !s.useFahrenheit })),
      toggleDistUnit: () => set((s) => ({ useMiles: !s.useMiles })),
    }),
    { name: 'travel-companion-settings' }
  )
);

export function formatTemp(celsius: number, useFahrenheit: boolean): string {
  if (useFahrenheit) {
    return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatDist(km: number, useMiles: boolean): string {
  if (useMiles) {
    return `${(km * 0.621371).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}
