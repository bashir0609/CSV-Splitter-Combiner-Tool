// app/api/vlookup/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length !== 2) {
      return NextResponse.json({ error: 'Exactly 2 files are required: Main Data file and Lookup Table file' }, { status: 400 });
    }

    const filesInfo: Array<{
      filename: string;
      rowCount: number;
      columns: string[];
    }> = [];

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
    }

    // First file is Main Data, second file is Lookup Table
    const [mainFile, lookupFile] = filesInfo;

    if (mainFile.columns.length === 0 || lookupFile.columns.length === 0) {
      return NextResponse.json({ 
        error: 'Both files must contain column headers' 
      }, { status: 400 });
    }

    return NextResponse.json({
      mainFile,
      lookupFile,
      totalFiles: files.length
    });

  } catch (error) {
    console.error('Error analyzing files for VLOOKUP:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze files' 
    }, { status: 500 });
  }
}