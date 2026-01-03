import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MovieSearch from "./components/MovieSearch"; 
import MovieRandomizer from "./components/MovieRandomizer";
import Watchlist from './components/Watchlist'; 
import { LayoutGrid, Dices, Film, Moon, Sun } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors"> {/* pb-20 para não cobrir o menu no mobile */}
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
          <Route path="/" element={<MovieSearch />} />
          <Route path="/sorteio" element={<MovieRandomizer />} />
          <Route path="/lista" element={<Watchlist />} />
        </Routes>

        {/* Menu Inferior Estilo App Mobile */}
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
      </div>
    </Router>
  );
}

export default App;