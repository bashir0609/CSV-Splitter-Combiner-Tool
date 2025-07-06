// app/api/join-on-column/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length !== 2) {
      return NextResponse.json({ error: 'Exactly 2 files are required for join operations' }, { status: 400 });
    }

    const filesInfo: Array<{
      filename: string;
      rowCount: number;
      columns: string[];
    }> = [];

    const allColumnsSet = new Set<string>();
    const columnsByFile: string[][] = [];

    // Parse each file to get structure
    for (const file of files) {
      const csvText = await file.text();
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        return NextResponse.json({ 
          error: `CSV parsing error in ${file.name}: ${parseResult.errors[0].message}` 
        }, { status: 400 });
      }

      const data = parseResult.data as any[];
      const headers = parseResult.meta.fields || [];

      filesInfo.push({
        filename: file.name,
        rowCount: data.length,
        columns: headers
      });

      columnsByFile.push(headers);
      headers.forEach(col => allColumnsSet.add(col));
    }

    // Find common columns (case-insensitive and whitespace-tolerant)
    const commonColumns: string[] = [];
    const [leftColumns, rightColumns] = columnsByFile;
    
    // Create normalized maps for comparison (lowercase + trimmed)
    const leftColumnsMap = new Map<string, string>();
    const rightColumnsMap = new Map<string, string>();
    
    leftColumns.forEach(col => {
      const normalized = col.toLowerCase().trim().replace(/\s+/g, ' ');
      leftColumnsMap.set(normalized, col);
    });
    
    rightColumns.forEach(col => {
      const normalized = col.toLowerCase().trim().replace(/\s+/g, ' ');
      rightColumnsMap.set(normalized, col);
    });
    
    // Find columns that exist in both files (using normalized comparison)
    leftColumnsMap.forEach((originalCol, normalizedCol) => {
      if (rightColumnsMap.has(normalizedCol)) {
        // Use the column name from the left file as the canonical name
        commonColumns.push(originalCol);
      }
    });

    console.log('Debug - Left columns:', leftColumns);
    console.log('Debug - Right columns:', rightColumns);
    console.log('Debug - Common columns found:', commonColumns);

    if (commonColumns.length === 0) {
      return NextResponse.json({ 
        error: 'No common columns found between the files. Join operations require at least one matching column name.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      files: filesInfo,
      commonColumns: commonColumns.sort(),
      totalFiles: files.length,
      maxRows: Math.max(...filesInfo.map(f => f.rowCount))
    });

  } catch (error) {
    console.error('Error analyzing files for join:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze files' 
    }, { status: 500 });
  }
}