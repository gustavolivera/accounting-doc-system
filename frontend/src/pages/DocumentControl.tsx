import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';
import { useUI } from '../context/UIContext';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Company {
  id: string;
  tradeName: string;
  fantasyName: string;
}

interface MonthlyControl {
  month: number;
  year: number;
  status: 'PENDING' | 'DELIVERED' | 'NO_DOCUMENTS';
  observation?: string;
}

export const DocumentControl: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useUI();

  // Fetch companies for the dropdown
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies', { params: { limit: 1000 } }).then(res => res.data?.data || []),
  });

  // Fetch controls when company and year are selected
  const { data: controls } = useQuery<MonthlyControl[]>({
    queryKey: ['document-controls', selectedCompanyId, year],
    queryFn: () => api.get(`/deadlines/document-control/${selectedCompanyId}/${year}`).then(res => res.data),
    enabled: !!selectedCompanyId,
  });

  const mutation = useMutation({
    mutationFn: (data: { month: number; status: string; observation?: string }) => {
      return api.post(`/deadlines/document-control/${selectedCompanyId}/${year}/${data.month}`, {
        status: data.status,
        observation: data.observation,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-controls', selectedCompanyId, year] });
      showToast('Controle atualizado com sucesso', 'success');
    },
    onError: () => {
      showToast('Erro ao atualizar o controle mensal', 'error');
    }
  });

  const getControl = (monthIndex: number) => {
    return controls?.find((c) => c.month === monthIndex + 1);
  };

  const getStatus = (monthIndex: number) => {
    const control = getControl(monthIndex);
    return control?.status || 'PENDING';
  };

  const getObservation = (monthIndex: number) => {
    const control = getControl(monthIndex);
    return control?.observation || '';
  };

  const handleStatusChange = (monthIndex: number, newStatus: string) => {
    const currentControl = getControl(monthIndex);
    mutation.mutate({
      month: monthIndex + 1,
      status: newStatus,
      observation: currentControl?.observation
    });
  };

  const handleObservationChange = (monthIndex: number, value: string) => {
    const currentStatus = getStatus(monthIndex);
    mutation.mutate({
      month: monthIndex + 1,
      status: currentStatus,
      observation: value
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'var(--color-success)';
      case 'NO_DOCUMENTS': return 'var(--color-gray-400)';
      default: return 'var(--color-warning)'; // Pending
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'var(--color-success-bg)';
      case 'NO_DOCUMENTS': return 'var(--color-gray-100)';
      default: return 'var(--color-warning-bg)';
    }
  };

  const handleMarkAll = async (status: string) => {
    setIsMarkingAll(true);
    try {
      await Promise.all(
        MONTHS.map((_, index) =>
          api.post(`/deadlines/document-control/${selectedCompanyId}/${year}/${index + 1}`, {
            status,
            observation: getObservation(index),
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['document-controls', selectedCompanyId, year] });
      showToast('Todos os meses atualizados com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao atualizar os meses', 'error');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1>Recebimento de Documentos</h1>
        <p>Acompanhe o recebimento mensal dos documentos físicos e digitais enviados pelo cliente.</p>
      </div>

      <div className="card">
        <div className="form-grid">
          <div className="col-4">
            <div className="form-group">
              <label>Selecione a Empresa</label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">-- Selecione --</option>
                {companies?.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-3">
            <div className="form-group">
              <label>Ano de Referência</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setYear(year - 1)}><ChevronLeft size={16} /></button>
                <input type="number" value={year} readOnly style={{ textAlign: 'center' }} />
                <button className="btn btn-secondary" style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setYear(year + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>

          {selectedCompanyId && (
            <div className="col-5">
              <div className="form-group">
                <label>Marcar todos (Ações rápidas)</label>
                <div style={{ display: 'flex', gap: '0.5rem', height: '38px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                    onClick={() => handleMarkAll('PENDING')}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? 'Aguarde...' : 'Pendente'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                    onClick={() => handleMarkAll('DELIVERED')}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? 'Aguarde...' : 'Recebido'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMarkAll('NO_DOCUMENTS')}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? 'Aguarde...' : 'Sem Movimento'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCompanyId ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {MONTHS.map((month, index) => {
              const status = getStatus(index);
              const observation = getObservation(index);

              return (
                <div
                  key={month}
                  className="card"
                  style={{
                    borderTop: `4px solid ${getStatusColor(status)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    gap: '1rem',
                    marginBottom: 0
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, marginTop: 0 }}>{month}</h3>
                    <div
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: getStatusBg(status),
                        color: getStatusColor(status),
                        textTransform: 'uppercase'
                      }}
                    >
                      {status === 'DELIVERED' ? 'Recebido' : status === 'NO_DOCUMENTS' ? 'Sem Movimento' : 'Pendente'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                    >
                      <option value="PENDING">Pendente</option>
                      <option value="DELIVERED">Recebido</option>
                      <option value="NO_DOCUMENTS">Sem Movimento</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Observações</label>
                    <textarea
                      rows={3}
                      defaultValue={observation}
                      onBlur={(e) => {
                        if (e.target.value !== observation) {
                          handleObservationChange(index, e.target.value);
                        }
                      }}
                      placeholder="Adicionar notas..."
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--color-gray-300)' }}>
            <MousePointer2 size={48} />
          </div>
          <p>Selecione uma empresa acima para visualizar e gerenciar os documentos.</p>
        </div>
      )}
    </div>
  );
};
