import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUI } from '../context/UIContext';
import { Save, X } from 'lucide-react';

const TAX_REGIMES = [
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
];

const ACTIVITIES = [
  { value: 'SERVICO', label: 'Serviço' },
  { value: 'COMERCIO', label: 'Comércio' },
  { value: 'INDUSTRIA', label: 'Indústria' },
];

const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, '') // remove tudo que não for dígito
    .replace(/^(\d{2})(\d)/, '$1.$2') // ponto após 2 dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // ponto após 3 dígitos
    .replace(/\.(\d{3})(\d)/, '.$1/$2') // barra após 3 dígitos
    .replace(/(\d{4})(\d)/, '$1-$2') // traço após 4 dígitos
    .slice(0, 18); // limita a 18 caracteres (14 dígitos + 4 pontuações)
};

export const CompanyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useUI();
  const isEdit = !!id;

  const [form, setForm] = useState({
    // General
    internalCode: '',
    corporateName: '',
    tradeName: '',
    cnpj: '',
    stateRegistration: '',
    isExemptStateRegistration: false,
    city: '',

    // Taxation
    taxRegime: '',
    fiscalObservations: '',

    // Activities
    activities: [] as string[],

    // Config: Movements
    hasMovement: false,
    hasOutboundDocs: false,
    hasInboundDocs: false,
    hasServiceDocs: false,

    // Config: Taxes
    taxSimplesNacional: false,
    taxIss: false,
    taxIcms: false,
    taxPis: false,
    taxCofins: false,
    taxIrpj: false,
    taxCsll: false,

    // Config: Obligations
    obFima: false,
    obSintegra: false,
    obSpedIcms: false,
    obEfdContribuicoes: false,
    obDctfWeb: false,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => api.get(`/companies/${id}`).then(res => res.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (company) {
      const parsedFlags: any = {};
      if (company.fiscalParameters) {
        company.fiscalParameters.forEach((p: any) => {
          parsedFlags[p.code] = p.value === 'true';
        });
      }

      setForm(prevForm => ({
        ...prevForm,
        ...company,
        ...parsedFlags,
        activities: company.activities || [],
      }));
    }
  }, [company]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data };
      if (payload.isExemptStateRegistration) {
        payload.stateRegistration = '';
      }

      // Pack boolean flags into fiscalParameters
      const flags = [
        'hasMovement', 'hasOutboundDocs', 'hasInboundDocs', 'hasServiceDocs',
        'taxSimplesNacional', 'taxIss', 'taxIcms', 'taxPis', 'taxCofins', 'taxIrpj', 'taxCsll',
        'obFima', 'obSintegra', 'obSpedIcms', 'obEfdContribuicoes', 'obDctfWeb'
      ];
      payload.fiscalParameters = {};
      flags.forEach(f => {
        if (payload[f] !== undefined) {
          payload.fiscalParameters[f] = payload[f] ? 'true' : 'false';
          delete payload[f];
        }
      });

      if (isEdit) return api.patch(`/companies/${id}`, payload);
      return api.post('/companies', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      showToast(isEdit ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!', 'success');
      navigate('/companies');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao salvar os dados da empresa.';
      showToast(Array.isArray(message) ? message[0] : message, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleCheckbox = (field: string) => {
    setForm(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleActivityToggle = (value: string) => {
    setForm(prev => {
      const current = prev.activities;
      if (current.includes(value)) {
        return { ...prev, activities: current.filter(a => a !== value) };
      } else {
        return { ...prev, activities: [...current, value] };
      }
    });
  };

  if (isEdit && isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '2rem', border: 'none', padding: 0 }}>
        <div>
          <h1>{isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h1>
          <p style={{ marginBottom: 0 }}>Preencha os dados cadastrais da empresa</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/companies')}>
            <X size={18} /> Cancelar
          </button>
          <button type="button" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleSubmit}>
            <Save size={18} /> {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>

          {/* Section 1: Identification */}
          <div className="form-section">
            <h3>Dados de Identificação</h3>
            <div className="form-grid">
              <div className="col-3">
                <div className="form-group">
                  <label>Código Interno (Opcional)</label>
                  <input
                    type="text"
                    value={form.internalCode}
                    onChange={e => setForm({ ...form, internalCode: e.target.value })}
                    placeholder="Ex: 001"
                  />
                </div>
              </div>
              <div className="col-4">
                <div className="form-group">
                  <label>CNPJ <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: maskCnpj(e.target.value) })}
                    required
                    disabled={isEdit}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div className="col-5">
                {/* Spacer or additional field */}
              </div>

              <div className="col-6">
                <div className="form-group">
                  <label>Razão Social <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={form.corporateName}
                    onChange={e => setForm({ ...form, corporateName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label>Nome Fantasia <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={form.tradeName}
                    onChange={e => setForm({ ...form, tradeName: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Localization & Fiscal */}
          <div className="form-section">
            <h3>Localização e Fiscal</h3>
            <div className="form-grid">
              <div className="col-4">
                <div className="form-group">
                  <label>Município / UF <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-4">
                <div className="form-group">
                  <label>Inscrição Estadual</label>
                  <input
                    type="text"
                    value={form.stateRegistration}
                    onChange={e => setForm({ ...form, stateRegistration: e.target.value })}
                    disabled={form.isExemptStateRegistration}
                  />
                </div>
              </div>
              <div className="col-4" style={{ display: 'flex', alignItems: 'end', paddingBottom: '10px' }}>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={form.isExemptStateRegistration}
                    onChange={() => handleCheckbox('isExemptStateRegistration')}
                  />
                  Isento de Inscrição
                </label>
              </div>

              <div className="col-4">
                <div className="form-group">
                  <label>Regime Tributário <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={form.taxRegime}
                    onChange={e => setForm({ ...form, taxRegime: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {TAX_REGIMES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label>Observações Fiscais</label>
                  <textarea
                    rows={2}
                    value={form.fiscalObservations}
                    onChange={e => setForm({ ...form, fiscalObservations: e.target.value })}
                    style={{ minHeight: '38px', height: '38px', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Activities */}
          <div className="form-section">
            <h3>Atividades Econômicas</h3>
            <div className="form-grid">
              <div className="col-12" style={{ display: 'flex', gap: '2rem' }}>
                {ACTIVITIES.map(act => (
                  <label key={act.value} className="checkbox-group" style={{ padding: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      checked={form.activities.includes(act.value)}
                      onChange={() => handleActivityToggle(act.value)}
                    />
                    {act.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Configuration Flags - Grouped nicely */}
          <div className="form-section">
            <h3>Configurações de Movimentação e Impostos</h3>
            <div className="form-grid">
              {/* Movement */}
              <div className="col-4">
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Movimentação</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="checkbox-group"><input type="checkbox" checked={form.hasMovement} onChange={() => handleCheckbox('hasMovement')} /> Possui Movimento</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.hasOutboundDocs} onChange={() => handleCheckbox('hasOutboundDocs')} /> Notas de Saída</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.hasInboundDocs} onChange={() => handleCheckbox('hasInboundDocs')} /> Notas de Entrada</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.hasServiceDocs} onChange={() => handleCheckbox('hasServiceDocs')} /> Notas de Serviço</label>
                </div>
              </div>

              {/* Taxes */}
              <div className="col-4">
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Tributos Apurados</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxSimplesNacional} onChange={() => handleCheckbox('taxSimplesNacional')} /> Simples</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxIss} onChange={() => handleCheckbox('taxIss')} /> ISS</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxIcms} onChange={() => handleCheckbox('taxIcms')} /> ICMS</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxPis} onChange={() => handleCheckbox('taxPis')} /> PIS</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxCofins} onChange={() => handleCheckbox('taxCofins')} /> COFINS</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxIrpj} onChange={() => handleCheckbox('taxIrpj')} /> IRPJ</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.taxCsll} onChange={() => handleCheckbox('taxCsll')} /> CSLL</label>
                </div>
              </div>

              {/* Obligations */}
              <div className="col-4">
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Obrigações Acessórias</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  <label className="checkbox-group"><input type="checkbox" checked={form.obFima} onChange={() => handleCheckbox('obFima')} /> FIMA</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.obSintegra} onChange={() => handleCheckbox('obSintegra')} /> SINTEGRA</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.obSpedIcms} onChange={() => handleCheckbox('obSpedIcms')} /> SPED ICMS</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.obEfdContribuicoes} onChange={() => handleCheckbox('obEfdContribuicoes')} /> EFD Contribuições</label>
                  <label className="checkbox-group"><input type="checkbox" checked={form.obDctfWeb} onChange={() => handleCheckbox('obDctfWeb')} /> DCTF Web</label>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
