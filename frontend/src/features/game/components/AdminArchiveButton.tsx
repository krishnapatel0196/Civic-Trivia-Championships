// TODO: Future — support Dev Role with per-collection admin access
import { useState } from 'react';
import { AdminArchiveModal } from './AdminArchiveModal';

interface AdminArchiveButtonProps {
  questionId: string;
  onArchived: () => void;
  accessToken: string;
}

export function AdminArchiveButton({ questionId, onArchived, accessToken }: AdminArchiveButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setIsModalOpen(true)}
          aria-label="Archive question (admin)"
          className="p-2 transition-opacity hover:opacity-80"
        >
          {/* Archive box icon */}
          <svg
            className="w-5 h-5 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3h18v4H3z" />
            <path d="M5 7v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7" />
            <path d="M9 12h6" />
          </svg>
        </button>

        {/* CSS hover tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-700 text-white text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Archive question (admin)
        </div>
      </div>

      <AdminArchiveModal
        isOpen={isModalOpen}
        questionId={questionId}
        accessToken={accessToken}
        onClose={() => setIsModalOpen(false)}
        onArchived={() => {
          setIsModalOpen(false);
          onArchived();
        }}
      />
    </>
  );
}
