import { Fragment, useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { API_URL } from '../../../services/api';

interface FlagEntry {
  id: number;
  userId: number;
  username: string;
  reasons: string[];
  elaboration: string | null;
  createdAt: string;
}

interface QuestionDetail {
  id: number;
  externalId: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  source: {
    name: string;
    url: string | null;
  };
  learningContent: string | null;
  status: string;
}

interface FlagDetailResponse {
  question: QuestionDetail;
  flags: FlagEntry[];
}

interface FlagDetailPanelProps {
  questionId: number | null;
  onClose: () => void;
  onQuestionArchived: (questionId: number) => void;
  onFlagsDismissed: (questionId: number) => void;
  onQuestionRestored: (questionId: number) => void;
  onRefreshNeeded: () => void;
}

// Toast state and hook
interface ToastState {
  message: string;
  undoCallback: (() => void) | null;
  visible: boolean;
}

function useUndoToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    undoCallback: null,
    visible: false,
  });
  const timeoutRef = useRef<number>();

  const showToast = (message: string, undoCallback: () => void) => {
    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setToast({
      message,
      undoCallback,
      visible: true,
    });

    // Auto-hide after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return { toast, showToast, hideToast };
}

// Toast component
function Toast({
  message,
  undoCallback,
  visible,
  onClose,
  onUndo,
}: ToastState & { onClose: () => void; onUndo: () => void }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <span>{message}</span>
      {undoCallback && (
        <button
          onClick={onUndo}
          className="text-amber-400 hover:text-amber-300 font-medium"
        >
          Undo
        </button>
      )}
      <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
        ×
      </button>
    </div>
  );
}

