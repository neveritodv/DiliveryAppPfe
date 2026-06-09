import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
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

        const usersCount = usersRes.data.payload?.length || 0;
        const restaurantsCount = restaurantsRes.data.payload?.length || 0;
        const productsCount = productsRes.data.payload?.length || 0;

        setSummary({
          orders: orders.length,
          revenue: totalRevenue,
          users: usersCount,
          restaurants: restaurantsCount,
          products: productsCount,
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
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Dashboard Overview</h2>
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}><span>📦</span></div>
          <div style={styles.cardContent}>
            <h3>Total Orders</h3>
            <p>{summary.orders}</p>
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardIcon}><span>💰</span></div>
          <div style={styles.cardContent}>
            <h3>Revenue</h3>
            <p>${summary.revenue.toFixed(2)}</p>
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardIcon}><span>👥</span></div>
          <div style={styles.cardContent}>
            <h3>Users</h3>
            <p>{summary.users}</p>
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardIcon}><span>🍽️</span></div>
          <div style={styles.cardContent}>
            <h3>Restaurants</h3>
            <p>{summary.restaurants}</p>
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardIcon}><span>🥘</span></div>
          <div style={styles.cardContent}>
            <h3>Products</h3>
            <p>{summary.products}</p>
          </div>
        </div>
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Orders – Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={3} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Orders by Status</h3>
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
    backgroundColor: '#F8F9FC',
    minHeight: '100vh',
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
    border: '4px solid #e0e0e0',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '24px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s',
    cursor: 'pointer',
  },
  cardIcon: {
    fontSize: '32px',
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardContentH3: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    margin: '0 0 4px',
  },
  cardContentP: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
  },
};

export default Dashboard;