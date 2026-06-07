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
        <img src="/logo.png" alt="Logo" style={styles.logo} />
        <h2 style={styles.title}>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button} disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' },
  card: { background: 'white', padding: '40px', borderRadius: '28px', width: '350px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  logo: { width: '120px', marginBottom: '20px' },
  title: { color: '#4A4B4D', fontSize: '30px', fontWeight: '800', marginBottom: '20px' },
  input: { width: '100%', padding: '14px', margin: '10px 0', borderRadius: '25px', border: '1px solid #ddd', fontSize: '14px' },
  button: { width: '100%', backgroundColor: '#FC6011', color: 'white', padding: '14px', borderRadius: '28px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '20px' },
  error: { color: 'red', fontSize: '12px', marginTop: '10px' }
};

export default Login;