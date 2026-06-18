import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const API_URL = 'http://localhost:3001/api';
const COLORS = ['#7C3AED', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'];

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ orders: 0, revenue: 0, users: 0, restaurants: 0, products: 0 });
  const [statusData, setStatusData] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, usersRes, restaurantsRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/orders/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/restaurants`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = statsRes.data;
      setStats(statsData);

      const orders = ordersRes.data.payload || [];
      setAllOrders(orders);

      const filteredOrders = filterByDate(orders);
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Status counts for pie chart
      const statusCounts = filteredOrders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});
      const formattedStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
      setStatusData(formattedStatus);

      // Daily revenue for bar chart
      const revenueByDay = {};
      filteredOrders.forEach(o => {
        const day = new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        revenueByDay[day] = (revenueByDay[day] || 0) + (o.total || 0);
      });
      const formattedRevenue = Object.entries(revenueByDay).map(([name, value]) => ({
        name,
        revenue: parseFloat(value.toFixed(2)),
      }));
      setDailyRevenue(formattedRevenue);

      setSummary({
        orders: filteredOrders.length,
        revenue: totalRevenue,
        users: usersRes.data.payload?.length || 0,
        restaurants: restaurantsRes.data.payload?.length || 0,
        products: productsRes.data.payload?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByDate = (orders) => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
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
        default: return true;
      }
    });
  };

  const getDateLabel = () => {
    const labels = { all: 'All Time', today: 'Today', yesterday: 'Yesterday', this_week: 'This Week', this_month: 'This Month', this_year: 'This Year' };
    return labels[dateFilter] || 'All Time';
  };

  const handlePrint = () => {
    setExporting(true);
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  const dateFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
  ];

  return (
    <div style={styles.container} className="dashboard-page">
      {/* ====== HEADER (hidden when printing) ====== */}
      <div style={styles.headerRow} className="no-print">
        <div>
          <h2 style={styles.heading}>📊 Dashboard Overview</h2>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '4px 0 0' }}>
            Showing data for: <strong>{getDateLabel()}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {dateFilters.map(f => (
            <button key={f.value} onClick={() => setDateFilter(f.value)} style={{
              border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
              fontWeight: '500', transition: 'all 0.2s',
              backgroundColor: dateFilter === f.value ? '#7C3AED' : '#F3F4F6',
              color: dateFilter === f.value ? 'white' : '#6B7280',
            }}>{f.label}</button>
          ))}
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
          <p style={styles.printSubtitle}><strong>Sales & Performance Report</strong> - {getDateLabel()}</p>
          <p style={styles.printSubtitle}>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* ====== SUMMARY CARDS ====== */}
      <div style={styles.cardsGrid}>
        {[
          { icon: '📦', label: 'Total Orders', value: summary.orders, color: '#7C3AED', bg: '#EDE9FE' },
          { icon: '💰', label: 'Total Revenue', value: `$${summary.revenue.toFixed(2)}`, color: '#10B981', bg: '#D1FAE5' },
          { icon: '👥', label: 'Total Users', value: summary.users, color: '#3B82F6', bg: '#DBEAFE' },
          { icon: '🍽️', label: 'Restaurants', value: summary.restaurants, color: '#F59E0B', bg: '#FEF3C7' },
          { icon: '🥘', label: 'Products', value: summary.products, color: '#F43F5E', bg: '#FEE2E2' },
        ].map((item, idx) => (
          <div key={idx} style={styles.card}>
            <div style={{ ...styles.cardIcon, backgroundColor: item.bg }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardLabel}>{item.label}</h3>
              <p style={{ ...styles.cardValue, color: item.color }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ====== CHARTS ROW 1 ====== */}
      <div style={styles.chartsRow}>
        {/* Line Chart - Orders */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Orders – Last 7 Days</h3>
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={3}
                  dot={{ fill: '#7C3AED', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#7C3AED', stroke: '#fff', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No data for this period</div>
          )}
        </div>

        {/* Pie Chart - Status */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🍩 Orders by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}
                  dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No data for this period</div>
          )}
        </div>
      </div>

      {/* ====== CHARTS ROW 2 ====== */}
      <div style={styles.chartsRow}>
        {/* Bar Chart - Revenue by Day */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>💰 Revenue by Day</h3>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No data for this period</div>
          )}
        </div>

        {/* Summary Stats */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📋 Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
            {[
              { label: 'Avg Order Value', value: summary.orders > 0 ? `$${(summary.revenue / summary.orders).toFixed(2)}` : '$0.00', icon: '💵' },
              { label: 'Pending Orders', value: statusData.find(s => s.name === 'pending')?.value || 0, icon: '⏳' },
              { label: 'Delivered Orders', value: statusData.find(s => s.name === 'delivered')?.value || 0, icon: '✅' },
              { label: 'Cancelled Orders', value: statusData.find(s => s.name === 'cancelled')?.value || 0, icon: '❌' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: 12 }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{item.icon} {item.label}</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== PRINT FOOTER ====== */}
      <div className="print-only" style={styles.printFooter}>
        <p>RACINE DELIVERY - Confidential Document</p>
      </div>

      {/* ====== PRINT STYLES ====== */}
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; background: white; width: 100%; }
          aside, nav, .sidebar, header, .app-layout > aside, .no-print { display: none !important; }
          body * { visibility: hidden; }
          .dashboard-page, .dashboard-page * { visibility: visible !important; }
          .dashboard-page { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print-only { display: block !important; }
          svg { max-width: 100%; height: auto; }
          .recharts-wrapper { width: 100% !important; }
          .recharts-surface { width: 100% !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 1cm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { padding: '24px', backgroundColor: '#F8FAFC', minHeight: '100vh' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: 12 },
  heading: { fontSize: '26px', fontWeight: '700', color: '#1F2937', margin: 0 },
  printBtn: {
    backgroundColor: '#7C3AED', color: 'white', border: 'none', padding: '10px 20px',
    borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)', whiteSpace: 'nowrap',
  },
  printHeader: { textAlign: 'center', padding: '10px 0', marginBottom: 20 },
  printTitle: { color: '#7C3AED', margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '2px' },
  printSubtitle: { color: '#6B7280', margin: '3px 0', fontSize: '12px' },
  printFooter: { textAlign: 'center', marginTop: 20, paddingTop: 10, borderTop: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: '10px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  spinner: {
    width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTopColor: '#7C3AED',
    borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px',
  },
  loadingText: { color: '#6B7280', fontSize: '14px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '20px', display: 'flex',
    alignItems: 'center', gap: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
  },
  cardIcon: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: '13px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' },
  cardValue: { fontSize: '24px', fontWeight: '700', margin: 0 },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' },
  chartCard: { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  chartTitle: { fontSize: '17px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default Dashboard;