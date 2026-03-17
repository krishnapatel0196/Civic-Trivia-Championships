import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import type { GameResult, Question, LearningContent } from '../../../types/game';
import { TOPIC_ICONS, TOPIC_LABELS } from './TopicIcon';
import { LearnMoreModal } from './LearnMoreModal';
import { FlagButton } from './FlagButton';
import { GemIcon } from '../../../components/icons/GemIcon';
import { useConfettiStore } from '../../../store/confettiStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { announce } from '../../../utils/announce';
import { XpReveal } from './XpReveal';
import { LevelUpOverlay } from './LevelUpOverlay';
import { ACCOUNTS_WEB_URL } from '../../../services/accountsApi';
import { useTheme } from '../../../hooks/useTheme';
import { Header } from '../../../components/layout/Header';

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
  onHome,
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

  const navigate        = useNavigate();
  const motionScore     = useMotionValue(0);
  const accordionButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const accuracy      = Math.round((result.totalCorrect / result.totalQuestions) * 100);
  const isPerfectGame = result.totalCorrect === result.totalQuestions;

  const { fireConfettiRain } = useConfettiStore();
  const reducedMotion        = useReducedMotion();
  const { C }                = useTheme();

  // Perfect game celebration
  useEffect(() => {
    if (isPerfectGame) {
      if (!reducedMotion) fireConfettiRain();
      announce.polite(`Perfect game! You answered all ${result.totalQuestions} questions correctly!`);
    }
  }, [isPerfectGame, reducedMotion, fireConfettiRain]);

  // Animate score counter
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

  // Level-up overlay
  const [showLevelUp, setShowLevelUp]   = useState(false);
  const levelUpShownRef                  = useRef(false);
  useEffect(() => {
    if (levelUpShownRef.current) return;
    const xp = result.progression?.xp;
    if (
      xp?.confirmed &&
      !xp.isDuplicate &&
      xp.level !== undefined &&
      priorLevel !== null &&
      priorLevel !== undefined &&
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
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (index + 1) % questions.length;
        accordionButtonRefs.current[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = (index + questions.length - 1) % questions.length;
        accordionButtonRefs.current[prevIndex]?.focus();
        break;
    }
  };

  const scoreColor = isPerfectGame ? C.gold : result.totalScore < 0 ? C.incorrect : C.ink;

  return (
    <div style={{
      background: C.paper,
      minHeight: '100vh',
      fontFamily: "'Lora', Georgia, serif",
      color: C.ink,
    }}>
      <Header />
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Masthead ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ paddingTop: '28px', textAlign: 'center' }}
        >
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.22em',
            fontSize: '18px',
            color: C.muted,
            margin: 0,
          }}>
            CIVIC TRIVIA CHAMPIONSHIP
          </p>
          <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: '10px' }} />
        </motion.div>

        {/* ── Game Complete image ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ textAlign: 'center', marginTop: '28px' }}
        >
          <img
            src="/images/GameComplete.png"
            alt="Game Complete!"
            style={{ maxWidth: '240px', width: '100%', display: 'inline-block' }}
          />
          {collectionName && (
            <p style={{ fontStyle: 'italic', color: C.muted, fontSize: '14px', margin: '6px 0 0' }}>
              {collectionName}
            </p>
          )}
        </motion.div>

        {/* ── Score — the centerpiece ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={{ textAlign: 'center', marginTop: '16px' }}
        >
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(72px, 22vw, 128px)',
            lineHeight: 0.88,
            color: scoreColor,
            letterSpacing: '-0.01em',
          }}>
            {displayScore.toLocaleString()}
          </div>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.22em',
            fontSize: '12px',
            color: C.muted,
            margin: '6px 0 0',
          }}>
            TOTAL POINTS
          </p>

          {isPerfectGame && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 280, damping: 20 }}
              style={{
                display: 'inline-block',
                marginTop: '14px',
                padding: '6px 20px',
                border: `2px solid ${C.gold}`,
                color: C.gold,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.22em',
                fontSize: '17px',
              }}
            >
              ★ PERFECT GAME ★
            </motion.div>
          )}
        </motion.div>

        {/* ── Score breakdown line ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          style={{ textAlign: 'center', marginTop: '10px' }}
        >
          {(() => {
            if (result.wagerResult && result.wagerResult.wagerAmount > 0) {
              const nonFinalAnswers  = result.answers.slice(0, -1);
              const nonFinalBase     = nonFinalAnswers.reduce((s, a) => s + a.basePoints, 0);
              const nonFinalSpeed    = nonFinalAnswers.reduce((s, a) => s + a.speedBonus, 0);
              const wagerSign        = result.wagerResult.won ? '+' : '−';
              return (
                <p style={{ fontStyle: 'italic', color: C.muted, fontSize: '14px', margin: 0 }}>
                  {nonFinalBase.toLocaleString()} base + {nonFinalSpeed.toLocaleString()} speed{' '}
                  <span style={{ color: result.wagerResult.won ? C.correct : C.incorrect }}>
                    {wagerSign} {result.wagerResult.wagerAmount.toLocaleString()} wager
                  </span>
                </p>
              );
            }
            return (
              <p style={{ fontStyle: 'italic', color: C.muted, fontSize: '14px', margin: 0 }}>
                {result.totalBasePoints.toLocaleString()} base + {result.totalSpeedBonus.toLocaleString()} speed
              </p>
            );
          })()}
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          style={{
            display: 'flex',
            borderTop: `1px solid ${C.rule}`,
            borderBottom: `1px solid ${C.rule}`,
            margin: '28px 0',
          }}
        >
          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: '16px 8px',
            borderRight: `1px solid ${C.rule}`,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', lineHeight: 1, color: C.ink }}>
              {result.totalCorrect}/{result.totalQuestions}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.16em', fontSize: '10px', color: C.muted, marginTop: '4px' }}>
              CORRECT
            </div>
          </div>

          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: '16px 8px',
            borderRight: result.fastestAnswer ? `1px solid ${C.rule}` : 'none',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', lineHeight: 1, color: C.ink }}>
              {accuracy}%
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.16em', fontSize: '10px', color: C.muted, marginTop: '4px' }}>
              ACCURACY
            </div>
          </div>

          {result.fastestAnswer && (
            <div style={{ flex: 1, textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', lineHeight: 1, color: C.ink }}>
                {result.fastestAnswer.responseTime.toFixed(1)}s
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.16em', fontSize: '10px', color: C.muted, marginTop: '4px' }}>
                FASTEST · Q{result.fastestAnswer.questionIndex + 1}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── XP + Gems — dark stamp on paper ── */}
        {result.progression ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.3 }}
            style={{
              border: `1px solid ${C.rule}`,
              padding: '20px 28px',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            {result.progression.xp?.confirmed && (
              <XpReveal xpResult={result.progression.xp} />
            )}
            {result.progression.gemsEarned > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: result.progression.xp?.confirmed ? '12px' : '0',
              }}>
                {Array.from({ length: result.progression.gemsEarned }).map((_, i) => (
                  <GemIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '28px',
                  letterSpacing: '0.06em',
                  color: C.gold,
                }}>
                  +{result.progression.gemsEarned} {result.progression.gemsEarned === 1 ? 'GEM' : 'GEMS'}
                </span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
            style={{ textAlign: 'center', marginBottom: '28px' }}
          >
            <a
              href={ACCOUNTS_WEB_URL}
              style={{ color: C.muted, fontSize: '13px', fontStyle: 'italic', textDecoration: 'underline' }}
            >
              Link account to earn XP
            </a>
          </motion.div>
        )}

        {/* ── Wager card ── */}
        {result.wagerResult && result.wagerResult.wagerAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.3 }}
            style={{
              border: `1px solid ${result.wagerResult.won ? C.correct : C.incorrect}`,
              padding: '20px 24px',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.22em',
              fontSize: '11px',
              color: C.muted,
              margin: '0 0 8px',
            }}>
              FINAL QUESTION WAGER
            </p>
            <p style={{ color: C.muted, fontSize: '14px', margin: '0 0 10px' }}>
              Bet: {result.wagerResult.wagerAmount.toLocaleString()} points
            </p>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '32px',
              letterSpacing: '0.05em',
              color: result.wagerResult.won ? C.correct : C.incorrect,
            }}>
              {result.wagerResult.won
                ? `WON +${result.wagerResult.wagerAmount.toLocaleString()}`
                : `LOST −${result.wagerResult.wagerAmount.toLocaleString()}`}
            </div>
          </motion.div>
        )}

        {/* ── Action buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.3 }}
          style={{ marginBottom: '52px' }}
        >
          <button
            onClick={onPlayAgain}
            style={{
              display: 'block',
              width: '100%',
              padding: '18px',
              minHeight: '48px',
              background: C.accent,
              color: '#FFFFFF',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              letterSpacing: '0.14em',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = C.accentHover)}
            onMouseLeave={e => (e.currentTarget.style.background = C.accent)}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              minHeight: '48px',
              background: 'transparent',
              color: C.muted,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '16px',
              letterSpacing: '0.2em',
              border: `1px solid ${C.rule}`,
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.inkLight;
              e.currentTarget.style.color = C.ink;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.rule;
              e.currentTarget.style.color = C.muted;
            }}
          >
            LEADERBOARD
          </button>
          <button
            onClick={onHome}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              minHeight: '48px',
              background: 'transparent',
              color: C.muted,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '16px',
              letterSpacing: '0.2em',
              border: `1px solid ${C.rule}`,
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.inkLight;
              e.currentTarget.style.color = C.ink;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.rule;
              e.currentTarget.style.color = C.muted;
            }}
          >
            HOME
          </button>
        </motion.div>

        {/* ── Answer Review ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.48, duration: 0.3 }}
        >
          {/* Section header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.22em',
              fontSize: '12px',
              color: C.muted,
              whiteSpace: 'nowrap',
            }}>
              ANSWER REVIEW
            </span>
            <div style={{ flex: 1, borderTop: `1px solid ${C.rule}` }} />
            <button
              onClick={() => {
                if (expandedQuestions.size > 0) {
                  setExpandedQuestions(new Set());
                } else {
                  setExpandedQuestions(new Set(questions.map((_, i) => i)));
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.16em',
                fontSize: '11px',
                color: C.accent,
                whiteSpace: 'nowrap',
                padding: 0,
              }}
            >
              {expandedQuestions.size > 0 ? 'COLLAPSE ALL' : 'EXPAND ALL'}
            </button>
          </div>

          {/* Question rows */}
          <div>
            {questions.map((question, index) => {
              const answer    = result.answers[index];
              const isCorrect = answer.correct;
              const timedOut  = answer.selectedOption === null;
              const isExpanded = expandedQuestions.has(index);

              const borderAccent = isCorrect ? C.correct : timedOut ? C.amber : C.incorrect;

              return (
                <div
                  key={question.id}
                  style={{
                    borderBottom: `1px solid ${C.ruleLight}`,
                    borderLeft: `3px solid ${borderAccent}`,
                  }}
                >
                  {/* Collapsed row */}
                  <button
                    ref={el => (accordionButtonRefs.current[index] = el)}
                    onClick={() => toggleQuestion(index)}
                    onKeyDown={e => handleAccordionKeyDown(e, index)}
                    aria-expanded={isExpanded}
                    aria-controls={`question-detail-${index}`}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '14px 14px 14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      minHeight: '48px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: '0.1em',
                          fontSize: '11px',
                          color: C.muted,
                        }}>
                          Q{index + 1}
                        </span>
                        {question.topicCategory && TOPIC_ICONS[question.topicCategory] && (() => {
                          const Icon = TOPIC_ICONS[question.topicCategory];
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: C.muted,
                              background: 'rgba(0,0,0,0.06)',
                              borderRadius: '99px',
                              padding: '2px 8px',
                            }}>
                              <Icon className="w-3.5 h-3.5" />
                              {TOPIC_LABELS[question.topicCategory]}
                            </span>
                          );
                        })()}
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
                      <p style={{ margin: 0, fontSize: '15px', color: C.ink, lineHeight: 1.45 }}>
                        {question.text}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '22px',
                        letterSpacing: '0.02em',
                        color: answer.totalPoints < 0 ? C.incorrect : isCorrect ? C.correct : timedOut ? C.amber : C.muted,
                      }}>
                        {answer.totalPoints >= 0 ? '+' : ''}{answer.totalPoints}
                      </div>
                      <svg
                        style={{
                          width: '14px',
                          height: '14px',
                          color: C.muted,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          flexShrink: 0,
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          id={`question-detail-${index}`}
                          style={{
                            padding: '12px 14px 16px 16px',
                            borderTop: `1px solid ${C.ruleLight}`,
                            background: 'rgba(0,0,0,0.025)',
                          }}
                        >
                          {/* Score breakdown */}
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            flexWrap: 'wrap',
                            marginBottom: '12px',
                            fontSize: '13px',
                            color: C.muted,
                          }}>
                            {index === questions.length - 1 && answer.wager !== undefined && answer.wager > 0 ? (
                              <>
                                <span>Wager: <strong style={{ color: C.ink }}>{answer.wager.toLocaleString()} pts</strong></span>
                                <span style={{ color: isCorrect ? C.correct : C.incorrect }}>
                                  {isCorrect ? '+' : '−'}{answer.wager.toLocaleString()}
                                </span>
                                <span>Time: <strong style={{ color: C.ink }}>{answer.responseTime.toFixed(1)}s</strong></span>
                              </>
                            ) : index === questions.length - 1 && answer.wager !== undefined && answer.wager === 0 ? (
                              <>
                                <span>Wager: 0 (played for fun)</span>
                                <span>0 pts</span>
                                <span>Time: <strong style={{ color: C.ink }}>{answer.responseTime.toFixed(1)}s</strong></span>
                              </>
                            ) : isCorrect ? (
                              <>
                                <span>Base: <strong style={{ color: C.ink }}>+{answer.basePoints}</strong></span>
                                <span>Speed: <strong style={{ color: C.correct }}>+{answer.speedBonus}</strong></span>
                                <span>Time: <strong style={{ color: C.ink }}>{answer.responseTime.toFixed(1)}s</strong></span>
                              </>
                            ) : (
                              <span>No points awarded</span>
                            )}
                          </div>

                          {/* Your answer */}
                          <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>Your answer: </span>
                            {timedOut ? (
                              <span style={{ color: C.amber, fontSize: '14px' }}>No answer (timed out)</span>
                            ) : (
                              <span style={{ color: isCorrect ? C.correct : C.incorrect, fontSize: '14px' }}>
                                {question.options[answer.selectedOption!]}
                              </span>
                            )}
                          </div>

                          {/* Correct answer (if wrong) */}
                          {!isCorrect && (
                            <div style={{ marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', color: C.muted, fontStyle: 'italic' }}>Correct answer: </span>
                              <span style={{ color: C.correct, fontSize: '14px' }}>
                                {question.options[answer.correctAnswer]}
                              </span>
                            </div>
                          )}

                          {/* Explanation */}
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            borderLeft: `2px solid ${C.rule}`,
                            fontSize: '14px',
                            color: C.inkLight,
                            lineHeight: 1.65,
                            fontStyle: 'italic',
                          }}>
                            {question.explanation}
                          </div>

                          {/* Learn More */}
                          {question.learningContent && (
                            <button
                              onClick={e => { e.stopPropagation(); handleOpenLearnMore(index); }}
                              style={{
                                marginTop: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: C.accent,
                                fontSize: '13px',
                                fontFamily: "'Lora', serif",
                                fontStyle: 'italic',
                              }}
                            >
                              <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              Learn More
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* LearnMoreModal — outside scrollable content */}
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
