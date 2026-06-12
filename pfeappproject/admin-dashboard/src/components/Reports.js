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
        headers: { Authorization: `Bearer ${token}` },
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
    const badgeStyles = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: '⏳ Pending' },
      accepted: { bg: '#D1FAE5', color: '#065F46', text: '✅ Accepted' },
      refused: { bg: '#FEE2E2', color: '#991B1B', text: '❌ Refused' },
    };
    const s = badgeStyles[status] || badgeStyles.pending;
    return (
      <span style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ padding: '0px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📋 Client Reports</h2>
          <p style={styles.subtitle}>Manage and respond to client reports</p>
        </div>
        <button onClick={fetchReports} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6B7280', marginTop: 12 }}>Loading reports...</p>
        </div>
      ) : (
        /* Table */
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Delivery Person</th>
                <th style={styles.th}>Order</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length > 0 ? reports.map((r) => (
                <tr
                  key={r._id}
                  style={styles.tableRow}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={styles.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                      {r.clientId?.substring(0, 8)}...
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                      {r.deliveryPersonId?.substring(0, 8)}...
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.orderBadge}>
                      #{r.orderId?.substring(0, 8)}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '500' }}>{r.reason}</td>
                  <td style={{ ...styles.td, maxWidth: '200px' }}>
                    <div style={styles.truncate}>
                      {r.description || 'N/A'}
                    </div>
                  </td>
                  <td style={styles.td}>{getStatusBadge(r.status)}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => acceptReport(r._id)} style={styles.acceptBtn}>
                            ✓ Accept
                          </button>
                          <button onClick={() => refuseReport(r._id)} style={styles.refuseBtn}>
                            ✕ Refuse
                          </button>
                        </>
                      )}
                      {r.status === 'accepted' && (
                        <span style={{ color: '#065F46', fontSize: '13px', fontWeight: '500' }}>
                          ✓ Chat opened
                        </span>
                      )}
                      {r.status === 'refused' && (
                        <span style={{ color: '#991B1B', fontSize: '13px', fontWeight: '500' }}>
                          ✕ Refused
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={styles.emptyState}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                    <p style={{ fontSize: '16px', margin: 0, color: '#1F2937', fontWeight: '600' }}>No reports found</p>
                    <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#9CA3AF' }}>Reports from clients will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#1F2937',
    fontWeight: '700',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6B7280',
    fontSize: '13px',
  },
  refreshBtn: {
    padding: '10px 20px',
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
  },
  errorBanner: {
    padding: '14px 18px',
    backgroundColor: '#FEE2E2',
    borderRadius: '12px',
    marginBottom: '16px',
    color: '#991B1B',
    fontSize: '14px',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    backgroundColor: 'white',
    borderRadius: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  tableWrapper: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    borderBottom: '2px solid #E5E7EB',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '12px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #F3F4F6',
    transition: 'background 0.2s',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#1F2937',
  },
  orderBadge: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#7C3AED',
    fontWeight: '600',
    backgroundColor: '#EDE9FE',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  acceptBtn: {
    background: '#10B981',
    color: 'white',
    border: 'none',
    padding: '7px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  refuseBtn: {
    background: '#F43F5E',
    color: 'white',
    border: 'none',
    padding: '7px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  emptyState: {
    padding: '60px',
    textAlign: 'center',
  },
};

export default Reports;