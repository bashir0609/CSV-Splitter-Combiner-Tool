// app/api/json-to-csv/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Parser } from 'json2csv';

function extractPrimaryArray(data: any): any[] {
    if (Array.isArray(data)) {
        return data;
    }
    if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 1 && Array.isArray(data[keys[0]])) {
            return data[keys[0]];
        }
    }
    return [data];
}

// NEW: Function to flatten arrays in JSON objects
function flattenArrays(obj: any): any {
    if (Array.isArray(obj)) {
        // Convert array items to strings and join with commas
        return obj.map(item => {
            if (typeof item === 'object' && item !== null) {
                // For complex objects in arrays, stringify them
                return JSON.stringify(item);
            }
            return String(item);
        }).join(', ');
    }
    
    if (typeof obj === 'object' && obj !== null) {
        // Recursively process object properties
        const flattened: any = {};
        for (const [key, value] of Object.entries(obj)) {
            flattened[key] = flattenArrays(value);
        }
        return flattened;
    }
    
    // Return primitive values as-is
    return obj;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const jsonFile = formData.get('file') as File | null;

        if (!jsonFile) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const content = await jsonFile.text();
        const data = JSON.parse(content);
        const dataArray = extractPrimaryArray(data);

        if (dataArray.length === 0) {
            return NextResponse.json({ message: 'The JSON file contains no data to convert.' }, { status: 400 });
        }

        // NEW: Flatten arrays before CSV conversion
        const flattenedData = dataArray.map(item => flattenArrays(item));

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(flattenedData);

        // Parse the CSV back to get structured data for preview
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        // Generate preview data (first 5 rows)
        const previewRows = lines.slice(1, 6).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        }).filter(row => Object.values(row).some(val => val !== ''));

        return NextResponse.json({
            message: `Preview of JSON to CSV conversion (${dataArray.length} total rows)`,
            previewData: previewRows,
            totalRows: dataArray.length,
            totalColumns: headers.length,
            headers
        });

    } catch (error: any) {
        console.error("Preview API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Preview failed: ${errorMessage}` }, { status: 500 });
    }
                                                 }
