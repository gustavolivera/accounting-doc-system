import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

export const UsersList: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Usuários</h1>
        <Link to="/users/new" className="btn btn-primary">
          + Novo Usuário
        </Link>
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
            {users?.map((user) => (
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
            {users?.length === 0 && (
               <tr>
                 <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                   Nenhum usuário encontrado.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
