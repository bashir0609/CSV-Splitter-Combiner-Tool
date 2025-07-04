import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import JSZip from 'jszip';

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

        if (records.length < 2) {
             return NextResponse.json({ message: 'CSV file needs a header and at least one data row.' }, { status: 400 });
        }
        
        const header = records[0];
        const dataRows = records.slice(1);
        const totalRows = dataRows.length;
        const rowsPerFile = Math.ceil(totalRows / numSplits);
        
        const zip = new JSZip();
        const originalFileName = file.name.replace(/\.csv$/, '');

        for (let i = 0; i < numSplits; i++) {
            const startRow = i * rowsPerFile;
            const endRow = startRow + rowsPerFile;
            const splitData = dataRows.slice(startRow, endRow);

            if (splitData.length > 0) {
                const csvContent = [header, ...splitData].map(row => row.join(',')).join('\n');
                zip.file(`${originalFileName}_part_${i + 1}.csv`, csvContent);
            }
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

        return new NextResponse(zipContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${originalFileName}_split.zip"`,
            },
        });

    } catch (error: any) {
        console.error("API Split Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Splitting failed: ${errorMessage}` }, { status: 500 });
    }
}
