import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Deadline {
  id: string;
  month: number;
  year: number;
  dueDate: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'ATRASADO';
  company: { tradeName: string };
  obligation: { name: string; type: string };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const DeadlineDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
    company: '',
  });

  const { data: deadlines, isLoading } = useQuery<Deadline[]>({
    queryKey: ['deadlines'],
    queryFn: () => api.get('/deadlines').then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.patch(`/deadlines/${id}/status?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
  });

  const filteredDeadlines = deadlines?.filter(d => {
    if (filters.year && d.year !== Number(filters.year)) return false;
    if (filters.month && d.month !== Number(filters.month)) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.company && !d.company.tradeName.toLowerCase().includes(filters.company.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
      if (status === 'ATRASADO') return 'badge-danger';
      if (status === 'ENTREGUE') return 'badge-success';
      return 'badge-warning'; // Pendente
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
           <h1>Controle de Prazos</h1>
           <p style={{ marginBottom: 0 }}>Acompanhe as entregas das obrigações acessórias</p>
        </div>
        <button 
           className="btn btn-primary" 
           onClick={() => api.get('/deadlines/generate').then(() => queryClient.invalidateQueries({ queryKey: ['deadlines'] }))}
        >
            Atualizar Prazos
        </button>
      </div>
      
      {/* Filters */}
      <div className="card">
         <div className="form-grid">
            <div className="col-3">
                 <div className="form-group">
                    <label>Mês</label>
                    <select value={filters.month} onChange={e => setFilters({...filters, month: Number(e.target.value)})}>
                    <option value={0}>Todos</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                    </select>
                 </div>
            </div>
            <div className="col-2">
                 <div className="form-group">
                    <label>Ano</label>
                    <input type="number" value={filters.year} onChange={e => setFilters({...filters, year: Number(e.target.value)})} />
                 </div>
            </div>
            <div className="col-3">
                 <div className="form-group">
                    <label>Status</label>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                    <option value="">Todos</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="ENTREGUE">Entregue</option>
                    <option value="ATRASADO">Atrasado</option>
                    </select>
                 </div>
            </div>
            <div className="col-4">
                 <div className="form-group">
                    <label>Empresa</label>
                    <input placeholder="Buscar nome..." value={filters.company} onChange={e => setFilters({...filters, company: e.target.value})} />
                 </div>
            </div>
         </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Vencimento</th>
                <th>Empresa</th>
                <th style={{ width: '200px' }}>Obrigação</th>
                <th style={{ width: '100px' }}>Ref.</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>}
              {filteredDeadlines?.map((d) => (
                <tr key={d.id}>
                  <td>
                     <span style={{ fontWeight: 500 }}>{formatDate(d.dueDate)}</span>
                  </td>
                  <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{d.company.tradeName}</div>
                  </td>
                  <td>
                      <div>{d.obligation.name}</div>
                      <small style={{ color: 'var(--text-secondary)' }}>{d.obligation.type}</small>
                  </td>
                  <td>{d.month}/{d.year}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {d.status !== 'ENTREGUE' ? (
                        <button 
                            className="btn btn-success btn-sm" 
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                            onClick={() => updateStatusMutation.mutate({ id: d.id, status: 'ENTREGUE' })}
                        >
                            Entregar
                        </button>
                    ) : (
                        <button 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px' }}
                            onClick={() => updateStatusMutation.mutate({ id: d.id, status: 'PENDENTE' })}
                        >
                            Reabrir
                        </button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filteredDeadlines?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhum prazo encontrado com os filtros selecionados.
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
