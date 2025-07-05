// app/hooks/useColumnMapping.ts

'use client';
import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { FiCheckCircle, FiAlertCircle, FiEdit3, FiXCircle } from 'react-icons/fi';

// Types for the analysis data structure
export interface AnalysisResult {
  files: Array<{
    filename: string;
    columns: string[];
    rowCount: number;
  }>;
  allTargetColumns: string[];
}

export interface ColumnMapping {
  [filename: string]: {
    [originalColumn: string]: string; // maps original column to target column
  };
}

export type MatchStatus = 'exact' | 'fuzzy' | 'manual' | 'unmapped';

interface UseColumnMappingOptions {
  analysisData: AnalysisResult | null;
  onMappingChange?: (mappings: ColumnMapping) => void;
}

interface UseColumnMappingReturn {
  columnMappings: ColumnMapping;
  isAllMapped: boolean;
  updateColumnMapping: (filename: string, originalColumn: string, targetColumn: string) => void;
  initializeMappings: (data: AnalysisResult) => void;
  resetMappings: () => void;
  getColumnMatchStatus: (filename: string, originalColumn: string) => MatchStatus;
  getStatusIcon: (status: MatchStatus) => JSX.Element;
  getStatusClass: (status: MatchStatus) => string;
  getMappedColumns: () => string[];
}

export function useColumnMapping({
  analysisData,
  onMappingChange
}: UseColumnMappingOptions): UseColumnMappingReturn {
  
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});

  // Fuzzy match helper function
  const fuzzyMatch = useCallback((str1: string, str2: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized1 = normalize(str1);
    const normalized2 = normalize(str2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
    
    // Simple similarity check (at least 70% similar)
    const similarity = Math.max(normalized1.length, normalized2.length) > 0 
      ? 1 - Math.abs(normalized1.length - normalized2.length) / Math.max(normalized1.length, normalized2.length)
      : 0;
    
    return similarity > 0.7;
  }, []);

  // Get match status for a column
  const getColumnMatchStatus = useCallback((filename: string, originalColumn: string): MatchStatus => {
    const mapping = columnMappings[filename]?.[originalColumn];
    if (!mapping) return 'unmapped';
    
    // Check if it's an exact match
    if (originalColumn.toLowerCase() === mapping.toLowerCase()) return 'exact';
    
    // Check if it's a fuzzy match
    if (fuzzyMatch(originalColumn, mapping)) return 'fuzzy';
    
    // Otherwise it's manual
    return 'manual';
  }, [columnMappings, fuzzyMatch]);

  // Get status icon component and class for different match types
  const getStatusIcon = useCallback((status: MatchStatus) => {
    const matchStatus = status as MatchStatus;
    switch (status) {
      case 'exact':
        return React.createElement(FiCheckCircle, { className: "text-green-400" });
      case 'fuzzy':
        return React.createElement(FiAlertCircle, { className: "text-yellow-400" });
      case 'manual':
        return React.createElement(FiEdit3, { className: "text-blue-400" });
      case 'unmapped':
        return React.createElement(FiXCircle, { className: "text-red-400" });
      default:
        return React.createElement(FiXCircle, { className: "text-gray-400" });
    }
  }, []);

  // Get status class for different match types
  const getStatusClass = useCallback((status: MatchStatus): string => {
    switch (status) {
      case 'exact':
        return 'text-green-400';
      case 'fuzzy':
        return 'text-yellow-400';
      case 'manual':
        return 'text-blue-400';
      case 'unmapped':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }, []);

  // Update a specific column mapping
  const updateColumnMapping = useCallback((filename: string, originalColumn: string, targetColumn: string) => {
    setColumnMappings(prev => {
      const newMappings = {
        ...prev,
        [filename]: {
          ...prev[filename],
          [originalColumn]: targetColumn
        }
      };
      
      // Remove empty mappings
      if (!targetColumn) {
        delete newMappings[filename][originalColumn];
        if (Object.keys(newMappings[filename]).length === 0) {
          delete newMappings[filename];
        }
      }
      
      onMappingChange?.(newMappings);
      return newMappings;
    });
  }, [onMappingChange]);

  // Initialize mappings based on analysis data
  const initializeMappings = useCallback((data: AnalysisResult) => {
    const newMappings: ColumnMapping = {};
    
    data.files.forEach(file => {
      newMappings[file.filename] = {};
      
      file.columns.forEach(originalColumn => {
        // Try to find exact match first
        let bestMatch = data.allTargetColumns.find(target => 
          originalColumn.toLowerCase() === target.toLowerCase()
        );
        
        // If no exact match, try fuzzy matching
        if (!bestMatch) {
          bestMatch = data.allTargetColumns.find(target => 
            fuzzyMatch(originalColumn, target)
          );
        }
        
        // Set mapping if we found a match
        if (bestMatch) {
          newMappings[file.filename][originalColumn] = bestMatch;
        }
      });
    });
    
    setColumnMappings(newMappings);
    onMappingChange?.(newMappings);
  }, [fuzzyMatch, onMappingChange]);

  // Reset all mappings
  const resetMappings = useCallback(() => {
    setColumnMappings({});
    onMappingChange?.({});
  }, [onMappingChange]);

  // Get all currently mapped target columns
  const getMappedColumns = useCallback((): string[] => {
    const mappedColumns = new Set<string>();
    
    Object.values(columnMappings).forEach(fileMapping => {
      Object.values(fileMapping).forEach(targetColumn => {
        if (targetColumn) {
          mappedColumns.add(targetColumn);
        }
      });
    });
    
    return Array.from(mappedColumns);
  }, [columnMappings]);

  // Check if all files have at least some columns mapped
  const isAllMapped = useMemo(() => {
    if (!analysisData) return false;
    
    return analysisData.files.every(file => {
      const fileMapping = columnMappings[file.filename];
      if (!fileMapping) return false;
      
      // Check if at least one column is mapped for this file
      return Object.values(fileMapping).some(targetColumn => targetColumn !== '');
    });
  }, [analysisData, columnMappings]);

  return {
    columnMappings,
    isAllMapped,
    updateColumnMapping,
    initializeMappings,
    resetMappings,
    getColumnMatchStatus,
    getStatusIcon,
    getStatusClass,
    getMappedColumns
  };
}
