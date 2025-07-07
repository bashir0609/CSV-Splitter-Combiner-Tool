'use client';

import { useState, useCallback, useMemo } from 'react';
import { FiUploadCloud, FiEye, FiTrash2, FiDownload, FiArrowRight, FiFilter, FiLayers } from 'react-icons/fi';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import ToolPageTemplate from '../ui/ToolPageTemplate';

interface PreviewResult {
  originalCount: number;
  duplicateCount: number;
  uniqueCount: number;
  duplicateRows: any[];
  previewRows: any[];
  columnMappings: Record<string, string>;
  message: string;
}

interface AnalysisResult {
  files: Array<{
    filename: string;
    rowCount: number;
    columns: string[];
  }>;
  totalRows: number;
}

type DeduplicationMode = 'single' | 'multiple';
type ExportType = 'merged-unique' | 'file2-only';

export function RemoveDuplicates() {
  const [mode, setMode] = useState<DeduplicationMode>('single');
  const [exportType, setExportType] = useState<ExportType>('merged-unique');
  const [duplicateColumn, setDuplicateColumn] = useState<string>('');
  const [fileColumnMappings, setFileColumnMappings] = useState<Record<string, string>>({});
  const [keepFirst, setKeepFirst] = useState<boolean>(true);
  const [customDownloadName, setCustomDownloadName] = useState<string>('');

  // Configure the useFileProcessor hook
  const {
    file,
    files,
    status,
    feedback,
    error,
    analysisData,
    previewData,
    isLoading,
    canProceed,
    handleFileChange,
    handleMultipleFileChange,
    handleAnalysis,
    handlePreview,
    handleProcess,
    reset
  } = useFileProcessor<PreviewResult, AnalysisResult>({
    acceptMultiple: mode === 'multiple',
    processApiEndpoint: '/api/remove-duplicates',
    previewApiEndpoint: '/api/remove-duplicates/preview',
    analysisApiEndpoint: '/api/remove-duplicates/analyze',
    outputFileNameGenerator: (files) => {
      const baseName = files[0]?.name?.replace('.csv', '') || 'file';
      if (mode === 'single') {
        return `${baseName}-deduped.csv`;
      } else if (exportType === 'file2-only') {
        return files.length >= 2 ? `${files[1].name.replace('.csv', '')}-unique-only.csv` : 'file2-unique-only.csv';
      } else {
        return 'merged-deduped.csv';
      }
    },
    getDynamicFormData: () => ({
      mode,
      exportType: mode === 'multiple' ? exportType : 'merged-unique',
      duplicateColumn: mode === 'single' ? duplicateColumn : '',
      fileColumnMappings: mode === 'multiple' ? JSON.stringify(fileColumnMappings) : '{}',
      keepFirst: keepFirst.toString(),
      customDownloadName: customDownloadName || ''
    }),
    feedbackMessages: {
      initial: mode === 'single' 
        ? 'Upload a CSV file to remove duplicate rows.'
        : 'Upload multiple CSV files to merge and remove duplicates.',
      fileSelected: (fileName) => `Selected: ${fileName}. Click "Analyze" to detect duplicates.`,
      processingAnalysis: 'Analyzing files for duplicate detection...',
      processingPreview: 'Generating preview of deduplicated data...',
      processingDownload: 'Creating deduplicated CSV file...',
      analysisSuccess: 'Analysis complete! Configure duplicate removal settings below.',
      previewSuccess: 'Preview generated successfully.',
      downloadSuccess: 'Success! Your deduplicated CSV file has been downloaded.',
      error: (message) => `Error: ${message}`,
    }
  });

  // Generate final download name
  const finalDownloadName = useMemo(() => {
    if (customDownloadName) {
      return customDownloadName.endsWith('.csv') ? customDownloadName : `${customDownloadName}.csv`;
    }
    if (mode === 'single' && file) {
      return `${file.name.replace('.csv', '')}-deduped.csv`;
    }
    if (mode === 'multiple' && exportType === 'file2-only' && files.length >= 2) {
      return `${files[1].name.replace('.csv', '')}-unique-only.csv`;
    }
    return 'merged-deduped.csv';
  }, [customDownloadName, mode, file, files, exportType]);

  // Handle file selection based on mode
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'single') {
      handleFileChange(e);
    } else {
      handleMultipleFileChange(e);
    }
    setDuplicateColumn('');
    setFileColumnMappings({});
    setCustomDownloadName('');
  }, [mode, handleFileChange, handleMultipleFileChange]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: DeduplicationMode) => {
    setMode(newMode);
    setExportType('merged-unique'); // Reset export type when changing mode
    setDuplicateColumn('');
    setFileColumnMappings({});
    setCustomDownloadName('');
    reset();
  }, [reset]);

  // Handle export type change
  const handleExportTypeChange = useCallback((newExportType: ExportType) => {
    setExportType(newExportType);
    setCustomDownloadName('');
  }, []);

  // Handle analysis
  const handleAnalyzeFiles = useCallback(async () => {
    const currentFiles = mode === 'single' ? (file ? [file] : []) : files;
    if (currentFiles.length === 0) return;
    
    if (handleAnalysis) {
      await handleAnalysis();
    }
  }, [mode, file, files, handleAnalysis]);

  // Handle preview generation
  const handlePreviewGeneration = useCallback(async () => {
    if (!analysisData) return;
    
    // Validation based on mode
    if (mode === 'single' && !duplicateColumn) return;
    if (mode === 'multiple') {
      const allFilesMapped = analysisData.files.every(file => 
        fileColumnMappings[file.filename]
      );
      if (!allFilesMapped) return;
      
      // Additional validation for file2-only export
      if (exportType === 'file2-only' && analysisData.files.length !== 2) return;
    }
    
    if (handlePreview) {
      await handlePreview();
    }
  }, [analysisData, mode, duplicateColumn, fileColumnMappings, exportType, handlePreview]);

  // Handle file column mapping change
  const handleFileColumnMappingChange = useCallback((filename: string, column: string) => {
    setFileColumnMappings(prev => ({
      ...prev,
      [filename]: column
    }));
  }, []);

  // Validation helpers
  const hasValidFiles = mode === 'single' ? !!file : files.length > 0;
  const canAnalyze = hasValidFiles && !isLoading;
  
  const canPreview = useMemo(() => {
    if (!analysisData || isLoading) return false;
    
    if (mode === 'single') {
      return !!duplicateColumn;
    } else {
      // All files must have a column selected
      const allFilesMapped = analysisData.files.every(file => fileColumnMappings[file.filename]);
      if (!allFilesMapped) return false;
      
      // Additional validation for file2-only export
      if (exportType === 'file2-only' && analysisData.files.length !== 2) return false;
      
      return true;
    }
  }, [analysisData, isLoading, mode, duplicateColumn, fileColumnMappings, exportType]);

  return (
    <ToolPageTemplate
      title="Remove Duplicates"
      icon={<FiTrash2 />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      {/* Step 1: Mode Selection & File Upload */}
      {!analysisData && (
        <>
          {/* Mode Selection */}
          <div className="mb-6 bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="font-medium text-slate-200 mb-3">Deduplication Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleModeChange('single')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  mode === 'single'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="text-center">
                  <FiTrash2 className="mx-auto text-2xl mb-2" />
                  <h4 className="font-medium mb-1">Single File</h4>
                  <p className="text-xs opacity-80">Remove duplicates within one CSV file</p>
                </div>
              </button>
              <button
                onClick={() => handleModeChange('multiple')}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  mode === 'multiple'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="text-center">
                  <FiArrowRight className="mx-auto text-2xl mb-2" />
                  <h4 className="font-medium mb-1">Multiple Files</h4>
                  <p className="text-xs opacity-80">Merge files and remove duplicates</p>
                </div>
              </button>
            </div>
          </div>

          {/* Export Type Selection (only for multiple files mode) */}
          {mode === 'multiple' && (
            <div className="mb-6 bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-3">Export Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExportTypeChange('merged-unique')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    exportType === 'merged-unique'
                      ? 'border-green-500 bg-green-500/20 text-green-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <FiLayers className="mx-auto text-2xl mb-2" />
                    <h4 className="font-medium mb-1">Merged Unique</h4>
                    <p className="text-xs opacity-80">Combine all files, remove duplicates</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExportTypeChange('file2-only')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    exportType === 'file2-only'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-center">
                    <FiFilter className="mx-auto text-2xl mb-2" />
                    <h4 className="font-medium mb-1">File 2 Only Unique</h4>
                    <p className="text-xs opacity-80">Only rows from File 2 not in File 1</p>
                  </div>
                </button>
              </div>
              
              {exportType === 'file2-only' && (
                <div className="mt-4 bg-purple-900/20 border border-purple-700 rounded-lg p-3">
                  <p className="text-xs text-purple-300">
                    💡 <strong>File 2 Only Unique:</strong> This export will only include rows from the second file that don't exist in the first file. Perfect for finding new records or differences between datasets. Requires exactly 2 files.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
          >
            <FiUploadCloud className="text-slate-400 text-3xl sm:text-4xl mb-2" />
            <span className="text-slate-300 font-semibold">
              {hasValidFiles ? 'Change Files' : `Click to Upload CSV ${mode === 'multiple' ? 'Files' : 'File'}`}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {mode === 'single' 
                ? (file ? `Selected: ${file.name}` : 'Select a CSV file to deduplicate')
                : exportType === 'file2-only'
                  ? (files.length > 0 ? `${files.length} files selected (need exactly 2)` : 'Select exactly 2 CSV files')
                  : (files.length > 0 ? `${files.length} files selected` : 'Select multiple CSV files to merge & deduplicate')
              }
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".csv"
              multiple={mode === 'multiple'}
              onChange={handleFileSelection}
              className="sr-only"
            />
          </label>

          {/* File Info */}
          {hasValidFiles && (
            <div className="mt-6 bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Selected Files:</h3>
              <div className="space-y-2">
                {mode === 'single' && file ? (
                  <div className="flex justify-between items-center text-sm text-slate-400">
                    <span>{file.name}</span>
                    <span>{Math.round(file.size / 1024)} KB</span>
                  </div>
                ) : (
                  files.map((file, index) => (
                    <div key={index} className="flex justify-between items-center text-sm text-slate-400">
                      <span>
                        {exportType === 'file2-only' && index < 2 && (
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            index === 0 ? 'bg-blue-400' : 'bg-purple-400'
                          }`}></span>
                        )}
                        {file.name}
                        {exportType === 'file2-only' && index === 0 && ' (Base File)'}
                        {exportType === 'file2-only' && index === 1 && ' (Compare File)'}
                      </span>
                      <span>{Math.round(file.size / 1024)} KB</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Warning for file2-only mode */}
              {mode === 'multiple' && exportType === 'file2-only' && files.length !== 2 && (
                <div className="mt-3 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ File 2 Only Unique export requires exactly 2 files. Currently selected: {files.length}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleAnalyzeFiles}
              disabled={!canAnalyze}
              className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiEye className="mr-2" />
              Analyze Files
            </button>
          </div>
        </>
      )}

      {/* Step 2: Configuration & Analysis Results */}
      {analysisData && !previewData && (
        <div className="space-y-6">
          {/* File Analysis Summary */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Analysis Results:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
              <div>
                <span className="text-slate-300">Mode:</span> {mode === 'single' ? 'Single File' : 'Multiple Files'}
              </div>
              <div>
                <span className="text-slate-300">Total Rows:</span> {analysisData.totalRows.toLocaleString()}
              </div>
              <div>
                <span className="text-slate-300">Files:</span> {analysisData.files.length}
              </div>
              {mode === 'multiple' && (
                <div>
                  <span className="text-slate-300">Export Type:</span> 
                  <span className={`ml-1 ${exportType === 'file2-only' ? 'text-purple-400' : 'text-green-400'}`}>
                    {exportType === 'file2-only' ? 'File 2 Only Unique' : 'Merged Unique'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Column Selection */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="font-medium text-slate-200 mb-3 flex items-center">
              <FiTrash2 className="mr-2" />
              Duplicate Detection Settings
            </h3>
            
            {mode === 'single' ? (
              // Single file mode: one column selector
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select column to check for duplicates:
                  </label>
                  <select
                    value={duplicateColumn}
                    onChange={(e) => setDuplicateColumn(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {analysisData.files[0]?.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Rows with duplicate values in this column will be removed.
                  </p>
                </div>
              </div>
            ) : (
              // Multiple files mode: column selector per file
              <div className="space-y-4">
                <p className="text-sm text-slate-300 mb-4">
                  {exportType === 'file2-only' 
                    ? 'Select which column to use for comparing the two files:'
                    : 'Select which column to use for duplicate detection in each file:'
                  }
                </p>
                
                <div className="space-y-4">
                  {analysisData.files.map((file, index) => (
                    <div key={file.filename} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-200 flex items-center">
                          {exportType === 'file2-only' && index < 2 && (
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                              index === 0 ? 'bg-blue-400' : 'bg-purple-400'
                            }`}></span>
                          )}
                          {file.filename}
                          {exportType === 'file2-only' && index === 0 && ' (Base File)'}
                          {exportType === 'file2-only' && index === 1 && ' (Compare File)'}
                        </h4>
                        <span className="text-xs text-slate-400">{file.rowCount.toLocaleString()} rows</span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {exportType === 'file2-only' 
                            ? `${index === 0 ? 'Base' : 'Compare'} column:`
                            : 'Duplicate detection column:'
                          }
                        </label>
                        <select
                          value={fileColumnMappings[file.filename] || ''}
                          onChange={(e) => handleFileColumnMappingChange(file.filename, e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        >
                          <option value="">Select column...</option>
                          {file.columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                        
                        {fileColumnMappings[file.filename] && (
                          <p className="text-xs text-green-400 mt-1">
                            ✓ Using "{fileColumnMappings[file.filename]}" for {exportType === 'file2-only' ? 'comparison' : 'duplicate detection'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={`border rounded-lg p-3 ${
                  exportType === 'file2-only' 
                    ? 'bg-purple-900/20 border-purple-700'
                    : 'bg-blue-900/20 border-blue-700'
                }`}>
                  <p className={`text-xs ${exportType === 'file2-only' ? 'text-purple-300' : 'text-blue-300'}`}>
                    💡 <strong>Tip:</strong> {exportType === 'file2-only'
                      ? 'The export will contain only rows from the Compare File that have values in the selected column that don\'t exist in the Base File.'
                      : 'Files will be merged first, then duplicates will be detected based on the selected columns. Choose columns that represent the same type of data across all files.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Keep Strategy (not applicable for file2-only) */}
            {exportType !== 'file2-only' && (
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={keepFirst}
                    onChange={(e) => setKeepFirst(e.target.checked)}
                    className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500 focus:ring-2"
                  />
                  <span className="text-slate-300 text-sm">Keep first occurrence (remove later duplicates)</span>
                </label>
                <p className="text-xs text-slate-400 mt-1 ml-7">
                  {keepFirst ? 'First occurrence will be kept' : 'Last occurrence will be kept'}
                </p>
              </div>
            )}
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
              disabled={!canPreview}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FiEye className="mr-2" />
              Preview Results
            </button>
            <form onSubmit={handleProcess} className="contents">
              <button
                type="submit"
                disabled={!canPreview}
                className={`font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white ${
                  exportType === 'file2-only' 
                    ? 'bg-purple-600 hover:bg-purple-500' 
                    : 'bg-sky-600 hover:bg-sky-500'
                }`}
              >
                <FiDownload className="mr-2" />
                {exportType === 'file2-only' ? 'Export Unique Rows' : 'Remove Duplicates'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Step 3: Preview Results */}
      {previewData && (
        <div className="space-y-6">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-3">
              {exportType === 'file2-only' ? 'Comparison Results' : 'Deduplication Results'}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-300">
                  {exportType === 'file2-only' ? 'Total Rows (File 2):' : 'Original Rows:'}
                </span>
                <span className="text-slate-400 ml-2">{previewData.originalCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-300">
                  {exportType === 'file2-only' ? 'Matching in File 1:' : 'Duplicates Found:'}
                </span>
                <span className="text-red-400 ml-2">{previewData.duplicateCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-300">
                  {exportType === 'file2-only' ? 'Unique to File 2:' : 'Unique Rows:'}
                </span>
                <span className="text-green-400 ml-2">{previewData.uniqueCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-300">Columns Used:</span>
                <span className="text-sky-400 ml-2">
                  {mode === 'single' 
                    ? duplicateColumn 
                    : Object.keys(previewData.columnMappings || {}).length + ' mapped'
                  }
                </span>
              </div>
            </div>
          </div>

          {mode === 'multiple' && previewData.columnMappings && (
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h4 className="font-medium text-slate-200 mb-3">Column Mappings Used:</h4>
              <div className="space-y-2">
                {Object.entries(previewData.columnMappings).map(([filename, column]) => (
                  <div key={filename} className="flex justify-between text-sm">
                    <span className="text-slate-300">{filename}:</span>
                    <span className="text-sky-400">{column}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exportType === 'file2-only' ? (
            previewData.uniqueCount > 0 ? (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">
                  {previewData.uniqueCount} unique rows found in File 2
                </h4>
                <p className="text-sm text-slate-300">
                  {previewData.duplicateCount} rows from File 2 already exist in File 1
                </p>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ All rows from File 2 already exist in File 1. No unique rows to export.
                </p>
              </div>
            )
          ) : (
            previewData.duplicateCount > 0 ? (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">
                  {previewData.duplicateCount} duplicate rows will be removed
                </h4>
                <p className="text-sm text-slate-300">
                  {mode === 'single' 
                    ? `Duplicate detection based on column: ${duplicateColumn}`
                    : 'Duplicate detection based on mapped columns across files'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  ✅ No duplicates found! Your data is already clean.
                </p>
              </div>
            )
          )}

          {/* Processing Summary */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h3 className="font-medium text-slate-200 mb-3">Processing Summary</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Output filename:</span>
                <span className="text-sky-400 font-medium">{finalDownloadName}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="text-slate-400">{mode === 'single' ? 'Single File' : 'Multiple Files'}</span>
              </div>
              {mode === 'multiple' && (
                <div className="flex justify-between">
                  <span>Export Type:</span>
                  <span className={exportType === 'file2-only' ? 'text-purple-400' : 'text-green-400'}>
                    {exportType === 'file2-only' ? 'File 2 Only Unique' : 'Merged Unique'}
                  </span>
                </div>
              )}
              {exportType !== 'file2-only' && (
                <div className="flex justify-between">
                  <span>Keep strategy:</span>
                  <span className="text-slate-400">{keepFirst ? 'First occurrence' : 'Last occurrence'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setCustomDownloadName('');
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
                className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white ${
                  exportType === 'file2-only' 
                    ? 'bg-purple-600 hover:bg-purple-500' 
                    : 'bg-sky-600 hover:bg-sky-500'
                }`}
              >
                <FiDownload className="mr-2" />
                {exportType === 'file2-only' 
                  ? 'Download Unique Rows' 
                  : 'Download Deduplicated CSV'
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </ToolPageTemplate>
  );
}