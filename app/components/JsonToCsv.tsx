'use client';

import { useState, useRef } from 'react';
import { FiUploadCloud, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function JsonToCsv() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('Upload a JSON file to get started.');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFeedback(`Selected file: ${selectedFile.name}`);
      setStatus('idle');
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
    setFeedback('Converting, please wait...');
    const formData = new FormData();
    formData.append('jsonFile', file);

    try {
      const response = await fetch('/api/json-to-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Conversion failed on the server.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.json$/, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus('success');
      setFeedback('Success! Your CSV has been downloaded.');

    } catch (error: any) {
      setStatus('error');
      setFeedback(`Error: ${error.message}`);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'processing': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-8 text-center">
      
      <div className="flex justify-center items-center mb-4">
        <FiUploadCloud className="text-sky-400 text-4xl mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">JSON to CSV Converter</h1>
      </div>

      <p className={`mt-4 mb-6 h-10 flex items-center justify-center text-sm sm:text-base ${getStatusColor()}`}>
        {status === 'success' && <FiCheckCircle className="mr-2" />}
        {status === 'error' && <FiAlertTriangle className="mr-2" />}
        {feedback}
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
        >
          <FiUploadCloud className="text-slate-400 text-3xl sm:text-4xl mb-2" />
          <span className="text-slate-300 font-semibold">
            {file ? 'Change File' : 'Click to Upload'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {file ? file.name : 'JSON up to 10MB'}
          </span>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <button
          type="submit"
          disabled={!file || status === 'processing'}
          className="w-full mt-6 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
        >
          {status === 'processing' ? 'Processing...' : 'Convert & Download'}
        </button>
      </form>
    </div>
  );
}
