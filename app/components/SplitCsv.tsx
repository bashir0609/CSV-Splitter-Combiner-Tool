'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { FiUploadCloud, FiEye, FiGitCommit } from 'react-icons/fi';
import ToolPageTemplate from './ui/ToolPageTemplate';

export default function SplitCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [numSplits, setNumSplits] = useState<number>(2);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('Upload a CSV file to get started.');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFeedback(`Selected file: ${selectedFile.name}`);
      setStatus('idle');
      setErrorDetails(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setFeedback('Please select a file to preview.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setFeedback('Analyzing file...');
    setErrorDetails(null);
    setPreviewData(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('numSplits', String(numSplits));

    try {
      const response = await fetch('/api/split-csv/preview', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        setErrorDetails(JSON.stringify(result, null, 2));
        throw new Error(result.message || 'Preview generation failed.');
      }

      setPreviewData(result.previewMessage);
      setStatus('idle');
      setFeedback('Analysis complete.');
    } catch (error: any) {
      setStatus('error');
      setFeedback(`Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFeedback('Please select a file first.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setFeedback('Splitting file and creating zip...');
    setErrorDetails(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('numSplits', String(numSplits));

    try {
      const response = await fetch('/api/split-csv', { method: 'POST', body: formData });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorDetails(JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || 'File splitting failed.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.csv$/, '')}_split.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus('success');
      setFeedback('Success! Your zip file has been downloaded.');
    } catch (error: any) {
      setStatus('error');
      setFeedback(`Error: ${error.message}`);
    }
  };

  return (
    <ToolPageTemplate
      title="Split CSV File"
      icon={<FiGitCommit />}
      status={status}
      feedback={feedback}
      errorDetails={errorDetails}
    >
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
        >
          <FiUploadCloud className="text-slate-400 text-3xl sm:text-4xl mb-2" />
          <span className="text-slate-300 font-semibold">{file ? 'Change File' : 'Click to Upload'}</span>
          <span className="text-xs text-slate-500 mt-1">{file ? file.name : 'CSV up to 20MB'}</span>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <div className="mt-6">
          <label htmlFor="num-splits" className="block text-sm font-medium text-slate-300 mb-2">
            Number of files to split into:
          </label>
          <input
            type="number"
            id="num-splits"
            value={numSplits}
            onChange={(e) => setNumSplits(Math.max(2, parseInt(e.target.value, 10) || 2))}
            min="2"
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-center text-lg font-semibold"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || status === 'processing'}
            className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiEye className="mr-2" />
            Analyze
          </button>
          <button
            type="submit"
            disabled={!file || status === 'processing'}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Split & Download Zip
          </button>
        </div>
      </form>
      
      {previewData && (
        <div className="mt-6 text-center bg-slate-900 p-4 rounded-lg border border-slate-700">
          <p className="text-slate-300">{previewData}</p>
        </div>
      )}
    </ToolPageTemplate>
  );
}
