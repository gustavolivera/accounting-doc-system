import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useUI } from '../context/UIContext';
import { RefreshCw, Check, RotateCcw, Search } from 'lucide-react';

interface Deadline {
  id: string;
  month: number;
  year: number;
  dueDate: string;
  status: 'PENDENTE' | 'ENTREGUE' | 'ATRASADO';
  company: { tradeName: string };
  obligation: { name: string; type: string };
  events?: Array<{ status: string; observation?: string; evidenceUrl?: string; createdAt: string; user?: { email: string } }>;
}

interface PaginatedResponse {
  data: Deadline[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const DeadlineDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { showPrompt, showToast } = useUI();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
    company: '',
  });
  const limit = 10;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['deadlines', page, filters],
    queryFn: () => api.get('/deadlines', {
      params: {
        page,
        limit,
        search: filters.company,
        year: filters.year,
        month: filters.month === 0 ? undefined : filters.month,
        status: filters.status || undefined
      }
    }).then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, observation, evidenceUrl }: { id: string; status: string; observation?: string; evidenceUrl?: string; }) =>
      api.patch(`/deadlines/${id}/delivery-state`, { status, observation, evidenceUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      showToast('Status atualizado com sucesso', 'success');
    },
    onError: () => {
      showToast('Erro ao atualizar o status', 'error');
    }
  });

  const rawDeadlines = data?.data || [];

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
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => api.post('/deadlines/generate', { year: filters.year }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['deadlines'] });
            showToast('Prazos gerados com sucesso!', 'success');
          })}
          title="Gera os prazos para o ano selecionado no filtro"
        >
          <RefreshCw size={18} /> Gerar para Ano {filters.year}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="form-grid">
          <div className="col-3">
            <div className="form-group">
              <label>Mês</label>
              <select value={filters.month} onChange={e => { setFilters({ ...filters, month: Number(e.target.value) }); setPage(1); }}>
                <option value={0}>Todos</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-2">
            <div className="form-group">
              <label>Ano</label>
              <input type="number" value={filters.year} onChange={e => { setFilters({ ...filters, year: Number(e.target.value) }); setPage(1); }} />
            </div>
          </div>
          <div className="col-3">
            <div className="form-group">
              <label>Status</label>
              <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
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
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Buscar nome..."
                  value={filters.company}
                  onChange={e => {
                    setFilters({ ...filters, company: e.target.value });
                    setPage(1);
                  }}
                  style={{ paddingLeft: '35px', width: '100%' }}
                />
              </div>
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
              {rawDeadlines.map((d) => (
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
                        style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}
                        onClick={() => {
                          showPrompt('Observação (opcional):', (observation) => {
                            if (observation !== null) {
                              setTimeout(() => {
                                showPrompt('URL de Evidência (opcional):', (evidenceUrl) => {
                                  if (evidenceUrl !== null) {
                                    updateStatusMutation.mutate({ id: d.id, status: 'ENTREGUE', observation, evidenceUrl: evidenceUrl || undefined });
                                  }
                                });
                              }, 100);
                            }
                          });
                        }}
                      >
                        <Check size={14} /> Entregar
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.75rem', height: '24px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}
                        onClick={() => {
                          showPrompt('Motivo da reabertura:', (observation) => {
                            if (observation) {
                              updateStatusMutation.mutate({ id: d.id, status: 'PENDENTE', observation });
                            }
                          });
                        }}
                      >
                        <RotateCcw size={14} /> Reabrir
                      </button>
                    )}
                    {d.events && d.events.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Último evento: {new Date(d.events[d.events.length - 1].createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && rawDeadlines.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhum prazo encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Página {data.page} de {data.totalPages} (Total: {data.total} registros)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
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
