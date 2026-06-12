import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const API_URL = 'http://localhost:3001/api';
const COLORS = ['#7C3AED', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'];

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ orders: 0, revenue: 0, users: 0, restaurants: 0, products: 0 });
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    const fetchData = async () => {
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
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const statusCounts = orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {});
        const formattedStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setStatusData(formattedStatus);

        setSummary({
          orders: orders.length,
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

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>📊 Dashboard Overview</h2>
        <button style={styles.refreshBtn} onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.cardsGrid}>
        {[
          { icon: '📦', label: 'Total Orders', value: summary.orders, color: '#7C3AED' },
          { icon: '💰', label: 'Revenue', value: `$${summary.revenue.toFixed(2)}`, color: '#10B981' },
          { icon: '👥', label: 'Users', value: summary.users, color: '#3B82F6' },
          { icon: '🍽️', label: 'Restaurants', value: summary.restaurants, color: '#F59E0B' },
          { icon: '🥘', label: 'Products', value: summary.products, color: '#F43F5E' },
        ].map((item, idx) => (
          <div key={idx} style={styles.card} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ ...styles.cardIcon, backgroundColor: `${item.color}15` }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
            </div>
            <div style={styles.cardContent}>
              <h3 style={styles.cardLabel}>{item.label}</h3>
              <p style={{ ...styles.cardValue, color: item.color }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Orders – Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#7C3AED"
                strokeWidth={3}
                dot={{ fill: '#7C3AED', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#7C3AED', stroke: '#fff', strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🍩 Orders by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  refreshBtn: {
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '14px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
    margin: '0 0 6px 0',
  },
  cardValue: {
    fontSize: '26px',
    fontWeight: '700',
    margin: 0,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  chartTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
  },
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;