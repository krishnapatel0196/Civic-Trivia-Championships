import { useWindowSize } from '../../hooks/useWindowSize';

interface BalloonColors {
  base: string;
  light: string;
  shade: string;
}

const PALETTE: Record<string, BalloonColors> = {
  teal: { base: '#7FB3A3', light: '#A8D2C4', shade: '#5B9282' },
  mustard: { base: '#E0B458', light: '#F0D190', shade: '#C08F35' },
  terracotta: { base: '#D98B6E', light: '#E8B49A', shade: '#B5674C' },
  lavender: { base: '#B39DDB', light: '#D3C4EA', shade: '#8F76BB' },
  coral: { base: '#E28F8F', light: '#F0B8B8', shade: '#C06666' },
};

interface BalloonConfig {
  top: number;
  side: 'left' | 'right';
  edge: number; // % from that edge
  size: number; // px, envelope width
  colorKey: keyof typeof PALETTE;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  sway: number;
}

// Ordered safest-first (closest to the true edge) so smaller breakpoints can take a
// prefix of this list. Edge distance doubles as "depth": the further a balloon drifts
// in toward the center, the smaller/fainter/blurrier it is, like it's further away —
// which is also what keeps it from competing with the content it's floating past.
const CONFIGS: BalloonConfig[] = [
  { top: 110, side: 'left', edge: 0.5, size: 58, colorKey: 'teal', opacity: 0.55, blur: 0, duration: 17, delay: -3, sway: 4 },
  { top: 90, side: 'right', edge: 0.5, size: 54, colorKey: 'mustard', opacity: 0.52, blur: 0, duration: 19, delay: -8, sway: 5 },
  { top: 700, side: 'left', edge: 3, size: 40, colorKey: 'mustard', opacity: 0.34, blur: 0.5, duration: 22, delay: -13, sway: 4 },
  { top: 780, side: 'right', edge: 4, size: 44, colorKey: 'teal', opacity: 0.36, blur: 0.4, duration: 20, delay: -6, sway: 4 },
  { top: 300, side: 'left', edge: 7, size: 48, colorKey: 'terracotta', opacity: 0.42, blur: 0.5, duration: 21, delay: -11, sway: 6 },
  { top: 330, side: 'right', edge: 8, size: 46, colorKey: 'lavender', opacity: 0.4, blur: 0.5, duration: 18, delay: -5, sway: 5 },
  { top: 480, side: 'left', edge: 24, size: 34, colorKey: 'coral', opacity: 0.3, blur: 0.9, duration: 16, delay: -9, sway: 3 },
  { top: 520, side: 'right', edge: 16, size: 36, colorKey: 'lavender', opacity: 0.3, blur: 0.9, duration: 19, delay: -2, sway: 4 },
  { top: 630, side: 'left', edge: 30, size: 26, colorKey: 'teal', opacity: 0.2, blur: 1.3, duration: 23, delay: -15, sway: 3 },
  { top: 200, side: 'right', edge: 26, size: 24, colorKey: 'coral', opacity: 0.2, blur: 1.3, duration: 24, delay: -4, sway: 3 },
  { top: 900, side: 'left', edge: 5, size: 42, colorKey: 'terracotta', opacity: 0.32, blur: 0.5, duration: 20, delay: -7, sway: 4 },
  { top: 950, side: 'right', edge: 6, size: 38, colorKey: 'coral', opacity: 0.3, blur: 0.6, duration: 22, delay: -10, sway: 4 },
  { top: 550, side: 'left', edge: 38, size: 20, colorKey: 'mustard', opacity: 0.16, blur: 1.5, duration: 25, delay: -18, sway: 2 },
  { top: 250, side: 'right', edge: 32, size: 22, colorKey: 'terracotta', opacity: 0.17, blur: 1.5, duration: 24, delay: -1, sway: 2 },
  { top: 1050, side: 'right', edge: 5, size: 40, colorKey: 'lavender', opacity: 0.3, blur: 0.5, duration: 21, delay: -12, sway: 4 },
  { top: 1100, side: 'left', edge: 6, size: 36, colorKey: 'coral', opacity: 0.28, blur: 0.6, duration: 23, delay: -16, sway: 3 },
  { top: 400, side: 'left', edge: 32, size: 30, colorKey: 'mustard', opacity: 0.24, blur: 1, duration: 20, delay: -3, sway: 4 },
  { top: 600, side: 'right', edge: 20, size: 28, colorKey: 'terracotta', opacity: 0.24, blur: 1, duration: 22, delay: -14, sway: 3 },
  // Genuinely central — smallest, faintest, most blurred of all, so they read as
  // "far off in the middle distance" rather than competing with the hero/card.
  { top: 850, side: 'left', edge: 44, size: 18, colorKey: 'teal', opacity: 0.12, blur: 1.8, duration: 26, delay: -19, sway: 2 },
  { top: 1000, side: 'right', edge: 42, size: 16, colorKey: 'lavender', opacity: 0.12, blur: 1.8, duration: 27, delay: -6, sway: 2 },
  // The hero's own mid-gap — between the pitch text and the featured card. Pushed well
  // past the text column's typical width (not just the grid gap) to keep clear of it.
  { top: 130, side: 'left', edge: 46, size: 30, colorKey: 'coral', opacity: 0.3, blur: 0.6, duration: 18, delay: -4, sway: 4 },
  { top: 190, side: 'right', edge: 35, size: 34, colorKey: 'mustard', opacity: 0.34, blur: 0.4, duration: 20, delay: -10, sway: 4 },
  { top: 390, side: 'left', edge: 48, size: 26, colorKey: 'lavender', opacity: 0.26, blur: 0.8, duration: 19, delay: -14, sway: 3 },
];

