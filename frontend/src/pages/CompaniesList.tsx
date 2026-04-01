import React from 'react';
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

export const CompaniesList: React.FC = () => {
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get('/companies');
      return response.data;
    },
  });

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
              {companies?.map((company) => (
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
              {!isLoading && companies?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhuma empresa cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
