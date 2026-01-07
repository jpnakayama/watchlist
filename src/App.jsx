import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MovieSearch from "./components/MovieSearch"; 
import MovieRandomizer from "./components/MovieRandomizer";
import Watchlist from './components/Watchlist';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { LayoutGrid, Dices, Film, Moon, Sun, LogOut, User } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import toast from 'react-hot-toast';

function AppContent() {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error('Erro ao fazer logout');
        console.error('Erro no logout:', error);
      } else {
        toast.success('Logout realizado com sucesso');
        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          navigate('/login', { replace: true });
          // Forçar reload se o navigate não funcionar
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }, 100);
      }
    } catch (err) {
      console.error('Erro inesperado no logout:', err);
      toast.error('Erro ao fazer logout');
      // Mesmo em caso de erro, tentar redirecionar
      navigate('/login', { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 100);
    }
  };

  return (
    <div className={`min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden ${user ? 'pt-16 pb-20' : 'pb-20'}`}> {/* pt-16 para header, pb-20 para menu no mobile */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: isDark ? '#1f2937' : '#fff',
              color: isDark ? '#f3f4f6' : '#333',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/login" 
            element={
              loading ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
                  </div>
                </div>
              ) : user ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MovieSearch />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sorteio" 
            element={
              <ProtectedRoute>
                <MovieRandomizer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lista" 
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* Header com usuário e botão de logout - apenas quando autenticado */}
        {user && (
          <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-40">
            {/* Informações do usuário */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile?.full_name || profile?.username || 'Usuário'}
              </span>
            </div>
            
            {/* Botão de logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Sair"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}

        {/* Menu Inferior Estilo App Mobile - apenas quando autenticado */}
        {user && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 flex items-end justify-center shadow-lg z-50">
            {/* Container com os três botões */}
            <div className="flex items-end justify-center gap-4 w-full max-w-md mx-auto px-4">
              {/* Botão Catálogo */}
              <Link to="/" className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition pb-1">
                <LayoutGrid size={24} />
                <span className="text-xs font-medium">Catálogo</span>
              </Link>
              
              {/* Botão Sortear em destaque - elevado */}
              <Link 
                to="/sorteio" 
                className="flex flex-col items-center gap-1 bg-purple-600 dark:bg-purple-500 text-white rounded-full p-4 -mt-6 shadow-2xl hover:bg-purple-700 dark:hover:bg-purple-600 transition-all transform hover:scale-105 relative z-10"
              >
                <Dices size={28} />
                <span className="text-xs font-semibold">Sortear</span>
              </Link>
              
              {/* Botão Lista */}
              <Link to="/lista" className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition pb-1">
                <Film size={24} />
                <span className="text-xs font-medium">Lista</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;