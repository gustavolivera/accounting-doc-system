import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface Company {
  id: string;
  internalCode: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  city: string;
  isActive: boolean;
}

interface PaginatedResponse {
  data: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const CompaniesList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['companies', page, search],
    queryFn: async () => {
      const response = await api.get('/companies', {
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

  const companies = data?.data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Empresas</h1>
          <p style={{ marginBottom: 0 }}>Gerencie as empresas cadastradas no escritório</p>
        </div>
        <Link to="/companies/new" className="btn btn-primary">
          + Nova Empresa
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por Razão Social ou CNPJ..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input"
            style={{ maxWidth: '300px' }}
          />
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Cód.</th>
                <th>Razão Social / Fantasia</th>
                <th style={{ width: '180px' }}>CNPJ</th>
                <th style={{ width: '150px' }}>Município</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                 <tr>
                   <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td>
                 </tr>
              )}
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', background: 'var(--color-gray-100)', padding: '2px 6px', borderRadius: '4px' }}>
                      {company.internalCode || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{company.corporateName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{company.tradeName}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{company.cnpj}</td>
                  <td>{company.city}</td>
                  <td>
                    <span className={`badge ${company.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {company.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link 
                      to={`/companies/${company.id}/edit`} 
                      className="btn btn-secondary btn-sm"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && companies.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Mostrando {companies.length} de {data.total} registros
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
