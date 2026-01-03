import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dices, Filter, Film, Calendar, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Lista básica de géneros do TMDB (podes expandir depois)
const GENRES = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia",
  36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério",
  10749: "Romance", 878: "Ficção Científica", 53: "Suspense"
};

const MovieRandomizer = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);

  // Estados dos Filtros
  const [genreFilter, setGenreFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
  }, [user]);

  const fetchWatchlist = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id);
      
    if (!error) {
      // Filtrar apenas filmes que estão na lista E não estão assistidos
      // Status 'listed' = na lista e não assistido (pode ser sorteado)
      // Status 'both' = na lista mas também assistido (não deve ser sorteado)
      // Status 'watched' = apenas assistido, não na lista (não deve ser sorteado)
      const availableMovies = (data || []).filter(movie => 
        movie.status === 'listed'
      );
      setWatchlist(availableMovies);
      setFilteredMovies(availableMovies);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let list = [...watchlist];

    if (genreFilter) {
      list = list.filter(m => m.genre_ids?.includes(parseInt(genreFilter)));
    }

    if (yearFilter) {
      list = list.filter(m => m.release_date?.startsWith(yearFilter));
    }

    setFilteredMovies(list);
    return list;
  };

  const pickRandom = () => {
    const listToPick = applyFilters();
    
    if (listToPick.length === 0) {
      alert("Nenhum filme encontrado com estes filtros!");
      return;
    }

    setIsRolling(true);
    setSelectedMovie(null);

    // Efeito visual de "rolar" (opcional, mas divertido)
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * listToPick.length);
      setSelectedMovie(listToPick[randomIndex]);
      setIsRolling(false);
    }, 800);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Dices className="text-purple-600 dark:text-purple-400" /> O que vamos ver hoje?
        </h2>
        {/* Botão de Toggle de Tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Painel de Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400 dark:text-gray-500" />
          <select 
            onChange={(e) => setGenreFilter(e.target.value)}
            className="border-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          >
            <option value="">Todos os Géneros</option>
            {Object.entries(GENRES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
          <input 
            type="number" 
            placeholder="Ano (ex: 2023)"
            onChange={(e) => setYearFilter(e.target.value)}
            className="border-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm w-32 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Botão Principal */}
      <button
        onClick={pickRandom}
        disabled={isRolling || loading}
        className="bg-purple-600 dark:bg-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all flex items-center gap-3 mx-auto active:scale-95 disabled:opacity-50"
      >
        {isRolling ? "A escolher..." : "Sortear Filme"}
        <Dices />
      </button>

      {/* Resultado do Sorteio */}
      <div className="mt-12 min-h-[400px]">
        {selectedMovie && !isRolling && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="max-w-xs mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border-4 border-purple-100 dark:border-purple-900">
              <img 
                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} 
                alt={selectedMovie.title}
                className="w-full h-auto"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedMovie.title}</h3>
                <p className="text-purple-600 dark:text-purple-400 font-medium">{selectedMovie.release_date?.split('-')[0]}</p>
              </div>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 italic">Boa sessão! 🍿</p>
          </div>
        )}
        
        {!selectedMovie && !isRolling && (
          <div className="text-gray-300 dark:text-gray-600 flex flex-col items-center gap-4 mt-20">
            <Film size={64} />
            <p className="text-gray-600 dark:text-gray-400">Tens {filteredMovies.length} filmes na lista com estes filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieRandomizer;