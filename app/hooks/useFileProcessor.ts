// app/hooks/useFileProcessor.ts

'use client';

import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';

// --- 1. Enhanced Configuration Options for the Hook ---
interface UseFileProcessorOptions<T> {
  acceptMultiple?: boolean;
  processApiEndpoint: string;
  previewApiEndpoint?: string;
  analysisApiEndpoint?: string; // NEW: For complex analysis steps
  outputFileNameGenerator: (files: File[]) => string;
  getExtraFormData?: () => Record<string, string>;
  getDynamicFormData?: (customState: any) => Record<string, string>; // NEW: Dynamic form data
  steps?: string[]; // NEW: Multi-step workflow support
  initialStep?: string; // NEW: Starting step
  feedbackMessages?: { // NEW: Custom feedback messages
    initial?: string;
    fileSelected?: (fileName: string) => string;
    processingPreview?: string;
    processingDownload?: string;
    processingAnalysis?: string;
    previewSuccess?: string;
    downloadSuccess?: string;
    analysisSuccess?: string;
    error?: (message: string) => string;
  };
}

// --- 2. Enhanced Return Type of the Hook ---
interface UseFileProcessorReturn<T, A = any> {
  // File handling
  file: File | null; // Legacy single file support
  files: File[]; // NEW: Multiple files support
  
  // State management
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'processing' | 'success' | 'error'; // NEW: Enhanced status
  feedback: string; // NEW: User feedback messages
  
  // Data states
  previewData: T | null;
  analysisData: A | null; // NEW: Analysis results
  customState: Record<string, any>; // NEW: Tool-specific state
  
  // Step management (NEW)
  currentStep: string;
  steps: string[];
  
  // File handlers
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMultipleFileChange: (e: ChangeEvent<HTMLInputElement>) => void; // NEW
  
  // Processing handlers
  handleProcess: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePreview?: () => Promise<void>;
  handleAnalysis?: () => Promise<void>; // NEW: Analysis step
  
  // State management (NEW)
  updateCustomState: (key: string, value: any) => void;
  setStep: (step: string) => void;
  setFeedback: (message: string) => void;
  setStatus: (status: 'idle' | 'processing' | 'success' | 'error') => void;
  
  // Utility
  reset: () => void;
  canProceed: boolean; // NEW: Validation helper
}