interface CloudConfig {
  top: number;
  side: 'left' | 'right';
  edge: number;
  size: number;
  opacity: number;
}

// Purely static (no animation) — they're just soft sky texture, one less moving part.
const CLOUD_CONFIGS: CloudConfig[] = [
  { top: 50, side: 'left', edge: 2, size: 130, opacity: 0.55 },
  { top: 80, side: 'right', edge: 3, size: 110, opacity: 0.5 },
  { top: 250, side: 'right', edge: 1.5, size: 150, opacity: 0.4 },
  { top: 420, side: 'left', edge: 3, size: 100, opacity: 0.45 },
  { top: 600, side: 'right', edge: 10, size: 120, opacity: 0.4 },
  { top: 720, side: 'left', edge: 12, size: 90, opacity: 0.4 },
  { top: 850, side: 'right', edge: 6, size: 130, opacity: 0.38 },
  { top: 160, side: 'left', edge: 30, size: 60, opacity: 0.3 },
  { top: 950, side: 'left', edge: 8, size: 110, opacity: 0.36 },
  { top: 1080, side: 'right', edge: 14, size: 95, opacity: 0.34 },
  { top: 330, side: 'right', edge: 20, size: 70, opacity: 0.32 },
  { top: 500, side: 'left', edge: 34, size: 60, opacity: 0.28 },
  // Centered, soft — a hint of sky in the middle rather than clouds only at the sides.
  { top: 700, side: 'left', edge: 38, size: 90, opacity: 0.22 },
  { top: 900, side: 'right', edge: 40, size: 85, opacity: 0.2 },
  // The hero's own mid-gap, beside the pitch text and the featured card. Kept well
  // past the text column's typical width, not just the grid's own gap.
  { top: 60, side: 'right', edge: 33, size: 75, opacity: 0.4 },
  { top: 400, side: 'left', edge: 46, size: 50, opacity: 0.3 },
];

const STYLE_TAG = `
@keyframes cvt-balloon-drift {
  0%   { transform: translate(0, 0) rotate(0deg); }
  25%  { transform: translate(var(--balloon-sway, 6px), -10px) rotate(1.4deg); }
  50%  { transform: translate(0, -16px) rotate(0deg); }
  75%  { transform: translate(calc(var(--balloon-sway, 6px) * -1), -10px) rotate(-1.4deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
.cvt-balloon {
  animation: cvt-balloon-drift var(--balloon-duration, 18s) ease-in-out infinite;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out;
}
.cvt-balloon:hover {
  animation-play-state: paused;
  transform: scale(1.22) rotate(-4deg) !important;
  opacity: 1 !important;
  filter: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .cvt-balloon { animation: none; }
  .cvt-balloon:hover { transform: scale(1.08) !important; }
}
`;

