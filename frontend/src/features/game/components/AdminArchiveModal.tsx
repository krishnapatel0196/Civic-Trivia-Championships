import { useState } from 'react';
import { API_URL } from '../../../services/api';

interface AdminArchiveModalProps {
  isOpen: boolean;
  questionId: string;
  accessToken: string;
  onClose: () => void;
  onArchived: () => void;
}

export function AdminArchiveModal({
  isOpen,
  questionId,
  accessToken,
  onClose,
  onArchived,
}: AdminArchiveModalProps) {
  const [verdict, setVerdict] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleArchive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/questions/by-external-id/${encodeURIComponent(questionId)}/archive`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ verdict: verdict.trim() || null }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || `Request failed (${response.status})`);
        setIsLoading(false);
        return;
      }

      // Show brief success state, then close
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setVerdict('');
        onArchived();
      }, 800);
    } catch (err) {
      setError('Network error — please try again.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setVerdict('');
      setError(null);
      setShowSuccess(false);
      onClose();
    }
  };

  return (
    /* Fixed overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={handleClose}
    >
      {/* Modal card */}
      <div
        className="bg-slate-800 rounded-sm shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '22px',
            letterSpacing: '0.1em',
            color: '#F5EDD8',
            marginBottom: '4px',
          }}
        >
          Archive Question
        </h2>
        <p className="text-slate-400 text-sm mb-5">
          This will remove the question from active play.
        </p>

        <textarea
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          placeholder="Why is this question being archived? (optional but helpful)"
          disabled={isLoading || showSuccess}
          rows={3}
          className="w-full bg-slate-700 text-slate-200 text-sm rounded-sm px-3 py-2 mb-4 resize-none outline-none focus:ring-1 focus:ring-slate-500 placeholder-slate-500 disabled:opacity-60"
        />

        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading || showSuccess}
            className="px-4 py-2 text-sm text-slate-300 bg-slate-700 rounded-sm hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleArchive}
            disabled={isLoading || showSuccess}
            className="px-4 py-2 text-sm font-medium rounded-sm transition-colors disabled:opacity-60"
            style={{
              background: showSuccess ? '#16a34a' : '#dc2626',
              color: '#fff',
            }}
          >
            {showSuccess ? 'Archived' : isLoading ? 'Archiving...' : 'Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}
