import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    // Get the item first to find its image path
    const items = await query('SELECT image_path FROM inventory WHERE id = ?', [id]);
    
    if (items.length > 0) {
      const item = items[0];
      // Try to delete the file
      if (item.image_path) {
        const filename = item.image_path.split('/').pop();
        const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete from database
    await query('DELETE FROM inventory WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const sku_id = formData.get('sku_id');
    const category = formData.get('category');
    const sub_category = formData.get('sub_category');
    const image = formData.get('image'); // Optional when editing

    if (!id || !sku_id || !category || !sub_category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let queryStr = 'UPDATE inventory SET sku_id = ?, category = ?, sub_category = ?';
    let queryParams = [sku_id, category, sub_category];

    // Handle new image upload if provided
    if (image && typeof image !== 'string') {
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

      queryStr += ', image_path = ?';
      queryParams.push(image_path);
    }

    queryStr += ' WHERE id = ?';
    queryParams.push(id);

    await query(queryStr, queryParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
