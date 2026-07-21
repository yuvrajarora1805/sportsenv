import { NextResponse } from 'next/server';
import { getInventory } from '@/lib/db';

export async function GET() {
  try {
    const items = getInventory();
    
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Fetch Inventory Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
