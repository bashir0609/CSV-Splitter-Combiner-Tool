// app/api/join-on-column/route.ts
// Author: Your Name
// GitHub: https://github.com/your-username/csv-toolkit-web

import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { Parser } from 'json2csv';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file1 = formData.get('file1') as File | null; // Left file
        const file2 = formData.get('file2') as File | null; // Right file
        const joinColumn1 = formData.get('joinColumn1') as string | null;
        const joinColumn2 = formData.get('joinColumn2') as string | null;
        const joinType = formData.get('joinType') as 'inner' | 'left' | null;

        if (!file1 || !file2 || !joinColumn1 || !joinColumn2 || !joinType) {
            return NextResponse.json({ error: 'Missing required files or join parameters.' }, { status: 400 });
        }

        const [content1, content2] = await Promise.all([file1.text(), file2.text()]);

        const records1: Record<string, string>[] = parse(content1, { columns: true, skip_empty_lines: true });
        const records2: Record<string, string>[] = parse(content2, { columns: true, skip_empty_lines: true });

        if (records1.length === 0 || records2.length === 0) {
            return NextResponse.json({ error: 'One or both files have no data to join.' }, { status: 400 });
        }
        
        // Create a lookup map from the right file for efficient joining
        const rightFileMap = new Map<string, Record<string, string>>();
        for (const record of records2) {
            if (record[joinColumn2]) {
                rightFileMap.set(record[joinColumn2], record);
            }
        }
        
        const headers1 = Object.keys(records1[0]);
        const headers2 = Object.keys(records2[0]).filter(h => h !== joinColumn2);
        const finalHeaders = [...headers1, ...headers2];

        const joinedRecords = [];

        for (const leftRecord of records1) {
            const joinKey = leftRecord[joinColumn1];
            const rightRecord = rightFileMap.get(joinKey);

            if (rightRecord) {
                // Match found, merge records
                const { [joinColumn2]: _, ...restOfRightRecord } = rightRecord; // Exclude right join column
                joinedRecords.push({ ...leftRecord, ...restOfRightRecord });
            } else if (joinType === 'left') {
                // No match, but it's a left join, so include the left record with empty right columns
                const emptyRightRecord = headers2.reduce((acc, h) => ({ ...acc, [h]: '' }), {});
                joinedRecords.push({ ...leftRecord, ...emptyRightRecord });
            }
        }

        if(joinedRecords.length === 0) {
            return NextResponse.json({ error: `No matching records found for an '${joinType}' join. The output file would be empty.` }, { status: 400 });
        }

        const parser = new Parser({ fields: finalHeaders });
        const finalCsv = parser.parse(joinedRecords);

        return new NextResponse(finalCsv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="joined_data.csv"`,
            },
        });

    } catch (error: any) {
        console.error("API Join Error:", error);
        return NextResponse.json({ error: `Joining files failed: ${error.message}` }, { status: 500 });
    }
}