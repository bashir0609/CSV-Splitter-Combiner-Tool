import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

interface ColumnMapping {
  [filename: string]: {
    [originalColumn: string]: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const mappingsJson = formData.get('mappings') as string;
    
    if (!mappingsJson) {
      return NextResponse.json({ message: 'Column mappings are required' }, { status: 400 });
    }
    
    const mappings: ColumnMapping = JSON.parse(mappingsJson);
    
    if (files.length < 2) {
      return NextResponse.json({ message: 'At least 2 files are required' }, { status: 400 });
    }
    
    // Quick analysis - only read headers and row count, don't process all data
    let totalRows = 0;
    const fileInfo = [];
    
    for (const file of files) {
      const text = await file.text();
      
      try {
        // Just count lines for speed instead of parsing all data
        const lines = text.trim().split('\n');
        const dataRows = lines.length - 1; // Subtract header row
        
        if (dataRows < 0) {
          return NextResponse.json(
            { message: `File ${file.name} appears to be empty` },
            { status: 400 }
          );
        }
        
        totalRows += dataRows;
        fileInfo.push(`${file.name}: ${dataRows} rows`);
      } catch (parseError) {
        return NextResponse.json(
          { message: `Failed to analyze ${file.name}: ${parseError}` },
          { status: 400 }
        );
      }
    }
    
    // Get mapped columns count
    const mappedColumns = new Set<string>();
    Object.values(mappings).forEach(fileMapping => {
      Object.values(fileMapping).forEach(targetColumn => {
        if (targetColumn) {
          mappedColumns.add(targetColumn);
        }
      });
    });
    
    const previewMessage = `Ready to combine ${files.length} files with ${totalRows} total rows into ${mappedColumns.size} columns. Files: ${fileInfo.join(', ')}`;
    
    return NextResponse.json({ previewMessage });
    
  } catch (error: any) {
    console.error('Preview error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: `Preview failed: ${errorMessage}` }, { status: 500 });
  }
}