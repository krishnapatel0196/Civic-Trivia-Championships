import { useThemeStore } from '../store/themeStore';

export interface ColorTokens {
  paper: string;
  ink: string;
  inkLight: string;
  rule: string;
  ruleLight: string;
  muted: string;
  mutedFg: string;
  accent: string;
  accentHover: string;
  gold: string;
  amber: string;
  correct: string;
  incorrect: string;
  gems: string;
  xpBg: string;
}

export const LIGHT: ColorTokens = {
  paper:       '#FFFFFF',
  ink:         '#17120E',
  inkLight:    '#3D2E22',
  rule:        '#C8BAA6',
  ruleLight:   '#DDD5C3',
  muted:       '#7A6A5A',
  mutedFg:     '#9A8878',
  accent:      '#C63B18',
  accentHover: '#A82F12',
  gold:        '#B8860B',
  amber:       '#92400E',
  correct:     '#255C3F',
  incorrect:   '#C0152A',
  gems:        '#7A5A9A',
  xpBg:        '#1E1610',
};

export const DARK: ColorTokens = {
  paper:       '#0B1628',
  ink:         '#F1F1F1',
  inkLight:    '#AAAAAA',
  rule:        '#1C2E40',
  ruleLight:   '#122030',
  muted:       '#888888',
  mutedFg:     '#666666',
  accent:      '#E04820',
  accentHover: '#C03A18',
  gold:        '#D4A017',
  amber:       '#D4952A',
  correct:     '#3A8A5F',
  incorrect:   '#E0253A',
  gems:        '#9A7ABF',
  xpBg:        '#080E1A',
};

export function useTheme() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  return {
    darkMode,
    toggleDarkMode,
    C: darkMode ? DARK : LIGHT,
  };
}
