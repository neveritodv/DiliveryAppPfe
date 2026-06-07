import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/reports/admin/all`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.status === '1') {
        setReports(res.data.payload || []);
      } else {
        setError(res.data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptReport = async (reportId) => {
    try {
      const res = await axios.patch(
        `${API_URL}/reports/admin/${reportId}/accept`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === '1') {
        if (res.data.chatId) {
          window.open(`/chat?chatId=${res.data.chatId}`, '_blank');
        }
        fetchReports();
      } else {
        alert(res.data.message || 'Failed to accept');
      }
    } catch (err) {
      alert('Error accepting report');
      console.error(err);
    }
  };

  const refuseReport = async (reportId) => {
    try {
      await axios.patch(
        `${API_URL}/reports/admin/${reportId}/refuse`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchReports();
    } catch (err) {
      alert('Error refusing report');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#FFF3CD', color: '#856404', text: 'Pending' },
      accepted: { bg: '#D4EDDA', color: '#155724', text: 'Accepted' },
      refused: { bg: '#F8D7DA', color: '#721C24', text: 'Refused' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {s.text}
      </span>
    );
  };

  // ✅ FIXED: Always render hooks at the top level, conditional rendering below
  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1F2937' }}>Client Reports</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '14px' }}>
            Manage and respond to client reports
          </p>
        </div>
        <button 
          onClick={fetchReports}
          style={{
            padding: '8px 16px',
            backgroundColor: '#7C3AED',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#FEE2E2',
          borderRadius: '12px',
          marginBottom: '16px',
          color: '#991B1B',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '60px',
          backgroundColor: 'white',
          borderRadius: '16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #E5E7EB',
              borderTopColor: '#7C3AED',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ color: '#6B7280' }}>Loading reports...</p>
          </div>
        </div>
      ) : (
        /* Table */
        <div style={{ 
          overflowX: 'auto', 
          background: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#F9FAFB', 
                borderBottom: '2px solid #E5E7EB' 
              }}>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Delivery Person</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? reports.map((r) => (
                <tr key={r._id} style={{ 
                  borderBottom: '1px solid #F3F4F6',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                      {r.clientId?.substring(0, 8)}...
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                      {r.deliveryPersonId?.substring(0, 8)}...
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#7C3AED' }}>
                      #{r.orderId?.substring(0, 8)}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '500' }}>{r.reason}</td>
                  <td style={{ ...tdStyle, maxWidth: '200px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                    }}>
                      {r.description || 'N/A'}
                    </div>
                  </td>
                  <td style={tdStyle}>{getStatusBadge(r.status)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {r.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => acceptReport(r._id)}
                            style={acceptBtnStyle}
                          >
                            ✓ Accept
                          </button>
                          <button 
                            onClick={() => refuseReport(r._id)}
                            style={refuseBtnStyle}
                          >
                            ✕ Refuse
                          </button>
                        </>
                      )}
                      {r.status === 'accepted' && (
                        <span style={{ color: '#155724', fontSize: '13px', fontWeight: '500' }}>
                          ✓ Chat opened
                        </span>
                      )}
                      {r.status === 'refused' && (
                        <span style={{ color: '#721C24', fontSize: '13px', fontWeight: '500' }}>
                          ✕ Refused
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ 
                    padding: '60px', 
                    textAlign: 'center',
                    color: '#9CA3AF',
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                    <p style={{ fontSize: '16px', margin: 0 }}>No reports found</p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Reports from clients will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Style constants
const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '12px',
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#1F2937',
};

const acceptBtnStyle = {
  background: '#10B981',
  color: 'white',
  border: 'none',
  padding: '6px 14px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.2s',
};

const refuseBtnStyle = {
  background: '#EF4444',
  color: 'white',
  border: 'none',
  padding: '6px 14px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  transition: 'all 0.2s',
};

export default Reports;