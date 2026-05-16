import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CompaniesList } from './pages/CompaniesList';
import { CompanyForm } from './pages/CompanyForm';
import { DocumentControl } from './pages/DocumentControl';
import { UsersList } from './pages/UsersList';
import { UserForm } from './pages/UserForm';
import { ObligationList } from './pages/ObligationList';
import { ObligationForm } from './pages/ObligationForm';
import { DeadlineDashboard } from './pages/DeadlineDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

import { MainLayout } from './components/layout/MainLayout';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Routes that use MainLayout */}
      <Route element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<CompaniesList />} />
        <Route path="/companies/new" element={<CompanyForm />} />
        <Route path="/companies/:id/edit" element={<CompanyForm />} />
        <Route path="/obligations" element={<ObligationList />} />
        <Route path="/obligations/new" element={<ObligationForm />} />
        <Route path="/obligations/:id/edit" element={<ObligationForm />} />
        <Route path="/deadlines" element={<DeadlineDashboard />} />
        <Route path="/documents" element={<DocumentControl />} />
        <Route path="/users" element={<UsersList />} />
        <Route path="/users/new" element={<UserForm />} />
        <Route path="/users/:id/edit" element={<UserForm />} />
      </Route>
    </Routes>
  );
}

import { UIProvider } from './context/UIContext';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </UIProvider>
    </QueryClientProvider>
  );
};

export default App;
