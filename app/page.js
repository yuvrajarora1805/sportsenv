"use client";

import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Image from 'next/image';

export default function Home() {
  const [skuId, setSkuId] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  const SPORTS_CATEGORIES = {
    'Cricket': ['Bats', 'Balls', 'Pads', 'Helmets', 'Gloves'],
    'Football': ['Balls', 'Boots', 'Shin Guards', 'Goalkeeper Gloves'],
    'Tennis': ['Rackets', 'Balls', 'Shoes'],
    'Basketball': ['Balls', 'Shoes', 'Hoops', 'Jerseys']
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubCategory(''); // Reset sub-category when category changes
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setInventory(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!skuId || !category || !subCategory || !image) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('sku_id', skuId);
    formData.append('category', category);
    formData.append('sub_category', subCategory);
    formData.append('image', image);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Item added successfully!');
        setSkuId('');
        setCategory('');
        setSubCategory('');
        setImage(null);
        setImagePreview('');
        fetchInventory(); // Refresh list
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Define columns
    worksheet.columns = [
      { header: 'Image', key: 'image', width: 20 },
      { header: 'ID', key: 'id', width: 15 },
      { header: 'SKU ID', key: 'sku_id', width: 20 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Sub Category', key: 'sub_category', width: 20 },
      { header: 'Added On', key: 'added_on', width: 25 },
    ];

    // Add rows and images
    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i];
      const rowIndex = i + 2; // Row 1 is header
      
      const row = worksheet.addRow({
        id: item.id,
        sku_id: item.sku_id,
        category: item.category,
        sub_category: item.sub_category,
        added_on: new Date(item.created_at).toLocaleString()
      });

      // Set row height so the image fits
      row.height = 80;

      if (item.image_path) {
        try {
          // Fetch the image from the server to embed it
          const response = await fetch(item.image_path);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();

          // Get image extension
          const ext = item.image_path.split('.').pop().toLowerCase();
          const format = ext === 'png' ? 'png' : ext === 'gif' ? 'gif' : 'jpeg';

          const imageId = workbook.addImage({
            buffer: arrayBuffer,
            extension: format,
          });

          // Add the image to the specific cell (Column A)
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowIndex - 1 }, // top-left (0-indexed)
            ext: { width: 100, height: 100 }
          });
        } catch (err) {
          console.error('Failed to embed image:', err);
        }
      }
    }

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'sports_inventory.xlsx');
  };

  return (
    <main className="container">
      <header className="header">
        <h1>Sports Inventory System</h1>
        <p>Manage and export your sports equipment catalog</p>
      </header>

      <div className="layout">
        <section className="upload-section card">
          <h2>Add New Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>SKU ID</label>
              <input type="text" value={skuId} onChange={(e) => setSkuId(e.target.value)} placeholder="e.g. BAT-001" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={handleCategoryChange} required>
                <option value="" disabled>Select Category</option>
                {Object.keys(SPORTS_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Sub Category</label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} required disabled={!category}>
                <option value="" disabled>Select Sub Category</option>
                {category && SPORTS_CATEGORIES[category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product Image</label>
              <div className="upload-buttons">
                <label>
                  📷 Take Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden-file-input" />
                </label>
                <label>
                  🖼️ Gallery
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden-file-input" />
                </label>
              </div>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Uploading...' : 'Add Item'}
            </button>
          </form>
        </section>

        <section className="inventory-section card">
          <div className="inventory-header">
            <h2>Current Inventory</h2>
            <button onClick={exportToExcel} className="btn-secondary" disabled={inventory.length === 0}>
              Export to Excel
            </button>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>SKU ID</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length > 0 ? (
                  inventory.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Image">
                        <div className="thumb-container">
                          <img src={item.image_path} alt={item.sku_id} className="thumb" />
                        </div>
                      </td>
                      <td data-label="SKU ID">{item.sku_id}</td>
                      <td data-label="Category">{item.category}</td>
                      <td data-label="Sub Category">{item.sub_category}</td>
                      <td data-label="Added On">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-state">No items found. Add one above!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
