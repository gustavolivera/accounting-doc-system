import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Building2, 
  FileText, 
  CalendarClock, 
  ClipboardList, 
  Users, 
  LogOut, 
  Menu, 
  ChevronLeft 
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Início', icon: <Home size={20} /> },
    { to: '/companies', label: 'Empresas', icon: <Building2 size={20} /> },
    { to: '/documents', label: 'Controle Mensal', icon: <FileText size={20} /> },
    { to: '/deadlines', label: 'Prazos', icon: <CalendarClock size={20} /> },
  ];

  if (isAdmin) {
    navItems.splice(3, 0, { to: '/obligations', label: 'Obrigações', icon: <ClipboardList size={20} /> });
    navItems.push({ to: '/users', label: 'Usuários', icon: <Users size={20} /> });
  }

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
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
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
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
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
              <LogOut size={18} />
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
