import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUI } from '../context/UIContext';
import { Eye, Save, Trash2, X } from 'lucide-react';

const TYPES = ['FEDERAL', 'ESTADUAL', 'MUNICIPAL'];
const PERIODICITIES = ['MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'ANUAL'];
const COMPANY_FIELDS = [
  { value: 'taxRegime', label: 'Regime Tributário' },
  { value: 'activities', label: 'Atividades Econômicas' },
  { value: 'stateRegistration', label: 'Inscrição Estadual' },
  { value: 'city', label: 'Município' },
  { value: 'hasMovement', label: 'Possui Movimento' },
  { value: 'hasOutboundDocs', label: 'Possui Notas de Saída' },
  { value: 'hasInboundDocs', label: 'Possui Notas de Entrada' },
  { value: 'taxSimplesNacional', label: 'Apura Simples Nacional' },
  { value: 'taxIcms', label: 'Apura ICMS' },
  { value: 'obSintegra', label: 'Envia SINTEGRA' },
  { value: 'obSpedIcms', label: 'Envia SPED ICMS' },
];

const OPERATORS = [
  { value: 'EQUALS', label: 'Igual a' },
  { value: 'CONTAINS', label: 'Contém / Pertence a' },
];

const FIELD_OPTIONS: Record<string, {value: string, label: string}[]> = {
  taxRegime: [
    { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
    { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
    { value: 'LUCRO_REAL', label: 'Lucro Real' },
  ],
  activities: [
    { value: 'SERVICO', label: 'Serviço' },
    { value: 'COMERCIO', label: 'Comércio' },
    { value: 'INDUSTRIA', label: 'Indústria' },
  ],
  boolean: [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
  ]
};

const getFieldType = (field: string) => {
  if (['hasMovement', 'hasOutboundDocs', 'hasInboundDocs', 'taxSimplesNacional', 'taxIcms', 'obSintegra', 'obSpedIcms'].includes(field)) {
    return 'boolean';
  }
  if (field === 'taxRegime') return 'taxRegime';
  if (field === 'activities') return 'activities';
  return 'text';
};

export const ObligationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useUI();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'FEDERAL',
    periodicity: 'MENSAL',
    dueDay: 20,
    isActive: true,
    conditions: [] as any[],
  });

  const { data: obligation, isLoading } = useQuery({
    queryKey: ['obligation', id],
    queryFn: () => api.get(`/obligations/${id}`).then(res => res.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (obligation) {
      setForm({
        ...obligation,
        conditions: obligation.conditions || [],
      });
    }
  }, [obligation]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, dueDay: Number(data.dueDay) };
      if (isEdit) return api.patch(`/obligations/${id}`, payload);
      return api.post('/obligations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obligations'] });
      showToast(isEdit ? 'Obrigação atualizada com sucesso' : 'Obrigação criada com sucesso', 'success');
      navigate('/obligations');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar a obrigação';
      showToast(Array.isArray(message) ? message[0] : message, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const addCondition = () => {
    setForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'taxRegime', operator: 'EQUALS', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setForm(prev => {
      const newConditions = [...prev.conditions];
      newConditions[index] = { ...newConditions[index], [field]: value };
      return { ...prev, conditions: newConditions };
    });
  };

  const [previewData, setPreviewData] = useState<{ totalActiveCompanies: number; affectedCount: number; affectedCompanies: any[] } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const criteria = form.conditions.map(c => ({
        criterionCode: c.field,
        operator: c.operator,
        value: c.value
      }));
      const res = await api.post('/rules/preview', { criteria });
      setPreviewData(res.data);
    } catch (err) {
      showToast('Erro ao pré-visualizar as regras.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  if (isEdit && isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '2rem', border: 'none', padding: 0 }}>
         <div>
            <h1>{isEdit ? 'Editar Obrigação' : 'Nova Obrigação'}</h1>
            <p style={{ marginBottom: 0 }}>Defina os detalhes e regras da obrigação</p>
         </div>
         <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/obligations')}>
              <X size={18} /> Cancelar
            </button>
            <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleSubmit}>
                <Save size={18} /> {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
         </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          
          <div className="form-section">
             <h3>Dados Básicos</h3>
             <div className="form-grid">
                <div className="col-6">
                   <div className="form-group">
                      <label>Nome da Obrigação</label>
                      <input 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        required 
                        placeholder="Ex: DAS Simples Nacional"
                      />
                   </div>
                </div>
                <div className="col-3">
                   <div className="form-group">
                      <label>Tipo</label>
                      <select 
                        value={form.type} 
                        onChange={e => setForm({...form, type: e.target.value})}
                      >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                </div>
                <div className="col-3">
                    <div className="form-group" style={{ display: 'flex', alignItems: 'end', height: '100%', paddingBottom: '10px' }}>
                        <label className="checkbox-group">
                            <input 
                            type="checkbox" 
                            checked={form.isActive} 
                            onChange={e => setForm({...form, isActive: e.target.checked})} 
                            />
                            Obrigação Ativa
                        </label>
                    </div>
                </div>

                <div className="col-12">
                   <div className="form-group">
                      <label>Descrição</label>
                      <textarea 
                        value={form.description} 
                        onChange={e => setForm({...form, description: e.target.value})} 
                        style={{ minHeight: '60px' }}
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="form-section">
             <h3>Prazos e Periodicidade</h3>
             <div className="form-grid">
               <div className="col-4">
                  <div className="form-group">
                    <label>Periodicidade</label>
                    <select 
                      value={form.periodicity} 
                      onChange={e => setForm({...form, periodicity: e.target.value})}
                      required
                    >
                      {PERIODICITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
               </div>
               <div className="col-4">
                  <div className="form-group">
                    <label>Dia Fixo de Vencimento</label>
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={form.dueDay} 
                      onChange={e => setForm({...form, dueDay: Number(e.target.value)})} 
                      required 
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>Dia do mês subsequente ao período</small>
                  </div>
               </div>
             </div>
          </div>
          
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h3>Regras de Aplicação</h3>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCondition}>
                  + Adicionar Regra
                </button>
            </div>
            
            <div className="card" style={{ backgroundColor: 'var(--color-gray-50)', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
               {form.conditions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                     <p>Nenhuma regra definida.</p>
                     <small>Esta obrigação não será vinculada automaticamente a nenhuma empresa.</small>
                  </div>
               )}

               {form.conditions.map((cond, index) => (
                 <div key={index} style={{ 
                     display: 'flex', 
                     gap: '1rem', 
                     alignItems: 'end', 
                     marginBottom: '1rem', 
                     paddingBottom: '1rem', 
                     borderBottom: index < form.conditions.length - 1 ? '1px solid var(--color-gray-200)' : 'none' 
                  }}>
                    <div style={{ flex: 2 }}>
                       <label style={{ fontSize: '0.75rem' }}>Campo da Empresa</label>
                       <select 
                          value={cond.field} 
                          onChange={e => updateCondition(index, 'field', e.target.value)}
                       >
                         {COMPANY_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                       </select>
                    </div>
                    <div style={{ width: '180px' }}>
                       <label style={{ fontSize: '0.75rem' }}>Operador</label>
                       <select 
                          value={cond.operator} 
                          onChange={e => updateCondition(index, 'operator', e.target.value)}
                       >
                         {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                       </select>
                    </div>
                    <div style={{ flex: 2 }}>
                       <label style={{ fontSize: '0.75rem' }}>Valor Esperado</label>
                       {getFieldType(cond.field) !== 'text' ? (
                          <select
                            value={cond.value}
                            onChange={e => updateCondition(index, 'value', e.target.value)}
                          >
                            <option value="" disabled>Selecione...</option>
                            {FIELD_OPTIONS[getFieldType(cond.field)]?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                       ) : (
                          <input 
                             value={cond.value} 
                             onChange={e => updateCondition(index, 'value', e.target.value)}
                             placeholder="Ex: SP"
                          />
                       )}
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm" 
                      onClick={() => removeCondition(index)}
                      title="Remover regra"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Trash2 size={14} /> Remover
                    </button>
                 </div>
               ))}
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>* A empresa deve atender a <strong>TODAS</strong> as condições para que a obrigação seja aplicada.</p>
            
            <div style={{ marginTop: '1rem' }}>
               <button 
                 type="button" 
                 className="btn btn-secondary" 
                 onClick={handlePreview} 
                 disabled={isPreviewing || form.conditions.length === 0}
                 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
               >
                 {isPreviewing ? 'Calculando...' : <><Eye size={18} /> Pré-visualizar Impacto</>}
               </button>
            </div>

            {previewData && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-info-bg)', border: '1px solid var(--color-info)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-info)' }}>Resultado da Simulação</h4>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                  <strong>{previewData.affectedCount}</strong> de <strong>{previewData.totalActiveCompanies}</strong> empresas ativas se enquadram nestas regras.
                </p>
                {previewData.affectedCount > 0 && (
                  <div style={{ marginTop: '0.5rem', maxHeight: '100px', overflowY: 'auto', fontSize: '0.75rem', background: 'white', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                     {previewData.affectedCompanies.map(c => <div key={c.id}>- {c.tradeName}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
