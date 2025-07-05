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
    const removeDuplicates = formData.get('removeDuplicates') === 'true';
    const duplicateColumn = formData.get('duplicateColumn') as string;
    
    if (!mappingsJson) {
      return NextResponse.json(
        { error: 'Column mappings are required' },
        { status: 400 }
      );
    }
    
    const mappings: ColumnMapping = JSON.parse(mappingsJson);
    
    if (files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 files are required' },
        { status: 400 }
      );
    }
    
    // Get all target columns from mappings
    const targetColumns = new Set<string>();
    Object.values(mappings).forEach(fileMapping => {
      Object.values(fileMapping).forEach(targetColumn => {
        if (targetColumn) {
          targetColumns.add(targetColumn);
        }
      });
    });
    
    const targetColumnsList = Array.from(targetColumns).sort();
    const combinedData: Record<string, any>[] = [];
    
    // Process each file
    for (const file of files) {
      const text = await file.text();
      const fileMapping = mappings[file.name];
      
      if (!fileMapping) {
        continue; // Skip files without mappings
      }
      
      try {
        const records = parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        
        // Transform each record according to the mapping
        for (const record of records) {
          const transformedRecord: Record<string, any> = {};
          
          // Initialize all target columns with empty values
          targetColumnsList.forEach(col => {
            transformedRecord[col] = '';
          });
          
          // Map original columns to target columns
          Object.entries(fileMapping).forEach(([originalCol, targetCol]) => {
            if (targetCol && record[originalCol] !== undefined) {
              transformedRecord[targetCol] = record[originalCol];
            }
          });
          
          combinedData.push(transformedRecord);
        }
        
      } catch (parseError) {
        return NextResponse.json(
          { error: `Failed to parse ${file.name}: ${parseError}` },
          { status: 400 }
        );
      }
    }
    
    if (combinedData.length === 0) {
      return NextResponse.json(
        { error: 'No data to combine' },
        { status: 400 }
      );
    }
    
    // Remove duplicates if requested
    let finalData = combinedData;
    if (removeDuplicates && duplicateColumn) {
      const seen = new Set<string>();
      finalData = combinedData.filter(row => {
        const value = row[duplicateColumn]?.toString() || '';
        if (seen.has(value)) {
          return false; // Skip duplicate
        }
        seen.add(value);
        return true; // Keep first occurrence
      });
    }
    
    // Generate CSV output manually
    const headers = targetColumnsList.join(',');
    const rows = finalData.map(row => 
      targetColumnsList.map(col => {
        const value = row[col] || '';
        // Escape commas and quotes
        return value.toString().includes(',') || value.toString().includes('"') 
          ? `"${value.toString().replace(/"/g, '""')}"` 
          : value.toString();
      }).join(',')
    );
    
    const csvOutput = [headers, ...rows].join('\n');
    
    return new NextResponse(csvOutput, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="combined.csv"'
      }
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process files' },
      { status: 500 }
    );
  }
}