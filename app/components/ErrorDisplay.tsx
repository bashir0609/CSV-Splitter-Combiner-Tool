'use client';

import { FiCopy } from 'react-icons/fi';

interface ErrorDisplayProps {
  errorDetails: string | null;
}

export default function ErrorDisplay({ errorDetails }: ErrorDisplayProps) {
  if (!errorDetails) {
    return null; // Don't render anything if there's no error
  }

  const handleCopyError = () => {
    const textArea = document.createElement("textarea");
    textArea.value = errorDetails;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      // You could add a small "Copied!" feedback message here if desired
    } catch (err) {
      console.error('Failed to copy error details: ', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="mt-6 text-left">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-slate-300">Server Error Details:</h3>
        <button
          type="button"
          onClick={handleCopyError}
          className="flex items-center px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs font-semibold rounded-md transition-colors"
        >
          <FiCopy className="mr-2" />
          Copy
        </button>
      </div>
      <pre className="bg-slate-900 p-4 rounded-lg text-sm text-red-400 overflow-x-auto">
        <code>{errorDetails}</code>
      </pre>
    </div>
  );
}
