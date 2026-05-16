import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil } from 'lucide-react';

interface Obligation {
  id: string;
  name: string;
  type: string;
  periodicity: string;
  dueDay: number;
  isActive: boolean;
  conditions: any[];
}

interface PaginatedResponse {
  data: Obligation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ObligationList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['obligations', page, search],
    queryFn: async () => {
      const response = await api.get('/obligations', {
        params: { page, limit, search }
      });
      return response.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const obligations = data?.data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Obrigações Acessórias</h1>
          <p style={{ marginBottom: 0 }}>Configure as regras de obrigações tributárias e fiscais</p>
        </div>
        <Link to="/obligations/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Nova Obrigação
        </Link>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Buscar por Nome..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input"
              style={{ paddingLeft: '35px', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: '120px' }}>Tipo</th>
                <th style={{ width: '120px' }}>Periodicidade</th>
                <th style={{ width: '100px' }}>Dia Venc.</th>
                <th style={{ width: '100px' }}>Regras</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                 <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td>
                 </tr>
              )}
              {obligations.map((ob) => (
                <tr key={ob.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{ob.name}</div>
                  </td>
                  <td><span className="badge badge-neutral">{ob.type}</span></td>
                  <td>{ob.periodicity}</td>
                  <td>{ob.dueDay}</td>
                  <td>
                    <span className="badge badge-neutral">
                      {ob.conditions?.length || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${ob.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {ob.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link 
                      to={`/obligations/${ob.id}/edit`} 
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Pencil size={14} /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && obligations.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhuma obrigação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Mostrando {obligations.length} de {data.total} registros
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              <span style={{ padding: '0.5rem' }}>Página {page} de {data.totalPages}</span>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
