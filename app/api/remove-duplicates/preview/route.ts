// app/api/remove-duplicates/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const mode = formData.get('mode') as string;
    const exportType = formData.get('exportType') as string;
    const duplicateColumn = formData.get('duplicateColumn') as string;
    const fileColumnMappingsStr = formData.get('fileColumnMappings') as string;
    const keepFirst = formData.get('keepFirst') === 'true';

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

      // Find duplicates
      const seen = new Set<string>();
      const uniqueData: any[] = [];
      const duplicates: any[] = [];
      const dataToProcess = keepFirst ? data : [...data].reverse();

      for (const row of dataToProcess) {
        const value = row[duplicateColumn];
        const key = String(value || '').trim().toLowerCase();

        if (!seen.has(key)) {
          seen.add(key);
          uniqueData.push(row);
        } else {
          duplicates.push(row);
        }
      }

      const previewRows = uniqueData.slice(0, 5);
      const duplicateRows = duplicates.slice(0, 5);

      return NextResponse.json({
        originalCount: data.length,
        duplicateCount: duplicates.length,
        uniqueCount: uniqueData.length,
        columnMappings: { [duplicateColumn]: duplicateColumn },
        previewRows,
        duplicateRows,
        message: duplicates.length > 0 
          ? `Found ${duplicates.length} duplicate rows based on column "${duplicateColumn}"`
          : `No duplicates found based on column "${duplicateColumn}"`
      });

    } else {
      // Handle multiple files
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
      let file1Column = '';
      let file2Column = '';

      // Process each file separately
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

        // Store data for each file separately
        if (i === 0) {
          file1Data = fileData;
          file1Column = mappedColumn;
        } else if (i === 1) {
          file2Data = fileData;
          file2Column = mappedColumn;
        }
      }

      if (exportType === 'file2-only') {
        // Create a set of all values from File 1's comparison column
        const file1Values = new Set(
          file1Data.map(row => String(row[file1Column] || '').trim().toLowerCase())
        );

        // Filter File 2 data to find rows that don't exist in File 1
        const file2UniqueRows = file2Data.filter(row => {
          const file2Value = String(row[file2Column] || '').trim().toLowerCase();
          return !file1Values.has(file2Value);
        });

        // Find rows in File 2 that do exist in File 1 (for reporting)
        const file2DuplicateRows = file2Data.filter(row => {
          const file2Value = String(row[file2Column] || '').trim().toLowerCase();
          return file1Values.has(file2Value);
        });

        const previewRows = file2UniqueRows.slice(0, 5);
        const duplicateRows = file2DuplicateRows.slice(0, 5);

        return NextResponse.json({
          originalCount: file2Data.length, // Only count File 2 rows
          duplicateCount: file2DuplicateRows.length, // Rows in File 2 that exist in File 1
          uniqueCount: file2UniqueRows.length, // Rows in File 2 that don't exist in File 1
          columnMappings: fileColumnMappings,
          previewRows,
          duplicateRows,
          message: file2UniqueRows.length > 0
            ? `Found ${file2UniqueRows.length} rows in ${files[1].name} that don't exist in ${files[0].name}. ${file2DuplicateRows.length} rows already exist in ${files[0].name}.`
            : `All rows in ${files[1].name} already exist in ${files[0].name}.`
        });

      } else {
        // Merged Unique logic (existing behavior)
        let mergedData: any[] = [];

        // Process and merge data for standard deduplication
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

          // Add duplicate key to each row
          const processedData = fileData.map(row => ({
            ...row,
            __duplicate_key: String(row[mappedColumn] || '').trim().toLowerCase()
          }));

          mergedData = mergedData.concat(processedData);
        }

        // Find duplicates across merged data
        const seen = new Set<string>();
        const uniqueData: any[] = [];
        const duplicates: any[] = [];
        const dataToProcess = keepFirst ? mergedData : [...mergedData].reverse();

        for (const row of dataToProcess) {
          const key = row.__duplicate_key;

          if (!seen.has(key)) {
            seen.add(key);
            uniqueData.push(row);
          } else {
            duplicates.push(row);
          }
        }

        // Clean up internal fields for preview
        const cleanUniqueData = uniqueData.map(row => {
          const cleanRow = { ...row };
          delete cleanRow.__duplicate_key;
          return cleanRow;
        });

        const cleanDuplicateData = duplicates.map(row => {
          const cleanRow = { ...row };
          delete cleanRow.__duplicate_key;
          return cleanRow;
        });

        const previewRows = cleanUniqueData.slice(0, 5);
        const duplicateRows = cleanDuplicateData.slice(0, 5);

        return NextResponse.json({
          originalCount: mergedData.length,
          duplicateCount: duplicates.length,
          uniqueCount: uniqueData.length,
          columnMappings: fileColumnMappings,
          previewRows,
          duplicateRows,
          message: duplicates.length > 0 
            ? `Found ${duplicates.length} duplicate rows across ${files.length} files`
            : `No duplicates found across ${files.length} files`
        });
      }
    }

  } catch (error) {
    console.error('Error previewing files:', error);
    return NextResponse.json({ 
      error: 'Failed to preview files' 
    }, { status: 500 });
  }
}