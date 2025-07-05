import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

interface FileAnalysis {
  filename: string;
  columns: string[];
  rowCount: number;
  preview: Record<string, any>[];
}

interface ColumnMatch {
  targetColumn: string;
  matches: {
    filename: string;
    originalColumn: string;
    confidence: 'exact' | 'fuzzy' | 'manual';
  }[];
  unmapped: {
    filename: string;
    originalColumn: string;
  }[];
}

// Fuzzy matching helpers
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 1.0;
  
  // Simple Levenshtein distance based similarity
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1.0 : 1.0 - (matrix[len1][len2] / maxLen);
}

function findBestMatches(columns: string[]): ColumnMatch[] {
  const allColumns = Array.from(new Set(columns));
  const matches: ColumnMatch[] = [];
  
  // First pass: exact matches
  const exactMatches = new Set<string>();
  for (const col of allColumns) {
    const matchCount = columns.filter(c => c.toLowerCase() === col.toLowerCase()).length;
    if (matchCount > 1) {
      exactMatches.add(col.toLowerCase());
    }
  }
  
  // Second pass: fuzzy matches for remaining columns
  const remainingColumns = allColumns.filter(col => !exactMatches.has(col.toLowerCase()));
  const processed = new Set<string>();
  
  for (const col1 of remainingColumns) {
    if (processed.has(col1)) continue;
    
    const group = [col1];
    processed.add(col1);
    
    for (const col2 of remainingColumns) {
      if (processed.has(col2)) continue;
      
      const similarity = calculateSimilarity(col1, col2);
      if (similarity > 0.7) { // 70% similarity threshold
        group.push(col2);
        processed.add(col2);
      }
    }
    
    if (group.length > 1) {
      // Use the most common or shortest name as target
      const targetColumn = group.reduce((a, b) => a.length <= b.length ? a : b);
      matches.push({
        targetColumn,
        matches: group.map(col => ({
          filename: '', // Will be populated later
          originalColumn: col,
          confidence: col.toLowerCase() === targetColumn.toLowerCase() ? 'exact' : 'fuzzy'
        })),
        unmapped: []
      });
    }
  }
  
  return matches;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 files are required' },
        { status: 400 }
      );
    }
    
    const fileAnalyses: FileAnalysis[] = [];
    const allColumns: string[] = [];
    
    // Analyze each file
    for (const file of files) {
      const text = await file.text();
      
      try {
        const records = parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        
        if (records.length === 0) {
          return NextResponse.json(
            { error: `File ${file.name} appears to be empty or invalid` },
            { status: 400 }
          );
        }
        
        const columns = Object.keys(records[0]);
        allColumns.push(...columns);
        
        fileAnalyses.push({
          filename: file.name,
          columns,
          rowCount: records.length,
          preview: records.slice(0, 5) // First 5 rows for preview
        });
      } catch (parseError) {
        return NextResponse.json(
          { error: `Failed to parse ${file.name}: ${parseError}` },
          { status: 400 }
        );
      }
    }
    
    // Find suggested column mappings
    const suggestedMappings = findBestMatches(allColumns);
    
    // Populate filename information in matches
    const finalMappings: ColumnMatch[] = [];
    
    for (const mapping of suggestedMappings) {
      const updatedMapping: ColumnMatch = {
        targetColumn: mapping.targetColumn,
        matches: [],
        unmapped: []
      };
      
      for (const match of mapping.matches) {
        for (const fileAnalysis of fileAnalyses) {
          if (fileAnalysis.columns.includes(match.originalColumn)) {
            updatedMapping.matches.push({
              filename: fileAnalysis.filename,
              originalColumn: match.originalColumn,
              confidence: match.confidence
            });
          }
        }
      }
      
      finalMappings.push(updatedMapping);
    }
    
    // Add individual columns that don't have matches
    const mappedColumns = new Set(finalMappings.flatMap(m => m.matches.map(match => match.originalColumn)));
    
    for (const fileAnalysis of fileAnalyses) {
      for (const column of fileAnalysis.columns) {
        if (!mappedColumns.has(column)) {
          // Check if this column name already exists as a target
          let existingMapping = finalMappings.find(m => m.targetColumn === column);
          
          if (!existingMapping) {
            existingMapping = {
              targetColumn: column,
              matches: [],
              unmapped: []
            };
            finalMappings.push(existingMapping);
          }
          
          existingMapping.matches.push({
            filename: fileAnalysis.filename,
            originalColumn: column,
            confidence: 'exact'
          });
        }
      }
    }
    
    // Generate list of all possible target columns
    const allTargetColumns = Array.from(new Set([
      ...finalMappings.map(m => m.targetColumn),
      ...allColumns
    ])).sort();
    
    return NextResponse.json({
      files: fileAnalyses,
      suggestedMappings: finalMappings,
      allTargetColumns
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze files' },
      { status: 500 }
    );
  }
}