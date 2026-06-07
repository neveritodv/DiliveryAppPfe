import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  const logout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/orders', label: 'Live Orders', icon: '📦' },
    { path: '/restaurants', label: 'Restaurants', icon: '🍽️' },
    { path: '/products', label: 'Products', icon: '🍔' },
    { path: '/delivery-staff', label: 'Delivery Staff', icon: '🛵' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/reports', label: 'Reports', icon: '📋' }
  ];

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <img src="/logo.png" alt="Logo" style={styles.logoImg} />
          <h3 style={styles.logoText}>Food Delivery</h3>
        </div>
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              ...styles.menuItem,
              backgroundColor: location.pathname === item.path ? '#FC6011' : 'transparent',
              color: location.pathname === item.path ? 'white' : '#4A4B4D',
            }}>
              <span style={{ marginRight: 12 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </aside>
      <main style={styles.main}>
        <div style={styles.header}>
          <h2>Dashboard</h2>
        </div>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh' },
  sidebar: { width: 260, background: 'white', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', padding: '20px' },
  logoArea: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 20 },
  logoImg: { width: 45, height: 45 },
  logoText: { color: '#FC6011', margin: 0 },
  nav: { flex: 1 },
  menuItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', marginBottom: 8, textDecoration: 'none', fontWeight: 500 },
  logoutBtn: { backgroundColor: '#f0f0f0', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, marginTop: 'auto' },
  main: { flex: 1, overflow: 'auto', background: '#f5f5f5' },
  header: { padding: '20px 30px', background: 'white', borderBottom: '1px solid #eee' },
  content: { padding: '30px' }
};

export default Layout;