'use client';

import React from 'react';

interface CsvPreviewTableProps {
  csvData: string | null; // Allow null
}

export default function CsvPreviewTable({ csvData }: CsvPreviewTableProps) {
  if (!csvData) return null;

  try {
    // Split the CSV string into an array of rows, then split each row into cells
    const rows = csvData.trim().split('\n');
    if (rows.length === 0) return null;

    const headers = rows[0].split(',').map(header => header.replace(/"/g, ''));
    const bodyRows = rows.slice(1).map(row => row.split(',').map(cell => cell.replace(/"/g, '')));

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-2 text-left">File Preview</h3>
        <div className="overflow-x-auto bg-slate-900 border border-slate-700 rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-800">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-4 py-2 font-medium text-slate-300 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {bodyRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-800/50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-slate-400 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering CSV preview:", error);
    return (
        <div className="mt-6 text-left p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">Could not render CSV preview. The data might be malformed.</p>
        </div>
    );
  }
}
