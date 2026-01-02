import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MovieSearch from "./components/MovieSearch"; 
import MovieRandomizer from "./components/MovieRandomizer";
import Watchlist from './components/Watchlist'; 
import { LayoutGrid, Dices, Film } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 para não cobrir o menu no mobile */}
        
        <Routes>
          <Route path="/" element={<MovieSearch />} />
          <Route path="/sorteio" element={<MovieRandomizer />} />
          <Route path="/lista" element={<Watchlist />} />
        </Routes>

        {/* Menu Inferior Estilo App Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center shadow-lg">
          <Link to="/" className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition">
            <LayoutGrid size={24} />
            <span className="text-xs font-medium">Catálogo</span>
          </Link>
          
          <Link to="/sorteio" className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-600 transition">
            <Dices size={24} />
            <span className="text-xs font-medium">Sortear</span>
          </Link>
          
          <Link to="/lista" className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-600 transition">
            <Film size={24} />
            <span className="text-xs font-medium">Lista</span>
          </Link>
        </nav>
      </div>
    </Router>
  );
}

export default App;