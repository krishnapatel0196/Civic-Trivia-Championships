import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyPress } from '../hooks/useKeyPress';
import { GameTimer } from './GameTimer';
import { ProgressDots } from './ProgressDots';
import { QuestionCard } from './QuestionCard';
import { AnswerGrid } from './AnswerGrid';
import { ScoreDisplay } from './ScoreDisplay';
import { ScorePopup } from './ScorePopup';
import { LearnMoreButton } from './LearnMoreButton';
import { LearnMoreTooltip } from './LearnMoreTooltip';
import { LearnMoreModal } from './LearnMoreModal';
import { FinalQuestionAnnouncement } from './FinalQuestionAnnouncement';
import { WagerScreen } from './WagerScreen';
import { PauseOverlay } from './PauseOverlay';
import { FlagButton } from './FlagButton';
import { AdminArchiveButton } from './AdminArchiveButton';
import { CelebrationEffects } from '../../../components/animations/CelebrationEffects';
import { DegradedBanner } from '../../../components/DegradedBanner';
import { useAuthStore } from '../../../store/authStore';
import { useConfettiStore } from '../../../store/confettiStore';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { announce } from '../../../utils/announce';
import type { GameState, Question, LearningContent } from '../../../types/game';
import { XpStrip } from './XpStrip';
import { NextStepButton } from './NextStepButton';
import { ACCOUNTS_WEB_URL } from '../../../services/accountsApi';

const QUESTION_DURATION = 20; // seconds
const FINAL_QUESTION_DURATION = 50; // seconds for final question
const QUESTION_PREVIEW_MS = 1000; // show question before revealing options

interface GameScreenProps {
  state: GameState;
  currentQuestion: Question | null;
  startGame: () => Promise<void>;
  selectAnswer: (optionIndex: number, timeRemaining?: number) => void;
  lockAnswer: (timeRemaining: number) => void;
  handleTimeout: () => void;
  quitGame: () => void;
  nextQuestion: () => void;
  hasShownTooltip: boolean;
  setHasShownTooltip: (value: boolean) => void;
  setWagerAmount: (amount: number) => void;
  lockWager: () => void;
  isFinalQuestion: boolean;
  pauseGame: () => void;
  resumeGame: () => void;
  flaggedQuestions: Set<string>;
  isRateLimited: boolean;
  onFlagToggle: (questionId: string) => void;
  xpData: import('../../../hooks/usePlayerXp').PlayerXpData | null;
  isXpLoading: boolean;
  isXpConnected: boolean;
  onArchiveQuestion?: (questionId: string) => void;
}

