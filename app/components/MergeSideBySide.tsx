'use client';

import { useState, useCallback, useEffect } from 'react';
import { FiUploadCloud, FiEye, FiArrowRight, FiDownload } from 'react-icons/fi';
import { useFileProcessor } from '../hooks/useFileProcessor';
import { useColumnMapping, type AnalysisResult, type ColumnMapping } from '../hooks/useColumnMapping';
import ToolPageTemplate from './ui/ToolPageTemplate';

interface PreviewResult {
  previewMessage: string;
  sampleRows: any[];
  totalColumns: number;
  totalRows: number;
}

export function MergeSideBySide() {
  const [shouldInitializeMappings, setShouldInitializeMappings] = useState<boolean>(false);
  const [customDownloadName, setCustomDownloadName] = useState<string>('');
  const [keyColumn, setKeyColumn] = useState<string>(''); // NEW: Key column for VLOOKUP
  const [joinType, setJoinType] = useState<'inner' | 'left' | 'full'>('left'); // NEW: Join type

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
    processApiEndpoint: '/api/merge-side-by-side',
    previewApiEndpoint: '/api/merge-side-by-side/preview',
    analysisApiEndpoint: '/api/merge-side-by-side/analyze',
    outputFileNameGenerator: () => 'merged-side-by-side.csv',
    steps: ['upload', 'mapping', 'preview'],
    initialStep: 'upload',
    getDynamicFormData: () => ({
      mappings: JSON.stringify(columnMapping.columnMappings),
      keyColumn,
      joinType,
      customDownloadName: customDownloadName || ''
    }),
    feedbackMessages: {
      initial: 'Upload multiple CSV files to merge using VLOOKUP-style joins.',
      fileSelected: (fileName: string) => `Selected ${fileName}. Click "Analyze Files" to continue.`,
      processingAnalysis: 'Analyzing files and detecting join columns...',
      processingPreview: 'Generating preview of joined data...',
      processingDownload: 'Creating merged CSV file...',
      analysisSuccess: 'Files analyzed successfully. Configure column mappings and join settings below.',
      previewSuccess: 'Preview generated successfully. Review before downloading.',
      downloadSuccess: 'Success! Your merged CSV file has been downloaded.',
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
      setFeedback('Please select at least 2 CSV files to merge.');
      return;
    }
    // Reset mappings when new files are selected
    columnMapping.resetMappings();
    setCustomDownloadName('');
    setKeyColumn('');
  }, [handleMultipleFileChange, setFeedback, columnMapping]);

  // Handle analysis with automatic mapping initialization
  const handleAnalysisWithMapping = useCallback(async () => {
    if (files.length < 2) {
      setFeedback('Please select at least 2 CSV files to merge.');
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

  // Handle preview generation
  const handlePreviewGeneration = useCallback(() => {
    if (!analysisData) return;

    setStep('preview');
    setFeedback('Preview generated successfully. Review the merged structure before downloading.');
  }, [analysisData, setFeedback, setStep]);

  // Handle final download
  const handleDownload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleProcess(e);
  }, [handleProcess]);

  // Validation helpers
  const canProceedToPreview = () => {
    if (!analysisData) return false;
    return columnMapping.isAllMapped && keyColumn;
  };

  // Generate final download name
  const finalDownloadName = customDownloadName 
    ? (customDownloadName.endsWith('.csv') ? customDownloadName : `${customDownloadName}.csv`)
    : 'merged-side-by-side.csv';

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
      title="Merge Side-by-Side"
      icon={<FiArrowRight />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      <StepIndicator />

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <>
          <div className="mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">💡 About VLOOKUP-Style Merging</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              This tool merges multiple CSV files using a key column (like VLOOKUP in Excel). 
              Files are joined based on matching values in the key column, allowing you to combine related data from different sources.
            </p>
          </div>

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

            {/* Column Mapping Table */}
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
                              {file.filename}
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
                                      // Clear any existing mapping for this target column
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
                                  <option value="">Skip this column...</option>
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

            {/* Join Settings */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-3">VLOOKUP Join Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Key Column (for joining):
                  </label>
                  <select
                    value={keyColumn}
                    onChange={(e) => setKeyColumn(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select key column...</option>
                    {columnMapping.getMappedColumns().map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Files will be joined based on matching values in this column.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Join Type:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setJoinType('left')}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        joinType === 'left'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">Left Join</div>
                      <div className="text-xs opacity-80">Keep all rows from first file</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinType('inner')}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        joinType === 'inner'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">Inner Join</div>
                      <div className="text-xs opacity-80">Only matching rows</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinType('full')}
                      className={`p-3 rounded-lg border text-sm transition-all ${
                        joinType === 'full'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium">Full Join</div>
                      <div className="text-xs opacity-80">Keep all rows from all files</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Output Settings */}
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

            {/* Merge Info */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">VLOOKUP Join Strategy</h4>
              <div className="text-xs text-blue-200 space-y-1">
                <p>• <strong>Key-based joining:</strong> Files joined using the selected key column</p>
                <p>• <strong>Left Join:</strong> Keeps all rows from first file, adds matching data from others</p>
                <p>• <strong>Inner Join:</strong> Only keeps rows where key exists in all files</p>
                <p>• <strong>Full Join:</strong> Keeps all rows from all files, fills missing with empty</p>
                <p>• <strong>Column mapping:</strong> Different column names unified in output</p>
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
          {/* Preview Summary */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-3">Merge Preview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-300">Input files:</span>
                <span className="text-sky-400 ml-2">{analysisData.files.length}</span>
              </div>
              <div>
                <span className="text-slate-300">Output filename:</span>
                <span className="text-sky-400 ml-2">{finalDownloadName}</span>
              </div>
              <div>
                <span className="text-slate-300">Total columns:</span>
                <span className="text-green-400 ml-2">{columnMapping.getMappedColumns().length}</span>
              </div>
              <div>
                <span className="text-slate-300">Join type:</span>
                <span className="text-green-400 ml-2 capitalize">{joinType} join</span>
              </div>
              <div>
                <span className="text-slate-300">Key column:</span>
                <span className="text-sky-400 ml-2">{keyColumn}</span>
              </div>
            </div>
          </div>

          {/* Column Mapping Summary */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-medium text-slate-200 mb-3">Column Mappings Summary</h4>
            <div className="space-y-2 text-sm">
              {columnMapping.getMappedColumns().map(targetCol => (
                <div key={targetCol} className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">{targetCol}:</span>
                  <div className="flex space-x-2">
                    {analysisData.files.map(file => {
                      const originalCol = Object.keys(columnMapping.columnMappings[file.filename] || {}).find(
                        col => columnMapping.columnMappings[file.filename][col] === targetCol
                      );
                      return originalCol ? (
                        <span key={file.filename} className="text-xs bg-slate-600 px-2 py-1 rounded">
                          {file.filename}: {originalCol}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Row Counts */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <h4 className="text-yellow-300 font-medium mb-2">Row Count Information</h4>
            <div className="space-y-1 text-sm">
              {analysisData.files.map(file => (
                <div key={file.filename} className="flex justify-between">
                  <span className="text-slate-300">{file.filename}:</span>
                  <span className="text-slate-400">{file.rowCount.toLocaleString()} rows</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-200 mt-2">
              Files with fewer rows will have empty cells in the merged output.
            </p>
          </div>
          
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
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download Merged CSV
              </button>
            </div>
          </form>
        </div>
      )}
    </ToolPageTemplate>
  );
}