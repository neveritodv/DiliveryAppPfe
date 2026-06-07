import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({ orders: 0, revenue: 0 });
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data));
    axios.get(`${API_URL}/admin/orders/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const orders = res.data.payload;
        setSummary({ orders: orders.length, revenue: orders.reduce((s, o) => s + (o.total || 0), 0) });
      });
  }, []);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 30 }}>
        <div style={styles.card}><h3>Total Orders</h3><p>{summary.orders}</p></div>
        <div style={styles.card}><h3>Revenue</h3><p>${summary.revenue.toFixed(2)}</p></div>
      </div>
      <div style={styles.chartCard}>
        <h3>Last 7 Days Orders</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats}>
            <CartesianGrid stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#FC6011" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  card: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  chartCard: { background: 'white', padding: '20px', borderRadius: '16px' }
};

export default Dashboard;