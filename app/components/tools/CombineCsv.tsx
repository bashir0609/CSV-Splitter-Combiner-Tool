'use client';

import { useState, useCallback, useEffect } from 'react';
import { FiUploadCloud, FiEye, FiGitMerge, FiArrowRight } from 'react-icons/fi';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { useColumnMapping, type AnalysisResult, type ColumnMapping } from '../../hooks/useColumnMapping';
import ToolPageTemplate from './ui/ToolPageTemplate';
import ColumnMappingPreview from './ui/ColumnMappingPreview';

interface PreviewResult {
  previewMessage: string;
}

export function CombineCsv() {
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
  const [duplicateColumn, setDuplicateColumn] = useState<string>('');
  const [shouldInitializeMappings, setShouldInitializeMappings] = useState<boolean>(false);

  // Configure the enhanced useFileProcessor hook
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
    updateCustomState,
    setStep,
    setFeedback,
    reset
  } = useFileProcessor<PreviewResult, AnalysisResult>({
    acceptMultiple: true,
    processApiEndpoint: '/api/combine-csv',
    previewApiEndpoint: '/api/combine-csv/preview',
    analysisApiEndpoint: '/api/combine-csv/analyze',
    outputFileNameGenerator: () => 'combined.csv',
    steps: ['upload', 'mapping', 'preview'],
    initialStep: 'upload',
    getDynamicFormData: () => ({
      mappings: JSON.stringify(columnMapping.columnMappings),
      removeDuplicates: removeDuplicates.toString(),
      duplicateColumn: duplicateColumn
    }),
    feedbackMessages: {
      initial: 'Upload at least 2 CSV files to get started.',
      fileSelected: (fileName: string) => `Selected ${fileName}. Click "Analyze Files" to continue.`,
      processingAnalysis: 'Analyzing files and detecting column patterns...',
      processingPreview: 'Generating preview of combined data...',
      processingDownload: 'Creating combined CSV file...',
      analysisSuccess: 'Files analyzed successfully. Review and adjust column mappings below.',
      previewSuccess: 'Preview generated successfully. Review before downloading.',
      downloadSuccess: 'Success! Your combined CSV file has been downloaded.',
      error: (message: string) => `Error: ${message}`,
    }
  });

  // Initialize column mapping hook
  const columnMapping = useColumnMapping({
    analysisData,
    onMappingChange: (mappings) => {
      // Optional: handle mapping changes if needed
    }
  });

  // Handle file selection with validation
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleFileChange(e);
    if (e.target.files && e.target.files.length < 2) {
      setFeedback('Please select at least 2 CSV files to combine.');
      return;
    }
    // Reset mappings when new files are selected
    columnMapping.resetMappings();
    setRemoveDuplicates(false);
    setDuplicateColumn('');
  }, [handleMultipleFileChange, setFeedback, columnMapping]);

  // Handle analysis with automatic mapping initialization
  const handleAnalysisWithMapping = useCallback(async () => {
    if (files.length < 2) {
      setFeedback('Please select at least 2 CSV files to combine.');
      return;
    }

    if (handleAnalysis) {
      await handleAnalysis();
      setShouldInitializeMappings(true);
    }
  }, [files.length, handleAnalysis, setFeedback]);

  // Auto-initialize mappings when analysis data becomes available
  useEffect(() => {
    if (analysisData && shouldInitializeMappings) {
      columnMapping.initializeMappings(analysisData);
      setStep('mapping');
      setShouldInitializeMappings(false);
    }
  }, [analysisData, shouldInitializeMappings, setStep]);

  // Reset mappings when new files are selected
  useEffect(() => {
    if (files.length === 0) {
      columnMapping.resetMappings();
    }
  }, [files.length]);

  // Handle preview generation (show mapping table)
  const handlePreviewGeneration = useCallback(() => {
    if (!analysisData) return;

    setStep('preview');
    setFeedback('Preview generated successfully. Review the column mappings before downloading.');
  }, [analysisData, setFeedback, setStep]);

  // Handle final download
  const handleDownload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleProcess(e);
  }, [handleProcess]);

  // Validation helpers
  const canProceedToPreview = () => {
    if (!analysisData) return false;
    const duplicateCheckValid = !removeDuplicates || (removeDuplicates && duplicateColumn);
    return columnMapping.isAllMapped && duplicateCheckValid;
  };

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
      <div className={`flex items-center ${currentStep === 'mapping' ? 'text-sky-400' : 'text-slate-500'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          currentStep === 'mapping' ? 'bg-sky-600' : 'bg-slate-600'
        }`}>2</div>
        <span className="ml-2 text-sm">Map Columns</span>
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
      title="Combine CSVs"
      icon={<FiGitMerge />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      <StepIndicator />

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <>
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
          >
            <FiUploadCloud className="text-slate-400 text-3xl sm:text-4xl mb-2" />
            <span className="text-slate-300 font-semibold">
              {files.length > 0 ? 'Change Files' : 'Click to Upload CSV Files'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {files.length > 0 ? `${files.length} files selected` : 'Select multiple CSV files (minimum 2)'}
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
                    <span>{file.name}</span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleAnalysisWithMapping}
              disabled={files.length < 2 || isLoading}
              className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiEye className="mr-2" />
              Analyze Files
            </button>
          </div>
        </>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 'mapping' && analysisData && (
        <>
          <div className="text-left space-y-4">
            <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center text-sm text-slate-300 space-x-6">
                <div className="flex items-center">
                  {columnMapping.getStatusIcon('exact')}
                  <span className="ml-1">Exact match</span>
                </div>
                <div className="flex items-center">
                  {columnMapping.getStatusIcon('fuzzy')}
                  <span className="ml-1">Fuzzy match</span>
                </div>
                <div className="flex items-center">
                  {columnMapping.getStatusIcon('manual')}
                  <span className="ml-1">Manual</span>
                </div>
                <div className="flex items-center">
                  {columnMapping.getStatusIcon('unmapped')}
                  <span className="ml-1">Unmapped</span>
                </div>
              </div>
            </div>

            {/* Unified Mapping Table - Full Width */}
            <div className="-mx-6 sm:-mx-8">
              <div className="w-full bg-slate-900 border-y border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-left font-medium text-slate-300 w-1/4">
                          Target Column
                        </th>
                        {analysisData.files.map((file, index) => (
                          <th key={index} className="px-6 py-4 text-left font-medium text-slate-300">
                            <div className="truncate">
                              File {index + 1}
                            </div>
                            <div className="text-xs text-slate-400 font-normal">
                              ({file.rowCount.toLocaleString()} rows)
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-slate-700">
                    {analysisData.allTargetColumns.map((targetColumn, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {targetColumn}
                        </td>
                        {analysisData.files.map((file, fileIndex) => {
                          // Find which original column maps to this target column
                          const originalColumn = Object.keys(columnMapping.columnMappings[file.filename] || {}).find(
                            col => columnMapping.columnMappings[file.filename][col] === targetColumn
                          );
                          
                          const status = originalColumn ? columnMapping.getColumnMatchStatus(file.filename, originalColumn) : 'unmapped';
                          
                          return (
                            <td key={fileIndex} className="px-6 py-4">
                              <select
                                value={originalColumn || ''}
                                onChange={(e) => {
                                  const selectedOriginalColumn = e.target.value;
                                  if (selectedOriginalColumn) {
                                    // Clear any existing mapping for this original column
                                    Object.keys(columnMapping.columnMappings[file.filename] || {}).forEach(col => {
                                      if (columnMapping.columnMappings[file.filename][col] === targetColumn) {
                                        columnMapping.updateColumnMapping(file.filename, col, '');
                                      }
                                    });
                                    // Set new mapping
                                    columnMapping.updateColumnMapping(file.filename, selectedOriginalColumn, targetColumn);
                                  } else {
                                    // Clear mapping if empty selection
                                    if (originalColumn) {
                                      columnMapping.updateColumnMapping(file.filename, originalColumn, '');
                                    }
                                  }
                                }}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                              >
                                <option value="">Select source column...</option>
                                {file.columns.map(col => (
                                  <option key={col} value={col}>{col}</option>
                                ))}
                              </select>
                              {originalColumn && (
                                <div className="flex items-center mt-2 text-xs">
                                  {columnMapping.getStatusIcon(status)}
                                  <span className="ml-2 text-slate-400">{originalColumn}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            {/* Duplicate Removal Options */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-3">Duplicate Removal (Optional)</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={removeDuplicates}
                    onChange={(e) => setRemoveDuplicates(e.target.checked)}
                    className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500 focus:ring-2"
                  />
                  <span className="text-slate-300 text-sm">Remove duplicate rows based on column values</span>
                </label>
                
                {removeDuplicates && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select column to check for duplicates:
                    </label>
                    <select
                      value={duplicateColumn}
                      onChange={(e) => setDuplicateColumn(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">Select column...</option>
                      {analysisData.allTargetColumns.map(targetCol => (
                        <option key={targetCol} value={targetCol}>{targetCol}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">
                      First occurrence of each unique value will be kept, duplicates will be removed.
                    </p>
                  </div>
                )}
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
      {currentStep === 'preview' && analysisData && (
        <div className="space-y-6">
          <ColumnMappingPreview
            files={analysisData.files}
            columnMappings={columnMapping.columnMappings}
            targetColumns={columnMapping.getMappedColumns()}
            getColumnMatchStatus={columnMapping.getColumnMatchStatus}
            getStatusIcon={columnMapping.getStatusIcon}
            removeDuplicates={removeDuplicates}
            duplicateColumn={duplicateColumn}
          />
          
          <form onSubmit={handleDownload}>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300"
              >
                Back to Mapping
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Combined CSV
              </button>
            </div>
          </form>
        </div>
      )}
    </ToolPageTemplate>
  );
}