export function GameScreen({
  state,
  currentQuestion,
  startGame,
  selectAnswer,
  lockAnswer,
  handleTimeout,
  quitGame,
  nextQuestion,
  hasShownTooltip,
  setHasShownTooltip,
  setWagerAmount,
  lockWager,
  isFinalQuestion,
  pauseGame,
  resumeGame,
  flaggedQuestions,
  isRateLimited,
  onFlagToggle,
  xpData,
  isXpLoading,
  isXpConnected,
  onArchiveQuestion,
}: GameScreenProps) {

  const [showTimeoutFlash, setShowTimeoutFlash] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [currentTimeRemaining, setCurrentTimeRemaining] = useState(QUESTION_DURATION);
  const [shouldShake, setShouldShake] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Get timer multiplier from auth store (defaults to 1.0)
  const timerMultiplier = useAuthStore((s) => s.timerMultiplier);

  // Check if user is authenticated for flag button visibility
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Admin state for archive button
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Confetti store for celebrations
  const { fireSmallBurst, fireMediumBurst } = useConfettiStore();
  const reducedMotion = useReducedMotion();

  // Calculate adjusted durations based on multiplier
  const questionDuration = Math.round(QUESTION_DURATION * timerMultiplier);
  const finalQuestionDuration = Math.round(FINAL_QUESTION_DURATION * timerMultiplier);

  // Determine if current question has learning content
  const learningContent = currentQuestion?.learningContent ?? null;
  const latestAnswer = state.answers.length > 0 ? state.answers[state.answers.length - 1] : null;

  // Tooltip auto-show logic: show once per session when first reveal happens
  useEffect(() => {
    if (state.phase === 'revealing' && learningContent && !hasShownTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setHasShownTooltip(true);
      }, 1000); // Delay to let reveal settle
      return () => clearTimeout(timer);
    }
  }, [state.phase, learningContent, hasShownTooltip, setHasShownTooltip]);

  // Handle opening Learn More modal
  const handleOpenLearnMore = () => {
    setShowTooltip(false);
    setIsLearnMoreOpen(true);
  };

  // Handle closing Learn More modal
  const handleCloseLearnMore = () => {
    setIsLearnMoreOpen(false);
  };

  // Extract teaser text (first sentence of first paragraph)
  const getTeaserText = (content: LearningContent): string => {
    const firstParagraph = content.paragraphs[0] || '';
    const sentences = firstParagraph.split('. ');
    return sentences[0] + (sentences.length > 1 ? '...' : '');
  };

  // Question preview: show question text for 2s, then reveal options and start timer
  useEffect(() => {
    if (state.phase === 'answering' && !showOptions) {
      const timer = setTimeout(() => {
        setShowOptions(true);
        setTimerKey((prev) => prev + 1);
      }, QUESTION_PREVIEW_MS);
      return () => clearTimeout(timer);
    }
  }, [state.currentQuestionIndex, state.phase, showOptions]);

  // Reset showOptions when moving to a new question
  useEffect(() => {
    if (state.phase === 'answering') {
      setShowOptions(false);
    }
  }, [state.currentQuestionIndex]);

  // Reset timer when entering answering phase for final question
  useEffect(() => {
    if (state.phase === 'answering' && isFinalQuestion) {
      setTimerKey((prev) => prev + 1);
    }
  }, [state.phase, isFinalQuestion]);

  // Handle score animations and feedback on reveal phase
  useEffect(() => {
    if (state.phase === 'revealing' && state.answers.length > 0) {
      const latestAnswer = state.answers[state.answers.length - 1];

      // Check if it's a wrong answer (not timeout)
      if (!latestAnswer.correct && latestAnswer.selectedOption !== null) {
        setShouldShake(true);
        setShowRedFlash(true);
        setTimeout(() => {
          setShouldShake(false);
          setShowRedFlash(false);
        }, 500);
      } else {
        // Correct answer or timeout - show score popup
        setShowScorePopup(true);
      }
    } else {
      setShowScorePopup(false);
    }
  }, [state.phase, state.answers.length]);

  // Global number key handler for answer selection (when AnswerGrid doesn't have focus)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const canUseKeyboard = state.phase === 'answering' && showOptions;
      if (!canUseKeyboard) return;

      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        selectAnswer(index, currentTimeRemaining);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state.phase, showOptions, selectAnswer, currentTimeRemaining]);

  // Escape key handler for pause overlay
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Only pause during answering or selected phases (not during reveal, wager, or already paused)
        if ((state.phase === 'answering' || (state.phase === 'selected' && state.currentQuestionIndex === state.totalQuestions - 1)) && !state.isPaused) {
          pauseGame();
          announce.polite('Game paused');
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [state.phase, state.isPaused, pauseGame]);

  // Space/Enter to advance during reveal phase
  useEffect(() => {
    if (state.phase !== 'revealing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if Learn More modal is open
      if (isLearnMoreOpen) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, isLearnMoreOpen, nextQuestion]);

  // Timer threshold announcements for screen readers
  useEffect(() => {
    if (state.phase !== 'answering' && !(state.phase === 'selected' && state.currentQuestionIndex === state.totalQuestions - 1)) return;

    if (currentTimeRemaining === 10) {
      announce.polite('10 seconds remaining');
    } else if (currentTimeRemaining === 5) {
      announce.polite('5 seconds remaining');
    }
  }, [currentTimeRemaining, state.phase]);

  // Streak celebrations - fire confetti on milestones
  useEffect(() => {
    if (reducedMotion) return;

    if (state.currentStreak === 3) {
      fireSmallBurst();
    } else if (state.currentStreak === 5) {
      fireMediumBurst();
      announce.polite('On Fire! 5 in a row!');
    } else if (state.currentStreak >= 7) {
      fireMediumBurst();
      if (state.currentStreak === 7) {
        announce.polite('Unstoppable! 7 in a row!');
      }
    }
  }, [state.currentStreak, reducedMotion, fireSmallBurst, fireMediumBurst]);

  // Question number announcements for screen readers
  useEffect(() => {
    if (state.phase === 'answering' && showOptions) {
      if (state.currentQuestionIndex === 0) {
        announce.polite(`Question 1 of ${state.totalQuestions}`);
      } else if (isFinalQuestion) {
        announce.assertive('Final Question');
      }
    }
  }, [state.phase, state.currentQuestionIndex, isFinalQuestion, showOptions]);

  // Derive the current advance button label for screen reader messages
  const advanceLabel = isFinalQuestion
    ? 'Game Recap'
    : state.currentQuestionIndex === state.totalQuestions - 2
    ? 'Last Question'
    : 'Next Question';

  // Answer reveal announcements for screen readers
  useEffect(() => {
    if (state.phase === 'revealing' && state.answers.length > 0) {
      const latestAnswer = state.answers[state.answers.length - 1];
      const question = state.questions[state.currentQuestionIndex];
      if (!question) return;

      const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
      const correctLetter = OPTION_LETTERS[latestAnswer.correctAnswer];
      const correctText = question.options[latestAnswer.correctAnswer];

      let message = '';
      if (latestAnswer.correct) {
        message = `Correct! The answer is ${correctLetter}, ${correctText}. You earned ${latestAnswer.totalPoints} points. Press Space or click ${advanceLabel} to continue.`;
      } else if (latestAnswer.selectedOption !== null) {
        message = `Not quite. The correct answer was ${correctLetter}, ${correctText}. Press Space or click ${advanceLabel} to continue.`;
      } else {
        message = `Time's up. The correct answer was ${correctLetter}, ${correctText}. Press Space or click ${advanceLabel} to continue.`;
      }

      announce.polite(message);
    }
  }, [state.phase, state.answers.length]);

  // Keyboard shortcut for Learn More (only during reveal when content exists)
  const canOpenLearnMore = state.phase === 'revealing' && !!learningContent && !isLearnMoreOpen;
  useKeyPress('l', handleOpenLearnMore, canOpenLearnMore);

  // Handle timeout with flash message
  const onTimeout = () => {
    setShowTimeoutFlash(true);
    announce.assertive("Time's up");
    setTimeout(() => {
      setShowTimeoutFlash(false);
      handleTimeout();
    }, 1000);
  };

  // Handle lock in with actual time remaining
  const onLockIn = () => {
    lockAnswer(currentTimeRemaining);
  };

  // Idle state - show start button
  if (state.phase === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0D09' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
          style={{ padding: '0 24px' }}
        >
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 72px)',
            color: '#F5EDD8',
            letterSpacing: '0.06em',
            lineHeight: 1,
            marginBottom: '32px',
          }}>
            Civic Trivia Challenge
          </h1>
          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              background: '#E8A020',
              color: '#0F0D09',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '22px',
              letterSpacing: '0.14em',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              minHeight: '56px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#C88010')}
            onMouseLeave={e => (e.currentTarget.style.background = '#E8A020')}
          >
            QUICK PLAY
          </button>

          {/* XP panel for Connected players */}
          {isXpConnected && (
            <XpStrip xpData={xpData} isLoading={isXpLoading} />
          )}

          {/* Non-Connected prompt */}
          {!isXpConnected && !isXpLoading && (
            <div className="mt-4">
              <a
                href={ACCOUNTS_WEB_URL}
                style={{ color: '#5C4A30', fontSize: '13px', fontStyle: 'italic', textDecoration: 'underline' }}
              >
                Link account to earn XP
              </a>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Final announcement phase - show dramatic "FINAL QUESTION" screen
  if (state.phase === 'final-announcement') {
    return <FinalQuestionAnnouncement show={true} />;
  }

  // Wagering phases - show wager input screen
  if (state.phase === 'wagering' || state.phase === 'wager-locked') {
    return (
      <WagerScreen
        currentScore={state.totalScore}
        category={state.wagerCategory || 'General'}
        wagerAmount={state.wagerAmount}
        onSetWager={setWagerAmount}
        onLockWager={lockWager}
        isLocked={state.phase === 'wager-locked'}
      />
    );
  }

  // Main game screen
  if (!currentQuestion) {
    return null;
  }

  return (
    <div
      className="h-screen h-[100dvh] relative overflow-hidden"
      style={{ background: '#0F0D09' }}
    >
      {/* Degraded mode banner - shown only when backend is in fallback mode */}
      <DegradedBanner visible={state.degraded} />

      {/* Radial warm glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(232,160,32,0.05) 0%, transparent 70%)',
      }} />

      {/* Celebration effects for streaks */}
      <CelebrationEffects streak={state.currentStreak} />

      {/* Main content container */}
      <div className="relative h-full flex flex-col py-2 md:py-4 px-4">
        {/* Top HUD - Score, Timer, Collection name, Progress dots */}
        <div className="flex flex-col items-center mb-1 max-w-5xl mx-auto w-full flex-shrink-0">
          {/* Controls row - three equal columns for true centering */}
          <div className="grid grid-cols-3 items-center w-full">
            {/* Score display (left) */}
            <div className="justify-self-start">
              <ScoreDisplay
                score={state.totalScore}
                shouldShake={shouldShake}
                showRedFlash={showRedFlash}
                compact={true}
              />
            </div>

            {/* Timer (center - grid guarantees true center, min-h reserves space) */}
            <div
              className="flex items-center justify-center"
              style={{ minHeight: state.phase === 'revealing' ? '56px' : '80px' }}
            >
              {(showOptions || state.phase === 'locked' || state.phase === 'revealing' || (state.phase === 'selected' && state.currentQuestionIndex === state.totalQuestions - 1)) && (
                <GameTimer
                  key={timerKey}
                  duration={isFinalQuestion ? finalQuestionDuration : questionDuration}
                  onTimeout={onTimeout}
                  onTimeUpdate={setCurrentTimeRemaining}
                  isPaused={state.isTimerPaused || !showOptions}
                  size={state.phase === 'revealing' ? 56 : 80}
                />
              )}
            </div>

            {/* Collection name + Progress dots + question counter (right) */}
            <div className="flex flex-col items-end gap-0.5 justify-self-end">
              {state.collectionName && (
                <div className="truncate max-w-[160px]" style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  color: '#5C4A30',
                }}>
                  {state.collectionName}
                </div>
              )}
              <div className="hidden md:block">
                <ProgressDots
                  currentIndex={state.currentQuestionIndex}
                  total={state.totalQuestions}
                />
              </div>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '11px',
                letterSpacing: '0.16em',
                color: '#5C4A30',
              }}>
                Q{state.currentQuestionIndex + 1} / {state.totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Timeout flash message */}
        <AnimatePresence>
          {showTimeoutFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <div style={{
                background: '#C0152A',
                color: '#F5EDD8',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '36px',
                letterSpacing: '0.12em',
                padding: '20px 48px',
                borderRadius: '2px',
                boxShadow: '0 0 40px rgba(192,21,42,0.5)',
              }}>
                TIME'S UP
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score popup during reveal phase - disabled for final question (wager-only scoring) */}
        {showScorePopup && !isFinalQuestion && state.answers.length > 0 && (() => {
          const latestAnswer = state.answers[state.answers.length - 1];
          return (
            <ScorePopup
              basePoints={latestAnswer.basePoints}
              speedBonus={latestAnswer.speedBonus}
              isCorrect={latestAnswer.correct}
              isTimeout={latestAnswer.selectedOption === null}
              onComplete={() => setShowScorePopup(false)}
            />
          );
        })()}

        {/* Question and answers - with AnimatePresence for transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentQuestionIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="flex-1 flex flex-col items-center justify-center max-w-[700px] mx-auto w-full px-4 min-h-0 overflow-hidden gap-2 md:gap-4 lg:gap-5"
          >
            {/* Final question badge */}
            {isFinalQuestion && (
              <div className="flex justify-center">
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '13px',
                  letterSpacing: '0.22em',
                  color: '#E8A020',
                  border: '1px solid rgba(232,160,32,0.4)',
                  padding: '4px 16px',
                  borderRadius: '2px',
                }}>
                  FINAL QUESTION
                </div>
              </div>
            )}

            {/* Question card - with amber glow for final question and flag button during reveal */}
            <div className="relative" style={isFinalQuestion ? {
              border: '1px solid rgba(232,160,32,0.25)',
              boxShadow: '0 0 30px rgba(232,160,32,0.08)',
              padding: '4px',
            } : {}}>
              <QuestionCard
                question={currentQuestion}
                questionNumber={state.currentQuestionIndex + 1}
                totalQuestions={state.totalQuestions}
              />

              {/* Flag button - shown during reveal phase for authenticated users only */}
              {state.phase === 'revealing' && isAuthenticated && currentQuestion && (
                <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <FlagButton
                    flagged={flaggedQuestions.has(currentQuestion.id)}
                    disabled={isRateLimited}
                    onToggle={() => onFlagToggle(currentQuestion.id)}
                  />
                </div>
              )}

              {/* Admin archive button - shown during reveal for admin users */}
              {state.phase === 'revealing' && isAdmin && currentQuestion && accessToken && (
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <AdminArchiveButton
                    questionId={currentQuestion.id}
                    onArchived={() => onArchiveQuestion?.(currentQuestion.id)}
                    accessToken={accessToken}
                  />
                </div>
              )}
            </div>

            {/* Answer grid - revealed after question preview */}
            <AnimatePresence>
              {(showOptions || state.phase === 'locked' || state.phase === 'revealing' || (state.phase === 'selected' && state.currentQuestionIndex === state.totalQuestions - 1)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full pt-1 md:pt-2 pb-2 md:pb-3"
                >
                  <AnswerGrid
                    options={currentQuestion.options}
                    selectedOption={state.selectedOption}
                    correctAnswer={
                      state.phase === 'revealing' && state.answers.length > 0
                        ? state.answers[state.answers.length - 1].correctAnswer
                        : 0
                    }
                    phase={state.phase}
                    onSelect={(index) => selectAnswer(index, currentTimeRemaining)}
                    onLockIn={onLockIn}
                    explanation={currentQuestion.explanation}
                  />

                  {/* Learn More button and tooltip - shown during reveal below answers */}
                  {state.phase === 'revealing' && learningContent && (
                    <div className="relative flex justify-center mt-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <LearnMoreButton
                          onOpenModal={handleOpenLearnMore}
                          hasContent={!!learningContent}
                        />
                        <LearnMoreTooltip
                          teaserText={getTeaserText(learningContent)}
                          show={showTooltip}
                          onDismiss={() => setShowTooltip(false)}
                          onReadMore={handleOpenLearnMore}
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation button — shown during reveal phase */}
                  {state.phase === 'revealing' && (
                    <div className="flex justify-center mt-3">
                      <NextStepButton
                        questionIndex={state.currentQuestionIndex}
                        totalQuestions={state.totalQuestions}
                        isFinalQuestion={isFinalQuestion}
                        onAdvance={nextQuestion}
                        disabled={isLearnMoreOpen}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Learn More modal - rendered outside main content */}
      {learningContent && latestAnswer && (
        <div onClick={(e) => e.stopPropagation()}>
        <LearnMoreModal
          isOpen={isLearnMoreOpen}
          onClose={handleCloseLearnMore}
          content={learningContent}
          userAnswer={latestAnswer.selectedOption}
          correctAnswer={latestAnswer.correctAnswer}
        />
        </div>
      )}

      {/* Pause overlay */}
      {state.isPaused && (
        <PauseOverlay
          onResume={() => {
            resumeGame();
            announce.polite('Game resumed');
          }}
          onQuit={quitGame}
        />
      )}
    </div>
  );
}
