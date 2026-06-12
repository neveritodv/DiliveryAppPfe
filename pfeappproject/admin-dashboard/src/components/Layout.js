import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUserId');
    window.location.href = '/';
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/orders', label: 'Live Orders', icon: '📦' },
    { path: '/restaurants', label: 'Restaurants', icon: '🍽️' },
    { path: '/products', label: 'Products', icon: '🍔' },
    { path: '/delivery-staff', label: 'Delivery Staff', icon: '🛵' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/reports', label: 'Reports', icon: '📋' },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo + Brand Name */}
        <div style={styles.logoArea}>
          <img
            src="/new.png"
            alt="Racine Delivery Logo"
            style={styles.logoImg}
          />
          <div>
            <h1 style={styles.brandName}>RACINE DELIVERY</h1>
            
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.menuItem,
                  backgroundColor: isActive ? '#7C3AED' : 'transparent',
                  color: isActive ? 'white' : '#6B7280',
                  fontWeight: isActive ? '600' : '400',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F5F3FF';
                    e.currentTarget.style.color = '#7C3AED';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6B7280';
                  }
                }}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span style={styles.activeDot}>●</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>A</div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>Admin</div>
            <div style={styles.userRole}>Administrator</div>
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} style={styles.logoutBtn}>
          <span style={{ marginRight: 8 }}>🚪</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
        </div>
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: 280,
    background: 'white',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 36,
    paddingBottom: 24,
    borderBottom: '1px solid #F3F4F6',
  },
  logoImg: {
    width: 46,
    height: 46,
    objectFit: 'contain',
    border: 'none',
    outline: 'none',
    background: 'transparent',
  },
  brandName: {
    color: '#7C3AED',
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
  },
  brandSubtext: {
    color: '#9CA3AF',
    margin: '2px 0 0',
    fontSize: '11px',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  menuIcon: {
    marginRight: 12,
    fontSize: '18px',
    width: 24,
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    right: 12,
    color: 'white',
    fontSize: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px',
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1F2937',
  },
  userRole: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    background: '#F8FAFC',
  },
  header: {
    padding: '20px 30px',
    background: 'white',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerTitle: {
    color: '#1F2937',
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
  },
  content: {
    padding: '28px',
  },
};

export default Layout;