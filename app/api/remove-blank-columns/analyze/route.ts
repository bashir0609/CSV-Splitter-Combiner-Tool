// app/api/remove-blank-columns/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse CSV
    const csvText = await file.text();
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: `CSV parsing error: ${parseResult.errors[0].message}` 
      }, { status: 400 });
    }

    const data = parseResult.data as Record<string, any>[];
    const headers = parseResult.meta.fields || [];

    if (data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Analyze each column for blank cells
    const columnStats: Record<string, { totalCells: number; emptyCells: number; blankPercentage: number }> = {};
    
    headers.forEach(header => {
      let emptyCells = 0;
      const totalCells = data.length;

      data.forEach(row => {
        const cellValue = row[header];
        if (cellValue === null || 
            cellValue === undefined || 
            cellValue === '' || 
            (typeof cellValue === 'string' && cellValue.trim() === '')) {
          emptyCells++;
        }
      });

      columnStats[header] = {
        totalCells,
        emptyCells,
        blankPercentage: (emptyCells / totalCells) * 100
      };
    });

    return NextResponse.json({
      columnStats,
      totalRows: data.length,
      originalColumns: headers
    });

  } catch (error) {
    console.error('Error analyzing CSV:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze CSV file' 
    }, { status: 500 });
  }
}