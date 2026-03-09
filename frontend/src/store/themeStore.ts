import { create } from 'zustand';

interface ThemeStore {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  darkMode: localStorage.getItem('ctc-theme') !== 'light',
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('ctc-theme', next ? 'dark' : 'light');
      return { darkMode: next };
    }),
}));
