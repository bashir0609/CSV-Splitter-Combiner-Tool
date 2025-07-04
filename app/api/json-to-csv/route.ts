import { NextRequest, NextResponse } from 'server';
import { promises as fs } from 'fs';
import { Parser } from 'json2csv';
import formidable from 'formidable';

// Helper to disable Next.js body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse the form data
const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});
        form.parse(req as any, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

export async function POST(req: NextRequest) {
    try {
        const { files } = await parseForm(req);
        const jsonFile = files.jsonFile?.[0];

        if (!jsonFile) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        const content = await fs.readFile(jsonFile.filepath, 'utf-8');
        const data = JSON.parse(content);

        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) {
            return NextResponse.json({ message: 'JSON file is empty.' }, { status: 400 });
        }

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(dataArray);

        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="converted.csv"`);

        return new NextResponse(csv, { status: 200, headers });

    } catch (error: any) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Conversion failed: ${errorMessage}` }, { status: 500 });
    }
}
