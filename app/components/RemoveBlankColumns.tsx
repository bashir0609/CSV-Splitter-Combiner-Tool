'use client';

import { useState, useCallback, useMemo } from 'react';
import { FiUploadCloud, FiEye, FiTrash2, FiDownload } from 'react-icons/fi';
import { useFileProcessor } from '../hooks/useFileProcessor';
import ToolPageTemplate from './ui/ToolPageTemplate';

interface PreviewResult {
  originalColumns: string[];
  columnsToRemove: string[];
  columnsToKeep: string[];
  blankPercentages: Record<string, number>;
  totalRows: number;
  message: string;
}

interface AnalysisResult {
  columnStats: Record<string, {
    totalCells: number;
    emptyCells: number;
    blankPercentage: number;
  }>;
  totalRows: number;
  originalColumns: string[];
}

export function RemoveBlankColumns() {
  const [blankThreshold, setBlankThreshold] = useState<number>(80);
  const [customDownloadName, setCustomDownloadName] = useState<string>('');
  const [manualRemovals, setManualRemovals] = useState<Record<string, boolean>>({});

  // Configure the useFileProcessor hook
  const {
    file,
    status,
    feedback,
    error,
    analysisData,
    previewData,
    isLoading,
    canProceed,
    handleFileChange,
    handleAnalysis,
    handlePreview,
    handleProcess,
    reset
  } = useFileProcessor<PreviewResult, AnalysisResult>({
    acceptMultiple: false,
    processApiEndpoint: '/api/remove-blank-columns',
    previewApiEndpoint: '/api/remove-blank-columns/preview',
    analysisApiEndpoint: '/api/remove-blank-columns/analyze',
    outputFileNameGenerator: (files) => {
      const originalName = files[0]?.name?.replace('.csv', '') || 'file';
      return `${originalName}-cleaned.csv`;
    },
    
    getDynamicFormData: () => ({
      blankThreshold: blankThreshold.toString(),
      customDownloadName: customDownloadName || '',
      manualRemovals: JSON.stringify(manualRemovals) // Add this
    }),
    
    feedbackMessages: {
      initial: 'Upload a CSV file to analyze and remove blank columns.',
      fileSelected: (fileName) => `Selected: ${fileName}. Click "Analyze File" to scan for blank columns.`,
      processingAnalysis: 'Analyzing columns for blank cells...',
      processingPreview: 'Generating preview of cleaned data...',
      processingDownload: 'Creating cleaned CSV file...',
      analysisSuccess: 'Analysis complete! Review the results below.',
      previewSuccess: 'Preview generated successfully.',
      downloadSuccess: 'Success! Your cleaned CSV file has been downloaded.',
      error: (message) => `Error: ${message}`,
    },
  });

  const finalDownloadName = useMemo(() => {
    if (customDownloadName) {
      return customDownloadName.endsWith('.csv') ? customDownloadName : `${customDownloadName}.csv`;
    }
    return file ? `${file.name.replace('.csv', '')}-cleaned.csv` : 'cleaned.csv';
  }, [customDownloadName, file]);

  // Handle file selection
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e);
    setManualRemovals({});
    if (setCustomDownloadName) {
      setCustomDownloadName('');
    }
  }, [handleFileChange, setCustomDownloadName]);

  // Handle analysis
  const handleAnalyzeFile = useCallback(async () => {
    if (!file) {
      return;
    }
    if (handleAnalysis) {
      await handleAnalysis();
    }
  }, [file, handleAnalysis]);

  // Handle preview generation
  const handlePreviewGeneration = useCallback(async () => {
    if (!analysisData) return;
    if (handlePreview) {
      await handlePreview();
    }
  }, [analysisData, handlePreview]);

  // Calculate which columns would be removed based on current threshold
  // const getColumnsToRemove = useCallback(() => {
  //   if (!analysisData) return [];
  //   return analysisData.originalColumns.filter(col => {
  //     const stats = analysisData.columnStats[col];
  //     return stats && stats.blankPercentage >= blankThreshold;
  //   });
  // }, [analysisData, blankThreshold]);
  
  const toggleManualRemoval = useCallback((column: string) => {
    setManualRemovals(prev => ({
      ...prev,
      [column]: !prev[column] // Toggle removal status
    }));
  }, []);

  
  const getColumnsToRemove = useCallback(() => {
    if (!analysisData) return [];
    
    return analysisData.originalColumns.filter(col => {
      const stats = analysisData.columnStats[col];
      const manualRemove = manualRemovals[col];
      
      // Manual override takes priority
      if (manualRemove !== undefined) return manualRemove;
      
      // Fall back to automatic threshold
      return stats && stats.blankPercentage >= blankThreshold;
    });
  }, [analysisData, blankThreshold, manualRemovals]);

  const columnsToRemove = getColumnsToRemove();
  const columnsToKeep = analysisData ? analysisData.originalColumns.filter(col => !columnsToRemove.includes(col)) : [];

  return (
    <ToolPageTemplate
      title="Remove Blank Columns"
      icon={<FiTrash2 />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      {/* Step 1: File Upload */}
      {!analysisData && (
        <>
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
          >
            <FiUploadCloud className="text-slate-400 text-3xl sm:text-4xl mb-2" />
            <span className="text-slate-300 font-semibold">
              {file ? 'Change File' : 'Click to Upload CSV File'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {file ? `Selected: ${file.name}` : 'Select a CSV file to analyze'}
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelection}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Selected File:</h3>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>{file.name}</span>
                <span>{Math.round(file.size / 1024)} KB</span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleAnalyzeFile}
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiEye className="mr-2" />
              Analyze File
            </button>
          </div>
        </>
      )}

      {/* Step 2: Analysis Results & Configuration */}
      {analysisData && !previewData && (
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">File Analysis:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
              <div>
                <span className="text-slate-300">File:</span> {file?.name}
              </div>
              <div>
                <span className="text-slate-300">Total Rows:</span> {analysisData.totalRows.toLocaleString()}
              </div>
              <div>
                <span className="text-slate-300">Total Columns:</span> {analysisData.originalColumns.length}
              </div>
              <div>
                <span className="text-slate-300">Columns to Remove:</span> 
                <span className={columnsToRemove.length > 0 ? 'text-red-400 ml-1' : 'text-green-400 ml-1'}>
                  {columnsToRemove.length}
                </span>
              </div>
            </div>
          </div>

          {/* Threshold Configuration */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="font-medium text-slate-200 mb-3 flex items-center">
              <FiTrash2 className="mr-2" />
              Blank Column Threshold
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Remove columns with {blankThreshold}% or more empty cells:
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={blankThreshold}
                    onChange={(e) => setBlankThreshold(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-slate-300 text-sm font-medium w-12">
                    {blankThreshold}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Download Name */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="font-medium text-slate-200 mb-3">Output Settings</h3>
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

          {/* Column Analysis Table */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-slate-300">Column Name</th>
                    <th className="px-6 py-4 text-left font-medium text-slate-300">Empty Cells</th>
                    <th className="px-6 py-4 text-left font-medium text-slate-300">Blank %</th>
                    <th className="px-6 py-4 text-left font-medium text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {analysisData.originalColumns.map((column) => {
                    const stats = analysisData.columnStats[column];
                    const willRemove = stats.blankPercentage >= blankThreshold;
                    
                    return (
                      <tr key={column} className={`hover:bg-slate-800/30 transition-colors ${
                          willRemove ? 'bg-red-900/20' : 'bg-green-900/10'
                        } ${manualRemovals[column] !== undefined ? 'ring-2 ring-yellow-500' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-200">{column}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {stats.emptyCells.toLocaleString()} / {stats.totalCells.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${willRemove ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.blankPercentage.toFixed(1)}%
                          </span>
                        </td>           
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleManualRemoval(column)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${
                              willRemove 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {willRemove ? 'Remove' : 'Keep'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={reset}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Start Over
            </button>
            <button
              onClick={handlePreviewGeneration}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FiEye className="mr-2" />
              Preview Results
            </button>
            <form onSubmit={handleProcess} className="contents">
              <button
                type="submit"
                disabled={isLoading || columnsToRemove.length === 0}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download Cleaned CSV
              </button>
            </form>
          </div>

          {columnsToRemove.length === 0 && (
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                ✅ No columns meet the removal threshold. Your file is already clean!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Preview Results */}
      {previewData && (
        <div className="space-y-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-3">Preview Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-300">Original Columns:</span>
                <span className="text-sky-400 ml-2">{previewData.originalColumns.length}</span>
              </div>
              <div>
                <span className="text-slate-300">Columns Removed:</span>
                <span className="text-red-400 ml-2">{previewData.columnsToRemove.length}</span>
              </div>
              <div>
                <span className="text-slate-300">Columns Kept:</span>
                <span className="text-green-400 ml-2">{previewData.columnsToKeep.length}</span>
              </div>
              <div>
                <span className="text-slate-300">Total Rows:</span>
                <span className="text-slate-400 ml-2">{previewData.totalRows.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {previewData.columnsToRemove.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Columns to be Removed:</h4>
              <div className="flex flex-wrap gap-2">
                {previewData.columnsToRemove.map(col => (
                  <span key={col} className="bg-red-900/30 text-red-300 px-2 py-1 rounded text-xs">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">Columns to be Kept:</h4>
            <div className="flex flex-wrap gap-2">
              {previewData.columnsToKeep.map(col => (
                <span key={col} className="bg-green-900/30 text-green-300 px-2 py-1 rounded text-xs">
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCustomDownloadName?.('');
                setManualRemovals({});
                reset();
              }}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Start Over
            </button>
            <form onSubmit={handleProcess}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download Cleaned CSV
              </button>
            </form>
          </div>
        </div>
      )}
    </ToolPageTemplate>
  );
}