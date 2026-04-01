import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const MainLayout: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Início', icon: '🏠' },
    { to: '/companies', label: 'Empresas', icon: '🏢' },
    { to: '/documents', label: 'Controle Mensal', icon: '📄' },
    { to: '/obligations', label: 'Obrigações', icon: '📋' },
    { to: '/deadlines', label: 'Prazos', icon: '⏰' },
    { to: '/users', label: 'Usuários', icon: '👥' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside 
        style={{ 
          width: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-sidebar)',
          color: 'var(--text-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          zIndex: 20
        }}
      >
        <div 
          style={{ 
            height: 'var(--header-height)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0' : '0 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {!collapsed && <span style={{ fontWeight: 'bold', color: 'white' }}>Gestão Contábil</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            {collapsed ? '☰' : '«'}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                color: isActive ? 'white' : 'var(--text-sidebar)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '0.75rem'
              })}
              title={collapsed ? item.label : ''}
              end={item.to === '/'}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            color: 'var(--text-sidebar)',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Usuário</div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, color: 'white' }}>{user?.email}</div>
              </div>
            )}
            <button 
              onClick={handleLogout} 
              title="Sair"
              style={{ 
                 background: 'transparent', 
                 border: '1px solid rgba(255,255,255,0.2)', 
                 borderRadius: '4px',
                 color: 'var(--text-sidebar)',
                 cursor: 'pointer',
                 padding: '0.4rem',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
              }}
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Fixed Header */}
        <header 
          style={{ 
            height: 'var(--header-height)', 
            backgroundColor: 'var(--bg-header)', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 2rem',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Painel Administrativo</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Empresa Exemplo Ltda
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
