
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This feature is not yet implemented' 
  }, { status: 501 });
}
