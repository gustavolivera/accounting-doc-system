import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useUI } from '../context/UIContext';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface PaginatedResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const UsersList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showConfirm, showToast } = useUI();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['users', page, search],
    queryFn: () => api.get('/users', { params: { page, limit, search } }).then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Usuário excluído com sucesso', 'success');
    },
    onError: () => {
      showToast('Erro ao excluir usuário', 'error');
    }
  });

  const handleDelete = (id: string) => {
    showConfirm('Tem certeza que deseja excluir este usuário?', () => {
      deleteMutation.mutate(id);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const users = data?.data || [];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Usuários</h1>
        <Link to="/users/new" className="btn btn-primary">
          + Novo Usuário
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por e-mail..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input"
            style={{ maxWidth: '300px' }}
          />
          <button type="submit" className="btn btn-secondary">Buscar</button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Data de Cadastro</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
               <tr>
                 <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td>
               </tr>
            )}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link 
                    to={`/users/${user.id}/edit`} 
                    className="btn"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      marginRight: '0.5rem'
                    }}
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="btn btn-danger"
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem' 
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && users.length === 0 && (
               <tr>
                 <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                   Nenhum usuário encontrado.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
        
        {data && data.totalPages > 1 && (
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Mostrando {users.length} de {data.total} registros
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
