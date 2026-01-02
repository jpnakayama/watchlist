import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { PlusCircle, Loader2, CheckCircle, Film, Search, Filter, X, Info, XCircle, Grid3x3, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const MovieSearch = () => {
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [allFilteredMovies, setAllFilteredMovies] = useState([]); // Todos os filmes filtrados
  const moviesPerPage = 50; // Quantidade de filmes por página
  
  // Estados de busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  // Estados do modal de detalhes
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Estado de visualização
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  
  // Refs para controle de requisições
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Carregar a watchlist e gêneros quando o componente monta
  useEffect(() => {
    fetchWatchlist();
    fetchGenres();
    loadMovies(1);
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/genre/movie/list`, {
        params: {
          api_key: import.meta.env.VITE_TMDB_API_KEY,
          language: 'pt-BR'
        }
      });
      setGenres(response.data.genres);
    } catch (err) {
      console.error("Erro ao carregar gêneros:", err);
    }
  };

  const fetchWatchlist = async () => {
    const { data, error } = await supabase
      .from('watchlist')
      .select('movie_id');
    
    if (!error && data) {
      setWatchlist(data.map(item => item.movie_id));
    }
  };

  const loadMovies = async (pageNum = 1, reset = false, searchTerm = null, genreFilter = null, yearFilter = null, sortFilter = null) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController para esta requisição
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setLoading(true);
    try {
      const queryToUse = searchTerm !== null ? searchTerm : searchQuery;
      
      // Usar valores passados ou estados atuais
      const genreToUse = genreFilter !== null ? genreFilter : selectedGenre;
      const yearToUse = yearFilter !== null ? yearFilter : selectedYear;
      const sortToUse = sortFilter !== null ? sortFilter : sortBy;
      
      // Sempre carregar 50 páginas por vez (1000 filmes)
      const maxPages = 50;
      // Calcular quais páginas carregar baseado na página virtual atual
      // Página virtual 1 = páginas 1-50 da API, Página virtual 2 = páginas 51-100, etc.
      const startPage = (pageNum - 1) * maxPages + 1;
      
      let allResults = [];
      let totalPagesFromAPI = 500; // Valor inicial, será atualizado na primeira requisição
      
      // Carregar todas as páginas necessárias (até 50 páginas)
      // Usar Promise.all para carregar páginas em paralelo (em lotes para não sobrecarregar)
      const batchSize = 10; // Carregar 10 páginas por vez em paralelo
      let totalPagesFromAPITemp = 500; // Valor inicial
      
      for (let batchStart = 0; batchStart < maxPages; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, maxPages);
        const batchPromises = [];
        
        for (let i = batchStart; i < batchEnd; i++) {
          const page = startPage + i;
          
          const requestPromise = (async () => {
            try {
              let response;
              
              if (queryToUse && queryToUse.trim()) {
                // Modo busca
                response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                  params: {
                    api_key: import.meta.env.VITE_TMDB_API_KEY,
                    query: queryToUse,
                    language: 'pt-BR',
                    page: page,
                    include_adult: false
                  },
                  signal
                });
              } else {
                // Modo discover com filtros
                const params = {
                  api_key: import.meta.env.VITE_TMDB_API_KEY,
                  language: 'pt-BR',
                  sort_by: sortToUse,
                  page: page,
                  include_adult: false
                };
                
                // Filtros de qualidade baseados na ordenação
                if (sortToUse === 'popularity.desc') {
                  params['vote_count.gte'] = 200;
                  params['vote_average.gte'] = 6.0;
                } else if (sortToUse === 'vote_average.desc') {
                  params['vote_count.gte'] = 100;
                  params['vote_average.gte'] = 5.0;
                } else {
                  params['vote_count.gte'] = 100;
                  params['vote_average.gte'] = 5.0;
                }
                
                if (genreToUse) {
                  params.with_genres = genreToUse;
                }
                
                if (yearToUse) {
                  params.primary_release_year = yearToUse;
                }
                
                if (sortToUse === 'release_date.desc') {
                  const today = new Date().toISOString().split('T')[0];
                  params['primary_release_date.lte'] = today;
                }
                
                response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, { 
                  params,
                  signal
                });
              }
              
              // Atualizar total de páginas na primeira requisição do primeiro batch
              if (i === 0) {
                totalPagesFromAPITemp = response.data.total_pages;
              }
              
              // Se não houver mais páginas, retornar null para indicar que deve parar
              if (page > totalPagesFromAPITemp) {
                return null;
              }
              
              return response.data.results;
            } catch (err) {
              // Ignorar erros de cancelamento
              if (axios.isCancel(err) || err.name === 'AbortError') {
                return null;
              }
              // Para outros erros, logar mas continuar
              console.warn(`Erro ao carregar página ${page}:`, err.message);
              return null;
            }
          })();
          
          batchPromises.push(requestPromise);
        }
        
        // Aguardar todas as requisições do batch
        const batchResults = await Promise.all(batchPromises);
        
        // Adicionar resultados ao array principal
        for (const results of batchResults) {
          if (results && results.length > 0) {
            allResults = [...allResults, ...results];
          }
        }
        
        // Atualizar totalPagesFromAPI após o primeiro batch
        if (batchStart === 0) {
          totalPagesFromAPI = totalPagesFromAPITemp;
          // Se não houver mais páginas disponíveis, parar
          if (startPage > totalPagesFromAPI) {
            break;
          }
        }
        
        // Se chegamos ao limite de páginas disponíveis, parar
        if (startPage + batchEnd > totalPagesFromAPI) {
          break;
        }
      }
      
      totalPagesFromAPI = totalPagesFromAPITemp;
      
      // Filtrar filmes dos resultados (filtro adicional no cliente)
      let filteredResults = allResults;
      
      // Usar sortToUse para os filtros client-side também
      const sortForFilter = sortFilter !== null ? sortFilter : sortBy;
      
      // Filtrar filmes não lançados
      if (sortForFilter === 'release_date.desc' || (queryToUse && queryToUse.trim())) {
        const today = new Date().toISOString().split('T')[0];
        filteredResults = filteredResults.filter(movie => {
          if (!movie.release_date) return false;
          return movie.release_date <= today;
        });
      }
      
      // Filtrar filmes com base na ordenação (garantir mesmo na busca)
      filteredResults = filteredResults.filter(movie => {
        if (sortForFilter === 'popularity.desc') {
          return movie.vote_count >= 200 && movie.vote_average >= 6.0;
        } else {
          return movie.vote_count >= 100 && movie.vote_average >= 5.0;
        }
      });
      
      // Remover duplicatas (caso algum filme apareça em múltiplas páginas)
      const uniqueMovies = filteredResults.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );
      
      // Debug: log temporário para verificar quantos filmes foram carregados
      console.log(`Carregados: ${allResults.length} filmes brutos, ${filteredResults.length} após filtros, ${uniqueMovies.length} únicos`);
      
      // Se for reset ou primeira página, substituir todos os filmes filtrados
      // Caso contrário, adicionar aos existentes (para carregar mais páginas da API)
      if (reset || pageNum === 1) {
        setAllFilteredMovies(uniqueMovies);
        setPage(1); // Resetar para página 1 quando carregar novos filmes
      } else {
        setAllFilteredMovies(prev => {
          const combined = [...prev, ...uniqueMovies];
          // Remover duplicatas também ao adicionar
          return combined.filter((movie, index, self) =>
            index === self.findIndex(m => m.id === movie.id)
          );
        });
      }
      
      // Calcular quantas "páginas virtuais" temos (cada uma representa 50 páginas da API)
      const virtualTotalPages = Math.ceil(totalPagesFromAPI / maxPages);
      
      // Verificar se há mais páginas da API para carregar
      setHasMore(pageNum < virtualTotalPages);
      
      // Recarregar a watchlist para verificar filmes já adicionados
      await fetchWatchlist();
    } catch (err) {
      // Ignorar erros de cancelamento
      if (axios.isCancel(err) || err.name === 'AbortError') {
        return;
      }
      console.error("Erro ao carregar filmes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      // Calcular qual página virtual da API carregar (50 páginas = 1000 filmes por página virtual)
      const maxPagesPerVirtualPage = 50;
      const currentVirtualPage = Math.floor((allFilteredMovies.length / (maxPagesPerVirtualPage * 20))) + 1;
      loadMovies(currentVirtualPage + 1, false);
    }
  };

  // Calcular filmes a exibir na página atual (paginação client-side)
  const currentPageMovies = useMemo(() => {
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return allFilteredMovies.slice(startIndex, endIndex);
  }, [allFilteredMovies, page, moviesPerPage]);

  // Calcular total de páginas baseado nos filmes filtrados
  const totalPagesFiltered = useMemo(() => {
    return Math.ceil(allFilteredMovies.length / moviesPerPage);
  }, [allFilteredMovies.length, moviesPerPage]);

  // Atualizar totalPages quando os filmes filtrados mudarem
  useEffect(() => {
    setTotalPages(totalPagesFiltered);
    // Resetar para página 1 se a página atual for maior que o total
    if (page > totalPagesFiltered && totalPagesFiltered > 0) {
      setPage(1);
    }
  }, [totalPagesFiltered, page]);

  const goToPage = (newPage) => {
    if (!loading && newPage >= 1 && newPage <= totalPagesFiltered) {
      setPage(newPage);
      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextPage = () => {
    if (!loading && page < totalPagesFiltered) {
      goToPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!loading && page > 1) {
      goToPage(page - 1);
    }
  };

  // Busca com debounce
  const debouncedSearch = (query) => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Se a query estiver vazia, voltar ao modo catálogo
    if (!query.trim()) {
      setIsSearchMode(false);
      setPage(1);
      loadMovies(1, true);
      return;
    }
    
    // Criar novo timeout
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearchMode(true);
      setPage(1);
      loadMovies(1, true, query);
    }, 500); // 500ms de debounce
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Limpar timeout se houver
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Executar busca imediatamente no submit
    if (searchQuery.trim()) {
      setIsSearchMode(true);
      setPage(1);
      loadMovies(1, true, searchQuery);
    }
  };
  
  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFilterChange = (newGenre = null, newYear = null, newSortBy = null) => {
    setIsSearchMode(false);
    setPage(1);
    
    // Atualizar estados primeiro
    if (newGenre !== null) setSelectedGenre(newGenre);
    if (newYear !== null) setSelectedYear(newYear);
    if (newSortBy !== null) setSortBy(newSortBy);
    
    // Carregar filmes com os valores passados diretamente (não esperar atualização do estado)
    loadMovies(1, true, null, newGenre !== null ? newGenre : selectedGenre, newYear !== null ? newYear : selectedYear, newSortBy !== null ? newSortBy : sortBy);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSortBy('popularity.desc');
    setIsSearchMode(false);
    setPage(1);
    loadMovies(1, true);
  };

  const hasActiveFilters = searchQuery || selectedGenre || selectedYear || sortBy !== 'popularity.desc';

  const addToWatchlist = async (movie) => {
    // Verificar se o filme já está na lista
    if (watchlist.includes(movie.id)) {
      alert(`"${movie.title}" já está na sua lista!`);
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .insert([
        { 
          movie_id: movie.id, 
          title: movie.title, 
          poster_path: movie.poster_path
        }
      ]);

    if (error) {
        alert("Erro ao adicionar: " + error.message);
    } else {
        alert(`"${movie.title}" foi para sua lista!`);
        // Atualizar a watchlist local
        setWatchlist([...watchlist, movie.id]);
    }
  };

  const isInWatchlist = (movieId) => {
    return watchlist.includes(movieId);
  };

  const fetchMovieDetails = async (movieId) => {
    setLoadingDetails(true);
    try {
      const [detailsResponse, creditsResponse, watchProvidersResponse, externalIdsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          params: {
            api_key: import.meta.env.VITE_TMDB_API_KEY,
            language: 'pt-BR'
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          params: {
            api_key: import.meta.env.VITE_TMDB_API_KEY,
            language: 'pt-BR'
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers`, {
          params: {
            api_key: import.meta.env.VITE_TMDB_API_KEY
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/external_ids`, {
          params: {
            api_key: import.meta.env.VITE_TMDB_API_KEY
          }
        })
      ]);

      const director = creditsResponse.data.crew.find(person => person.job === 'Director');
      const cast = creditsResponse.data.cast.slice(0, 10);
      const providers = watchProvidersResponse.data.results?.BR || watchProvidersResponse.data.results?.US || {};
      const externalIds = externalIdsResponse.data;

      setMovieDetails({
        ...detailsResponse.data,
        director,
        cast,
        providers,
        externalIds
      });
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openMovieDetails = (movie) => {
    setSelectedMovie(movie);
    setMovieDetails(null);
    fetchMovieDetails(movie.id);
  };

  const closeMovieDetails = () => {
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Título do Catálogo */}
      <div className="mb-6 flex items-center gap-2">
        <Film className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Filmes</h1>
      </div>

      {/* Barra de Busca */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            debouncedSearch(e.target.value);
          }}
          placeholder="Busque um filme..."
          className="w-full p-4 pl-12 rounded-xl bg-gray-100 border-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
        <button 
          type="submit"
          className="absolute right-3 top-2.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>

      {/* Controles de Visualização e Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          {/* Filtros à esquerda */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <label className="text-sm text-gray-600">Gênero:</label>
              <select 
                value={selectedGenre}
                onChange={(e) => {
                  handleFilterChange(e.target.value, null, null);
                }}
                className="border-none bg-gray-50 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                <option value="">Todos</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ano:</label>
              <select 
                value={selectedYear}
                onChange={(e) => {
                  handleFilterChange(null, e.target.value, null);
                }}
                className="border-none bg-gray-50 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              >
                <option value="">Todos</option>
                {Array.from({ length: 100 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Ordenar por:</label>
              <select 
                value={sortBy}
                onChange={(e) => {
                  handleFilterChange(null, null, e.target.value);
                }}
                className="border-none bg-gray-50 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="popularity.desc">Mais Populares</option>
                <option value="vote_average.desc">Melhor Avaliados</option>
                <option value="release_date.desc">Mais Recentes</option>
                <option value="release_date.asc">Mais Antigos</option>
                <option value="title.asc">Título (A-Z)</option>
                <option value="title.desc">Título (Z-A)</option>
              </select>
            </div>

          </div>

          {/* Botões de Visualização à direita */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Visualização em Grid"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {loading && allFilteredMovies.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Visualização em Grid
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {currentPageMovies.map((movie) => (
                <div key={movie.id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                  <div className="relative h-80 overflow-hidden">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">Sem Foto</div>
                    )}
                    <button
                      onClick={() => openMovieDetails(movie)}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                      title="Ver detalhes"
                    >
                      <Info size={18} />
                    </button>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                    <p className="text-xs text-gray-500">{movie.release_date?.split('-')[0]}</p>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openMovieDetails(movie)}
                        className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition text-xs font-semibold"
                      >
                        <Info size={14} />
                        Detalhes
                      </button>
                      
                      {isInWatchlist(movie.id) ? (
                        <button 
                          disabled
                          className="flex-1 flex items-center gap-1 justify-center bg-green-50 text-green-600 py-2 rounded-md border border-green-200 cursor-not-allowed text-xs font-semibold"
                        >
                          <CheckCircle size={14} />
                          Na Lista
                        </button>
                      ) : (
                        <button 
                          onClick={() => addToWatchlist(movie)}
                          className="flex-1 flex items-center gap-1 justify-center bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 transition border border-blue-200 text-xs font-semibold"
                        >
                          <PlusCircle size={14} />
                          Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Visualização em Lista Miniatura (3-4 filmes por linha)
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentPageMovies.map((movie) => (
                <div key={movie.id} className="group bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                  <div className="flex">
                    {/* Poster Miniatura */}
                    <div className="relative w-20 h-28 flex-shrink-0">
                      {movie.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Sem Foto</div>
                      )}
                    </div>
                    
                    {/* Informações */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {movie.release_date && (
                            <span>{movie.release_date.split('-')[0]}</span>
                          )}
                          {movie.vote_average > 0 && (
                            <span className="flex items-center gap-1">
                              ⭐ {movie.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Botões de Ação */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openMovieDetails(movie)}
                          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-1.5 rounded-md hover:bg-gray-200 transition text-xs font-semibold"
                        >
                          <Info size={12} />
                          Detalhes
                        </button>
                        
                        {isInWatchlist(movie.id) ? (
                          <button 
                            disabled
                            className="flex-1 flex items-center gap-1 justify-center bg-green-50 text-green-600 py-1.5 rounded-md border border-green-200 cursor-not-allowed text-xs font-semibold"
                          >
                            <CheckCircle size={12} />
                            Na Lista
                          </button>
                        ) : (
                          <button 
                            onClick={() => addToWatchlist(movie)}
                            className="flex-1 flex items-center gap-1 justify-center bg-blue-50 text-blue-600 py-1.5 rounded-md hover:bg-blue-100 transition border border-blue-200 text-xs font-semibold"
                          >
                            <PlusCircle size={12} />
                            Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Controles de Paginação */}
          {allFilteredMovies.length > 0 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              {/* Informação de paginação */}
              <div className="text-sm text-gray-600">
                Página {page} de {totalPagesFiltered > 0 ? totalPagesFiltered : 1} • {allFilteredMovies.length} filme{allFilteredMovies.length !== 1 ? 's' : ''} encontrado{allFilteredMovies.length !== 1 ? 's' : ''} • Mostrando {currentPageMovies.length} de {allFilteredMovies.length}
              </div>
              
              {/* Botões de navegação */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={loading || page === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
                
                {/* Números de página (mostrar algumas páginas ao redor da atual) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPagesFiltered) }, (_, i) => {
                    let pageNum;
                    if (totalPagesFiltered <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPagesFiltered - 2) {
                      pageNum = totalPagesFiltered - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={loading}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={loading || page === totalPagesFiltered}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Próxima
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalhes do Filme */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeMovieDetails}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={48} />
              </div>
            ) : movieDetails ? (
              <div className="relative">
                {/* Header com imagem de fundo */}
                <div 
                  className="relative h-64 bg-cover bg-center"
                  style={{
                    backgroundImage: movieDetails.backdrop_path 
                      ? `url(https://image.tmdb.org/t/p/w1280${movieDetails.backdrop_path})`
                      : 'linear-gradient(to bottom, #1e40af, #3b82f6)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  <button
                    onClick={closeMovieDetails}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10"
                  >
                    <XCircle size={24} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h2 className="text-3xl font-bold mb-2">{movieDetails.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                      {movieDetails.release_date && (
                        <span>{new Date(movieDetails.release_date).getFullYear()}</span>
                      )}
                      {movieDetails.runtime && (
                        <span>{movieDetails.runtime} min</span>
                      )}
                    </div>
                    {/* Avaliações */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {movieDetails.vote_average > 0 && (
                        <span className="bg-black/30 px-3 py-1 rounded">
                          <span className="font-semibold">TMDB:</span> ⭐ {movieDetails.vote_average.toFixed(1)}/10
                          {movieDetails.vote_count > 0 && (
                            <span className="text-xs opacity-80"> ({movieDetails.vote_count.toLocaleString()} votos)</span>
                          )}
                        </span>
                      )}
                      {movieDetails.externalIds?.imdb_id && (
                        <a
                          href={`https://www.imdb.com/title/${movieDetails.externalIds.imdb_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black/30 px-3 py-1 rounded hover:bg-black/50 transition"
                        >
                          <span className="font-semibold">IMDb:</span> Ver no IMDb
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {/* Poster */}
                    <div className="md:col-span-1">
                      {movieDetails.poster_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                          alt={movieDetails.title}
                          className="w-full rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                          Sem Poster
                        </div>
                      )}
                    </div>

                    {/* Informações principais */}
                    <div className="md:col-span-2">
                      {/* Sinopse */}
                      {movieDetails.overview && (
                        <div className="mb-6">
                          <h3 className="text-xl font-bold mb-2">Sinopse</h3>
                          <p className="text-gray-700 leading-relaxed">{movieDetails.overview}</p>
                        </div>
                      )}

                      {/* Diretor */}
                      {movieDetails.director && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-1">Diretor</h3>
                          <p className="text-gray-700">{movieDetails.director.name}</p>
                        </div>
                      )}

                      {/* Gêneros */}
                      {movieDetails.genres && movieDetails.genres.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Gêneros</h3>
                          <div className="flex flex-wrap gap-2">
                            {movieDetails.genres.map((genre) => (
                              <span key={genre.id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {genre.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Onde assistir */}
                      {movieDetails.providers && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2">Onde Assistir</h3>
                          <div className="flex flex-wrap gap-3">
                            {movieDetails.providers.flatrate && movieDetails.providers.flatrate.length > 0 ? (
                              <>
                                <span className="text-sm text-gray-600">Streaming:</span>
                                {movieDetails.providers.flatrate.map((provider) => (
                                  <img
                                    key={provider.provider_id}
                                    src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    title={provider.provider_name}
                                    className="h-8 rounded"
                                  />
                                ))}
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">Informação não disponível</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Elenco */}
                  {movieDetails.cast && movieDetails.cast.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Elenco Principal</h3>
                      <ul className="space-y-2">
                        {movieDetails.cast.map((actor) => (
                          <li key={actor.id} className="text-gray-700">
                            <span className="font-semibold">{actor.name}</span>
                            {actor.character && (
                              <span className="text-gray-500"> como {actor.character}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botão de adicionar à lista */}
                  <div className="mt-6 pt-6 border-t">
                    {isInWatchlist(movieDetails.id) ? (
                      <button 
                        disabled
                        className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 py-3 rounded-lg border border-green-200 cursor-not-allowed font-semibold"
                      >
                        <CheckCircle size={20} />
                        Já está na sua lista
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          addToWatchlist(movieDetails);
                          closeMovieDetails();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        <PlusCircle size={20} />
                        Adicionar à Minha Lista
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieSearch;