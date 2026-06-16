import type { PlayerXpData } from '../../../hooks/usePlayerXp';

interface XpStripProps {
  xpData: PlayerXpData | null;
  isLoading: boolean;
}

export function XpStrip({ xpData, isLoading }: XpStripProps) {
  if (isLoading) {
    return (
      <div style={{ marginTop: '20px', width: '224px', margin: '20px auto 0' }}>
        <div style={{ height: '14px', background: 'rgba(60,44,28,0.5)', borderRadius: '1px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '4px', background: 'rgba(60,44,28,0.5)', borderRadius: '1px', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!xpData) return null;

  const xpNeeded = xpData.xpInLevel + xpData.xpToNextLevel;
  const progress = xpNeeded > 0 ? xpData.xpInLevel / xpNeeded : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <div style={{ marginTop: '20px', width: '224px', margin: '20px auto 0', textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: '13px',
        letterSpacing: '0.18em',
        color: '#A08870',
        marginBottom: '4px',
      }}>
        LEVEL {xpData.level}
      </div>
      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '11px',
        color: '#5C4838',
        marginBottom: '8px',
      }}>
        {xpData.xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
      </div>
      <div
        style={{
          height: '3px',
          background: '#2E2620',
          borderRadius: '1px',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP progress: ${progressPercent}%`}
      >
        <div
          style={{
            height: '100%',
            background: '#E8A020',
            borderRadius: '1px',
            transition: 'width 0.5s ease',
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
}
