import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const BACKEND_URL = 'http://localhost:3001';

const getImageUrl = (image) => {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  if (image.startsWith('assets/')) return `${BACKEND_URL}/${image}`;
  if (image.startsWith('/uploads')) return `${BACKEND_URL}${image}`;
  return `${BACKEND_URL}${image}`;
};

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', image: '', rating: 0, foodType: '', address: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/restaurants`, { headers: { Authorization: `Bearer ${token}` } });
      setRestaurants(res.data.payload || []);
    } catch (err) { showMessage('Failed to load restaurants', 'error'); }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const clearImage = () => { setImageFile(null); setPreview(''); };

  const uploadImage = async () => {
    if (!imageFile) return form.image;
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await axios.post(`${API_URL}/upload-image`, formData, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = form.image;
      if (imageFile) imageUrl = await uploadImage();
      const payload = { ...form, image: imageUrl, rating: parseFloat(form.rating) || 0 };
      if (editingItem) {
        await axios.put(`${API_URL}/admin/restaurants/${editingItem._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('Restaurant updated', 'success');
      } else {
        await axios.post(`${API_URL}/admin/restaurants`, payload, { headers: { Authorization: `Bearer ${token}` } });
        showMessage('Restaurant added', 'success');
      }
      fetchRestaurants();
      closeModal();
    } catch (err) { showMessage('Save failed', 'error'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/restaurants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRestaurants();
      setDeleteConfirm(null);
      showMessage('Restaurant deleted', 'success');
    } catch (err) { showMessage('Delete failed', 'error'); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item, rating: item.rating || 0 });
      setPreview(getImageUrl(item.image));
    } else {
      setEditingItem(null);
      setForm({ name: '', image: '', rating: 0, foodType: '', address: '' });
      setPreview('');
    }
    setImageFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm({ name: '', image: '', rating: 0, foodType: '', address: '' });
    setPreview('');
    setImageFile(null);
  };

  return (
    <div style={{ padding: 0 }}>
      <div style={styles.headerBar}>
        <div>
          <h2 style={styles.pageTitle}>🍽️ Restaurants</h2>
          <p style={styles.pageSubtitle}>{restaurants.length} restaurants</p>
        </div>
        <button onClick={() => openModal()} style={styles.addBtn}>+ Add Restaurant</button>
      </div>

      {message.text && (
        <div style={{ ...styles.message, backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: message.type === 'success' ? '#065F46' : '#991B1B' }}>
          {message.text}
        </div>
      )}

      <div style={styles.grid}>
        {restaurants.map((r) => (
          <div key={r._id} style={styles.card}>
            <div style={styles.imageWrapper}>
              <img src={getImageUrl(r.image)} alt={r.name} style={styles.cardImage} onError={(e) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;...'; }} />
              <span style={styles.ratingBadge}>⭐ {r.rating || 0}</span>
            </div>
            <div style={styles.cardInfo}>
              <div style={styles.restaurantName}>{r.name}</div>
              <div style={styles.restaurantType}>{r.foodType || 'Various'}</div>
              <div style={styles.restaurantAddress}>📍 {r.address || 'No address'}</div>
            </div>
            <div style={styles.cardActions}>
              <button onClick={() => openModal(r)} style={styles.editBtn}>✏️ Edit</button>
              <button onClick={() => setDeleteConfirm(r)} style={styles.deleteBtn}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{editingItem ? '✏️ Edit Restaurant' : '➕ New Restaurant'}</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input placeholder="Restaurant Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={styles.input} />
              <div style={styles.imageUploadArea}>
                <label style={styles.label}>📸 Restaurant Image</label>
                <div style={styles.imageInputWrapper}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} id="restaurant-image" />
                  <label htmlFor="restaurant-image" style={styles.fileLabel}>Choose Image</label>
                </div>
                {preview && (
                  <div style={styles.previewContainer}>
                    <img src={preview} alt="Preview" style={styles.previewImage} />
                    <button type="button" onClick={clearImage} style={styles.clearBtn}>✖</button>
                  </div>
                )}
              </div>
              <input type="number" step="0.1" placeholder="Rating (0-5)" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} style={styles.input} />
              <input placeholder="Food Type" value={form.foodType} onChange={e => setForm({...form, foodType: e.target.value})} style={styles.input} />
              <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={styles.input} />
              <div style={styles.modalButtons}>
                <button type="submit" disabled={loading} style={styles.saveBtn}>{loading ? 'Saving...' : '💾 Save'}</button>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalSmall}>
            <h3>🗑️ Confirm Delete</h3>
            <p>Delete <strong>{deleteConfirm.name}</strong>?</p>
            <div style={styles.modalButtons}>
              <button onClick={() => handleDelete(deleteConfirm._id)} style={styles.deleteBtn}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)} style={styles.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  headerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 },
  pageSubtitle: { color: '#6B7280', fontSize: '13px', margin: '4px 0 0' },
  addBtn: { backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: '600', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' },
  message: { padding: '12px 16px', borderRadius: 12, marginBottom: 20, textAlign: 'center', fontWeight: '500', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  imageWrapper: { position: 'relative' },
  cardImage: { width: '100%', height: 160, objectFit: 'cover' },
  ratingBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '5px 12px', borderRadius: 10, fontSize: '12px', fontWeight: '600' },
  cardInfo: { padding: 16 },
  restaurantName: { fontWeight: '700', fontSize: '16px', color: '#1F2937', marginBottom: 4 },
  restaurantType: { fontSize: '13px', color: '#7C3AED', fontWeight: '500', marginBottom: 4 },
  restaurantAddress: { fontSize: '12px', color: '#6B7280' },
  cardActions: { padding: '12px 16px', display: 'flex', gap: 10, justifyContent: 'center', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' },
  editBtn: { backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '7px 18px', borderRadius: 10, cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  deleteBtn: { backgroundColor: '#F43F5E', color: 'white', border: 'none', padding: '7px 18px', borderRadius: 10, cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 24, padding: 28, width: 550, maxWidth: '90%', maxHeight: '90%', overflowY: 'auto', boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)' },
  modalTitle: { fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  modalSmall: { background: 'white', borderRadius: 20, padding: 28, width: 380, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: '14px', color: '#1F2937', backgroundColor: '#F9FAFB', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '14px', fontWeight: '600', marginBottom: 6, color: '#1F2937' },
  imageUploadArea: { display: 'flex', flexDirection: 'column', gap: 8 },
  imageInputWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
  fileInput: { display: 'none' },
  fileLabel: { backgroundColor: '#F3F4F6', padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: '13px', color: '#6B7280', fontWeight: '500' },
  previewContainer: { position: 'relative', width: 90, marginTop: 8 },
  previewImage: { width: 90, height: 90, objectFit: 'cover', borderRadius: 12, border: '2px solid #E5E7EB' },
  clearBtn: { position: 'absolute', top: -8, right: -8, background: '#F43F5E', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalButtons: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  saveBtn: { backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' },
  cancelBtn: { backgroundColor: '#F3F4F6', color: '#1F2937', border: 'none', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
};

export default Restaurants;