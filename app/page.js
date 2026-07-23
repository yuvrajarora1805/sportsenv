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
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setSubCategory(''); // Reset sub-category when category changes
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleAddCategory = async () => {
    const newCategory = prompt("Enter new Category name:");
    if (!newCategory || !newCategory.trim()) return;
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setCategory(newCategory.trim());
        setSubCategory('');
      }
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const handleAddSubCategory = async () => {
    if (!category) {
      alert("Please select a category first.");
      return;
    }
    const newSubCategory = prompt(`Enter new Sub Category for ${category}:`);
    if (!newSubCategory || !newSubCategory.trim()) return;
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subCategory: newSubCategory.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setSubCategory(newSubCategory.trim());
      }
    } catch (err) {
      alert("Failed to add sub category");
    }
  };


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
    if (!skuId || !category || !subCategory) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('sku_id', skuId);
    formData.append('category', category);
    formData.append('sub_category', subCategory);
    if (image) {
      formData.append('image', image);
    }

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/inventory/${editId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        if (!image) {
          alert('Please provide an image when adding a new item');
          setLoading(false);
          return;
        }
        res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
      }
      
      const data = await res.json();
      
      if (data.success) {
        alert(editId ? 'Item updated successfully!' : 'Item added successfully!');
        resetForm();
        fetchInventory(); // Refresh list
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSkuId('');
    setCategory('');
    setSubCategory('');
    setImage(null);
    setImagePreview('');
    setEditId(null);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setSkuId(item.sku_id);
    setCategory(item.category);
    setSubCategory(item.sub_category);
    setImagePreview(item.image_path);
    setImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchInventory();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting item');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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

  const renderForm = (isEdit = false) => (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>SKU ID</label>
        <input type="text" value={skuId} onChange={(e) => setSkuId(e.target.value)} placeholder="e.g. BAT-001" />
      </div>
      <div className="form-group">
        <label>Category</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={category} onChange={handleCategoryChange} required style={{ flex: 1 }}>
            <option value="" disabled>Select Category</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="button" onClick={handleAddCategory} className="btn-secondary" style={{ padding: '0 15px' }}>+</button>
        </div>
      </div>
      <div className="form-group">
        <label>Sub Category</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} required disabled={!category} style={{ flex: 1 }}>
            <option value="" disabled>Select Sub Category</option>
            {category && categories[category] && categories[category].map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <button type="button" onClick={handleAddSubCategory} disabled={!category} className="btn-secondary" style={{ padding: '0 15px' }}>+</button>
        </div>
      </div>
      <div className="form-group">
        <label>Product Image</label>
        <div 
          className={`upload-buttons drag-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc', 
            padding: '20px', 
            textAlign: 'center',
            borderRadius: '8px',
            marginBottom: '10px'
          }}
        >
          <p style={{ margin: '0 0 10px 0', color: '#666' }}>Drag and drop an image here, or</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <label>
              📷 Take Photo
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden-file-input" />
            </label>
            <label>
              🖼️ Gallery
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden-file-input" />
            </label>
          </div>
        </div>
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
          {loading ? 'Saving...' : (isEdit ? 'Update Item' : 'Add Item')}
        </button>
        {isEdit && (
          <button type="button" onClick={resetForm} className="btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  return (
    <main className="container">
      <header className="header">
        <h1>Sports Inventory System</h1>
        <p>Manage and export your sports equipment catalog</p>
      </header>

      <div className="layout">
        <section className="upload-section card">
          <h2>Add New Item</h2>
          {!editId && renderForm(false)}
        </section>

        {/* Edit Modal */}
        {editId && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="modal-content card" style={{
              backgroundColor: 'white', padding: '30px', borderRadius: '12px', 
              width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Edit Item</h2>
                <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>&times;</button>
              </div>
              {renderForm(true)}
            </div>
          </div>
        )}

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
                  <th>Actions</th>
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
                      <td data-label="Actions">
                        <button onClick={() => handleEdit(item)} className="btn-secondary" style={{ marginRight: '5px', padding: '5px 10px', fontSize: '0.8rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn-primary" style={{ backgroundColor: '#dc3545', padding: '5px 10px', fontSize: '0.8rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">No items found. Add one above!</td>
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
