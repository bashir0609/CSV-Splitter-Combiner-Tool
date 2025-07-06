// app/api/merge-side-by-side/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length < 2) {
      return NextResponse.json({ error: 'At least 2 files are required' }, { status: 400 });
    }

    const filesInfo: Array<{
      filename: string;
      rowCount: number;
      columns: string[];
    }> = [];

    const allColumns = new Set<string>();
    const columnCaseMap = new Map<string, string>(); // lowercase -> original case

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

      // Add columns with case-insensitive uniqueness
      headers.forEach(col => {
        const lowerCol = col.toLowerCase();
        if (!columnCaseMap.has(lowerCol)) {
          // First time seeing this column (case-insensitive), use this case
          columnCaseMap.set(lowerCol, col);
          allColumns.add(col);
        }
        // If we've seen this column before with different case, ignore it
      });
    }

    // Generate intelligent target columns (unique column names, case-insensitive)
    const allTargetColumns = Array.from(allColumns).sort();

    return NextResponse.json({
      files: filesInfo,
      allTargetColumns,
      totalFiles: files.length,
      maxRows: Math.max(...filesInfo.map(f => f.rowCount))
    });

  } catch (error) {
    console.error('Error analyzing files:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze files' 
    }, { status: 500 });
  }
}