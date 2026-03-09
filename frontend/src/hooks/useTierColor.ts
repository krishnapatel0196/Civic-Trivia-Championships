import { useAuthStore } from '../store/authStore';
import { useTheme } from './useTheme';

export function useTierColor(): string {
  const { tier, isAuthenticated } = useAuthStore();
  const { darkMode, C } = useTheme();

  if (tier === 'empowered') return '#FF5740';
  if (tier === 'connected') return darkMode ? '#03B9D2' : '#00657C';
  if (!isAuthenticated)     return darkMode ? '#59B0C4' : C.rule;
  return C.rule; // inform or unresolved
}
