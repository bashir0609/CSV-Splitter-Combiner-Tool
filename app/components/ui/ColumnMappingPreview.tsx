'use client';

import React from 'react';
import { type AnalysisResult, type MatchStatus, type ColumnMapping } from '../../hooks/useColumnMapping';

interface ColumnMappingPreviewProps {
  files: AnalysisResult['files'];
  columnMappings: ColumnMapping;
  targetColumns: string[];
  getColumnMatchStatus: (filename: string, originalColumn: string) => MatchStatus; // KEEP THIS ONE
  getStatusIcon: (status: MatchStatus) => React.ReactElement;
  removeDuplicates?: boolean;
  duplicateColumn?: string;
}

export default function ColumnMappingPreview({
  files,
  columnMappings,
  targetColumns,
  getColumnMatchStatus,
  getStatusIcon,
  removeDuplicates = false,
  duplicateColumn = ''
}: ColumnMappingPreviewProps) {
  const totalRows = files.reduce((sum, file) => sum + file.rowCount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Information */}
      <div className="bg-slate-700/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Column Mapping Preview</h3>
        <div className="text-sm text-slate-400 space-y-1">
          <div>
            <span className="font-medium">Files:</span> {files.length} • 
            <span className="font-medium ml-2">Total Rows:</span> {totalRows.toLocaleString()} • 
            <span className="font-medium ml-2">Target Columns:</span> {targetColumns.length}
          </div>
          {removeDuplicates && duplicateColumn && (
            <div className="text-yellow-400">
              <span className="font-medium">⚠ Duplicate Removal:</span> Enabled on column "{duplicateColumn}"
            </div>
          )}
        </div>
      </div>

      {/* Column Mapping Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-300 sticky left-0 bg-slate-800 z-10 border-r border-slate-700">
                  Target Column
                </th>
                {files.map((file, index) => (
                  <th key={index} className="px-4 py-3 text-left font-medium text-slate-300 min-w-[200px] border-r border-slate-700 last:border-r-0">
                    <div className="truncate" title={file.filename}>
                      {file.filename}
                    </div>
                    <div className="text-xs text-slate-400 font-normal">
                      {file.rowCount.toLocaleString()} rows
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {targetColumns.map((targetColumn, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200 sticky left-0 bg-slate-900 hover:bg-slate-800/30 border-r border-slate-700 z-10">
                    <div className="flex items-center space-x-2">
                      <span className="truncate" title={targetColumn}>
                        {targetColumn}
                      </span>
                      {removeDuplicates && duplicateColumn === targetColumn && (
                        <span className="text-yellow-400 text-xs" title="Duplicate removal column">
                          🔍
                        </span>
                      )}
                    </div>
                  </td>
                  {files.map((file, fileIndex) => {
                    // Find which original column maps to this target column
                    const originalColumn = Object.keys(columnMappings[file.filename] || {}).find(
                      col => columnMappings[file.filename][col] === targetColumn
                    );
                    const status = originalColumn ? getColumnMatchStatus(file.filename, originalColumn) : 'unmapped';
                    
                    return (
                      <td key={fileIndex} className="px-4 py-3 text-slate-400 border-r border-slate-700 last:border-r-0">
                        {originalColumn ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="flex-shrink-0">
                                {getStatusIcon(status)}
                              </span>
                              <span className="text-slate-300 font-medium">
                                {originalColumn}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 ml-6">
                              → {targetColumn}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="text-slate-600 text-lg">—</span>
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

      {/* Legend */}
      <div className="bg-slate-700/30 rounded-lg p-3">
        <div className="flex items-center text-xs text-slate-400 space-x-6">
          <div className="flex items-center space-x-1">
            {getStatusIcon('exact')}
            <span>Exact match</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon('fuzzy')}
            <span>Fuzzy match</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon('manual')}
            <span>Manual mapping</span>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon('unmapped')}
            <span>Not mapped</span>
          </div>
        </div>
      </div>
    </div>
  );
}