function BalloonIcon({ size, colors, uid }: { size: number; colors: BalloonColors; uid: string }) {
  const clipId = `cvt-balloon-clip-${uid}`;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 100 130" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="50" cy="46" rx="38" ry="46" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="92" fill={colors.base} />
        <rect x="8" y="0" width="14" height="92" fill={colors.shade} opacity="0.5" />
        <rect x="36" y="0" width="14" height="92" fill={colors.light} opacity="0.4" />
        <rect x="64" y="0" width="14" height="92" fill={colors.shade} opacity="0.5" />
      </g>
      <ellipse cx="50" cy="46" rx="38" ry="46" fill="none" stroke={colors.shade} strokeWidth="1" opacity="0.35" />
      {/* Bunting: a small hanging pennant string, like the reference image's balloons */}
      <path d="M33 90 Q50 98 67 90" stroke={colors.shade} strokeWidth="1" fill="none" opacity="0.5" />
      <polygon points="39,91.5 42,91.5 40.5,96" fill={colors.shade} opacity="0.6" />
      <polygon points="47,94.5 50,94.5 48.5,99" fill={colors.light} opacity="0.6" />
      <polygon points="55,94.5 58,94.5 56.5,99" fill={colors.shade} opacity="0.6" />
      <polygon points="63,91.5 66,91.5 64.5,96" fill={colors.light} opacity="0.6" />
      <path d="M38 88 Q50 100 62 88 L58 100 Q50 106 42 100 Z" fill={colors.shade} />
      <line x1="42" y1="100" x2="34" y2="118" stroke="#8A7154" strokeWidth="1.5" />
      <line x1="58" y1="100" x2="66" y2="118" stroke="#8A7154" strokeWidth="1.5" />
      <rect x="32" y="116" width="36" height="14" rx="2" fill="#A9805A" />
      <rect x="32" y="116" width="36" height="14" rx="2" fill="none" stroke="#7A5C3E" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function CloudIcon({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" aria-hidden="true">
      <g fill="#FFFFFF" opacity={opacity}>
        <ellipse cx="50" cy="42" rx="38" ry="14" />
        <ellipse cx="30" cy="34" rx="22" ry="17" />
        <ellipse cx="54" cy="26" rx="24" ry="19" />
        <ellipse cx="74" cy="36" rx="18" ry="14" />
      </g>
    </svg>
  );
}

/**
 * Decorative light-mode backdrop: hot-air balloons and clouds drifting across the
 * whole page, each balloon hoverable for a playful little bounce. CSS-animated only
 * (no canvas/RAF), reduced to fewer elements on narrower screens.
 */
export function HotAirBalloons() {
  const { width } = useWindowSize();
  // Below 1280px there's little to no side gutter next to the centered 1240px content
  // column, so this tapers element count down rather than risk crowding the hero.
  const balloonCount = width >= 1280 ? 23 : width >= 1024 ? 12 : width >= 640 ? 5 : 2;
  const configs = CONFIGS.slice(0, balloonCount);
  const cloudCount = width >= 1280 ? 16 : width >= 1024 ? 9 : width >= 640 ? 4 : 2;
  const clouds = CLOUD_CONFIGS.slice(0, cloudCount);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
      <style>{STYLE_TAG}</style>
      {clouds.map((c, i) => (
        <div key={`cloud-${i}`} style={{ position: 'absolute', top: c.top, [c.side]: `${c.edge}%` }}>
          <CloudIcon size={c.size} opacity={c.opacity} />
        </div>
      ))}
      {configs.map((c, i) => {
        const colors = PALETTE[c.colorKey];
        return (
          <div
            key={i}
            className="cvt-balloon"
            style={{
              position: 'absolute',
              top: c.top,
              [c.side]: `${c.edge}%`,
              opacity: c.opacity,
              filter: c.blur ? `blur(${c.blur}px)` : undefined,
              pointerEvents: 'auto',
              ['--balloon-sway' as string]: `${c.sway}px`,
              ['--balloon-duration' as string]: `${c.duration * 0.55}s`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <BalloonIcon size={c.size} colors={colors} uid={`${i}`} />
          </div>
        );
      })}
    </div>
  );
}
