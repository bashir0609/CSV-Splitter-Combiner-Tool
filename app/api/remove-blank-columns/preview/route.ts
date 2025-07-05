// app/api/remove-blank-columns/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const blankThreshold = parseFloat(formData.get('blankThreshold') as string) || 80;
    // const manualRemovals = JSON.parse(formData.get('manualRemovals') as string || {});
    const manualRemovalsRaw = formData.get('manualRemovals');
    const manualRemovals = manualRemovalsRaw 
      ? JSON.parse(manualRemovalsRaw as string) 
      : {};

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
    
    // Analyze columns for blank cells
    const columnStats: Record<string, { totalCells: number; emptyCells: number; blankPercentage: number }> = {};

    // Analyze columns
    const blankPercentages: Record<string, number> = {};
    
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

      blankPercentages[header] = (emptyCells / totalCells) * 100;
    });

    // Determine columns to remove/keep
    const columnsToRemove = headers.filter(header => {
      const manualRemove = manualRemovals[header];
      if (manualRemove !== undefined) return manualRemove;
      
      const stats = columnStats[header];
      return stats && stats.blankPercentage >= blankThreshold;
    });

    const columnsToKeep = headers.filter(header => 
      !columnsToRemove.includes(header)
    );

    return NextResponse.json({
      originalColumns: headers,
      columnsToRemove,
      columnsToKeep,
      blankPercentages,
      totalRows: data.length,
      message: `Analysis complete: ${columnsToRemove.length} columns will be removed, ${columnsToKeep.length} columns will be kept.`
    });

  } catch (error) {
    console.error('Error previewing CSV:', error);
    return NextResponse.json({ 
      error: 'Failed to preview CSV file' 
    }, { status: 500 });
  }
}