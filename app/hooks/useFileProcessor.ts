'use client';

import { useState, useCallback, ChangeEvent } from 'react';

// Define the arguments the hook will accept
interface FileProcessorOptions {
  previewApiEndpoint: string;
  downloadApiEndpoint: string;
  fileType: string; // e.g., '.json', '.csv'
  feedbackMessages: {
    initial: string;
    fileSelected: (fileName: string) => string;
    processingPreview: string;
    processingDownload: string;
    previewSuccess: string;
    downloadSuccess: string;
    error: (message: string) => string;
  };
}

// The custom hook
export function useFileProcessor({
  previewApiEndpoint,
  downloadApiEndpoint,
  fileType,
  feedbackMessages,
}: FileProcessorOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState(feedbackMessages.initial);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFeedback(feedbackMessages.fileSelected(selectedFile.name));
      setStatus('idle');
      setErrorDetails(null);
      setPreviewData(null);
    }
  }, [feedbackMessages]);

  const handlePreview = useCallback(async () => {
    if (!file) {
      setFeedback('Please select a file to preview.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setFeedback(feedbackMessages.processingPreview);
    setErrorDetails(null);
    setPreviewData(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(previewApiEndpoint, { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        setErrorDetails(JSON.stringify(result, null, 2));
        throw new Error(result.message || 'Preview generation failed.');
      }

      setPreviewData(result.csv);
      setStatus('idle');
      setFeedback(feedbackMessages.previewSuccess);
    } catch (error: any) {
      setStatus('error');
      setFeedback(feedbackMessages.error(error.message));
    }
  }, [file, previewApiEndpoint, feedbackMessages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFeedback('Please select a file first.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setFeedback(feedbackMessages.processingDownload);
    setErrorDetails(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(downloadApiEndpoint, { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorDetails(JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || 'Conversion failed on the server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(new RegExp(`${fileType}$`), '')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus('success');
      setFeedback(feedbackMessages.downloadSuccess);
    } catch (error: any) {
      setStatus('error');
      setFeedback(feedbackMessages.error(error.message));
    }
  }, [file, downloadApiEndpoint, fileType, feedbackMessages]);

  // Return all the state and handlers for the component to use
  return {
    file,
    status,
    feedback,
    errorDetails,
    previewData,
    handleFileChange,
    handlePreview,
    handleSubmit,
  };
}
