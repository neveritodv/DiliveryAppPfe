import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
let socket;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    socket = io('http://localhost:3001', { auth: { token } });
    socket.on('new-order', (order) => setOrders(prev => [order, ...prev]));
    socket.on('order-status-updated', (updated) => {
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
    });

    fetchOrders();

    return () => socket.disconnect();
  }, []);

  const fetchOrders = async () => {
    const res = await axios.get(`${API_URL}/admin/orders/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setOrders(res.data.payload || []);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case 'accepted': return { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' };
      case 'picked_up': return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' };
      case 'on_the_way': return { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1' };
      case 'delivered': return { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' };
      case 'cancelled': return { bg: '#FEE2E2', text: '#991B1B', dot: '#F43F5E' };
      default: return { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' };
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const statusFilters = ['all', 'pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📦 Live Orders</h2>
          <p style={styles.subtitle}>{orders.length} total orders</p>
        </div>
        <div style={styles.filterRow}>
          {statusFilters.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === status ? '#7C3AED' : '#F3F4F6',
                color: filter === status ? 'white' : '#6B7280',
                fontWeight: filter === status ? '600' : '400',
              }}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Order ID</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Delivery Person</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const statusStyle = getStatusColor(order.status);
              return (
                <tr key={order._id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <span style={styles.orderId}>#{order._id.slice(-6)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.clientInfo}>
                      <div style={styles.clientAvatar}>
                        {(order.clientId?.name || 'N')[0]}
                      </div>
                      <span>{order.clientId?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>${(order.total || 0).toFixed(2)}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: statusStyle.dot,
                      }} />
                      {order.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.clientInfo}>
                      <div style={{ ...styles.clientAvatar, backgroundColor: '#E5E7EB', color: '#6B7280' }}>
                        {(order.deliveryPersonId?.name || 'N')[0]}
                      </div>
                      <span>{order.deliveryPersonId?.name || 'Not assigned'}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.date}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📭</div>
                  <div style={styles.emptyText}>No orders found</div>
                  <div style={styles.emptySubtext}>Orders will appear here in real-time</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards" style={styles.mobileCards}>
        {filteredOrders.map(order => {
          const statusStyle = getStatusColor(order.status);
          return (
            <div key={order._id} style={styles.mobileCard}>
              <div style={styles.mobileCardHeader}>
                <span style={styles.orderId}>#{order._id.slice(-6)}</span>
                <span style={{
                  ...styles.mobileStatus,
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                }}>
                  {order.status?.replace('_', ' ')}
                </span>
              </div>
              <div style={styles.mobileCardBody}>
                <div style={styles.mobileRow}>
                  <span style={styles.mobileLabel}>Client</span>
                  <span>{order.clientId?.name || 'N/A'}</span>
                </div>
                <div style={styles.mobileRow}>
                  <span style={styles.mobileLabel}>Total</span>
                  <span style={styles.price}>${(order.total || 0).toFixed(2)}</span>
                </div>
                <div style={styles.mobileRow}>
                  <span style={styles.mobileLabel}>Delivery</span>
                  <span>{order.deliveryPersonId?.name || 'Not assigned'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          table { display: none; }
          .mobile-cards { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    padding: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    color: '#1F2937',
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    color: '#6B7280',
    margin: '4px 0 0',
    fontSize: '13px',
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
    textTransform: 'capitalize',
  },
  tableWrapper: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: 16,
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
  orderId: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#7C3AED',
    fontSize: '13px',
  },
  clientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  clientAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '13px',
  },
  price: {
    fontWeight: '700',
    color: '#1F2937',
  },
  date: {
    color: '#9CA3AF',
    fontSize: '13px',
  },
  emptyState: {
    padding: '60px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: '13px',
    color: '#9CA3AF',
  },
  mobileCards: {
    display: 'none',
    gap: 16,
    flexDirection: 'column',
    marginTop: 16,
  },
  mobileCard: {
    background: 'white',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mobileStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  mobileCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mobileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#1F2937',
  },
  mobileLabel: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
};

export default Orders;