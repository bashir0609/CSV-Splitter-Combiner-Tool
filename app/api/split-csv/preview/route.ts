import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const numSplits = parseInt(formData.get('numSplits') as string, 10);

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }
        if (isNaN(numSplits) || numSplits <= 1) {
            return NextResponse.json({ message: 'Invalid number of splits.' }, { status: 400 });
        }

        const content = await file.text();
        const records = parse(content, { columns: false, skip_empty_lines: true });
        
        const totalRows = records.length - 1; // Subtract header row
        if (totalRows < 1) {
             return NextResponse.json({ message: 'CSV file has no data rows to split.' }, { status: 400 });
        }

        const rowsPerFile = Math.ceil(totalRows / numSplits);

        const previewMessage = `This file has ${totalRows} data rows. It will be split into ${numSplits} files with approximately ${rowsPerFile} rows each.`;

        return NextResponse.json({ previewMessage });

    } catch (error: any) {
        console.error("API Preview Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Preview failed: ${errorMessage}` }, { status: 500 });
    }
}
