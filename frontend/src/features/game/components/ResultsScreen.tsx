import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import type { GameResult, Question, LearningContent } from '../../../types/game';
import type { TopicCategory } from '../../../types/game';
import { TOPIC_LABELS } from './TopicIcon';
import { LearnMoreModal } from './LearnMoreModal';
import { FlagButton } from './FlagButton';
import { GemIcon } from '../../../components/icons/GemIcon';
import { useConfettiStore } from '../../../store/confettiStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { announce } from '../../../utils/announce';
import { XpReveal } from './XpReveal';
import { LevelUpOverlay } from './LevelUpOverlay';
import { ACCOUNTS_WEB_URL } from '../../../services/accountsApi';
import { useGameTheme } from '../gameTheme';
import { Header } from '../../../components/layout/Header';

const GEM_SCORE_THRESHOLD = 1000;

interface ResultsScreenProps {
  result: GameResult;
  questions: Question[];
  collectionName?: string | null;
  onPlayAgain: () => void;
  onHome: () => void;
  flaggedQuestions?: Set<string>;
  onFlagToggle?: (questionId: string) => void;
  priorLevel?: number | null;
  onLevelCaptured?: (level: number) => void;
}

export function ResultsScreen({
  result,
  questions,
  collectionName,
  onPlayAgain,
  flaggedQuestions,
  onFlagToggle,
  priorLevel,
  onLevelCaptured,
}: ResultsScreenProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [learnMoreQuestion, setLearnMoreQuestion] = useState<{
    content: LearningContent;
    userAnswer: number | null;
    correctAnswer: number;
  } | null>(null);

  const navigate = useNavigate();
  const motionScore = useMotionValue(0);
  const accordionButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const accuracy      = Math.round((result.totalCorrect / result.totalQuestions) * 100);
  const isPerfectGame = result.totalCorrect === result.totalQuestions;
  const missed        = result.totalQuestions - result.totalCorrect;

  const { fireConfettiRain } = useConfettiStore();
  const reducedMotion        = useReducedMotion();
  const { G, darkMode }      = useGameTheme();

  useEffect(() => {
    if (isPerfectGame) {
      if (!reducedMotion) fireConfettiRain();
      announce.polite(`Perfect game! You answered all ${result.totalQuestions} questions correctly!`);
    }
  }, [isPerfectGame, reducedMotion, fireConfettiRain]);

  useEffect(() => {
    const controls = animate(motionScore, result.totalScore, {
      type: 'spring', stiffness: 100, damping: 20, mass: 0.5, duration: 1.5,
    });
    return () => controls.stop();
  }, [result.totalScore, motionScore]);

  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    return motionScore.on('change', (v) => setDisplayScore(Math.round(v)));
  }, [motionScore]);

  const [showLevelUp, setShowLevelUp]   = useState(false);
  const levelUpShownRef                  = useRef(false);
  useEffect(() => {
    if (levelUpShownRef.current) return;
    const xp = result.progression?.xp;
    if (
      xp?.confirmed && !xp.isDuplicate &&
      xp.level !== undefined &&
      priorLevel !== null && priorLevel !== undefined &&
      xp.level > priorLevel
    ) {
      levelUpShownRef.current = true;
      setShowLevelUp(true);
    }
  }, [result.progression, priorLevel]);

  const toggleQuestion = (index: number) => {
    const next = new Set(expandedQuestions);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setExpandedQuestions(next);
  };

  const handleOpenLearnMore = (questionIndex: number) => {
    const question = questions[questionIndex];
    const answer   = result.answers[questionIndex];
    if (question.learningContent) {
      setLearnMoreQuestion({
        content:       question.learningContent,
        userAnswer:    answer.selectedOption,
        correctAnswer: answer.correctAnswer,
      });
    }
  };

  const handleCloseLearnMore = () => setLearnMoreQuestion(null);

  const handleAccordionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      accordionButtonRefs.current[(index + 1) % questions.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      accordionButtonRefs.current[(index + questions.length - 1) % questions.length]?.focus();
    }
  };

  // Score subtitle
  const scoreSubtitle = (() => {
    if (result.wagerResult && result.wagerResult.wagerAmount > 0) {
      const preWagerBase = result.answers.slice(0, -1).reduce((s, a) => s + a.basePoints + a.speedBonus, 0);
      const sign = result.wagerResult.won ? '+' : '−';
      return `${preWagerBase.toLocaleString()} base ${sign} ${result.wagerResult.wagerAmount.toLocaleString()} wager`;
    }
    return `${result.totalBasePoints.toLocaleString()} base${result.totalSpeedBonus > 0 ? ` + ${result.totalSpeedBonus.toLocaleString()} speed` : ''}`;
  })();

  return (
    <div style={{
      background: G.bg,
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Manrope', sans-serif",
      color: G.ink,
    }}>
      <Header />

      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        maxWidth: '1080px',
        width: '100%',
        margin: '0 auto',
        padding: '16px 20px',
        gap: '16px',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
      }}>

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          {/* Score card */}
          <div style={{
            background: G.questionCard,
            border: `1px solid ${G.questionCardBorder}`,
            borderRadius: '14px',
            padding: '20px 20px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '8px' }}>🏆</div>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.22em',
              color: G.accent,
              marginBottom: '4px',
            }}>
              TOTAL POINTS
            </div>
            <div style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '60px',
              fontWeight: 700,
              lineHeight: 0.95,
              color: isPerfectGame ? G.btn : G.ink,
              marginBottom: '4px',
            }}>
              {displayScore.toLocaleString()}
            </div>
            {collectionName && (
              <div style={{ fontSize: '12px', color: G.inkMuted, marginBottom: '2px', fontWeight: 400, letterSpacing: '0.06em' }}>
                {collectionName}
              </div>
            )}
            <div style={{ fontSize: '13px', color: G.inkMuted }}>
              {scoreSubtitle}
            </div>
            {isPerfectGame && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 280, damping: 20 }}
                style={{
                  marginTop: '14px',
                  padding: '5px 16px',
                  border: `2px solid ${G.btn}`,
                  borderRadius: '4px',
                  color: G.btn,
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  display: 'inline-block',
                }}
              >
                ★ PERFECT GAME ★
              </motion.div>
            )}
          </div>

          {/* Stats card */}
          <div style={{
            background: G.questionCard,
            border: `1px solid ${G.questionCardBorder}`,
            borderRadius: '14px',
            padding: '0 20px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0',
              borderBottom: `1px solid ${G.questionCardBorder}`,
            }}>
              <span style={{ fontSize: '14px', color: G.inkMuted }}>Correct</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: G.ink }}>
                {result.totalCorrect}/{result.totalQuestions}
              </span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0',
              borderBottom: `1px solid ${G.questionCardBorder}`,
            }}>
              <span style={{ fontSize: '14px', color: G.inkMuted }}>Accuracy</span>
              <span style={{
                fontSize: '14px', fontWeight: 600,
                color: accuracy === 100 ? G.btn : accuracy >= 70 ? G.correct : G.ink,
              }}>
                {accuracy}%
              </span>
            </div>
            {result.wagerResult && result.wagerResult.wagerAmount > 0 ? (
              <div style={{
                padding: '10px 0',
                borderTop: `1px solid ${G.questionCardBorder}`,
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '10px', letterSpacing: '0.18em',
                  color: G.accent, marginBottom: '4px',
                }}>
                  FINAL QUESTION WAGER
                </div>
                <div style={{ fontSize: '12px', color: G.inkMuted, marginBottom: '6px' }}>
                  Bet: {result.wagerResult.wagerAmount.toLocaleString()} points
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: 700,
                  color: result.wagerResult.won ? G.accent : G.incorrect,
                  letterSpacing: '0.04em', marginBottom: '4px',
                }}>
                  {result.wagerResult.won
                    ? `WON +${result.wagerResult.wagerAmount.toLocaleString()}`
                    : `LOST −${result.wagerResult.wagerAmount.toLocaleString()}`}
                </div>
                {(() => {
                  const preWager = result.totalScore - (result.wagerResult.won
                    ? result.wagerResult.wagerAmount
                    : -result.wagerResult.wagerAmount);
                  const sign = result.wagerResult.won ? '+' : '−';
                  return (
                    <div style={{ fontSize: '11px', color: G.inkMuted }}>
                      {preWager.toLocaleString()} → {result.totalScore.toLocaleString()} pts · {sign}{result.wagerResult.wagerAmount.toLocaleString()} added
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0',
              }}>
                <span style={{ fontSize: '14px', color: G.inkMuted }}>Final Wager</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: G.inkMuted }}>—</span>
              </div>
            )}
          </div>

          {/* XP / Gems */}
          {result.progression ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                background: G.questionCard,
                border: `1px solid ${G.questionCardBorder}`,
                borderRadius: '14px',
                padding: '12px 16px',
                textAlign: 'center',
              }}
            >
              {result.progression.xp?.confirmed && (
                <XpReveal xpResult={result.progression.xp} />
              )}
              {result.progression.gemsEarned > 0 ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: result.progression.xp?.confirmed ? '10px' : '0',
                }}>
                  {Array.from({ length: result.progression.gemsEarned }).map((_, i) => (
                    <GemIcon key={i} className="w-5 h-5 text-yellow-400" />
                  ))}
                  <span style={{ fontSize: '22px', letterSpacing: '0.06em', color: G.btn }}>
                    +{result.progression.gemsEarned} {result.progression.gemsEarned === 1 ? 'GEM' : 'GEMS'}
                  </span>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  marginTop: result.progression.xp?.confirmed ? '10px' : '0',
                }}>
                  <span style={{ color: G.inkMuted }}><GemIcon className="w-4 h-4" /></span>
                  <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: G.inkMuted }}>
                    REACH {GEM_SCORE_THRESHOLD.toLocaleString()} POINTS FOR A GEM
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <a
                href={ACCOUNTS_WEB_URL}
                style={{ color: G.inkMuted, fontSize: '12px', fontStyle: 'italic' }}
              >
                Link account to earn XP
              </a>
            </div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <button
              onClick={onPlayAgain}
              style={{
                display: 'block', width: '100%',
                padding: '16px',
                background: G.btn,
                color: G.btnText,
                border: 'none',
                borderRadius: '50px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = G.btnHover)}
              onMouseLeave={e => (e.currentTarget.style.background = G.btn)}
            >
              PLAY AGAIN
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              style={{
                display: 'block', width: '100%',
                padding: '14px',
                background: 'transparent',
                color: G.inkMuted,
                border: `1px solid ${G.questionCardBorder}`,
                borderRadius: '50px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = G.inkMuted;
                e.currentTarget.style.color = G.ink;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = G.questionCardBorder;
                e.currentTarget.style.color = G.inkMuted;
              }}
            >
              LEADERBOARD
            </button>
          </motion.div>
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ flex: 1, minWidth: 0 }}
        >
          <div style={{
            background: G.questionCard,
            border: `1px solid ${G.questionCardBorder}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {/* Header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 24px',
              borderBottom: `1px solid ${G.questionCardBorder}`,
            }}>
              <span style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em',
                color: G.ink,
              }}>
                ANSWER REVIEW
              </span>
              <span style={{ fontSize: '13px', color: G.accent }}>
                {result.totalCorrect} correct · {missed} missed
              </span>
            </div>

            {/* Question rows */}
            <div>
            {questions.map((question, index) => {
              const answer      = result.answers[index];
              const isCorrect   = answer.correct;
              const timedOut    = answer.selectedOption === null;
              const isExpanded  = expandedQuestions.has(index);
              const isLast      = index === questions.length - 1;
              const topicLabel  = question.topicCategory
                ? (TOPIC_LABELS[question.topicCategory as TopicCategory] || question.topicCategory).toUpperCase()
                : 'GENERAL';
              const rowAccent   = isCorrect ? G.accent : G.incorrect;
              const badgeBg     = isCorrect ? G.accent : G.incorrect;

              return (
                <div
                  key={question.id}
                  style={{
                    borderBottom: !isLast ? `1px solid ${G.questionCardBorder}` : 'none',
                    border: isExpanded ? `1px solid ${rowAccent}` : undefined,
                    borderRadius: isExpanded ? '8px' : undefined,
                    margin: isExpanded ? '4px 8px' : undefined,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <button
                    ref={el => (accordionButtonRefs.current[index] = el)}
                    onClick={() => toggleQuestion(index)}
                    onKeyDown={e => handleAccordionKeyDown(e, index)}
                    aria-expanded={isExpanded}
                    aria-controls={`question-detail-${index}`}
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      textAlign: 'left',
                    }}
                  >
                    {/* Number badge — teal if correct, red if wrong */}
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: badgeBg,
                      color: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '13px', fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </div>

                    {/* Category + question text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '10px', letterSpacing: '0.14em',
                        color: G.inkMuted, marginBottom: '2px',
                      }}>
                        Q{index + 1} · {topicLabel}
                      </div>
                      <div style={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '14px', color: G.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {question.text}
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: '15px', fontWeight: 700, flexShrink: 0,
                      color: isCorrect ? G.correct : timedOut ? G.inkMuted : G.inkMuted,
                      minWidth: '40px', textAlign: 'right',
                    }}>
                      {answer.totalPoints >= 0 ? '+' : ''}{answer.totalPoints}
                    </div>

                    {/* Expand / collapse toggle — always same square style */}
                    <div style={{
                      width: '28px', height: '28px',
                      background: G.optionBg,
                      borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24"
                        fill="none" stroke={G.inkMuted} strokeWidth="2.5"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        id={`question-detail-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          padding: '0 16px 14px 16px',
                        }}>
                          {/* Answer boxes — side by side if wrong, single if correct */}
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <div style={{
                              flex: 1,
                              background: isCorrect
                                ? (darkMode ? 'rgba(45,155,95,0.15)' : 'rgba(37,92,63,0.08)')
                                : (darkMode ? 'rgba(192,21,42,0.18)' : 'rgba(192,21,42,0.08)'),
                              borderRadius: '8px',
                              padding: '10px 12px',
                            }}>
                              <div style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '10px', letterSpacing: '0.14em',
                                color: G.inkMuted, marginBottom: '4px',
                              }}>
                                YOUR ANSWER
                              </div>
                              <div style={{
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: '13px', fontWeight: 600,
                                color: timedOut ? G.inkMuted : isCorrect ? G.correct : G.incorrect,
                              }}>
                                {timedOut ? 'Timed out' : question.options[answer.selectedOption!]}
                              </div>
                            </div>

                            {!isCorrect && !timedOut && (
                              <div style={{
                                flex: 1,
                                background: darkMode ? 'rgba(20,184,166,0.12)' : 'rgba(13,148,136,0.08)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                              }}>
                                <div style={{
                                  fontFamily: "'Manrope', sans-serif",
                                  fontSize: '10px', letterSpacing: '0.14em',
                                  color: G.inkMuted, marginBottom: '4px',
                                }}>
                                  CORRECT ANSWER
                                </div>
                                <div style={{
                                  fontFamily: "'Manrope', sans-serif",
                                  fontSize: '13px', fontWeight: 600,
                                  color: G.accent,
                                }}>
                                  {question.options[answer.correctAnswer]}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Explanation */}
                          <div style={{
                            borderLeft: `3px solid ${G.btn}`,
                            paddingLeft: '12px',
                            fontFamily: "'Manrope', sans-serif",
                            fontSize: '13px', color: G.inkMuted,
                            fontWeight: 300, letterSpacing: '0.01em', lineHeight: 1.65,
                            marginBottom: '8px',
                          }}>
                            {question.explanation}
                          </div>

                          {/* Learn More + Flag */}
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {question.learningContent && (
                              <button
                                onClick={e => { e.stopPropagation(); handleOpenLearnMore(index); }}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                  color: G.accent, fontSize: '13px',
                                  fontFamily: "'Manrope', sans-serif", fontWeight: 500, letterSpacing: '0.06em',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                }}
                              >
                                <svg style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Learn More
                              </button>
                            )}
                            {onFlagToggle ? (
                              <FlagButton
                                flagged={flaggedQuestions?.has(question.id) || false}
                                disabled={false}
                                onToggle={() => onFlagToggle(question.id)}
                                size="sm"
                              />
                            ) : flaggedQuestions?.has(question.id) ? (
                              <FlagButton
                                flagged={true}
                                disabled={false}
                                onToggle={() => {}}
                                readOnly={true}
                                size="sm"
                              />
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            </div>
          </div>
        </motion.div>
      </div>

      <LearnMoreModal
        isOpen={learnMoreQuestion !== null}
        onClose={handleCloseLearnMore}
        content={learnMoreQuestion?.content ?? { topic: 'voting', paragraphs: [], corrections: {}, source: { name: '', url: '' } }}
        userAnswer={learnMoreQuestion?.userAnswer ?? null}
        correctAnswer={learnMoreQuestion?.correctAnswer ?? 0}
      />

      {showLevelUp && result.progression?.xp?.level && (
        <LevelUpOverlay
          newLevel={result.progression.xp.level}
          onDismiss={() => {
            setShowLevelUp(false);
            if (result.progression?.xp?.level && onLevelCaptured) {
              onLevelCaptured(result.progression.xp.level);
            }
          }}
        />
      )}
    </div>
  );
}
