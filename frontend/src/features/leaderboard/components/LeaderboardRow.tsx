import { Avatar } from '../../../components/Avatar';
import { useTheme } from '../../../hooks/useTheme';
import type { LeaderboardEntry } from '../types';

const TIER_COLORS = {
  inform: 'muted' as const,
  connected: '#03B9D2',
  empowered: '#FF5740',
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isYou: boolean;
}

export function LeaderboardRow({ entry, isYou }: LeaderboardRowProps) {
  const { C } = useTheme();

  const tierColor =
    entry.tier === 'inform'
      ? C.muted
      : TIER_COLORS[entry.tier];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: isYou ? `${C.accent}14` : 'transparent',
        borderBottom: `1px solid ${C.ruleLight}`,
      }}
    >
      {/* Rank number */}
      <span
        style={{
          width: '28px',
          textAlign: 'right',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '16px',
          letterSpacing: '0.08em',
          color: C.muted,
          flexShrink: 0,
        }}
      >
        {entry.rank}
      </span>

      {/* Tier badge dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: tierColor,
          flexShrink: 0,
        }}
      />

      {/* Avatar */}
      <Avatar name={entry.username || (isYou ? 'You' : 'Player')} size={28} />

      {/* Username + level */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '14px',
            color: isYou ? C.ink : C.muted,
            fontStyle: 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.username || (isYou ? 'You' : 'Player')}
        </div>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: C.muted,
          }}
        >
          LV {entry.level}
        </div>
      </div>

      {/* Total XP */}
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '14px',
          letterSpacing: '0.06em',
          color: '#E8A020',
          flexShrink: 0,
        }}
      >
        {entry.total_xp.toLocaleString()} XP
      </span>
    </div>
  );
}
