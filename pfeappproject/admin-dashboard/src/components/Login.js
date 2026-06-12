import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.status === '1') {
        if (res.data.payload.role !== 'admin') {
          setError('Access denied. Admin only.');
          setLoading(false);
          return;
        }
        localStorage.setItem('adminToken', res.data.payload.auth_token);
        window.location.href = '/';
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo - clean, no border, no rounded corners */}
        <img
          src="/new.png"
          alt="Racine Delivery Logo"
          style={styles.logo}
        />

        {/* Brand Name */}
        <h1 style={styles.brandName}>RACINE DELIVERY</h1>

        {/* Tagline */}
        <p style={styles.tagline}>Fast • Fresh • Reliable</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footerText}>Admin Panel</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
  },
  card: {
    background: 'white',
    padding: '44px 40px',
    borderRadius: '24px',
    width: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(124, 58, 237, 0.3)',
  },
  logo: {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    marginBottom: '16px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
  },
  brandName: {
    color: '#7C3AED',
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '2px',
    margin: '0 0 4px 0',
  },
  tagline: {
    color: '#6B7280',
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '1px',
    margin: '0 0 32px 0',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    margin: '10px 0',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    backgroundColor: '#7C3AED',
    color: 'white',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '24px',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
  },
  error: {
    color: '#F43F5E',
    fontSize: '13px',
    marginTop: '12px',
    fontWeight: '500',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: '12px',
    marginTop: '24px',
  },
};

export default Login;