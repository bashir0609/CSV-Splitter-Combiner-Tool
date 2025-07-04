import { NextRequest, NextResponse } from 'next/server';
import { Parser } from 'json2csv';

const PREVIEW_ROW_COUNT = 10;

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

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        // --- THIS IS THE FIX ---
        // Changed formData.get('jsonFile') to formData.get('file')
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

        const previewData = dataArray.slice(0, PREVIEW_ROW_COUNT);
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(previewData);

        return NextResponse.json({ csv });

    } catch (error: any) {
        console.error("API Preview Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Preview failed: ${errorMessage}` }, { status: 500 });
    }
}
