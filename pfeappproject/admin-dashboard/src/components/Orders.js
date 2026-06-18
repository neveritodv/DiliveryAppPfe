import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
let socket;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [exporting, setExporting] = useState(false);
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

  const filterByDate = (order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    switch (dateFilter) {
      case 'today': return orderDate.toDateString() === now.toDateString();
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate.toDateString() === yesterday.toDateString();
      }
      case 'this_week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return orderDate >= startOfWeek;
      }
      case 'this_month': return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      case 'this_year': return orderDate.getFullYear() === now.getFullYear();
      case 'last_month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
      }
      default: return true;
    }
  };

  const filteredOrders = orders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const dateMatch = dateFilter === 'all' || filterByDate(order);
    return statusMatch && dateMatch;
  });

  const statusFilters = ['all', 'pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
  ];

  const getDateFilterLabel = () => dateFilters.find(f => f.value === dateFilter)?.label || 'All Time';

  const handlePrint = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  return (
    <div style={styles.container} className="orders-page">
      {/* ====== SCREEN HEADER (Hidden when printing) ====== */}
      <div style={styles.header} className="no-print">
        <div>
          <h2 style={styles.title}>📦 Live Orders</h2>
          <p style={styles.subtitle}>{filteredOrders.length} orders found</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={styles.filterRow}>
            {dateFilters.map(f => (
              <button key={f.value} onClick={() => setDateFilter(f.value)} style={{
                ...styles.filterBtn,
                backgroundColor: dateFilter === f.value ? '#7C3AED' : '#F3F4F6',
                color: dateFilter === f.value ? 'white' : '#6B7280',
                fontWeight: dateFilter === f.value ? '600' : '400',
              }}>{f.label}</button>
            ))}
          </div>
          <div style={styles.filterRow}>
            {statusFilters.map(status => (
              <button key={status} onClick={() => setStatusFilter(status)} style={{
                ...styles.filterBtn,
                backgroundColor: statusFilter === status ? '#7C3AED' : '#F3F4F6',
                color: statusFilter === status ? 'white' : '#6B7280',
                fontWeight: statusFilter === status ? '600' : '400',
              }}>{status === 'all' ? 'All' : status.replace('_', ' ')}</button>
            ))}
          </div>
          <button onClick={handlePrint} style={styles.printBtn} disabled={exporting}>
            🖨️ {exporting ? 'Printing...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* ====== PRINT HEADER with LOGO ====== */}
      <div className="print-only" style={styles.printHeader}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 15 }}>
          <img src="/new.png" alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          <div>
            <h1 style={styles.printTitle}>RACINE DELIVERY</h1>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>Fast • Fresh • Reliable</p>
          </div>
        </div>
        <div style={{ borderTop: '2px solid #7C3AED', paddingTop: 12, marginTop: 5 }}>
          <p style={styles.printSubtitle}><strong>Orders Report</strong></p>
          <p style={styles.printSubtitle}>
            Period: <strong>{getDateFilterLabel()}</strong> | 
            Status: <strong>{statusFilter === 'all' ? 'All' : statusFilter.replace('_', ' ')}</strong> | 
            Total: <strong>{filteredOrders.length} orders</strong>
          </p>
          <p style={styles.printSubtitle}>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* ====== ORDERS TABLE ====== */}
      <div style={styles.tableWrapper} className="desktop-table">
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
            {filteredOrders.length > 0 ? filteredOrders.map(order => {
              const statusStyle = getStatusColor(order.status);
              return (
                <tr key={order._id} style={styles.tableRow}>
                  <td style={styles.td}><span style={styles.orderId}>#{order._id.slice(-6)}</span></td>
                  <td style={styles.td}>{order.clientId?.name || 'N/A'}</td>
                  <td style={styles.td}><span style={styles.price}>${(order.total || 0).toFixed(2)}</span></td>
                  <td style={styles.td}>
                    <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: statusStyle.dot, marginRight: 6 }} />{order.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>{order.deliveryPersonId?.name || 'Not assigned'}</td>
                  <td style={styles.td}><span style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span></td>
                </tr>
              );
            }) : (
              <tr><td colSpan="6" style={styles.emptyState}><div style={styles.emptyIcon}>📭</div><div style={styles.emptyText}>No orders found</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== PRINT FOOTER ====== */}
      <div className="print-only" style={styles.printFooter}>
        <p>RACINE DELIVERY - Confidential Document | Page 1</p>
      </div>

      {/* ====== MOBILE CARDS ====== */}
      <div className="mobile-cards no-print" style={styles.mobileCards}>
        {filteredOrders.map(order => {
          const statusStyle = getStatusColor(order.status);
          return (
            <div key={order._id} style={styles.mobileCard}>
              <div style={styles.mobileCardHeader}>
                <span style={styles.orderId}>#{order._id.slice(-6)}</span>
                <span style={{ ...styles.mobileStatus, backgroundColor: statusStyle.bg, color: statusStyle.text }}>{order.status?.replace('_', ' ')}</span>
              </div>
              <div style={styles.mobileCardBody}>
                <div style={styles.mobileRow}><span style={styles.mobileLabel}>Client</span><span>{order.clientId?.name || 'N/A'}</span></div>
                <div style={styles.mobileRow}><span style={styles.mobileLabel}>Total</span><span style={styles.price}>${(order.total || 0).toFixed(2)}</span></div>
                <div style={styles.mobileRow}><span style={styles.mobileLabel}>Delivery</span><span>{order.deliveryPersonId?.name || 'Not assigned'}</span></div>
                <div style={styles.mobileRow}><span style={styles.mobileLabel}>Date</span><span style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== PRINT STYLES ====== */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-table { display: none; }
          .mobile-cards { display: flex !important; }
        }
        @media print {
          html, body { margin: 0; padding: 0; background: white; width: 100%; height: 100%; }
          aside, nav, .sidebar, header, .app-layout > aside, .no-print { display: none !important; }
          body * { visibility: hidden; }
          .orders-page, .orders-page * { visibility: visible !important; }
          .orders-page { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print-only { display: block !important; }
          .desktop-table { display: block !important; }
          .mobile-cards { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 1cm; size: A4 landscape; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 },
  title: { color: '#1F2937', margin: 0, fontSize: '24px', fontWeight: '700' },
  subtitle: { color: '#6B7280', margin: '4px 0 0', fontSize: '13px' },
  filterRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: { border: 'none', padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize' },
  printBtn: { backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
  printHeader: { textAlign: 'center', padding: '10px 0', marginBottom: 15 },
  printTitle: { color: '#7C3AED', margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '2px' },
  printSubtitle: { color: '#6B7280', margin: '3px 0', fontSize: '12px' },
  printFooter: { textAlign: 'center', marginTop: 15, paddingTop: 8, borderTop: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: '10px' },
  tableWrapper: { overflowX: 'auto', background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' },
  th: { padding: '14px 16px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tableRow: { borderBottom: '1px solid #F3F4F6' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#1F2937' },
  orderId: { fontFamily: 'monospace', fontWeight: '600', color: '#7C3AED', fontSize: '13px' },
  price: { fontWeight: '700', color: '#1F2937' },
  date: { color: '#9CA3AF', fontSize: '13px' },
  emptyState: { padding: '60px 40px', textAlign: 'center' },
  emptyIcon: { fontSize: '48px', marginBottom: 12 },
  emptyText: { fontSize: '16px', fontWeight: '600', color: '#1F2937' },
  mobileCards: { display: 'none', gap: 16, flexDirection: 'column', marginTop: 16 },
  mobileCard: { background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  mobileCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mobileStatus: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  mobileCardBody: { display: 'flex', flexDirection: 'column', gap: 8 },
  mobileRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1F2937' },
  mobileLabel: { color: '#9CA3AF', fontWeight: '500' },
};

export default Orders;