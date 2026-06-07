import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Restaurants from './components/Restaurants';
import Products from './components/Products';
import DeliveryStaff from './components/DeliveryStaff';
import Layout from './components/Layout';
import AdminChat from './components/AdminChat';
import Reports from './components/Reports';

function App() {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Login />;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/products" element={<Products />} />
          <Route path="/delivery-staff" element={<DeliveryStaff />} />
          <Route path="/chat" element={<AdminChat />} />
          import Reports from './components/Reports';
<Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;