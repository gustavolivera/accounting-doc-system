import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Link } from 'react-router-dom';

interface Obligation {
  id: string;
  name: string;
  type: string;
  periodicity: string;
  dueDay: number;
  isActive: boolean;
  conditions: any[];
}

export const ObligationList: React.FC = () => {
  const { data: obligations, isLoading } = useQuery<Obligation[]>({
    queryKey: ['obligations'],
    queryFn: async () => {
      const response = await api.get('/obligations');
      return response.data;
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1>Obrigações Acessórias</h1>
          <p style={{ marginBottom: 0 }}>Configure as regras de obrigações tributárias e fiscais</p>
        </div>
        <Link to="/obligations/new" className="btn btn-primary">
          + Nova Obrigação
        </Link>
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
              {obligations?.map((ob) => (
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
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && obligations?.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhuma obrigação cadastrada.
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