export function FlagDetailPanel({
  questionId,
  onClose,
  onQuestionArchived,
  onFlagsDismissed,
  onQuestionRestored,
  onRefreshNeeded,
}: FlagDetailPanelProps) {
  const { accessToken } = useAuthStore();
  const [questionDetail, setQuestionDetail] = useState<QuestionDetail | null>(
    null
  );
  const [flags, setFlags] = useState<FlagEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { toast, showToast, hideToast } = useUndoToast();

  // Fetch question detail when questionId changes
  useEffect(() => {
    if (questionId === null || !accessToken) {
      setQuestionDetail(null);
      setFlags([]);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/admin/flags/${questionId}/detail`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch flag details');
        }

        const data: FlagDetailResponse = await response.json();
        setQuestionDetail(data.question);
        setFlags(data.flags);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [questionId, accessToken]);

  // Handle archive with undo
  const handleArchive = async () => {
    if (!questionDetail || pendingAction) return;

    setPendingAction('archiving');

    // Optimistically update parent
    onQuestionArchived(questionDetail.id);
    onClose();

    // Show undo toast
    showToast('Question archived', async () => {
      // Undo: restore the question
      try {
        await fetch(`${API_URL}/api/admin/flags/${questionDetail.id}/restore`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        onRefreshNeeded();
      } catch (err) {
        setError('Failed to restore question');
        onRefreshNeeded();
      }
    });

    // Call archive API
    try {
      const response = await fetch(
        `${API_URL}/api/admin/flags/${questionDetail.id}/archive`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to archive question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
      onRefreshNeeded();
    } finally {
      setPendingAction(null);
    }
  };

  // Handle dismiss (with confirmation, no undo)
  const handleDismiss = async () => {
    if (!questionDetail || pendingAction) return;

    const confirmed = window.confirm(
      'Dismiss all flags for this question? This will remove all player feedback.'
    );
    if (!confirmed) return;

    setPendingAction('dismissing');

    // Optimistically update parent
    onFlagsDismissed(questionDetail.id);
    onClose();

    // Call dismiss API
    try {
      const response = await fetch(
        `${API_URL}/api/admin/flags/${questionDetail.id}/dismiss`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to dismiss flags');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss flags');
      onRefreshNeeded();
    } finally {
      setPendingAction(null);
    }
  };

  // Handle restore
  const handleRestore = async () => {
    if (!questionDetail || pendingAction) return;

    setPendingAction('restoring');

    // Optimistically update parent
    onQuestionRestored(questionDetail.id);
    onClose();

    // Call restore API
    try {
      const response = await fetch(
        `${API_URL}/api/admin/flags/${questionDetail.id}/restore`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore');
      onRefreshNeeded();
    } finally {
      setPendingAction(null);
    }
  };

  // Toggle flag elaboration expansion
  const toggleFlagExpansion = (flagId: number) => {
    setExpandedFlags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(flagId)) {
        newSet.delete(flagId);
      } else {
        newSet.add(flagId);
      }
      return newSet;
    });
  };

  // Aggregate flag summary
  const getAggregateReasonSummary = () => {
    const breakdown: Record<string, number> = {};
    for (const flag of flags) {
      for (const reason of flag.reasons || []) {
        breakdown[reason] = (breakdown[reason] || 0) + 1;
      }
    }
    return breakdown;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      'confusing-wording': { label: 'Confusing', color: 'bg-amber-100 text-amber-800 border-amber-300' },
      'outdated-info': { label: 'Outdated', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      'wrong-answer': { label: 'Wrong', color: 'bg-red-100 text-red-800 border-red-300' },
      'not-interesting': { label: 'Boring', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    return labels[reason] || { label: reason, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const isOpen = questionId !== null;

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      {/* Header */}
                      <div className="bg-red-900 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-white">
                            Flag Details
                          </Dialog.Title>
                          <div className="flex items-center space-x-2">
                            {/* Close button */}
                            <button
                              onClick={onClose}
                              className="p-2 text-white hover:bg-red-800 rounded"
                              aria-label="Close panel"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto px-6 py-6">
                        {/* Loading state */}
                        {loading && (
                          <div className="space-y-4 animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                            <div className="space-y-2">
                              <div className="h-6 bg-gray-200 rounded w-full" />
                              <div className="h-6 bg-gray-200 rounded w-full" />
                              <div className="h-6 bg-gray-200 rounded w-full" />
                              <div className="h-6 bg-gray-200 rounded w-full" />
                            </div>
                          </div>
                        )}

                        {/* Error state */}
                        {error && !loading && (
                          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                            {error}
                          </div>
                        )}

                        {/* Content */}
                        {!loading && questionDetail && (
                          <div className="space-y-6">
                            {/* Flag Summary Section */}
                            <div className="bg-red-50 p-4 rounded-md border border-red-200">
                              <div className="flex items-center gap-2 mb-2">
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <h4 className="text-sm font-semibold text-red-900">
                                  {flags.length} {flags.length === 1 ? 'flag' : 'flags'}
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(getAggregateReasonSummary()).map(
                                  ([reason, count]) => {
                                    const { label, color } = getReasonLabel(reason);
                                    return (
                                      <span
                                        key={reason}
                                        className={`px-2 py-1 text-xs font-medium rounded border ${color}`}
                                      >
                                        {label} x{count}
                                      </span>
                                    );
                                  }
                                )}
                              </div>
                            </div>

                            {/* Action Buttons Section */}
                            <div className="flex gap-3">
                              {questionDetail.status === 'active' ? (
                                <>
                                  <button
                                    onClick={handleArchive}
                                    disabled={!!pendingAction}
                                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Archive Question
                                  </button>
                                  <button
                                    onClick={handleDismiss}
                                    disabled={!!pendingAction}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Dismiss Flags
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={handleRestore}
                                  disabled={!!pendingAction}
                                  className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Restore Question
                                </button>
                              )}
                            </div>

                            {/* Question Context Section */}
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {questionDetail.text}
                              </h3>

                              {/* Answer options */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Answer Options
                                </h4>
                                <div className="space-y-2">
                                  {questionDetail.options.map((optionText, idx) => {
                                    const isCorrect = questionDetail.correctAnswer === idx;
                                    const label = String.fromCharCode(65 + idx); // A, B, C, D

                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-start p-3 rounded-md border ${
                                          isCorrect
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-gray-50 border-gray-200'
                                        }`}
                                      >
                                        <span className="font-semibold text-gray-700 mr-2">
                                          {label}.
                                        </span>
                                        <div className="flex-1">
                                          <span className="text-gray-900">
                                            {optionText}
                                          </span>
                                          {isCorrect && (
                                            <svg
                                              className="inline-block w-5 h-5 ml-2 text-green-600"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Explanation */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Explanation
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <p className="text-gray-900">
                                    {questionDetail.explanation}
                                  </p>
                                </div>
                              </div>

                              {/* Learn More */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Learn More
                                </h4>
                                {questionDetail.source.url ? (
                                  <a
                                    href={questionDetail.source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-600 hover:text-red-700 underline"
                                  >
                                    {questionDetail.source.name}
                                    <svg
                                      className="inline-block w-4 h-4 ml-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                ) : (
                                  <span className="text-gray-500">
                                    {questionDetail.source.name || 'No source provided'}
                                  </span>
                                )}
                              </div>

                              {/* Learning Content */}
                              {questionDetail.learningContent && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Learning Content
                                  </h4>
                                  <div className="bg-gray-50 p-4 rounded-md prose prose-sm max-w-none">
                                    {questionDetail.learningContent.split('\n').map((para, idx) => (
                                      <p key={idx} className="text-gray-900 mb-2 last:mb-0">
                                        {para}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Edit Question Link */}
                              <div>
                                <Link
                                  to={`/admin/questions?search=${encodeURIComponent(
                                    questionDetail.externalId
                                  )}`}
                                  className="text-red-600 hover:text-red-700 underline text-sm"
                                >
                                  Edit in Question Explorer
                                </Link>
                              </div>
                            </div>

                            {/* Individual Flags Section */}
                            <div className="border-t pt-6">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Player Feedback ({flags.length}{' '}
                                {flags.length === 1 ? 'flag' : 'flags'})
                              </h4>

                              {flags.length === 0 ? (
                                <p className="text-sm text-gray-600 italic">
                                  No flag entries available
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {flags.map((flag) => {
                                    const hasReasons = flag.reasons && flag.reasons.length > 0;
                                    const hasElaboration = flag.elaboration && flag.elaboration.trim();
                                    const isExpanded = expandedFlags.has(flag.id);
                                    const needsTruncation = hasElaboration && flag.elaboration!.length > 100;
                                    const displayText = needsTruncation && !isExpanded
                                      ? flag.elaboration!.slice(0, 100) + '...'
                                      : flag.elaboration;

                                    return (
                                      <div
                                        key={flag.id}
                                        className="bg-gray-50 p-4 rounded-md border border-gray-200"
                                      >
                                        {/* Top row: username + date */}
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-semibold text-gray-900">
                                            {flag.username}
                                          </span>
                                          <span className="text-sm text-gray-500">
                                            {new Date(flag.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>

                                        {/* Reasons row */}
                                        {hasReasons && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {flag.reasons.map((reason) => {
                                              const { label, color } = getReasonLabel(reason);
                                              return (
                                                <span
                                                  key={reason}
                                                  className={`px-2 py-0.5 text-xs font-medium rounded border ${color}`}
                                                >
                                                  {label}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* Elaboration text */}
                                        {hasElaboration && (
                                          <div>
                                            <p className="text-sm text-gray-900 mb-1">
                                              {displayText}
                                            </p>
                                            {needsTruncation && (
                                              <button
                                                onClick={() => toggleFlagExpansion(flag.id)}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                                              >
                                                {isExpanded ? 'Show less' : 'Show more'}
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        {/* No details case */}
                                        {!hasReasons && !hasElaboration && (
                                          <p className="text-sm text-gray-500 italic">
                                            Flagged without details
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Toast */}
      <Toast
        {...toast}
        onClose={hideToast}
        onUndo={() => {
          if (toast.undoCallback) {
            toast.undoCallback();
            hideToast();
          }
        }}
      />
    </>
  );
}
