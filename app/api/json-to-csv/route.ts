import { NextRequest, NextResponse } from 'next/server';
import { Parser } from 'json2csv';

/**
 * Intelligently extracts the primary array from a JSON object.
 * If the object contains a single key whose value is an array, that array is returned.
 * Otherwise, the original data is returned.
 * @param data The parsed JSON data.
 * @returns The primary array or the original data.
 */
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
    // If no primary array is found, wrap the object in an array to treat it as a single row
    return [data];
}


export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const jsonFile = formData.get('jsonFile') as File | null;

        if (!jsonFile) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const content = await jsonFile.text();
        const data = JSON.parse(content);

        // Intelligently find the array to convert (e.g., the "people" array)
        const dataArray = extractPrimaryArray(data);

        if (dataArray.length === 0) {
            return NextResponse.json({ message: 'The JSON file contains no data to convert.' }, { status: 400 });
        }

        // The json2csv Parser will automatically flatten nested objects and arrays
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(dataArray);

        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="converted.csv"`);

        return new NextResponse(csv, { status: 200, headers });

    } catch (error: any) {
        console.error("API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Conversion failed: ${errorMessage}` }, { status: 500 });
    }
}
