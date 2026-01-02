import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Film } from 'lucide-react';

const Watchlist = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar os filmes do Supabase
  const fetchWatchlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar lista:', error);
      alert(`Erro ao carregar lista: ${error.message}. Verifique as políticas RLS no Supabase.`);
    } else {
      setMovies(data || []);
    }
    setLoading(false);
  };

  // Função para remover um filme da lista
  const removeMovie = async (id) => {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) alert('Erro ao remover');
    else fetchWatchlist(); // Recarrega a lista após deletar
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando sua lista...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Film className="text-blue-600" /> Minha Lista ({movies.length})
      </h2>

      {movies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Sua lista está vazia. Comece buscando filmes!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {movies.map((movie) => (
            <div key={movie.id} className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <img 
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                alt={movie.title}
                className="w-24 h-36 object-cover"
              />
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-gray-800 leading-tight">{movie.title}</h3>
                </div>
                <button 
                  onClick={() => removeMovie(movie.id)}
                  className="flex items-center gap-2 text-red-500 text-xs font-semibold hover:bg-red-50 w-fit p-2 rounded-lg transition"
                >
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;