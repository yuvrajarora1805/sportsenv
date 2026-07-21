import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { addInventoryItem } from '@/lib/db';

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const sku_id = formData.get('sku_id');
    const category = formData.get('category');
    const sub_category = formData.get('sub_category');
    const image = formData.get('image');

    if (!sku_id || !category || !sub_category || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save image to public/uploads
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${image.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    const image_path = `/uploads/${uniqueFilename}`;

    // Insert into database
    const newItem = addInventoryItem({
      sku_id,
      category,
      sub_category,
      image_path
    });

    return NextResponse.json({ success: true, id: newItem.id, image_path });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
