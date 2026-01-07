import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [forceRender, setForceRender] = useState(false);

  // Timeout de segurança: se loading demorar mais de 2 segundos, forçar renderização
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('ProtectedRoute: timeout no loading, forçando renderização');
        setForceRender(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      setForceRender(false);
    }
  }, [loading]);

  // Aguardar verificação de autenticação (mas não travar indefinidamente)
  if (loading && !forceRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

