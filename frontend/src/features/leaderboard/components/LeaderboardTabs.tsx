import { useTheme } from '../../../hooks/useTheme';
import type { LeaderboardTab } from '../types';

interface LeaderboardTabsProps {
  active: LeaderboardTab;
  onChange: (tab: LeaderboardTab) => void;
}

const TABS: { key: LeaderboardTab; label: string }[] = [
  { key: 'all_time', label: 'ALL TIME' },
  { key: 'this_week', label: 'THIS WEEK' },
];

export function LeaderboardTabs({ active, onChange }: LeaderboardTabsProps) {
  const { C } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: `1px solid ${C.rule}`,
        marginBottom: '24px',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              padding: '10px 20px',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '15px',
              letterSpacing: '0.16em',
              color: isActive ? C.accent : C.muted,
              background: 'none',
              border: 'none',
              borderBottom: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
