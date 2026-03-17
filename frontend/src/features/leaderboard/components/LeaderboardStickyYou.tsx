import { Link } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import type { UserRank } from '../types';

interface LeaderboardStickyYouProps {
  userRank: UserRank | null;
  isAuthenticated: boolean;
  isInTop25: boolean;
}

export function LeaderboardStickyYou({ userRank, isAuthenticated, isInTop25 }: LeaderboardStickyYouProps) {
  const { C } = useTheme();

  // Logged out: sign-in prompt
  if (!isAuthenticated) {
    return (
      <div
        style={{
          borderTop: `2px solid ${C.rule}`,
          marginTop: '16px',
          padding: '20px 16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Lora', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '14px',
            color: C.muted,
            margin: '0 0 12px',
          }}
        >
          Want to see where you rank?
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '14px',
            letterSpacing: '0.14em',
            color: C.accent,
            textDecoration: 'none',
            border: `1px solid ${C.accent}`,
            padding: '8px 20px',
            borderRadius: '2px',
          }}
        >
          SIGN IN TO SEE YOUR RANK
        </Link>
      </div>
    );
  }

  // Authenticated + in top 25: nothing (row is highlighted in the main list)
  if (isInTop25) {
    return null;
  }

  // Authenticated + not in top 25 + has rank data
  if (userRank) {
    return (
      <div
        style={{
          borderTop: `2px solid ${C.rule}`,
          marginTop: '16px',
        }}
      >
        {/* Rank row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            background: `${C.accent}0D`,
          }}
        >
          {/* YOU label */}
          <span
            style={{
              width: '28px',
              textAlign: 'right',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: C.accent,
              flexShrink: 0,
            }}
          >
            YOU
          </span>

          {/* Rank number */}
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '14px',
              letterSpacing: '0.08em',
              color: C.muted,
              flexShrink: 0,
            }}
          >
            #{userRank.rank}
          </span>

          {/* Username + level */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '14px',
                color: C.ink,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userRank.username}
            </div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: C.muted,
              }}
            >
              LV {userRank.level}
            </div>
          </div>

          {/* XP */}
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '14px',
              letterSpacing: '0.06em',
              color: '#E8A020',
              flexShrink: 0,
            }}
          >
            {userRank.total_xp.toLocaleString()} XP
          </span>
        </div>

        {/* Gap message */}
        {userRank.gap_to_next > 0 && (
          <p
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '12px',
              color: C.muted,
              margin: '8px 16px 0',
              textAlign: 'right',
            }}
          >
            {userRank.gap_to_next.toLocaleString()} XP to move up
          </p>
        )}
      </div>
    );
  }

  // Authenticated + not in top 25 + no rank data (hasn't played)
  return (
    <div
      style={{
        borderTop: `2px solid ${C.rule}`,
        marginTop: '16px',
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '14px',
          color: C.muted,
          margin: '0 0 12px',
        }}
      >
        Play a game to appear on the leaderboard!
      </p>
      <Link
        to="/play"
        style={{
          display: 'inline-block',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '14px',
          letterSpacing: '0.14em',
          color: C.accent,
          textDecoration: 'none',
          border: `1px solid ${C.accent}`,
          padding: '8px 20px',
          borderRadius: '2px',
        }}
      >
        PLAY NOW
      </Link>
    </div>
  );
}
