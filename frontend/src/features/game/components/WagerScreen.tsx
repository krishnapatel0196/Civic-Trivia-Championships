import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOPIC_LABELS } from './TopicIcon';
import type { TopicCategory } from '../../../types/game';
import { useTheme } from '../../../hooks/useTheme';
import { GemIcon } from '../../../components/icons/GemIcon';

const GEM_SCORE_THRESHOLD = 1000;

interface WagerScreenProps {
  currentScore: number;
  category: string;
  wagerAmount: number;
  onSetWager: (amount: number) => void;
  onLockWager: () => void;
  isLocked: boolean;
}

export function WagerScreen({
  currentScore,
  category,
  wagerAmount,
  onSetWager,
  onLockWager,
  isLocked,
}: WagerScreenProps) {
  const { C } = useTheme();
  const maxWager = Math.floor(currentScore / 2);
  const hasPoints = currentScore > 0;
  const categoryLabel = TOPIC_LABELS[category as TopicCategory] || category;
  const ifCorrect = currentScore + wagerAmount;
  const ifWrong   = currentScore - wagerAmount;

  const meetsGemThreshold = ifCorrect >= GEM_SCORE_THRESHOLD;
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetWager(parseInt(e.target.value, 10));
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLocked) return;
    switch (e.key) {
      case 'PageDown': e.preventDefault(); onSetWager(Math.max(0, wagerAmount - 50)); break;
      case 'PageUp':   e.preventDefault(); onSetWager(Math.min(maxWager, wagerAmount + 50)); break;
      case 'Home':     e.preventDefault(); onSetWager(0); break;
      case 'End':      e.preventDefault(); onSetWager(maxWager); break;
    }
  };

  const sliderFillPct = maxWager > 0 ? (wagerAmount / maxWager) * 100 : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: C.paper,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Lora', Georgia, serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '560px', width: '100%' }}
      >
        {/* Final Question image + category */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/images/FinalQuestion_A.png"
            alt="Final Question"
            style={{ height: '23vh', maxHeight: '180px', objectFit: 'contain', display: 'inline-block', marginBottom: '16px' }}
          />
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.22em',
            fontSize: '13px',
            color: C.muted,
            margin: 0,
          }}>
            CATEGORY: <span style={{ color: C.ink }}>{categoryLabel.toUpperCase()}</span>
          </p>
        </div>

        {/* Current score */}
        <div style={{
          textAlign: 'center',
          borderTop: `1px solid ${C.rule}`,
          borderBottom: `1px solid ${C.rule}`,
          padding: '16px 0',
          marginBottom: '28px',
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.16em',
            fontSize: '11px',
            color: C.mutedFg,
            marginBottom: '4px',
          }}>
            YOUR SCORE
          </div>
          <div
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
          >
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '52px',
              lineHeight: 1,
              color: C.ink,
            }}>
              {currentScore.toLocaleString()}
            </div>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: '-8px',
                    background: C.ink,
                    color: C.paper,
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontFamily: "'Lora', Georgia, serif",
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    borderRadius: '2px',
                  }}
                >
                  Score 1,000+ to earn a gem. Perfect score earns 2 gems.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Wager card */}
        <div style={{
          border: `1px solid ${C.rule}`,
          padding: '24px',
          marginBottom: '24px',
        }}>
          {/* Wager amount */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.16em',
              fontSize: '11px',
              color: C.mutedFg,
              marginBottom: '4px',
            }}>
              WAGER
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '44px',
              lineHeight: 1,
              color: C.amber,
            }}>
              {wagerAmount.toLocaleString()}
            </div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.12em',
              fontSize: '10px',
              color: C.mutedFg,
              marginTop: '2px',
            }}>
              POINTS
            </div>
          </div>

          {/* Gem indicator */}
          <motion.div
            animate={{
              color: meetsGemThreshold ? C.gold : C.mutedFg,
              opacity: meetsGemThreshold ? 1 : 0.4,
            }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center', marginBottom: '16px' }}
          >
            <GemIcon className="w-6 h-6" />
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '9px',
              letterSpacing: '0.16em',
              color: C.mutedFg,
              marginTop: '4px',
            }}>
              1,000 PTS FOR A GEM
            </div>
          </motion.div>

          {/* Slider */}
          {hasPoints ? (
            <div style={{ marginBottom: '20px' }}>
              <input
                type="range"
                min={0}
                max={maxWager}
                step={10}
                value={wagerAmount}
                onChange={handleSliderChange}
                onKeyDown={handleSliderKeyDown}
                disabled={isLocked}
                aria-label="Wager amount"
                aria-valuemin={0}
                aria-valuemax={maxWager}
                aria-valuenow={wagerAmount}
                aria-valuetext={`${wagerAmount} points`}
                className="ctc-wager-slider"
                style={{
                  width: '100%',
                  height: '4px',
                  appearance: 'none',
                  borderRadius: '2px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.5 : 1,
                  background: `linear-gradient(to right, ${C.accent} 0%, ${C.accent} ${sliderFillPct}%, ${C.ruleLight} ${sliderFillPct}%, ${C.ruleLight} 100%)`,
                  outline: 'none',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '6px',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: C.mutedFg,
              }}>
                <span>0</span>
                <span>{maxWager.toLocaleString()} MAX</span>
              </div>

              {/* Percentage quick-select buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '10px',
              }}>
                {([25, 50, 75, 100] as const).map((pct) => {
                  const amount = Math.floor(maxWager * pct / 100 / 10) * 10;
                  const isActive = wagerAmount === amount;
                  return (
                    <button
                      key={pct}
                      onClick={() => !isLocked && onSetWager(amount)}
                      disabled={isLocked}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        borderRadius: '6px',
                        border: `1px solid ${isActive ? C.accent : C.rule}`,
                        background: isActive ? C.accent : 'transparent',
                        color: isActive ? '#FFFFFF' : C.muted,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      }}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted, fontStyle: 'italic', fontSize: '14px' }}>
              No points to wager
            </div>
          )}

          {/* Outcome preview */}
          <div role="group" aria-label="Wager outcome preview" aria-live="polite">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderTop: `1px solid ${C.ruleLight}`,
            }}>
              <span style={{ fontStyle: 'italic', fontSize: '14px', color: C.muted }}>If correct:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '22px',
                  color: C.correct,
                  transition: 'color 0.2s',
                }}>
                  +{ifCorrect.toLocaleString()}
                </span>
                {meetsGemThreshold && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                    <span style={{ color: C.gold }}><GemIcon className="w-4 h-4" /></span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '14px',
                      letterSpacing: '0.06em',
                      color: C.gold,
                    }}>+1 GEM</span>
                  </span>
                )}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderTop: `1px solid ${C.ruleLight}`,
            }}>
              <span style={{ fontStyle: 'italic', fontSize: '14px', color: C.muted }}>If wrong:</span>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '22px',
                color: C.incorrect,
                transition: 'color 0.2s',
              }}>
                {ifWrong.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onLockWager}
          disabled={isLocked}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            minHeight: '52px',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '20px',
            letterSpacing: '0.14em',
            border: wagerAmount === 0 ? `1px solid ${C.rule}` : 'none',
            background: isLocked ? C.rule : wagerAmount === 0 ? 'transparent' : C.accent,
            color: isLocked ? C.mutedFg : wagerAmount === 0 ? C.muted : '#FFFFFF',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            if (!isLocked && wagerAmount > 0) e.currentTarget.style.background = C.accentHover;
          }}
          onMouseLeave={e => {
            if (!isLocked && wagerAmount > 0) e.currentTarget.style.background = C.accent;
          }}
        >
          {isLocked ? 'LOCKED — GET READY…' : wagerAmount === 0 ? 'PLAY FOR FUN' : 'LOCK IN WAGER'}
        </button>
      </motion.div>

      <style>{`
        .ctc-wager-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 2px;
          background: ${C.accent};
          cursor: pointer;
          border: none;
        }
        .ctc-wager-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 2px;
          background: ${C.accent};
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
