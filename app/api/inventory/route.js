import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const items = await query('SELECT * FROM inventory ORDER BY created_at DESC');
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Fetch Inventory Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
