import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query('SELECT category, sub_category FROM categories');
    
    // Transform rows into { "Category": ["Sub1", "Sub2"] }
    const categoriesObj = {};
    rows.forEach(row => {
      if (!categoriesObj[row.category]) {
        categoriesObj[row.category] = [];
      }
      if (row.sub_category && !categoriesObj[row.category].includes(row.sub_category)) {
        categoriesObj[row.category].push(row.sub_category);
      }
    });

    // If empty (first time run), insert default categories
    if (Object.keys(categoriesObj).length === 0) {
      const defaultCategories = {
        "Cricket": ["Bats", "Balls", "Pads", "Helmets", "Gloves"],
        "Football": ["Balls", "Boots", "Shin Guards", "Goalkeeper Gloves"],
        "Tennis": ["Rackets", "Balls", "Shoes"],
        "Basketball": ["Balls", "Shoes", "Hoops", "Jerseys"]
      };
      
      for (const cat of Object.keys(defaultCategories)) {
        categoriesObj[cat] = [];
        for (const sub of defaultCategories[cat]) {
          await query('INSERT INTO categories (category, sub_category) VALUES (?, ?)', [cat, sub]);
          categoriesObj[cat].push(sub);
        }
      }
    }

    return NextResponse.json({ success: true, categories: categoriesObj });
  } catch (error) {
    console.error('Error reading categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to read categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, subCategory } = body;
    
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }

    if (subCategory) {
      // Check if this subcategory already exists
      const existing = await query('SELECT id FROM categories WHERE category = ? AND sub_category = ?', [category, subCategory]);
      if (existing.length === 0) {
        await query('INSERT INTO categories (category, sub_category) VALUES (?, ?)', [category, subCategory]);
      }
    } else {
      // Check if category exists
      const existing = await query('SELECT id FROM categories WHERE category = ? LIMIT 1', [category]);
      if (existing.length === 0) {
        await query('INSERT INTO categories (category, sub_category) VALUES (?, NULL)', [category]);
      }
    }

    // Fetch updated list to return
    const rows = await query('SELECT category, sub_category FROM categories');
    const categoriesObj = {};
    rows.forEach(row => {
      if (!categoriesObj[row.category]) {
        categoriesObj[row.category] = [];
      }
      if (row.sub_category && !categoriesObj[row.category].includes(row.sub_category)) {
        categoriesObj[row.category].push(row.sub_category);
      }
    });

    return NextResponse.json({ success: true, categories: categoriesObj });
  } catch (error) {
    console.error('Error updating categories:', error);
    return NextResponse.json({ success: false, error: 'Failed to update categories' }, { status: 500 });
  }
}
