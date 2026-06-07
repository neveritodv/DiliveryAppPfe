import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const BACKEND_URL = 'http://localhost:3001';

function DeliveryStaff() {
  const [staff, setStaff] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [removeAvatarOnSave, setRemoveAvatarOnSave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const token = localStorage.getItem('adminToken');

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/delivery-staff`, { headers: { Authorization: `Bearer ${token}` } });
      setStaff(res.data.payload || []);
    } catch (err) {
      showMessage('Failed to load staff', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
      setRemoveAvatarOnSave(false);
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setPreview('');
    if (editingItem && editingItem.avatar) {
      setRemoveAvatarOnSave(true);
    }
  };

  const uploadAvatar = async (staffId) => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      const res = await axios.post(`${API_URL}/admin/delivery-staff/${staffId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      return res.data.avatarUrl;
    } catch (err) {
      showMessage('Avatar upload failed', 'error');
      return null;
    }
  };

  const deleteAvatar = async (staffId) => {
    try {
      await axios.delete(`${API_URL}/admin/delivery-staff/${staffId}/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (err) {
      showMessage('Failed to remove avatar', 'error');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = null;
      if (editingItem) {
        if (removeAvatarOnSave) {
          await deleteAvatar(editingItem._id);
        } else if (avatarFile) {
          avatarUrl = await uploadAvatar(editingItem._id);
        }
      } else {
        const signupRes = await axios.post(`${API_URL}/auth/sign_up`, { ...form, role: 'delivery' });
        const newUserId = signupRes.data.payload.userId;
        if (avatarFile) {
          await uploadAvatar(newUserId);
        }
        showMessage('Staff added successfully', 'success');
        fetchStaff();
        closeModal();
        setLoading(false);
        return;
      }

      const payload = { name: form.name, mobile: form.mobile };
      if (form.password) payload.password = form.password;
      if (avatarUrl) payload.avatar = avatarUrl;

      await axios.put(`${API_URL}/admin/delivery-staff/${editingItem._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('Staff updated successfully', 'success');
      fetchStaff();
      closeModal();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Save failed', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/delivery-staff/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchStaff();
      setDeleteConfirm(null);
      showMessage('Staff deleted', 'success');
    } catch (err) {
      showMessage('Delete failed', 'error');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ name: item.name, email: item.email, password: '', mobile: item.mobile || '' });
      setPreview(item.avatar ? `${BACKEND_URL}${item.avatar}` : '');
    } else {
      setEditingItem(null);
      setForm({ name: '', email: '', password: '', mobile: '' });
      setPreview('');
    }
    setAvatarFile(null);
    setRemoveAvatarOnSave(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm({ name: '', email: '', password: '', mobile: '' });
    setPreview('');
    setAvatarFile(null);
    setRemoveAvatarOnSave(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={styles.headerBar}>
        <h2>Delivery Staff</h2>
        <button onClick={() => openModal()} style={styles.addBtn}>+ Add Staff</button>
      </div>

      {message.text && (
        <div style={{ ...styles.message, backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24' }}>
          {message.text}
        </div>
      )}

      <div style={styles.grid}>
        {staff.map(s => (
          <div key={s._id} style={styles.card}>
            <div style={styles.avatarWrapper}>
              <img
                src={s.avatar ? `${BACKEND_URL}${s.avatar}` : `${BACKEND_URL}/uploads/user.png`}
                alt={s.name}
                style={styles.avatar}
                onError={(e) => e.target.src = `${BACKEND_URL}/uploads/user.png`}
              />
            </div>
            <div style={styles.cardInfo}>
              <div><strong>{s.name}</strong></div>
              <div style={{ fontSize: 12, color: '#7C7D7E' }}>{s.email}</div>
              <div style={{ fontSize: 12, color: '#7C7D7E' }}>{s.mobile || '-'}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ ...styles.statusBadge, backgroundColor: s.isAvailable ? '#28a745' : '#dc3545' }}>
                  {s.isAvailable ? 'Available' : 'Offline'}
                </span>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button onClick={() => openModal(s)} style={styles.editBtn}>Edit</button>
              <button onClick={() => setDeleteConfirm(s)} style={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
        {staff.length === 0 && <div style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>No delivery staff found</div>}
      </div>

      {/* Modal for Add/Edit */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>{editingItem ? 'Edit Staff' : 'Add Staff'}</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.imageUploadArea}>
                <label style={styles.label}>Profile Photo</label>
                <div style={styles.imageInputWrapper}>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={styles.fileInput} id="staff-avatar" />
                  <label htmlFor="staff-avatar" style={styles.fileLabel}>Choose Image</label>
                </div>
                {preview && (
                  <div style={styles.previewContainer}>
                    <img src={preview} alt="Preview" style={styles.previewImage} />
                    <button type="button" onClick={clearAvatar} style={styles.clearBtn}>✖</button>
                  </div>
                )}
              </div>
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={styles.input} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={!!editingItem} style={styles.input} />
              <input placeholder="Password (leave blank to keep unchanged)" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={styles.input} />
              <input placeholder="Mobile Number" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} style={styles.input} />
              <div style={styles.modalButtons}>
                <button type="submit" disabled={loading} style={styles.saveBtn}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>Cancel</button>
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
            <p>Delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.</p>
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
  headerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: { backgroundColor: '#FC6011', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 24, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  message: { padding: '10px', borderRadius: 8, marginBottom: 20, textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  avatarWrapper: { display: 'flex', justifyContent: 'center', paddingTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #FC6011' },
  cardInfo: { padding: 16, textAlign: 'center' },
  statusBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, color: 'white', fontSize: 12 },
  cardActions: { padding: '12px 16px', display: 'flex', gap: 12, justifyContent: 'center', borderTop: '1px solid #f0f0f0' },
  editBtn: { backgroundColor: '#4A4B4D', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  deleteBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: 24, padding: 28, width: 550, maxWidth: '90%', maxHeight: '90%', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  modalSmall: { background: 'white', borderRadius: 24, padding: 28, width: 380, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  input: { width: '100%', padding: 12, borderRadius: 28, border: '1px solid #e0e0e0', fontSize: 14 },
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

export default DeliveryStaff;