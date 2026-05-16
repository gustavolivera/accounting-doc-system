import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, FileText, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [year, setYear] = React.useState(new Date().getFullYear());

  const { data: companies } = useQuery({
    queryKey: ['companies-stats'],
    queryFn: () => api.get('/companies').then(res => res.data),
  });

  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics', year],
    queryFn: () => api.get('/dashboard/metrics', { params: { year } }).then(res => res.data),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Visão Geral</h1>
          <p style={{ marginBottom: 0 }}>Bem-vindo ao sistema de gestão contábil</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
             <button className="btn btn-sm btn-secondary" onClick={() => setYear(year - 1)}><ChevronLeft size={16} /></button>
             <span style={{ fontWeight: 600, padding: '0 1rem', minWidth: '4rem', textAlign: 'center' }}>{year}</span>
             <button className="btn btn-sm btn-secondary" onClick={() => setYear(year + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
         <div className="card" style={{ marginBottom: 0 }}>
           <h3 style={{ marginTop: 0 }}>Empresas Ativas</h3>
           <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary-600)', marginBottom: 0 }}>{metrics?.totalCompanies || 0}</p>
         </div>
         <div className="card" style={{ marginBottom: 0 }}>
           <h3 style={{ marginTop: 0 }}>Pendências ({year})</h3>
           <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)', marginBottom: 0 }}>{metrics?.pendingDeadlines ?? 0}</p>
         </div>
         <div className="card" style={{ marginBottom: 0 }}>
           <h3 style={{ marginTop: 0 }}>Obrigações Entregues</h3>
           <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)', marginBottom: 0 }}>{metrics?.deliveredDeadlines ?? 0}</p>
         </div>
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Acesso Rápido</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
        <Link to="/companies/new" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', marginBottom: 0, textDecoration: 'none' }}>
          <div style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>Nova Empresa</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Cadastrar novo cliente</div>
          </div>
        </Link>
        <Link to="/documents" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', marginBottom: 0, textDecoration: 'none' }}>
          <div style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>Recebimento de Docs</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Acompanhar recepção mensal</div>
          </div>
        </Link>
        <Link to="/deadlines" className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'pointer', marginBottom: 0, textDecoration: 'none' }}>
          <div style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarClock size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>Prazos</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Verificar entregas</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
