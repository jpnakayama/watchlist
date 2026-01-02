import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Film, Loader2, CheckCircle, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const Watchlist = () => {
  const { isDark, toggleTheme } = useTheme();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // Função para buscar os filmes do Supabase
  const fetchWatchlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar lista:', error);
      toast.error(`Erro ao carregar lista: ${error.message}`);
    } else {
      // Filtrar apenas filmes que aparecem na lista: status = 'listed' ou 'both'
      const filteredMovies = (data || []).filter(movie => 
        movie.status === 'listed' || movie.status === 'both'
      );
      setMovies(filteredMovies);
    }
    setLoading(false);
  };

  // Função para marcar/desmarcar como assistido
  const toggleWatched = async (movieId) => {
    try {
      const movie = movies.find(m => (m.movie_id || m.id) === movieId);
      if (!movie) return;

      const currentStatus = movie.status || 'listed';
      const isCurrentlyWatched = currentStatus === 'watched' || currentStatus === 'both';
      const newWatchedStatus = !isCurrentlyWatched;
      
      let newStatus;
      if (newWatchedStatus) {
        // Marcando como assistido
        newStatus = currentStatus === 'listed' ? 'both' : 'watched';
      } else {
        // Removendo de assistido
        newStatus = currentStatus === 'both' ? 'listed' : 'listed';
      }
      
      const { error } = await supabase
        .from('watchlist')
        .update({ status: newStatus })
        .eq('movie_id', movieId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error(`Erro ao atualizar status: ${error.message}`);
      } else {
        // Atualizar localmente para feedback imediato
        setMovies(movies.map(m => 
          (m.movie_id || m.id) === movieId 
            ? { ...m, status: newStatus }
            : m
        ));
        
        toast.success(
          newWatchedStatus 
            ? `"${movie.title}" marcado como assistido!` 
            : `"${movie.title}" removido dos assistidos!`,
          {
            icon: newWatchedStatus ? '✅' : '👁️',
          }
        );
      }
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    }
  };

  // Função para remover um filme da lista
  const removeMovie = async (movieId) => {
    setRemovingId(movieId);
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('movie_id', movieId);

      if (error) {
        console.error('Erro ao remover filme:', error);
        toast.error(`Erro ao remover filme: ${error.message}`);
      } else {
        // Recarrega a lista após deletar
        await fetchWatchlist();
        // Encontrar o título do filme removido para mostrar no toast
        const removedMovie = movies.find(m => (m.movie_id || m.id) === movieId);
        toast.success(`"${removedMovie?.title || 'Filme'}" removido da lista!`, {
          icon: '🗑️',
        });
      }
    } catch (err) {
      console.error('Erro inesperado ao remover filme:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Carregando sua lista...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Film className="text-blue-600 dark:text-blue-400" /> Minha Lista ({movies.length})
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

      {movies.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-400 dark:text-gray-500">Sua lista está vazia. Comece buscando filmes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {movies.map((movie) => {
            // Usar movie_id se disponível, caso contrário tentar id ou outro campo
            const movieId = movie.movie_id || movie.id;
            return (
              <div key={movieId || movie.title} className="flex bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                  alt={movie.title}
                  className="w-24 h-36 object-cover"
                />
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">{movie.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => toggleWatched(movieId)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition ${
                        (movie.status === 'watched' || movie.status === 'both')
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={(movie.status === 'watched' || movie.status === 'both') ? 'Marcar como não assistido' : 'Marcar como assistido'}
                    >
                      <CheckCircle size={14} className={(movie.status === 'watched' || movie.status === 'both') ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'} />
                      {(movie.status === 'watched' || movie.status === 'both') ? 'Assistido' : 'Assistir'}
                    </button>
                    <button 
                      onClick={() => removeMovie(movieId)}
                      disabled={removingId === movieId}
                      className={`flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg transition ${
                        removingId === movieId ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {removingId === movieId ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Removendo...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} /> Remover
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Watchlist;