'use client';

import { useState, useCallback, useEffect } from 'react';
import { FiDatabase, FiEye, FiArrowRight, FiDownload, FiInfo } from 'react-icons/fi';
import { useFileProcessor } from '../hooks/useFileProcessor';
import ToolPageTemplate from './ui/ToolPageTemplate';

interface JoinAnalysisResult {
  files: Array<{
    filename: string;
    columns: string[];
    rowCount: number;
  }>;
  commonColumns: string[];
  totalFiles: number;
}

interface JoinPreviewResult {
  previewMessage: string;
  sampleRows: any[];
  totalColumns: number;
  totalRows: number;
  joinStats: {
    matchedRows: number;
    unmatchedFromLeft: number;
    unmatchedFromRight: number;
    totalOutputRows: number;
  };
  outputColumns: string[];
}

export function JoinOnColumn() {
  const [joinColumn, setJoinColumn] = useState<string>('');
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'right' | 'outer'>('inner');
  const [customDownloadName, setCustomDownloadName] = useState<string>('');
  const [columnPrefix, setColumnPrefix] = useState<boolean>(true);

  // Configure the useFileProcessor hook
  const {
    files,
    status,
    feedback,
    error,
    analysisData,
    previewData,
    currentStep,
    isLoading,
    canProceed,
    handleMultipleFileChange,
    handleAnalysis,
    handlePreview,
    handleProcess,
    setStep,
    setFeedback,
    reset
  } = useFileProcessor<JoinPreviewResult, JoinAnalysisResult>({
    acceptMultiple: true,
    processApiEndpoint: '/api/join-on-column',
    previewApiEndpoint: '/api/join-on-column/preview',
    analysisApiEndpoint: '/api/join-on-column/analyze',
    outputFileNameGenerator: () => 'joined-data.csv',
    steps: ['upload', 'configure', 'preview'],
    initialStep: 'upload',
    getDynamicFormData: () => ({
      joinColumn,
      joinType,
      columnPrefix: columnPrefix.toString(),
      customDownloadName: customDownloadName || ''
    }),
    feedbackMessages: {
      initial: 'Upload 2 CSV files to perform database-style joins.',
      fileSelected: (fileName: string) => `Selected ${fileName}. Click "Analyze Files" to continue.`,
      processingAnalysis: 'Analyzing files and detecting join columns...',
      processingPreview: 'Generating join preview...',
      processingDownload: 'Creating joined CSV file...',
      analysisSuccess: 'Files analyzed successfully. Configure join settings below.',
      previewSuccess: 'Join preview generated successfully. Review before downloading.',
      downloadSuccess: 'Success! Your joined CSV file has been downloaded.',
      error: (message: string) => `Error: ${message}`,
    }
  });

  // Handle file selection with validation
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleFileChange(e);
    if (e.target.files && e.target.files.length !== 2) {
      setFeedback('Please select exactly 2 CSV files to join.');
      return;
    }
    // Reset settings when new files are selected
    setJoinColumn('');
    setCustomDownloadName('');
  }, [handleMultipleFileChange, setFeedback]);

  // Handle analysis
  const handleAnalysisWithValidation = useCallback(async () => {
    if (files.length !== 2) {
      setFeedback('Please select exactly 2 CSV files to join.');
      return;
    }

    if (handleAnalysis) {
      await handleAnalysis();
      setStep('configure');
    }
  }, [files.length, handleAnalysis, setFeedback, setStep]);

  // Handle preview generation
  const handlePreviewGeneration = useCallback(async () => {
    if (!joinColumn) {
      setFeedback('Please select a join column before generating preview.');
      return;
    }

    if (handlePreview) {
      await handlePreview();
      setStep('preview');
    }
  }, [joinColumn, handlePreview, setFeedback, setStep]);

  // Handle final download
  const handleDownload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleProcess(e);
  }, [handleProcess]);

  // Validation helpers
  const canProceedToPreview = () => {
    return analysisData && joinColumn;
  };

  // Generate final download name
  const finalDownloadName = customDownloadName 
    ? (customDownloadName.endsWith('.csv') ? customDownloadName : `${customDownloadName}.csv`)
    : 'joined-data.csv';

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6 space-x-4">
      <div className={`flex items-center ${currentStep === 'upload' ? 'text-sky-400' : 'text-slate-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'upload' ? 'bg-sky-600' : 'bg-slate-600'
        }`}>1</div>
        <span className="ml-2 text-sm">Upload Files</span>
      </div>
      <FiArrowRight className="text-slate-500" />
      <div className={`flex items-center ${currentStep === 'configure' ? 'text-sky-400' : 'text-slate-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'configure' ? 'bg-sky-600' : 'bg-slate-600'
        }`}>2</div>
        <span className="ml-2 text-sm">Configure Join</span>
      </div>
      <FiArrowRight className="text-slate-500" />
      <div className={`flex items-center ${currentStep === 'preview' ? 'text-sky-400' : 'text-slate-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'preview' ? 'bg-sky-600' : 'bg-slate-600'
        }`}>3</div>
        <span className="ml-2 text-sm">Preview & Download</span>
      </div>
    </div>
  );
  
  return (
    <ToolPageTemplate
      title="Join on Column"
      icon={<FiDatabase />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      <StepIndicator />

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <>
          <div className="mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">💡 About Database-Style Joins</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              This tool performs database-style joins on two CSV files using a common column. 
              Choose from Inner, Left, Right, or Outer joins to control which records are included in the result.
            </p>
          </div>

          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
          >
            <FiDatabase className="text-slate-400 text-3xl sm:text-4xl mb-2" />
            <span className="text-slate-300 font-semibold">
              {files.length > 0 ? 'Change Files' : 'Click to Upload 2 CSV Files'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {files.length > 0 ? `${files.length} files selected` : 'Select exactly 2 CSV files to join'}
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              multiple
              onChange={handleFileSelection}
              className="sr-only"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Selected Files:</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center text-sm text-slate-400">
                    <span className="flex items-center">
                      <span className="bg-slate-600 text-xs px-2 py-1 rounded mr-2">
                        {index === 0 ? 'LEFT' : 'RIGHT'}
                      </span>
                      {file.name}
                    </span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleAnalysisWithValidation}
              disabled={files.length !== 2 || isLoading}
              className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiEye className="mr-2" />
              Analyze Files
            </button>
          </div>
        </>
      )}

      {/* Step 2: Configure Join */}
      {currentStep === 'configure' && analysisData && (
        <>
          <div className="space-y-6">
            {/* File Information */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-slate-200 mb-3">File Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisData.files.map((file, index) => (
                  <div key={index} className="bg-slate-600/50 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="bg-sky-600 text-xs px-2 py-1 rounded mr-2">
                        {index === 0 ? 'LEFT' : 'RIGHT'}
                      </span>
                      <span className="text-sm font-medium text-slate-200 truncate">{file.filename}</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Rows: {file.rowCount.toLocaleString()}</div>
                      <div>Columns: {file.columns.length}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join Configuration */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-4">Join Configuration</h3>
              
              <div className="space-y-4">
                {/* Join Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Join Column:
                  </label>
                  <select
                    value={joinColumn}
                    onChange={(e) => setJoinColumn(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select column to join on...</option>
                    {analysisData.commonColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Only columns that exist in both files are shown.
                  </p>
                </div>

                {/* Join Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Join Type:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { type: 'inner', label: 'Inner Join', desc: 'Only matching records' },
                      { type: 'left', label: 'Left Join', desc: 'All from left + matches' },
                      { type: 'right', label: 'Right Join', desc: 'All from right + matches' },
                      { type: 'outer', label: 'Outer Join', desc: 'All records from both' }
                    ].map(({ type, label, desc }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setJoinType(type as any)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          joinType === type
                            ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-xs opacity-80 mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Options */}
                <div className="border-t border-slate-600 pt-4">
                  <h4 className="font-medium text-slate-200 mb-3">Output Options</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={columnPrefix}
                          onChange={(e) => setColumnPrefix(e.target.checked)}
                          className="mr-2 rounded border-slate-600 bg-slate-700 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-slate-300">
                          Add file prefixes to column names
                        </span>
                      </label>
                      <p className="text-xs text-slate-400 ml-6">
                        e.g., "Name" becomes "left_Name" and "right_Name"
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Custom filename (optional):
                      </label>
                      <input
                        type="text"
                        value={customDownloadName}
                        onChange={(e) => setCustomDownloadName(e.target.value)}
                        placeholder="Enter custom filename..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Final filename: <span className="text-sky-400">{finalDownloadName}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Type Information */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                <FiInfo className="mr-2" />
                Join Type Guide
              </h4>
              <div className="text-xs text-blue-200 space-y-1">
                <p>• <strong>Inner Join:</strong> Returns only rows where the join column value exists in both files</p>
                <p>• <strong>Left Join:</strong> Returns all rows from the left file, plus matching rows from the right</p>
                <p>• <strong>Right Join:</strong> Returns all rows from the right file, plus matching rows from the left</p>
                <p>• <strong>Outer Join:</strong> Returns all rows from both files, filling missing values with empty cells</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setStep('upload')}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300"
            >
              Back to Upload
            </button>
            <button
              onClick={handlePreviewGeneration}
              disabled={!canProceedToPreview() || isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Preview
            </button>
          </div>
        </>
      )}

      {/* Step 3: Preview */}
      {currentStep === 'preview' && analysisData && previewData && (
        <div className="space-y-6">
          {/* Join Summary */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-3">Join Results Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-300">Join type:</span>
                <span className="text-sky-400 ml-2 capitalize">{joinType} join</span>
              </div>
              <div>
                <span className="text-slate-300">Join column:</span>
                <span className="text-sky-400 ml-2">{joinColumn}</span>
              </div>
              <div>
                <span className="text-slate-300">Output rows:</span>
                <span className="text-green-400 ml-2">{previewData.joinStats.totalOutputRows.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-300">Output columns:</span>
                <span className="text-green-400 ml-2">{previewData.totalColumns}</span>
              </div>
            </div>
          </div>

          {/* Join Statistics */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-medium text-slate-200 mb-3">Join Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-900/30 border border-green-700 rounded p-3">
                <div className="text-green-300 font-medium">Matched Rows</div>
                <div className="text-green-100 text-lg">{previewData.joinStats.matchedRows.toLocaleString()}</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
                <div className="text-yellow-300 font-medium">Unmatched (Left)</div>
                <div className="text-yellow-100 text-lg">{previewData.joinStats.unmatchedFromLeft.toLocaleString()}</div>
              </div>
              <div className="bg-orange-900/30 border border-orange-700 rounded p-3">
                <div className="text-orange-300 font-medium">Unmatched (Right)</div>
                <div className="text-orange-100 text-lg">{previewData.joinStats.unmatchedFromRight.toLocaleString()}</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
                <div className="text-blue-300 font-medium">Total Output</div>
                <div className="text-blue-100 text-lg">{previewData.joinStats.totalOutputRows.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Sample Data Preview */}
          {previewData.sampleRows.length > 0 && (
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h4 className="font-medium text-slate-200 mb-3">Sample Output (First 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800">
                    <tr>
                      {previewData.outputColumns.map((col, index) => (
                        <th key={index} className="px-3 py-2 text-left font-medium text-slate-300 border border-slate-600">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-700">
                        {previewData.outputColumns.map((col, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 text-slate-300 border border-slate-600 max-w-32 truncate">
                            {row[col] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <form onSubmit={handleDownload}>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('configure')}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300"
              >
                Back to Configure
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download Joined CSV
              </button>
            </div>
          </form>
        </div>
      )}
    </ToolPageTemplate>
  );
}