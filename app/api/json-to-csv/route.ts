import { NextRequest, NextResponse } from 'server';
import { promises as fs } from 'fs';
import { Parser } from 'json2csv';
import formidable from 'formidable';

// Helper to parse the form data from the request
const parseForm = (req: NextRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});
        // The 'req' object in the App Router is compatible with Node's http.IncomingMessage
        form.parse(req as any, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

export async function POST(req: NextRequest) {
    try {
        // Parse the incoming form data to get the file
        const { files } = await parseForm(req);
        // formidable wraps files in an array, so we take the first one
        const jsonFile = files.jsonFile?.[0];

        if (!jsonFile) {
            return NextResponse.json({ message: 'No file uploaded.' }, { status: 400 });
        }

        // Read the content of the uploaded file
        const content = await fs.readFile(jsonFile.filepath, 'utf-8');
        const data = JSON.parse(content);

        // Ensure the data is an array for the parser
        const dataArray = Array.isArray(data) ? data : [data];

        if (dataArray.length === 0) {
            return NextResponse.json({ message: 'JSON file is empty.' }, { status: 400 });
        }

        // Use json2csv to perform the conversion
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(dataArray);

        // Set headers to trigger a file download in the browser
        const headers = new Headers();
        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', `attachment; filename="converted.csv"`);

        // Return the CSV data as the response
        return new NextResponse(csv, { status: 200, headers });

    } catch (error: any) {
        console.error("API Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ message: `Conversion failed: ${errorMessage}` }, { status: 500 });
    }
}
