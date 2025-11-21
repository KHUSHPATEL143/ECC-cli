import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { Group } from './pages/Group';
import { User } from './pages/User';
import { Proofs } from './pages/Proofs';
import { Admin } from './pages/Admin';
import { Loader } from './components/Loader';

const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-navy-900 flex items-center justify-center"><Loader /></div>;
  
  if (!user?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={user?.isAuthenticated ? <Navigate to="/" /> : <Login />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/group" element={<ProtectedRoute><Group /></ProtectedRoute>} />
            <Route path="/user" element={<ProtectedRoute><User /></ProtectedRoute>} />
            <Route path="/proofs" element={<ProtectedRoute><Proofs /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
         <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
