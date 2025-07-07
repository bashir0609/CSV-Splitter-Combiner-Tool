// app/api/remove-duplicates/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mode = formData.get('mode') as string;
    const exportType = formData.get('exportType') as string;

    let allFiles: Array<{ filename: string; rowCount: number; columns: string[] }> = [];
    let totalRows = 0;

    if (mode === 'single') {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Parse single file
      const csvText = await file.text();
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        return NextResponse.json({ 
          error: `CSV parsing error: ${parseResult.errors[0].message}` 
        }, { status: 400 });
      }

      const data = parseResult.data as any[];
      const headers = parseResult.meta.fields || [];

      allFiles.push({
        filename: file.name,
        rowCount: data.length,
        columns: headers
      });

      totalRows = data.length;

    } else {
      // Handle multiple files
      const files = formData.getAll('files') as File[];
      if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      // For file2-only export, we only care about File 2's row count in the summary
      let file2RowCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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

        allFiles.push({
          filename: file.name,
          rowCount: data.length,
          columns: headers
        });

        if (i === 1) {
          file2RowCount = data.length; // Store File 2's row count
        }

        totalRows += data.length;
      }

      // For file2-only export type, adjust the total to only show File 2's count
      if (exportType === 'file2-only') {
        totalRows = file2RowCount;
      }
    }

    return NextResponse.json({
      files: allFiles,
      totalRows,
      exportType: exportType || 'merged-unique'
    });

  } catch (error) {
    console.error('Error analyzing files:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze files' 
    }, { status: 500 });
  }
}