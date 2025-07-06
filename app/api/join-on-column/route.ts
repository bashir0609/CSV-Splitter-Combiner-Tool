// app/api/join-on-column/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const joinColumn = formData.get('joinColumn') as string;
    const joinType = (formData.get('joinType') as string) || 'inner';
    const columnPrefix = formData.get('columnPrefix') === 'true';
    const customDownloadName = formData.get('customDownloadName') as string;

    if (files.length !== 2) {
      return NextResponse.json({ error: 'Exactly 2 files are required for join operations' }, { status: 400 });
    }

    if (!joinColumn) {
      return NextResponse.json({ error: 'Join column is required' }, { status: 400 });
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

    const [leftFile, rightFile] = filesData;

    // Find the actual column names in each file (case-insensitive match)
    const findColumnName = (headers: string[], targetColumn: string): string | null => {
      return headers.find(header => header.toLowerCase() === targetColumn.toLowerCase()) || null;
    };

    const leftJoinColumn = findColumnName(leftFile.headers, joinColumn);
    const rightJoinColumn = findColumnName(rightFile.headers, joinColumn);

    if (!leftJoinColumn || !rightJoinColumn) {
      return NextResponse.json({ 
        error: `Join column "${joinColumn}" not found in both files` 
      }, { status: 400 });
    }

    // Create lookup tables for join operations
    const leftLookup = new Map<string, any[]>();
    const rightLookup = new Map<string, any[]>();

    // Build lookup tables
    leftFile.data.forEach(row => {
      const key = String(row[leftJoinColumn] || '').trim();
      if (key) {
        if (!leftLookup.has(key)) {
          leftLookup.set(key, []);
        }
        leftLookup.get(key)!.push(row);
      }
    });

    rightFile.data.forEach(row => {
      const key = String(row[rightJoinColumn] || '').trim();
      if (key) {
        if (!rightLookup.has(key)) {
          rightLookup.set(key, []);
        }
        rightLookup.get(key)!.push(row);
      }
    });

    // Determine output columns
    const outputColumns: string[] = [];
    const leftPrefix = columnPrefix ? 'left_' : '';
    const rightPrefix = columnPrefix ? 'right_' : '';

    // Add left file columns
    leftFile.headers.forEach(header => {
      if (header === leftJoinColumn) {
        outputColumns.push(joinColumn); // Join column appears once without prefix
      } else {
        outputColumns.push(`${leftPrefix}${header}`);
      }
    });

    // Add right file columns (excluding join column to avoid duplication)
    rightFile.headers.forEach(header => {
      if (header !== rightJoinColumn) {
        outputColumns.push(`${rightPrefix}${header}`);
      }
    });

    // Perform join based on join type
    const joinedData: any[] = [];

    if (joinType === 'inner') {
      // Inner join: only rows with matches in both tables
      leftLookup.forEach((leftRows, key) => {
        const rightRows = rightLookup.get(key);
        if (rightRows) {
          leftRows.forEach(leftRow => {
            rightRows.forEach(rightRow => {
              const joinedRow: any = {};
              
              // Add left file data
              leftFile.headers.forEach(header => {
                if (header === leftJoinColumn) {
                  joinedRow[joinColumn] = leftRow[header];
                } else {
                  joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
                }
              });
              
              // Add right file data (excluding join column)
              rightFile.headers.forEach(header => {
                if (header !== rightJoinColumn) {
                  joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
                }
              });
              
              joinedData.push(joinedRow);
            });
          });
        }
      });
    } else if (joinType === 'left') {
      // Left join: all rows from left, matches from right
      leftLookup.forEach((leftRows, key) => {
        const rightRows = rightLookup.get(key);
        
        leftRows.forEach(leftRow => {
          if (rightRows) {
            rightRows.forEach(rightRow => {
              const joinedRow: any = {};
              
              // Add left file data
              leftFile.headers.forEach(header => {
                if (header === leftJoinColumn) {
                  joinedRow[joinColumn] = leftRow[header];
                } else {
                  joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
                }
              });
              
              // Add right file data
              rightFile.headers.forEach(header => {
                if (header !== rightJoinColumn) {
                  joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
                }
              });
              
              joinedData.push(joinedRow);
            });
          } else {
            // No match in right table
            const joinedRow: any = {};
            
            // Add left file data
            leftFile.headers.forEach(header => {
              if (header === leftJoinColumn) {
                joinedRow[joinColumn] = leftRow[header];
              } else {
                joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
              }
            });
            
            // Add empty right file columns
            rightFile.headers.forEach(header => {
              if (header !== rightJoinColumn) {
                joinedRow[`${rightPrefix}${header}`] = '';
              }
            });
            
            joinedData.push(joinedRow);
          }
        });
      });
    } else if (joinType === 'right') {
      // Right join: all rows from right, matches from left
      rightLookup.forEach((rightRows, key) => {
        const leftRows = leftLookup.get(key);
        
        rightRows.forEach(rightRow => {
          if (leftRows) {
            leftRows.forEach(leftRow => {
              const joinedRow: any = {};
              
              // Add left file data
              leftFile.headers.forEach(header => {
                if (header === leftJoinColumn) {
                  joinedRow[joinColumn] = leftRow[header];
                } else {
                  joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
                }
              });
              
              // Add right file data
              rightFile.headers.forEach(header => {
                if (header !== rightJoinColumn) {
                  joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
                }
              });
              
              joinedData.push(joinedRow);
            });
          } else {
            // No match in left table
            const joinedRow: any = {};
            
            // Add empty left file columns
            leftFile.headers.forEach(header => {
              if (header === leftJoinColumn) {
                joinedRow[joinColumn] = rightRow[rightJoinColumn];
              } else {
                joinedRow[`${leftPrefix}${header}`] = '';
              }
            });
            
            // Add right file data
            rightFile.headers.forEach(header => {
              if (header !== rightJoinColumn) {
                joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
              }
            });
            
            joinedData.push(joinedRow);
          }
        });
      });
    } else { // 'outer'
      // Outer join: all rows from both tables
      const allKeys = new Set<string>();
      leftLookup.forEach((_, key) => allKeys.add(key));
      rightLookup.forEach((_, key) => allKeys.add(key));
      
      allKeys.forEach(key => {
        const leftRows = leftLookup.get(key) || [];
        const rightRows = rightLookup.get(key) || [];
        
        if (leftRows.length > 0 && rightRows.length > 0) {
          // Matches in both
          leftRows.forEach(leftRow => {
            rightRows.forEach(rightRow => {
              const joinedRow: any = {};
              
              // Add left file data
              leftFile.headers.forEach(header => {
                if (header === leftJoinColumn) {
                  joinedRow[joinColumn] = leftRow[header];
                } else {
                  joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
                }
              });
              
              // Add right file data
              rightFile.headers.forEach(header => {
                if (header !== rightJoinColumn) {
                  joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
                }
              });
              
              joinedData.push(joinedRow);
            });
          });
        } else if (leftRows.length > 0) {
          // Only in left
          leftRows.forEach(leftRow => {
            const joinedRow: any = {};
            
            // Add left file data
            leftFile.headers.forEach(header => {
              if (header === leftJoinColumn) {
                joinedRow[joinColumn] = leftRow[header];
              } else {
                joinedRow[`${leftPrefix}${header}`] = leftRow[header] || '';
              }
            });
            
            // Add empty right file columns
            rightFile.headers.forEach(header => {
              if (header !== rightJoinColumn) {
                joinedRow[`${rightPrefix}${header}`] = '';
              }
            });
            
            joinedData.push(joinedRow);
          });
        } else {
          // Only in right
          rightRows.forEach(rightRow => {
            const joinedRow: any = {};
            
            // Add empty left file columns
            leftFile.headers.forEach(header => {
              if (header === leftJoinColumn) {
                joinedRow[joinColumn] = rightRow[rightJoinColumn];
              } else {
                joinedRow[`${leftPrefix}${header}`] = '';
              }
            });
            
            // Add right file data
            rightFile.headers.forEach(header => {
              if (header !== rightJoinColumn) {
                joinedRow[`${rightPrefix}${header}`] = rightRow[header] || '';
              }
            });
            
            joinedData.push(joinedRow);
          });
        }
      });
    }

    // Convert to CSV
    const csvContent = Papa.unparse(joinedData, {
      header: true
    });

    // Generate filename
    let filename = customDownloadName || `${joinType}-join-${joinColumn}.csv`;
    if (!filename.endsWith('.csv')) {
      filename += '.csv';
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error performing join:', error);
    return NextResponse.json({ 
      error: 'Failed to perform join operation' 
    }, { status: 500 });
  }
}