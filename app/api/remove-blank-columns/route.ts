// app/api/remove-blank-columns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const blankThreshold = parseFloat(formData.get('blankThreshold') as string) || 80;
    const manualRemovalsStr = formData.get('manualRemovals') as string;
    const manualRemovals = manualRemovalsStr ? JSON.parse(manualRemovalsStr) : {};

    const customDownloadName = formData.get('customDownloadName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse CSV
    const csvText = await file.text();
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false // Keep as strings to properly detect empty cells
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

    const columnStats: Record<string, { totalCells: number; emptyCells: number; blankPercentage: number }> = {};

    // Initialize counts for all headers
    headers.forEach(header => {
      columnStats[header] = {
        totalCells: data.length,
        emptyCells: 0,
        blankPercentage: 0
      };
    });

    // Single pass through all data
    data.forEach(row => {
      headers.forEach(header => {
        const cellValue = row[header];
        if (
          cellValue === null || 
          cellValue === undefined || 
          cellValue === '' || 
          (typeof cellValue === 'string' && cellValue.trim() === '')
        ) {
          columnStats[header].emptyCells++;
        }
      });
    });

    // Calculate percentages
    headers.forEach(header => {
      const stats = columnStats[header];
      stats.blankPercentage = (stats.emptyCells / stats.totalCells) * 100;
    });


    // Determine which columns to remove
    const columnsToRemove = headers.filter(header => {
    const manualRemove = manualRemovals[header];
    if (manualRemove !== undefined) return manualRemove;
    
    // For main route:
    const stats = columnStats[header];
    return stats && stats.blankPercentage >= blankThreshold;
    });
    const columnsToKeep = headers.filter(header => 
      !columnsToRemove.includes(header)
    );

    if (columnsToKeep.length === 0) {
      return NextResponse.json({ 
        error: 'All columns would be removed with current threshold. Please lower the threshold.' 
      }, { status: 400 });
    }

    // Create cleaned data with only columns to keep
    const cleanedData = data.map(row => {
      const cleanedRow: Record<string, any> = {};
      columnsToKeep.forEach(col => {
        cleanedRow[col] = row[col];
      });
      return cleanedRow;
    });

    // Convert back to CSV
    const cleanedCsv = Papa.unparse(cleanedData, {
      header: true,
      columns: columnsToKeep
    });

    // Generate filename
    let filename = customDownloadName;
    if (!filename) {
      const originalName = file.name.replace('.csv', '');
      filename = `${originalName}-cleaned.csv`;
    } else if (!filename.endsWith('.csv')) {
      filename += '.csv';
    }

    // Return the cleaned CSV
    return new NextResponse(cleanedCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json({ 
      error: 'Failed to process CSV file' 
    }, { status: 500 });
  }
}