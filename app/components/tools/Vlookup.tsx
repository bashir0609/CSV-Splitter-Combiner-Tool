'use client';

import { useState, useCallback, useEffect } from 'react';
import { FiSearch, FiEye, FiArrowRight, FiDownload, FiInfo, FiPlus, FiX } from 'react-icons/fi';
import { useFileProcessor } from '../hooks/useFileProcessor';
import ToolPageTemplate from './ToolPageTemplate';

interface VLookupAnalysisResult {
  mainFile: {
    filename: string;
    columns: string[];
    rowCount: number;
  };
  lookupFile: {
    filename: string;
    columns: string[];
    rowCount: number;
  };
}

interface VLookupConfig {
  lookupColumn: string;
  returnColumns: Array<{
    sourceColumn: string;
    targetColumn: string;
    columnIndex: number;
  }>;
  matchType: 'exact' | 'approximate';
  errorValue: string;
}

interface VLookupPreviewResult {
  previewMessage: string;
  sampleRows: any[];
  totalColumns: number;
  totalRows: number;
  lookupStats: {
    totalLookups: number;
    successfulLookups: number;
    failedLookups: number;
    successRate: number;
  };
  outputColumns: string[];
}

export function VLookup() {
  const [vlookupConfig, setVLookupConfig] = useState<VLookupConfig>({
    lookupColumn: '',
    returnColumns: [{ sourceColumn: '', targetColumn: '', columnIndex: 1 }],
    matchType: 'exact',
    errorValue: '#N/A'
  });
  const [customDownloadName, setCustomDownloadName] = useState<string>('');

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
  } = useFileProcessor<VLookupPreviewResult, VLookupAnalysisResult>({
    acceptMultiple: true,
    processApiEndpoint: '/api/vlookup',
    previewApiEndpoint: '/api/vlookup/preview',
    analysisApiEndpoint: '/api/vlookup/analyze',
    outputFileNameGenerator: () => 'vlookup-result.csv',
    steps: ['upload', 'configure', 'preview'],
    initialStep: 'upload',
    getDynamicFormData: () => ({
      vlookupConfig: JSON.stringify(vlookupConfig),
      customDownloadName: customDownloadName || ''
    }),
    feedbackMessages: {
      initial: 'Upload 2 CSV files: Main Data file and Lookup Table file.',
      fileSelected: (fileName: string) => `Selected ${fileName}. Click "Analyze Files" to continue.`,
      processingAnalysis: 'Analyzing files for VLOOKUP configuration...',
      processingPreview: 'Generating VLOOKUP preview...',
      processingDownload: 'Creating VLOOKUP result CSV...',
      analysisSuccess: 'Files analyzed successfully. Configure VLOOKUP settings below.',
      previewSuccess: 'VLOOKUP preview generated successfully. Review before downloading.',
      downloadSuccess: 'Success! Your VLOOKUP result has been downloaded.',
      error: (message: string) => `Error: ${message}`,
    }
  });

  // Handle file selection with validation
  const handleFileSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleFileChange(e);
    if (e.target.files && e.target.files.length !== 2) {
      setFeedback('Please select exactly 2 CSV files: Main Data file and Lookup Table file.');
      return;
    }
    // Reset config when new files are selected
    setVLookupConfig({
      lookupColumn: '',
      returnColumns: [{ sourceColumn: '', targetColumn: '', columnIndex: 1 }],
      matchType: 'exact',
      errorValue: '#N/A'
    });
    setCustomDownloadName('');
  }, [handleMultipleFileChange, setFeedback]);

  // Handle analysis
  const handleAnalysisWithValidation = useCallback(async () => {
    if (files.length !== 2) {
      setFeedback('Please select exactly 2 CSV files: Main Data file and Lookup Table file.');
      return;
    }

    if (handleAnalysis) {
      await handleAnalysis();
      setStep('configure');
    }
  }, [files.length, handleAnalysis, setFeedback, setStep]);

  // Add new return column configuration
  const addReturnColumn = useCallback(() => {
    setVLookupConfig(prev => ({
      ...prev,
      returnColumns: [
        ...prev.returnColumns,
        { sourceColumn: '', targetColumn: '', columnIndex: prev.returnColumns.length + 1 }
      ]
    }));
  }, []);

  // Remove return column configuration
  const removeReturnColumn = useCallback((index: number) => {
    setVLookupConfig(prev => ({
      ...prev,
      returnColumns: prev.returnColumns.filter((_, i) => i !== index)
    }));
  }, []);

  // Update return column configuration
  const updateReturnColumn = useCallback((index: number, field: keyof VLookupConfig['returnColumns'][0], value: string | number) => {
    setVLookupConfig(prev => ({
      ...prev,
      returnColumns: prev.returnColumns.map((col, i) =>
        i === index ? { ...col, [field]: value } : col
      )
    }));
  }, []);

  // Handle preview generation
  const handlePreviewGeneration = useCallback(async () => {
    if (!vlookupConfig.lookupColumn) {
      setFeedback('Please select a lookup column before generating preview.');
      return;
    }

    if (vlookupConfig.returnColumns.some(col => !col.sourceColumn || !col.targetColumn)) {
      setFeedback('Please configure all return columns before generating preview.');
      return;
    }

    if (handlePreview) {
      await handlePreview();
      setStep('preview');
    }
  }, [vlookupConfig, handlePreview, setFeedback, setStep]);

  // Handle final download
  const handleDownload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleProcess(e);
  }, [handleProcess]);

  // Validation helpers
  const canProceedToPreview = () => {
    return analysisData && 
           vlookupConfig.lookupColumn && 
           vlookupConfig.returnColumns.length > 0 &&
           vlookupConfig.returnColumns.every(col => col.sourceColumn && col.targetColumn);
  };

  // Generate final download name
  const finalDownloadName = customDownloadName 
    ? (customDownloadName.endsWith('.csv') ? customDownloadName : `${customDownloadName}.csv`)
    : 'vlookup-result.csv';

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
        <span className="ml-2 text-sm">Configure VLOOKUP</span>
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
      title="VLOOKUP"
      icon={<FiSearch />}
      status={status}
      feedback={feedback}
      errorDetails={error}
    >
      <StepIndicator />

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <>
          <div className="mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">💡 About VLOOKUP</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              VLOOKUP enriches your main data by looking up values from a reference table, just like Excel's VLOOKUP function. 
              Perfect for adding customer details, prices, or any reference data to your main dataset.
            </p>
          </div>

          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 border-2 border-dashed border-slate-500 rounded-xl flex flex-col items-center justify-center p-6 sm:p-10 transition-colors duration-300"
          >
            <FiSearch className="text-slate-400 text-3xl sm:text-4xl mb-2" />
            <span className="text-slate-300 font-semibold">
              {files.length > 0 ? 'Change Files' : 'Click to Upload 2 CSV Files'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {files.length > 0 ? `${files.length} files selected` : 'Upload Main Data file and Lookup Table file'}
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
                        {index === 0 ? 'MAIN DATA' : 'LOOKUP TABLE'}
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

      {/* Step 2: Configure VLOOKUP */}
      {currentStep === 'configure' && analysisData && (
        <>
          <div className="space-y-6">
            {/* File Information */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-slate-200 mb-3">File Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-600/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="bg-green-600 text-xs px-2 py-1 rounded mr-2">MAIN DATA</span>
                    <span className="text-sm font-medium text-slate-200 truncate">{analysisData.mainFile.filename}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Rows: {analysisData.mainFile.rowCount.toLocaleString()}</div>
                    <div>Columns: {analysisData.mainFile.columns.length}</div>
                  </div>
                </div>
                <div className="bg-slate-600/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded mr-2">LOOKUP TABLE</span>
                    <span className="text-sm font-medium text-slate-200 truncate">{analysisData.lookupFile.filename}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Rows: {analysisData.lookupFile.rowCount.toLocaleString()}</div>
                    <div>Columns: {analysisData.lookupFile.columns.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* VLOOKUP Configuration */}
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
              <h3 className="font-medium text-slate-200 mb-4">VLOOKUP Configuration</h3>
              
              <div className="space-y-6">
                {/* Lookup Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Lookup Column (from Main Data):
                  </label>
                  <select
                    value={vlookupConfig.lookupColumn}
                    onChange={(e) => setVLookupConfig(prev => ({ ...prev, lookupColumn: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Select column to lookup...</option>
                    {analysisData.mainFile.columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    This column's values will be looked up in the Lookup Table.
                  </p>
                </div>

                {/* Return Columns Configuration */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300">
                      Return Columns:
                    </label>
                    <button
                      type="button"
                      onClick={addReturnColumn}
                      className="flex items-center text-xs bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded transition-colors"
                    >
                      <FiPlus className="mr-1" />
                      Add Column
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {vlookupConfig.returnColumns.map((returnCol, index) => (
                      <div key={index} className="bg-slate-600/30 border border-slate-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-300">VLOOKUP {index + 1}</span>
                          {vlookupConfig.returnColumns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeReturnColumn(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Source Column (Lookup Table):</label>
                            <select
                              value={returnCol.sourceColumn}
                              onChange={(e) => updateReturnColumn(index, 'sourceColumn', e.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                              <option value="">Select column...</option>
                              {analysisData.lookupFile.columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Target Column Name (Output):</label>
                            <input
                              type="text"
                              value={returnCol.targetColumn}
                              onChange={(e) => updateReturnColumn(index, 'targetColumn', e.target.value)}
                              placeholder="New column name..."
                              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Column Index:</label>
                            <input
                              type="number"
                              min="1"
                              max={analysisData.lookupFile.columns.length}
                              value={returnCol.columnIndex}
                              onChange={(e) => updateReturnColumn(index, 'columnIndex', parseInt(e.target.value) || 1)}
                              className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Match Type and Error Handling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Match Type:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="matchType"
                          value="exact"
                          checked={vlookupConfig.matchType === 'exact'}
                          onChange={(e) => setVLookupConfig(prev => ({ ...prev, matchType: e.target.value as 'exact' | 'approximate' }))}
                          className="mr-2 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-slate-300">Exact Match</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="matchType"
                          value="approximate"
                          checked={vlookupConfig.matchType === 'approximate'}
                          onChange={(e) => setVLookupConfig(prev => ({ ...prev, matchType: e.target.value as 'exact' | 'approximate' }))}
                          className="mr-2 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-sm text-slate-300">Approximate Match</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Error Value (when no match found):
                    </label>
                    <input
                      type="text"
                      value={vlookupConfig.errorValue}
                      onChange={(e) => setVLookupConfig(prev => ({ ...prev, errorValue: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Default: #N/A (like Excel)
                    </p>
                  </div>
                </div>

                {/* Output Settings */}
                <div className="border-t border-slate-600 pt-4">
                  <h4 className="font-medium text-slate-200 mb-3">Output Settings</h4>
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

            {/* VLOOKUP Information */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2 flex items-center">
                <FiInfo className="mr-2" />
                VLOOKUP Process
              </h4>
              <div className="text-xs text-blue-200 space-y-1">
                <p>• <strong>Lookup:</strong> Values from the lookup column in your main data will be searched in the first column of the lookup table</p>
                <p>• <strong>Return:</strong> When a match is found, specified columns from that row will be added to your main data</p>
                <p>• <strong>Exact Match:</strong> Requires perfect match (case-sensitive)</p>
                <p>• <strong>Approximate Match:</strong> Finds closest match (useful for ranges)</p>
                <p>• <strong>No Match:</strong> Cells will be filled with the error value you specified</p>
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
          {/* VLOOKUP Summary */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-slate-200 mb-3">VLOOKUP Results Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-300">Lookup column:</span>
                <span className="text-sky-400 ml-2">{vlookupConfig.lookupColumn}</span>
              </div>
              <div>
                <span className="text-slate-300">Return columns:</span>
                <span className="text-sky-400 ml-2">{vlookupConfig.returnColumns.length}</span>
              </div>
              <div>
                <span className="text-slate-300">Output rows:</span>
                <span className="text-green-400 ml-2">{previewData.totalRows.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-300">Success rate:</span>
                <span className="text-green-400 ml-2">{previewData.lookupStats.successRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* VLOOKUP Statistics */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-medium text-slate-200 mb-3">VLOOKUP Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-green-900/30 border border-green-700 rounded p-3">
                <div className="text-green-300 font-medium">Successful Lookups</div>
                <div className="text-green-100 text-lg">{previewData.lookupStats.successfulLookups.toLocaleString()}</div>
              </div>
              <div className="bg-red-900/30 border border-red-700 rounded p-3">
                <div className="text-red-300 font-medium">Failed Lookups</div>
                <div className="text-red-100 text-lg">{previewData.lookupStats.failedLookups.toLocaleString()}</div>
              </div>
              <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
                <div className="text-blue-300 font-medium">Total Lookups</div>
                <div className="text-blue-100 text-lg">{previewData.lookupStats.totalLookups.toLocaleString()}</div>
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
                          {vlookupConfig.returnColumns.some(rc => rc.targetColumn === col) && (
                            <span className="ml-1 text-sky-400 text-xs">(VLOOKUP)</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-700">
                        {previewData.outputColumns.map((col, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 text-slate-300 border border-slate-600 max-w-32 truncate">
                            {row[col] === vlookupConfig.errorValue ? (
                              <span className="text-red-400">{row[col]}</span>
                            ) : (
                              row[col] || ''
                            )}
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
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <FiDownload className="mr-2" />
                Download VLOOKUP Result
              </button>
            </div>
          </form>
        </div>
      )}
    </ToolPageTemplate>
  );
}