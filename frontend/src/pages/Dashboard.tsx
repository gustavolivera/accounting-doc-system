import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, FileText, CalendarClock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/dashboard/metrics').then(res => res.data),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Visão Geral</h1>
          <p style={{ marginBottom: 0 }}>Bem-vindo ao sistema de gestão contábil</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Prazos de Hoje</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary-600)', marginBottom: 0 }}>{metrics?.deadlinesToday ?? 0}</p>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Prazos Vencidos</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)', marginBottom: 0 }}>{metrics?.overdueDeadlines ?? 0}</p>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginTop: 0 }}>Próximos 7 Dias</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-warning)', marginBottom: 0 }}>{metrics?.deadlinesNext7Days ?? 0}</p>
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
