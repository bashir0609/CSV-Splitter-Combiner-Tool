// app/api/merge-side-by-side/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const mappingsStr = formData.get('mappings') as string;

    if (files.length < 2) {
      return NextResponse.json({ error: 'At least 2 files are required' }, { status: 400 });
    }

    let mappings: Record<string, Record<string, string>> = {};
    if (mappingsStr) {
      try {
        mappings = JSON.parse(mappingsStr);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid mappings format' }, { status: 400 });
      }
    }

    // Parse all files
    const filesData: Array<{
      filename: string;
      data: any[];
      headers: string[];
    }> = [];

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

      filesData.push({
        filename: file.name,
        data,
        headers
      });
    }

    // Determine all target columns from mappings (MAPPED COLUMNS)
    const allTargetColumns = new Set<string>();
    Object.values(mappings).forEach(fileMapping => {
      Object.values(fileMapping).forEach(targetCol => {
        if (targetCol) {
          allTargetColumns.add(targetCol);
        }
      });
    });

    const targetColumnsArray = Array.from(allTargetColumns).sort();

    if (targetColumnsArray.length === 0) {
      return NextResponse.json({ error: 'No column mappings provided' }, { status: 400 });
    }

    // Find unmapped columns for each file (UNMAPPED COLUMNS)
    const unmappedColumns: Array<{
      filename: string;
      columns: string[];
    }> = [];

    filesData.forEach(fileData => {
      const fileMapping = mappings[fileData.filename] || {};
      const mappedOriginalColumns = new Set(Object.keys(fileMapping).filter(col => fileMapping[col]));
      
      const unmappedCols = fileData.headers.filter(header => !mappedOriginalColumns.has(header));
      
      if (unmappedCols.length > 0) {
        unmappedColumns.push({
          filename: fileData.filename,
          columns: unmappedCols
        });
      }
    });

    // Get join settings
    const keyColumn = formData.get('keyColumn') as string;
    const joinType = (formData.get('joinType') as string) || 'left';

    if (!keyColumn) {
      return NextResponse.json({ error: 'Key column is required for VLOOKUP-style merging' }, { status: 400 });
    }

    // Find the key column mapping for each file
    const keyColumnMappings: Record<string, string> = {};
    filesData.forEach(fileData => {
      const fileMapping = mappings[fileData.filename] || {};
      const originalKeyColumn = Object.keys(fileMapping).find(
        origCol => fileMapping[origCol] === keyColumn
      );
      if (originalKeyColumn) {
        keyColumnMappings[fileData.filename] = originalKeyColumn;
      }
    });

    // Create lookup tables for each file based on key column
    const lookupTables: Record<string, Record<string, any>> = {};
    filesData.forEach(fileData => {
      const keyCol = keyColumnMappings[fileData.filename];
      if (keyCol) {
        const lookup: Record<string, any> = {};
        fileData.data.forEach(row => {
          const keyValue = row[keyCol];
          if (keyValue !== undefined && keyValue !== null && keyValue !== '') {
            lookup[String(keyValue)] = row;
          }
        });
        lookupTables[fileData.filename] = lookup;
      }
    });

    // Get all unique key values based on join type
    const allKeyValues = new Set<string>();
    
    if (joinType === 'left') {
      // Use keys from first file only
      const firstFile = filesData[0];
      const firstFileKeyCol = keyColumnMappings[firstFile.filename];
      if (firstFileKeyCol) {
        Object.keys(lookupTables[firstFile.filename] || {}).forEach(key => allKeyValues.add(key));
      }
    } else if (joinType === 'inner') {
      // Use keys that exist in ALL files
      const firstFile = filesData[0];
      const firstFileKeys = new Set(Object.keys(lookupTables[firstFile.filename] || {}));
      
      firstFileKeys.forEach(key => {
        const existsInAllFiles = filesData.every(file => 
          lookupTables[file.filename] && lookupTables[file.filename][key]
        );
        if (existsInAllFiles) {
          allKeyValues.add(key);
        }
      });
    } else { // 'full'
      // Use keys from ALL files
      filesData.forEach(fileData => {
        Object.keys(lookupTables[fileData.filename] || {}).forEach(key => allKeyValues.add(key));
      });
    }

    // Create column structure for preview (MAPPED AS SINGLE COLUMNS, THEN UNMAPPED)
    const previewColumns: string[] = [];
    const columnMapping: Record<string, string[]> = {};

    // FIRST: Add mapped columns (single column per target)
    targetColumnsArray.forEach(targetColumn => {
      previewColumns.push(targetColumn);
      
      const sourceCols: string[] = [];
      filesData.forEach(fileData => {
        const fileMapping = mappings[fileData.filename] || {};
        const originalColumn = Object.keys(fileMapping).find(
          origCol => fileMapping[origCol] === targetColumn
        );

        if (originalColumn) {
          sourceCols.push(`${fileData.filename}: ${originalColumn}`);
        }
      });
      
      columnMapping[targetColumn] = sourceCols;
    });

    // SECOND: Add unmapped columns
    unmappedColumns.forEach(({ filename, columns }) => {
      const filePrefix = filename.replace('.csv', '').replace(/[^a-zA-Z0-9]/g, '_');
      
      columns.forEach(originalColumn => {
        const uniqueColumnName = `${originalColumn}_${filePrefix}`;
        previewColumns.push(uniqueColumnName);
        
        // Add to column mapping for clarity
        const unmappedKey = `UNMAPPED_${originalColumn}`;
        if (!columnMapping[unmappedKey]) {
          columnMapping[unmappedKey] = [];
        }
        columnMapping[unmappedKey].push(`${filename}: ${originalColumn}`);
      });
    });

    // Generate sample merged data (first 5 unique keys)
    const sampleKeys = Array.from(allKeyValues).sort().slice(0, 5);
    const sampleRows: any[] = [];

    sampleKeys.forEach(keyValue => {
      const mergedRow: any = {};

      // FIRST: Add mapped columns (VLOOKUP style)
      targetColumnsArray.forEach(targetColumn => {
        let value = '';
        
        // Find the first file that has this key and target column mapping
        for (const fileData of filesData) {
          const fileMapping = mappings[fileData.filename] || {};
          const originalColumn = Object.keys(fileMapping).find(
            origCol => fileMapping[origCol] === targetColumn
          );
          
          if (originalColumn && lookupTables[fileData.filename] && lookupTables[fileData.filename][keyValue]) {
            const rowData = lookupTables[fileData.filename][keyValue];
            const cellValue = rowData[originalColumn];
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              value = cellValue;
              break; // Use first non-empty value found
            }
          }
        }
        
        mergedRow[targetColumn] = value;
      });

      // SECOND: Add unmapped columns
      unmappedColumns.forEach(({ filename, columns }) => {
        const filePrefix = filename.replace('.csv', '').replace(/[^a-zA-Z0-9]/g, '_');
        
        columns.forEach(originalColumn => {
          const uniqueColumnName = `${originalColumn}_${filePrefix}`;
          
          let value = '';
          if (lookupTables[filename] && lookupTables[filename][keyValue]) {
            const rowData = lookupTables[filename][keyValue];
            value = rowData[originalColumn] || '';
          }
          
          mergedRow[uniqueColumnName] = value;
        });
      });

      sampleRows.push(mergedRow);
    });

    return NextResponse.json({
      previewMessage: `Preview of VLOOKUP-style merged data with ${previewColumns.length} columns (${targetColumnsArray.length} mapped + ${previewColumns.length - targetColumnsArray.length} unmapped)`,
      sampleRows,
      totalColumns: previewColumns.length,
      totalRows: allKeyValues.size,
      columnMapping,
      previewColumns,
      mappedColumnsCount: targetColumnsArray.length,
      unmappedColumnsCount: previewColumns.length - targetColumnsArray.length,
      joinType,
      keyColumn,
      totalUniqueKeys: allKeyValues.size
    });

  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json({ 
      error: 'Failed to generate preview' 
    }, { status: 500 });
  }
}