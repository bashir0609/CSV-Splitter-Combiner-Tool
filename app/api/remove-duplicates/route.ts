// app/api/remove-duplicates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mode = formData.get('mode') as string;
    const exportType = formData.get('exportType') as string; // New field
    const duplicateColumn = formData.get('duplicateColumn') as string;
    const fileColumnMappingsStr = formData.get('fileColumnMappings') as string;
    const keepFirst = formData.get('keepFirst') === 'true';
    const customDownloadName = formData.get('customDownloadName') as string;

    let fileColumnMappings: Record<string, string> = {};
    
    if (mode === 'multiple' && fileColumnMappingsStr) {
      try {
        fileColumnMappings = JSON.parse(fileColumnMappingsStr);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid file column mappings' }, { status: 400 });
      }
    }

    if (mode === 'single' && !duplicateColumn) {
      return NextResponse.json({ error: 'Duplicate column is required for single file mode' }, { status: 400 });
    }

    if (mode === 'multiple' && Object.keys(fileColumnMappings).length === 0) {
      return NextResponse.json({ error: 'File column mappings are required for multiple files mode' }, { status: 400 });
    }

    let allData: any[] = [];
    let filename = 'deduplicated.csv';

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

      if (!headers.includes(duplicateColumn)) {
        return NextResponse.json({ 
          error: `Column "${duplicateColumn}" not found in file` 
        }, { status: 400 });
      }

      allData = data;
      filename = customDownloadName || `${file.name.replace('.csv', '')}-deduped.csv`;

      // Remove duplicates for single file
      const seen = new Set<string>();
      const uniqueData: any[] = [];
      const dataToProcess = keepFirst ? allData : [...allData].reverse();

      for (const row of dataToProcess) {
        const value = row[duplicateColumn];
        const key = String(value || '').trim().toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          uniqueData.push(row);
        }
      }

      const finalData = keepFirst ? uniqueData : uniqueData.reverse();

      // Convert back to CSV
      const cleanedCsv = Papa.unparse(finalData, {
        header: true,
        columns: headers
      });

      if (!filename.endsWith('.csv')) {
        filename += '.csv';
      }

      return new NextResponse(cleanedCsv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });

    } else {
      // Handle multiple files with new export types
      const files = formData.getAll('files') as File[];
      if (files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }

      // For "file2-only" export type, we need exactly 2 files
      if (exportType === 'file2-only' && files.length !== 2) {
        return NextResponse.json({ 
          error: 'File 2 Only export requires exactly 2 files' 
        }, { status: 400 });
      }

      let file1Data: any[] = [];
      let file2Data: any[] = [];
      let mergedData: any[] = [];
      let allHeaders = new Set<string>();

      // Process each file and merge data
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

        const fileData = parseResult.data as any[];
        const fileHeaders = parseResult.meta.fields || [];
        const mappedColumn = fileColumnMappings[file.name];

        if (!mappedColumn) {
          return NextResponse.json({ 
            error: `No column mapping found for file: ${file.name}` 
          }, { status: 400 });
        }

        if (!fileHeaders.includes(mappedColumn)) {
          return NextResponse.json({ 
            error: `Column "${mappedColumn}" not found in file: ${file.name}` 
          }, { status: 400 });
        }

        // Track all headers for final structure
        fileHeaders.forEach(header => allHeaders.add(header));

        // Add file source and duplicate key to each row
        const processedData = fileData.map(row => ({
          ...row,
          __source_file: file.name,
          __file_index: i,
          __duplicate_key: String(row[mappedColumn] || '').trim().toLowerCase()
        }));

        // Store file data separately for file2-only processing
        if (i === 0) {
          file1Data = processedData;
        } else if (i === 1) {
          file2Data = processedData;
        }

        mergedData = mergedData.concat(processedData);
      }

      let finalData: any[] = [];

      if (exportType === 'file2-only') {
        // Export Type 2: File 2 Only Unique
        // Parse files separately to maintain proper separation
        let file1Data: any[] = [];
        let file2Data: any[] = [];
        let file1Column = '';
        let file2Column = '';

        // Process each file separately first
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const csvText = await file.text();
          const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: (header) => header.trim()
          });

          const fileData = parseResult.data as any[];
          const mappedColumn = fileColumnMappings[file.name];

          if (i === 0) {
            file1Data = fileData;
            file1Column = mappedColumn;
          } else if (i === 1) {
            file2Data = fileData;
            file2Column = mappedColumn;
          }
        }

        // Create a set of all values from File 1's comparison column
        const file1Values = new Set(
          file1Data.map(row => String(row[file1Column] || '').trim().toLowerCase())
        );

        // Filter File 2 data to find rows that don't exist in File 1
        finalData = file2Data.filter(row => {
          const file2Value = String(row[file2Column] || '').trim().toLowerCase();
          return !file1Values.has(file2Value);
        });

        filename = customDownloadName || `${files[1].name.replace('.csv', '')}-unique-only.csv`;

      } else {
        // Export Type 1: Merged Unique File (default behavior)
        // Remove duplicates across all merged data
        const seen = new Set<string>();
        const uniqueData: any[] = [];
        const dataToProcess = keepFirst ? mergedData : [...mergedData].reverse();

        for (const row of dataToProcess) {
          const key = row.__duplicate_key;

          if (!seen.has(key)) {
            seen.add(key);
            // Remove internal fields before keeping
            const cleanRow = { ...row };
            delete cleanRow.__source_file;
            delete cleanRow.__file_index;
            delete cleanRow.__duplicate_key;
            uniqueData.push(cleanRow);
          }
        }

        finalData = keepFirst ? uniqueData : uniqueData.reverse();
        filename = customDownloadName || 'merged-deduped.csv';
      }

      // Create consistent column structure
      const finalHeaders = Array.from(allHeaders);

      // Normalize all rows to have same columns
      const normalizedData = finalData.map(row => {
        const normalizedRow: any = {};
        finalHeaders.forEach(header => {
          normalizedRow[header] = row[header] || '';
        });
        return normalizedRow;
      });

      // Convert back to CSV
      const cleanedCsv = Papa.unparse(normalizedData, {
        header: true,
        columns: finalHeaders
      });

      if (!filename.endsWith('.csv')) {
        filename += '.csv';
      }

      return new NextResponse(cleanedCsv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json({ 
      error: 'Failed to process files' 
    }, { status: 500 });
  }
}