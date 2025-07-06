// app/api/vlookup/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

interface VLookupConfig {
  lookupColumn: string;
  returnColumns: Array<{
    sourceColumn: string;
    targetColumn: string;
    columnIndex: number;
  }>;
  matchType: 'exact' | 'approximate';
  errorValue: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const vlookupConfigStr = formData.get('vlookupConfig') as string;

    if (files.length !== 2) {
      return NextResponse.json({ error: 'Exactly 2 files are required: Main Data file and Lookup Table file' }, { status: 400 });
    }

    if (!vlookupConfigStr) {
      return NextResponse.json({ error: 'VLOOKUP configuration is required' }, { status: 400 });
    }

    let vlookupConfig: VLookupConfig;
    try {
      vlookupConfig = JSON.parse(vlookupConfigStr);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid VLOOKUP configuration format' }, { status: 400 });
    }

    if (!vlookupConfig.lookupColumn || vlookupConfig.returnColumns.length === 0) {
      return NextResponse.json({ error: 'Lookup column and return columns are required' }, { status: 400 });
    }

    // Parse both files
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

    const [mainFile, lookupFile] = filesData;

    // Validate lookup column exists in main file
    if (!mainFile.headers.includes(vlookupConfig.lookupColumn)) {
      return NextResponse.json({ 
        error: `Lookup column "${vlookupConfig.lookupColumn}" not found in main data file` 
      }, { status: 400 });
    }

    // Validate return columns exist in lookup file
    for (const returnCol of vlookupConfig.returnColumns) {
      if (!lookupFile.headers.includes(returnCol.sourceColumn)) {
        return NextResponse.json({ 
          error: `Return column "${returnCol.sourceColumn}" not found in lookup table file` 
        }, { status: 400 });
      }
    }

    // Create lookup table using first column of lookup file as key
    const lookupTable = new Map<string, any>();
    const lookupKeyColumn = lookupFile.headers[0];

    lookupFile.data.forEach(row => {
      const key = String(row[lookupKeyColumn] || '').trim();
      if (key) {
        if (vlookupConfig.matchType === 'exact') {
          lookupTable.set(key, row);
        } else {
          // For approximate match, we'll store all keys for later sorting
          lookupTable.set(key.toLowerCase(), row);
        }
      }
    });

    // Create output data by performing VLOOKUP operations
    const outputData: any[] = [];
    let totalLookups = 0;
    let successfulLookups = 0;
    let failedLookups = 0;

    // Determine output columns
    const outputColumns = [
      ...mainFile.headers,
      ...vlookupConfig.returnColumns.map(col => col.targetColumn)
    ];

    mainFile.data.forEach(mainRow => {
      const outputRow: any = { ...mainRow };
      
      const lookupValue = String(mainRow[vlookupConfig.lookupColumn] || '').trim();
      if (lookupValue) {
        totalLookups++;
        
        let matchedRow = null;
        
        if (vlookupConfig.matchType === 'exact') {
          matchedRow = lookupTable.get(lookupValue);
        } else {
          // Approximate match - find closest match
          const searchKey = lookupValue.toLowerCase();
          const sortedKeys = Array.from(lookupTable.keys()).sort();
          
          // Find the largest key that is less than or equal to search key
          let bestMatch = null;
          for (const key of sortedKeys) {
            if (key <= searchKey) {
              bestMatch = key;
            } else {
              break;
            }
          }
          
          if (bestMatch) {
            matchedRow = lookupTable.get(bestMatch);
          }
        }
        
        if (matchedRow) {
          successfulLookups++;
          // Add return columns from matched row
          vlookupConfig.returnColumns.forEach(returnCol => {
            outputRow[returnCol.targetColumn] = matchedRow[returnCol.sourceColumn] || '';
          });
        } else {
          failedLookups++;
          // Add error values for return columns
          vlookupConfig.returnColumns.forEach(returnCol => {
            outputRow[returnCol.targetColumn] = vlookupConfig.errorValue;
          });
        }
      } else {
        // Empty lookup value
        totalLookups++;
        failedLookups++;
        vlookupConfig.returnColumns.forEach(returnCol => {
          outputRow[returnCol.targetColumn] = vlookupConfig.errorValue;
        });
      }
      
      outputData.push(outputRow);
    });

    // Calculate success rate
    const successRate = totalLookups > 0 ? (successfulLookups / totalLookups) * 100 : 0;

    // Generate sample data (first 5 rows)
    const sampleRows = outputData.slice(0, 5);

    return NextResponse.json({
      previewMessage: `Preview of VLOOKUP with ${vlookupConfig.returnColumns.length} return columns`,
      sampleRows,
      totalColumns: outputColumns.length,
      totalRows: outputData.length,
      lookupStats: {
        totalLookups,
        successfulLookups,
        failedLookups,
        successRate
      },
      outputColumns
    });

  } catch (error) {
    console.error('Error generating VLOOKUP preview:', error);
    return NextResponse.json({ 
      error: 'Failed to generate preview' 
    }, { status: 500 });
  }
}