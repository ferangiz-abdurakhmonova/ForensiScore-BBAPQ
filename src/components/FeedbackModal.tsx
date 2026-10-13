import React from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submit Feedback or Report Issue</h2>
        
        <div className="space-y-4">
          <a
            href="https://github.com/ferangiz-abdurakhmonova/ForensiScore-BBAPQ/issues/new"
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
            onClick={onClose}
          >
            <div className="text-2xl">🐙</div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Public GitHub Issue</div>
              <div className="text-sm text-slate-500">Requires a GitHub account. All comments and submissions will be publicly visible to the community.</div>
            </div>
          </a>
          
          <a
            href="https://forms.gle/sRVtiVsQai6th8vg9"
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
            onClick={onClose}
          >
            <div className="text-2xl">📝</div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Anonymous Feedback Form</div>
              <div className="text-sm text-slate-500">100% anonymous via Google Forms. No sign-in required, no names or emails collected.</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
