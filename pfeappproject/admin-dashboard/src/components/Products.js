import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const BACKEND_URL = 'http://localhost:3001';

// Helper to build the correct image URL
const getImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('assets/')) return `${BACKEND_URL}/${image}`;
  if (image.startsWith('/uploads')) return `${BACKEND_URL}${image}`;
  return `${BACKEND_URL}${image}`;
};

function Products() {
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'food',
    restaurantId: '',
    stock: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchProducts();
    axios
      .get(`${API_URL}/admin/restaurants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRestaurants(res.data.payload || []));
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.payload || []);
    } catch (err) {
      showMessage('Failed to load products', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setPreview('');
  };

  const uploadImage = async () => {
    if (!imageFile) return form.image;
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await axios.post(`${API_URL}/upload-image`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = form.image;
      if (imageFile) imageUrl = await uploadImage();
      const payload = {
        ...form,
        image: imageUrl,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
      };
      if (editingItem) {
        await axios.put(`${API_URL}/admin/products/${editingItem._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage('Product updated', 'success');
      } else {
        await axios.post(`${API_URL}/admin/products`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showMessage('Product added', 'success');
      }
      fetchProducts();
      closeModal();
    } catch (err) {
      showMessage('Save failed', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      setDeleteConfirm(null);
      showMessage('Product deleted', 'success');
    } catch (err) {
      showMessage('Delete failed', 'error');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item, price: item.price || 0, stock: item.stock || 0 });
      // ✅ Use helper so preview shows correct full URL
      setPreview(getImageUrl(item.image));
    } else {
      setEditingItem(null);
      setForm({
        name: '',
        description: '',
        price: 0,
        image: '',
        category: 'food',
        restaurantId: '',
        stock: 0,
      });
      setPreview('');
    }
    setImageFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm({
      name: '',
      description: '',
      price: 0,
      image: '',
      category: 'food',
      restaurantId: '',
      stock: 0,
    });
    setPreview('');
    setImageFile(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={styles.headerBar}>
        <h2>Products</h2>
        <button onClick={() => openModal()} style={styles.addBtn}>
          + Add Product
        </button>
      </div>

      {message.text && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={styles.grid}>
        {products.map((p) => (
          <div key={p._id} style={styles.card}>
            <img
              src={getImageUrl(p.image)}
              alt={p.name}
              style={styles.cardImage}
              onError={(e) => {
                e.target.onerror = null; // stop infinite loop
                e.target.src =
                  'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"><rect fill="%23f0f0f0" width="300" height="150"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="16" font-family="Arial">No Image</text></svg>';
              }}
            />
            <div style={styles.cardInfo}>
              <div>
                <strong>{p.name}</strong> – ${p.price || 0}
              </div>
              <div>{p.category === 'food' ? '🍔 Food' : '🎁 CAN'}</div>
              <div>Stock: {p.stock || 0}</div>
            </div>
            <div style={styles.cardActions}>
              <button onClick={() => openModal(p)} style={styles.editBtn}>
                Edit
              </button>
              <button onClick={() => setDeleteConfirm(p)} style={styles.deleteBtn}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>
            No products found
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>{editingItem ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={styles.input}
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={styles.textarea}
                rows={2}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                style={styles.input}
              />
              <div style={styles.imageUploadArea}>
                <label style={styles.label}>Product Image</label>
                <div style={styles.imageInputWrapper}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.fileInput}
                    id="product-image"
                  />
                  <label htmlFor="product-image" style={styles.fileLabel}>
                    Choose Image
                  </label>
                </div>
                {preview && (
                  <div style={styles.previewContainer}>
                    <img src={preview} alt="Preview" style={styles.previewImage} />
                    <button type="button" onClick={clearImage} style={styles.clearBtn}>
                      ✖
                    </button>
                  </div>
                )}
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={styles.input}
              >
                <option value="food">Food</option>
                <option value="can">CAN (Merchandise)</option>
              </select>
              {form.category === 'food' && (
                <select
                  value={form.restaurantId}
                  onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                style={styles.input}
              />
              <div style={styles.modalButtons}>
                <button type="submit" disabled={loading} style={styles.saveBtn}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalSmall}>
            <h3>Confirm Delete</h3>
            <p>
              Delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={styles.modalButtons}>
              <button onClick={() => handleDelete(deleteConfirm._id)} style={styles.deleteBtn}>
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: { backgroundColor: '#FC6011', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 24, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  message: { padding: '10px', borderRadius: 8, marginBottom: 20, textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  cardImage: { width: '100%', height: 150, objectFit: 'cover' },
  cardInfo: { padding: 16 },
  cardActions: { padding: '12px 16px', display: 'flex', gap: 12, justifyContent: 'center', borderTop: '1px solid #f0f0f0' },
  editBtn: { backgroundColor: '#4A4B4D', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  deleteBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 24, padding: 28, width: 550, maxWidth: '90%', maxHeight: '90%', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  modalSmall: { background: 'white', borderRadius: 24, padding: 28, width: 380, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  input: { width: '100%', padding: 12, borderRadius: 28, border: '1px solid #e0e0e0', fontSize: 14 },
  textarea: { width: '100%', padding: 12, borderRadius: 20, border: '1px solid #e0e0e0', fontSize: 14, resize: 'vertical' },
  label: { fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#4A4B4D' },
  imageUploadArea: { display: 'flex', flexDirection: 'column', gap: 8 },
  imageInputWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
  fileInput: { display: 'none' },
  fileLabel: { backgroundColor: '#f0f0f0', padding: '10px 16px', borderRadius: 28, cursor: 'pointer', fontSize: 14, color: '#4A4B4D' },
  previewContainer: { position: 'relative', width: 100, marginTop: 8 },
  previewImage: { width: 100, height: 100, objectFit: 'cover', borderRadius: 12, border: '1px solid #e0e0e0' },
  clearBtn: { position: 'absolute', top: -8, right: -8, background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalButtons: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  saveBtn: { backgroundColor: '#FC6011', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 28, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  cancelBtn: { backgroundColor: '#f0f0f0', color: '#4A4B4D', border: 'none', padding: '10px 20px', borderRadius: 28, cursor: 'pointer', fontSize: 14 },
};

export default Products;