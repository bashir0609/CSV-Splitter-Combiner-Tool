'use client';

import { useRef } from 'react';
import { FiUploadCloud, FiEye } from 'react-icons/fi';
import ToolPageTemplate from './ToolPageTemplate';
import CsvPreviewTable from './CsvPreviewTable';
import { useFileProcessor } from '../hooks/useFileProcessor'; // Import the new hook
import ErrorDetails from './ErrorDisplay';

// Configuration for this specific tool
const toolConfig = {
  previewApiEndpoint: '/api/json-to-csv/preview',
  processApiEndpoint: '/api/json-to-csv',
  fileType: '.json',
  outputFileNameGenerator: (files: File[]) => {
    const originalName = files[0]?.name?.replace(/\.[^/.]+$/, '') || 'file';
    return `${originalName}.csv`;
  },
  feedbackMessages: {
    initial: 'Upload a JSON file to get started.',
    fileSelected: (fileName: string) => `Selected file: ${fileName}`,
    processingPreview: 'Generating preview...',
    processingDownload: 'Converting, please wait...',
    previewSuccess: 'Preview generated successfully.',
    downloadSuccess: 'Success! Your CSV has been downloaded.',
    error: (message: string) => `Error: ${message}`,
  },
};

export default function JsonToCsv() {
  const {
    file,
    status,
    feedback,
    error,
    previewData,
    handleFileChange,
    handlePreview,
    handleProcess,
  } = useFileProcessor(toolConfig);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <ToolPageTemplate
      title="JSON to CSV Converter"
      icon={<FiUploadCloud />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      <form onSubmit={handleProcess}>
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
            accept={toolConfig.fileType}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || status === 'processing'}
            className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiEye className="mr-2" />
            Preview
          </button>
          <button
            type="submit"
            disabled={!file || status === 'processing'}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Convert & Download
          </button>
        </div>
      </form>
      
      <CsvPreviewTable csvData={previewData} />
    </ToolPageTemplate>
  );
}