// --- 3. Enhanced Generic Custom Hook ---
export function useFileProcessor<T = any, A = any>({
  acceptMultiple = false,
  processApiEndpoint,
  previewApiEndpoint,
  analysisApiEndpoint,
  outputFileNameGenerator,
  getExtraFormData,
  getDynamicFormData,
  steps = ['upload'],
  initialStep,
  feedbackMessages = {},
}: UseFileProcessorOptions<T>): UseFileProcessorReturn<T, A> {
  
  // Enhanced state management
  const [file, setFile] = useState<File | null>(null); // Legacy support
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState(feedbackMessages.initial || 'Select files to get started.');
  const [previewData, setPreviewData] = useState<T | null>(null);
  const [analysisData, setAnalysisData] = useState<A | null>(null);
  const [customState, setCustomState] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(initialStep || steps[0]);

  // Custom state updater
  const updateCustomState = useCallback((key: string, value: any) => {
    setCustomState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Step management
  const setStep = useCallback((step: string) => {
    setCurrentStep(step);
  }, []);

  // Centralized function to handle API requests
  const processRequest = useCallback(async (endpoint: string, isPreview: boolean, isAnalysis: boolean = false) => {
    const currentFiles = acceptMultiple ? files : (file ? [file] : []);
    
    if (currentFiles.length === 0) {
      const errorMsg = feedbackMessages.error?.('Please select at least one file.') || 'Please select at least one file.';
      setError(errorMsg);
      setStatus('error');
      setFeedback(errorMsg);
      return null;
    }

    setIsLoading(true);
    setError(null);
    setStatus('processing');
    
    if (isAnalysis) {
      setFeedback(feedbackMessages.processingAnalysis || 'Analyzing files...');
    } else if (isPreview) {
      setFeedback(feedbackMessages.processingPreview || 'Generating preview...');
      setPreviewData(null);
    } else {
      setFeedback(feedbackMessages.processingDownload || 'Processing files...');
    }

    const formData = new FormData();
    currentFiles.forEach(file => formData.append(acceptMultiple ? 'files' : 'file', file));
    
    // Add extra form data
    if (getExtraFormData) {
      const extraData = getExtraFormData();
      Object.entries(extraData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Add dynamic form data based on custom state
    if (getDynamicFormData) {
      const dynamicData = getDynamicFormData(customState);
      Object.entries(dynamicData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      }
      
      setStatus('success');
      if (isAnalysis) {
        setFeedback(feedbackMessages.analysisSuccess || 'Analysis completed successfully.');
      } else if (isPreview) {
        setFeedback(feedbackMessages.previewSuccess || 'Preview generated successfully.');
      } else {
        setFeedback(feedbackMessages.downloadSuccess || 'Processing completed successfully.');
      }
      
      return response;
    } catch (err: any) {
      const errorMsg = feedbackMessages.error?.(err.message) || `Error: ${err.message}`;
      setError(err.message || 'An unexpected error occurred.');
      setStatus('error');
      setFeedback(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [files, file, acceptMultiple, getExtraFormData, getDynamicFormData, customState, feedbackMessages]);

  // Handler for the main "process and download" action
  const handleProcess = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await processRequest(processApiEndpoint, false);
    if (response) {
      const blob = await response.blob();
      const outputFileName = outputFileNameGenerator(acceptMultiple ? files : (file ? [file] : []));

      // --- INLINE DOWNLOAD LOGIC ---
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // --- End of Download Logic ---
    }
  }, [processRequest, processApiEndpoint, outputFileNameGenerator, files, file, acceptMultiple]);

  // Handler for the "preview" action
  const handlePreview = previewApiEndpoint ? useCallback(async () => {
    const response = await processRequest(previewApiEndpoint, true);
    if (response) {
      const data: T = await response.json();
      setPreviewData(data);
    }
  }, [processRequest, previewApiEndpoint]) : undefined;

  // NEW: Handler for the "analysis" action
  const handleAnalysis = analysisApiEndpoint ? useCallback(async () => {
    const response = await processRequest(analysisApiEndpoint, false, true);
    if (response) {
      const data: A = await response.json();
      setAnalysisData(data);
    }
  }, [processRequest, analysisApiEndpoint]) : undefined;
  
  // Handler for file input changes (legacy single file)
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (acceptMultiple) {
        setFiles(selectedFiles);
        setFeedback(feedbackMessages.fileSelected?.(`${selectedFiles.length} files`) || `Selected ${selectedFiles.length} files.`);
      } else {
        const selectedFile = selectedFiles[0];
        setFile(selectedFile);
        setFiles([selectedFile]);
        setFeedback(feedbackMessages.fileSelected?.(selectedFile.name) || `Selected file: ${selectedFile.name}`);
      }
      setError(null);
      setPreviewData(null);
      setAnalysisData(null);
      setStatus('idle');
    }
  }, [acceptMultiple, feedbackMessages]);

  // NEW: Handler for multiple file input changes
  const handleMultipleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setFile(selectedFiles[0] || null); // For backward compatibility
      setFeedback(feedbackMessages.fileSelected?.(`${selectedFiles.length} files`) || `Selected ${selectedFiles.length} files.`);
      setError(null);
      setPreviewData(null);
      setAnalysisData(null);
      setStatus('idle');
    }
  }, [feedbackMessages]);

  // Resets the state of the hook
  const reset = useCallback(() => {
    setFile(null);
    setFiles([]);
    setIsLoading(false);
    setError(null);
    setStatus('idle');
    setFeedback(feedbackMessages.initial || 'Select files to get started.');
    setPreviewData(null);
    setAnalysisData(null);
    setCustomState({});
    setCurrentStep(initialStep || steps[0]);
  }, [feedbackMessages, initialStep, steps]);

  // NEW: Validation helper
  const canProceed = useMemo(() => {
    const hasFiles = acceptMultiple ? files.length > 0 : file !== null;
    return hasFiles && status !== 'processing';
  }, [acceptMultiple, files.length, file, status]);
  
  return {
    // Legacy support
    file,
    
    // Enhanced functionality
    files,
    isLoading,
    error,
    status,
    feedback,
    previewData,
    analysisData,
    customState,
    currentStep,
    steps,
    
    // Handlers
    handleFileChange,
    handleMultipleFileChange,
    handleProcess,
    handlePreview,
    handleAnalysis,
    
    // State management
    updateCustomState,
    setStep,
    setFeedback,
    setStatus,
    
    // Utility
    reset,
    canProceed,
  };
}