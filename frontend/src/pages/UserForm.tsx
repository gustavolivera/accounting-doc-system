import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const UserForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then(res => res.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (user) {
      setForm({ email: user.email, password: '' });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return api.put(`/users/${id}`, data);
      }
      return api.post('/users', data);
    },
    onSuccess: () => {
      navigate('/users');
    },
    onError: (err: any) => {
        alert(err.response?.data?.message || 'Failed to save user');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { email: form.email };
    if (form.password) {
      data.password = form.password;
    }
    mutation.mutate(data);
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-mail</label>
            <input 
              type="email"
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label>Senha {isEdit && <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Deixe em branco para manter)</span>}</label>
            <input 
              type="password"
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              required={!isEdit}
              minLength={6}
              placeholder={isEdit ? "Nova senha (opcional)" : "Mínimo 6 caracteres"}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
            <button 
              type="button" 
              className="btn" 
              onClick={() => navigate('/users')} 
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
