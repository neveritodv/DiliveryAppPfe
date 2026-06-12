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
      const res = await axios.get(`${API_URL}/admin/delivery-staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        const signupRes = await axios.post(`${API_URL}/auth/sign_up`, {
          ...form,
          role: 'delivery',
        });
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

      await axios.put(`${API_URL}/admin/delivery-staff/${editingItem._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await axios.delete(`${API_URL}/admin/delivery-staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        <h2 style={styles.pageTitle}>🚗 Delivery Staff</h2>
        <button onClick={() => openModal()} style={styles.addBtn}>+ Add Staff</button>
      </div>

      {message.text && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
          }}
        >
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
              <div style={styles.staffName}>{s.name}</div>
              <div style={styles.staffEmail}>{s.email}</div>
              <div style={styles.staffMobile}>{s.mobile || '-'}</div>
              <div style={{ marginTop: 10 }}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: s.isAvailable ? '#10B981' : '#F43F5E',
                  }}
                >
                  {s.isAvailable ? '🟢 Available' : '🔴 Offline'}
                </span>
              </div>
            </div>
            <div style={styles.cardActions}>
              <button onClick={() => openModal(s)} style={styles.editBtn}>Edit</button>
              <button onClick={() => setDeleteConfirm(s)} style={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, gridColumn: '1 / -1', color: '#6B7280' }}>
            No delivery staff found
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{editingItem ? 'Edit Staff' : 'Add New Staff'}</h3>
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
                <button type="submit" disabled={loading} style={styles.saveBtn}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
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
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  addBtn: {
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
    transition: 'all 0.2s',
  },
  message: {
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  avatarWrapper: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #7C3AED',
  },
  cardInfo: {
    padding: '12px 20px',
    textAlign: 'center',
  },
  staffName: {
    fontWeight: '700',
    fontSize: '16px',
    color: '#1F2937',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: 2,
  },
  staffMobile: {
    fontSize: '13px',
    color: '#6B7280',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: 20,
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardActions: {
    padding: '12px 16px',
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    borderTop: '1px solid #F3F4F6',
    background: '#FAFAFA',
  },
  editBtn: {
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    padding: '7px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: '#F43F5E',
    color: 'white',
    border: 'none',
    padding: '7px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'white',
    borderRadius: 24,
    padding: 28,
    width: 520,
    maxWidth: '90%',
    maxHeight: '90%',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(124, 58, 237, 0.2)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalSmall: {
    background: 'white',
    borderRadius: 20,
    padding: 28,
    width: 380,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: 6,
    color: '#1F2937',
  },
  imageUploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  imageInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  fileInput: {
    display: 'none',
  },
  fileLabel: {
    backgroundColor: '#F3F4F6',
    padding: '10px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    width: 90,
    marginTop: 8,
  },
  previewImage: {
    width: 90,
    height: 90,
    objectFit: 'cover',
    borderRadius: 12,
    border: '2px solid #E5E7EB',
  },
  clearBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    background: '#F43F5E',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtons: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default DeliveryStaff;