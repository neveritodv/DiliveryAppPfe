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
    const res = await axios.get(`${API_URL}/admin/orders/all`, { headers: { Authorization: `Bearer ${token}` } });
    setOrders(res.data.payload);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#17a2b8';
      case 'picked_up': return '#28a745';
      case 'delivered': return '#28a745';
      default: return '#6c757d';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#4A4B4D' }}>Live Orders</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {['all', 'pending', 'accepted', 'picked_up', 'delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                backgroundColor: filter === status ? '#FC6011' : '#f0f0f0',
                color: filter === status ? 'white' : '#4A4B4D',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
            <tr>
              <th style={{ padding: 16, textAlign: 'left' }}>Order ID</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Client</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Total</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Status</th>
              <th style={{ padding: 16, textAlign: 'left' }}>Delivery Person</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 16 }}>{order._id.slice(-6)}</td>
                <td style={{ padding: 16 }}>{order.clientId?.name || 'N/A'}</td>
                <td style={{ padding: 16 }}>${order.total}</td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    color: 'white',
                    backgroundColor: getStatusColor(order.status),
                    fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: 16 }}>{order.deliveryPersonId?.name || 'Not assigned'}</td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center' }}>No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards (visible on small screens) */}
      <div style={{ display: 'none', gap: 16, flexDirection: 'column', marginTop: 16 }}>
        {filteredOrders.map(order => (
          <div key={order._id} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Order #{order._id.slice(-6)}</strong>
              <span style={{ color: '#666' }}>${order.total}</span>
            </div>
            <div style={{ marginBottom: 8 }}>Client: {order.clientId?.name || 'N/A'}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                color: 'white',
                backgroundColor: getStatusColor(order.status),
                fontSize: 12,
              }}>
                {order.status}
              </span>
              <span style={{ fontSize: 12, color: '#666' }}>{order.deliveryPersonId?.name || 'Not assigned'}</span>
            </div>
          </div>
        ))}
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

export default Orders;