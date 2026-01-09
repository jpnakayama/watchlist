import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { PlusCircle, Loader2, CheckCircle, Film, Search, Filter, X, Info, XCircle, Grid3x3, List, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Moon, Sun, Bookmark, Eye, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Listas de diretores, atores e franquias principais
const POPULAR_DIRECTORS = [
  { id: 1032, name: 'Christopher Nolan' },
  { id: 525, name: 'Quentin Tarantino' },
  { id: 2710, name: 'Martin Scorsese' },
  { id: 18897, name: 'Steven Spielberg' },
  { id: 108916, name: 'Denis Villeneuve' },
  { id: 17825, name: 'Ridley Scott' },
  { id: 19292, name: 'David Fincher' },
  { id: 2, name: 'James Cameron' },
  { id: 12891, name: 'Peter Jackson' },
  { id: 9066, name: 'Tim Burton' },
  { id: 1243, name: 'Clint Eastwood' },
  { id: 1160, name: 'Ridley Scott' },
  { id: 1813, name: 'Wes Anderson' },
  { id: 1776, name: 'Paul Thomas Anderson' },
  { id: 1271, name: 'Coen Brothers' },
  { id: 2231, name: 'Spike Lee' },
  { id: 90633, name: 'Bong Joon-ho' },
  { id: 1100, name: 'Alejandro González Iñárritu' },
  { id: 190, name: 'Alfonso Cuarón' },
  { id: 11856, name: 'Guillermo del Toro' }
];

const POPULAR_CAST = [
  { id: 6193, name: 'Leonardo DiCaprio' },
  { id: 500, name: 'Tom Cruise' },
  { id: 287, name: 'Brad Pitt' },
  { id: 31, name: 'Tom Hanks' },
  { id: 3223, name: 'Robert Downey Jr.' },
  { id: 1245, name: 'Scarlett Johansson' },
  { id: 976, name: 'Jennifer Lawrence' },
  { id: 514, name: 'Johnny Depp' },
  { id: 3896, name: 'Will Smith' },
  { id: 1136406, name: 'Tom Holland' },
  { id: 117642, name: 'Jason Momoa' },
  { id: 172069, name: 'Chris Hemsworth' },
  { id: 74568, name: 'Chris Evans' },
  { id: 550843, name: 'Margot Robbie' },
  { id: 115440, name: 'Gal Gadot' },
  { id: 234352, name: 'Brie Larson' },
  { id: 54693, name: 'Emma Stone' },
  { id: 11701, name: 'Natalie Portman' },
  { id: 1813, name: 'Meryl Streep' },
  { id: 5149, name: 'Cate Blanchett' }
];


const MovieSearch = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState(new Set()); // Set de IDs de filmes assistidos
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
  
  // Novos filtros client-side
  const [filterInList, setFilterInList] = useState(false);
  const [filterWatched, setFilterWatched] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Estados temporários para filtros (antes de aplicar)
  const [tempGenre, setTempGenre] = useState('');
  const [tempYear, setTempYear] = useState('');
  const [tempSortBy, setTempSortBy] = useState('popularity.desc');
  const [tempCountry, setTempCountry] = useState('');
  // Estado para tipo de busca (filme, diretor, elenco)
  const [searchType, setSearchType] = useState('movie'); // 'movie', 'director', 'cast'
  
  // Estados do modal de detalhes
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Estado de visualização
  const [viewMode, setViewMode] = useState('list'); // 'grid' ou 'list'
  
  // Refs para controle de requisições
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Carregar a watchlist, gêneros e países quando o componente monta
  useEffect(() => {
    if (user) {
      fetchWatchlist();
    }
    fetchGenres();
    fetchCountries();
    loadMovies(1);
    
    // Inicializar estados temporários com os valores iniciais
    setTempGenre('');
    setTempYear('');
    setTempSortBy('popularity.desc');
    setTempCountry('');
  }, [user]);

  // Sincronizar estados temporários com os filtros aplicados quando os filtros são expandidos
  useEffect(() => {
    if (filtersExpanded) {
      setTempGenre(selectedGenre);
      setTempYear(selectedYear);
      setTempSortBy(sortBy);
      setTempCountry(selectedCountry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersExpanded]); // Sincronizar apenas quando expandir, não quando os filtros mudarem

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

  const fetchCountries = async () => {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/configuration/countries`, {
        params: {
          api_key: import.meta.env.VITE_TMDB_API_KEY,
          language: 'pt-BR'
        }
      });
      // Ordenar países por nome
      const sortedCountries = response.data.sort((a, b) => a.english_name.localeCompare(b.english_name));
      setCountries(sortedCountries);
    } catch (err) {
      console.error("Erro ao carregar países:", err);
    }
  };

  const fetchWatchlist = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('movie_id, status')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Erro ao buscar watchlist:', error);
        // Se for erro 406, pode ser problema de sessão
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.warn('Erro ao buscar watchlist');
        }
        return;
      }
      
      if (data) {
        // Filmes que aparecem na lista: status = 'listed' ou 'both'
        setWatchlist(
          data
            .filter(item => item.status === 'listed' || item.status === 'both')
            .map(item => item.movie_id)
        );
        // Filmes assistidos: status = 'watched' ou 'both'
        const watched = new Set(
          data
            .filter(item => item.status === 'watched' || item.status === 'both')
            .map(item => item.movie_id)
        );
        setWatchedMovies(watched);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar watchlist:', err);
    }
  };

  const loadMovies = async (pageNum = 1, reset = false, searchTerm = null, genreFilter = null, yearFilter = null, sortFilter = null, countryFilter = null) => {
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
      const countryToUse = countryFilter !== null ? countryFilter : selectedCountry;
      // Se houver busca, tratar de acordo com o tipo selecionado
      const trimmedQuery = queryToUse ? queryToUse.trim() : '';
      if (trimmedQuery && searchType !== 'movie') {
        // Buscar por diretor ou elenco
        try {
          const personSearch = await axios.get(`https://api.themoviedb.org/3/search/person`, {
            params: {
              api_key: import.meta.env.VITE_TMDB_API_KEY,
              query: trimmedQuery,
              language: 'pt-BR',
              page: 1
            },
            signal
          });
          
          // Se encontrou pessoa, buscar filmes dela
          if (personSearch.data.results && personSearch.data.results.length > 0) {
            const person = personSearch.data.results[0];
            const personId = person.id;
            
            // Buscar créditos da pessoa
            const creditsResponse = await axios.get(`https://api.themoviedb.org/3/person/${personId}/movie_credits`, {
              params: {
                api_key: import.meta.env.VITE_TMDB_API_KEY,
                language: 'pt-BR'
              },
              signal
            });
            
            // Filtrar por tipo: diretor ou elenco
            let personMovies = [];
            if (searchType === 'director') {
              personMovies = (creditsResponse.data.crew || []).filter(m => m.job === 'Director');
            } else if (searchType === 'cast') {
              personMovies = creditsResponse.data.cast || [];
            }
            
            // Filtrar filmes com base na qualidade
            let filteredMovies = personMovies.filter(movie => {
              return movie.vote_count >= 50 && movie.vote_average >= 4.0;
            });
            
            // Aplicar ordenação
            if (sortToUse) {
              filteredMovies = [...filteredMovies].sort((a, b) => {
                if (sortToUse === 'popularity.desc') {
                  return (b.popularity || 0) - (a.popularity || 0);
                } else if (sortToUse === 'vote_average.desc') {
                  return (b.vote_average || 0) - (a.vote_average || 0);
                } else if (sortToUse === 'release_date.desc') {
                  return new Date(b.release_date || 0) - new Date(a.release_date || 0);
                } else if (sortToUse === 'release_date.asc') {
                  return new Date(a.release_date || 0) - new Date(b.release_date || 0);
                } else if (sortToUse === 'title.asc') {
                  return (a.title || '').localeCompare(b.title || '');
                } else if (sortToUse === 'title.desc') {
                  return (b.title || '').localeCompare(a.title || '');
                }
                return 0;
              });
            }
            
            setAllFilteredMovies(filteredMovies);
            setPage(1);
            setHasMore(false);
            await fetchWatchlist();
            setLoading(false);
            return;
          }
        } catch (err) {
          if (axios.isCancel(err) || err.name === 'AbortError') {
            return;
          }
          // Se der erro ao buscar pessoa, mostrar erro e parar
          console.error("Erro ao buscar pessoa:", err);
          setLoading(false);
          return;
        }
      }
      
      // Carregar TODAS as páginas disponíveis (até 500 páginas = 10.000 filmes)
      const maxPages = 500; // Máximo permitido pela API
      // Sempre começar da página 1 quando for reset ou primeira carga
      const startPage = (reset || pageNum === 1) ? 1 : (pageNum - 1) * 50 + 1;
      
      let allResults = [];
      let totalPagesFromAPI = 500; // Valor inicial, será atualizado na primeira requisição
      
      // Carregar todas as páginas em lotes paralelos
      // Usar Promise.all para carregar páginas em paralelo (em lotes para não sobrecarregar)
      const batchSize = 20; // Carregar 20 páginas por vez em paralelo (aumentado para melhor performance)
      let totalPagesFromAPITemp = 500; // Valor inicial
      
      for (let batchStart = 0; batchStart < maxPages; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, maxPages);
        const batchPromises = [];
        
        for (let i = batchStart; i < batchEnd; i++) {
          const page = startPage + i;
          
          const requestPromise = (async () => {
            try {
              let response;
              
              if (trimmedQuery) {
                // Modo busca por filme (pessoa já foi tratada antes do loop)
                response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                  params: {
                    api_key: import.meta.env.VITE_TMDB_API_KEY,
                    query: trimmedQuery,
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
                
                // Filtro de país (nacionalidade)
                if (countryToUse) {
                  params.with_origin_country = countryToUse;
                }
                
                // Filtro de franquia é tratado antes (busca direta da coleção)
                // Não precisa adicionar aqui
                
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
      const hasSearchQuery = queryToUse && queryToUse.trim();
      if (sortForFilter === 'release_date.desc' || hasSearchQuery) {
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
      
      
      // Sempre substituir todos os filmes quando carregar tudo
      setAllFilteredMovies(uniqueMovies);
      setPage(1); // Resetar para página 1
      
      // Não há mais páginas para carregar (já carregamos tudo)
      setHasMore(false);
      
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

  // Funções auxiliares (precisam estar antes do useMemo que as usa)
  const isInWatchlist = (movieId) => {
    return watchlist.includes(movieId);
  };

  const isWatched = (movieId) => {
    return watchedMovies.has(movieId);
  };

  // Filtrar filmes client-side baseado nos novos filtros
  const clientFilteredMovies = useMemo(() => {
    let filtered = allFilteredMovies;

    // Se estiver em modo de busca, aplicar filtros client-side
    if (isSearchMode) {
      // Filtro de gênero
      if (selectedGenre) {
        const genreId = parseInt(selectedGenre);
        filtered = filtered.filter(movie => 
          movie.genre_ids && movie.genre_ids.includes(genreId)
        );
      }

      // Filtro de ano
      if (selectedYear) {
        filtered = filtered.filter(movie => 
          movie.release_date && movie.release_date.startsWith(selectedYear)
        );
      }

      // Filtro de país (nacionalidade)
      if (selectedCountry) {
        filtered = filtered.filter(movie => {
          if (!movie.origin_country) return false;
          // origin_country pode ser um array ou string
          if (Array.isArray(movie.origin_country)) {
            return movie.origin_country.includes(selectedCountry);
          }
          return movie.origin_country === selectedCountry;
        });
      }

      // Ordenação client-side
      if (sortBy) {
        filtered = [...filtered].sort((a, b) => {
          if (sortBy === 'popularity.desc') {
            return (b.popularity || 0) - (a.popularity || 0);
          } else if (sortBy === 'vote_average.desc') {
            return (b.vote_average || 0) - (a.vote_average || 0);
          } else if (sortBy === 'release_date.desc') {
            return new Date(b.release_date || 0) - new Date(a.release_date || 0);
          } else if (sortBy === 'release_date.asc') {
            return new Date(a.release_date || 0) - new Date(b.release_date || 0);
          } else if (sortBy === 'title.asc') {
            return (a.title || '').localeCompare(b.title || '');
          } else if (sortBy === 'title.desc') {
            return (b.title || '').localeCompare(a.title || '');
          }
          return 0;
        });
      }
    }

    // Filtro: apenas na lista
    if (filterInList) {
      filtered = filtered.filter(movie => isInWatchlist(movie.id));
    }

    // Filtro: apenas assistidos
    if (filterWatched) {
      filtered = filtered.filter(movie => isWatched(movie.id));
    }

    return filtered;
  }, [allFilteredMovies, isSearchMode, selectedGenre, selectedYear, selectedCountry, sortBy, filterInList, filterWatched, watchlist, watchedMovies]);

  // Calcular filmes a exibir na página atual (paginação client-side)
  const currentPageMovies = useMemo(() => {
    const startIndex = (page - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return clientFilteredMovies.slice(startIndex, endIndex);
  }, [clientFilteredMovies, page, moviesPerPage]);

  // Calcular total de páginas baseado nos filmes filtrados (client-side)
  const totalPagesFiltered = useMemo(() => {
    return Math.ceil(clientFilteredMovies.length / moviesPerPage);
  }, [clientFilteredMovies.length, moviesPerPage]);

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

  // Busca com debounce (mais rápido)
  const debouncedSearch = (query) => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Se a query estiver vazia, voltar ao modo catálogo imediatamente
    if (!query || !query.trim()) {
      setIsSearchMode(false);
      setPage(1);
      // Passar string vazia explicitamente para garantir que não use busca
      loadMovies(1, true, '', null, null, null, null);
      return;
    }
    
    // Para busca por diretor ou elenco, usar debounce menor (200ms) para resposta mais rápida
    // Para busca por filme, usar debounce normal (300ms)
    const debounceTime = searchType !== 'movie' ? 200 : 300;
    
    // Criar novo timeout com debounce
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearchMode(true);
      setPage(1);
      loadMovies(1, true, query.trim());
    }, debounceTime);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    // Limpar timeout se houver
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Atualizar estados primeiro
    setSearchQuery('');
    setIsSearchMode(false);
    setPage(1);
    
    // Forçar recarregamento imediato - passar string vazia explicitamente
    // para garantir que não use busca, mesmo que o estado ainda não tenha sido atualizado
    loadMovies(1, true, '', null, null, null, null);
  };
  
  // Limpar timeouts e abort controller ao desmontar
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

  const applyFilters = () => {
    setPage(1);
    
    // Aplicar os valores temporários aos estados reais
    setSelectedGenre(tempGenre);
    setSelectedYear(tempYear);
    setSortBy(tempSortBy);
    setSelectedCountry(tempCountry);
    
    // Se estiver em modo de busca, manter a busca e aplicar filtros client-side
    // Caso contrário, recarregar da API com os filtros
    if (isSearchMode && searchQuery.trim()) {
      // Manter modo de busca - os filtros serão aplicados client-side no useMemo
      // Não precisa recarregar da API
    } else {
      // Sair do modo de busca e carregar com filtros da API
      setIsSearchMode(false);
      loadMovies(1, true, null, tempGenre, tempYear, tempSortBy, tempCountry);
    }
  };

  const clearFilters = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Limpar estados temporários primeiro
    setTempGenre('');
    setTempYear('');
    setTempSortBy('popularity.desc');
    setTempCountry('');
    
    // Limpar todos os estados reais
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSortBy('popularity.desc');
    setSelectedCountry('');
    setFilterInList(false);
    setFilterWatched(false);
    setIsSearchMode(false);
    setPage(1);
    
    // Carregar filmes sem filtros - usar valores explícitos
    loadMovies(1, true, '', '', '', 'popularity.desc', '');
  };

  const hasActiveFilters = searchQuery || selectedGenre || selectedYear || sortBy !== 'popularity.desc';

  const addToWatchlist = async (movie) => {
    // Verificar se o filme já está na lista
    if (watchlist.includes(movie.id)) {
      toast(`"${movie.title}" já está na sua lista!`, {
        icon: 'ℹ️',
      });
      return;
    }

    // Verificar se o filme já existe na tabela
    const { data: existing, error: checkError } = await supabase
      .from('watchlist')
      .select('movie_id, status')
      .eq('movie_id', movie.id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar filme:', checkError);
      toast.error(`Erro ao verificar filme: ${checkError.message}`);
      return;
    }

    if (existing) {
      // Se já existe e está apenas como 'watched', mudar para 'both'
      // Se já existe e está como 'both', não fazer nada (já está na lista)
      let newStatus = 'both';
      if (existing.status === 'watched') {
        newStatus = 'both';
      } else if (existing.status === 'both') {
        toast(`"${movie.title}" já está na sua lista!`, {
          icon: 'ℹ️',
        });
        return;
      }

      const { error } = await supabase
        .from('watchlist')
        .update({ status: newStatus })
        .eq('movie_id', movie.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao adicionar:', error);
        // Se for erro 406
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          toast.error('Erro ao processar requisição. Tente novamente.');
        } else {
          toast.error("Erro ao adicionar: " + error.message);
        }
      } else {
        toast.success(`"${movie.title}" adicionado à lista!`, {
          icon: '✅',
        });
        setWatchlist([...watchlist, movie.id]);
        // Recarregar watchlist para garantir sincronização
        await fetchWatchlist();
      }
    } else {
      // Se não existe, inserir novo registro com status 'listed'
      const { error } = await supabase
        .from('watchlist')
        .insert([
          { 
            movie_id: movie.id, 
            title: movie.title, 
            poster_path: movie.poster_path,
            status: 'listed',
            user_id: user.id
          }
        ]);

      if (error) {
        console.error('Erro ao adicionar:', error);
        // Se for erro 406
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          toast.error('Erro ao processar requisição. Tente novamente.');
        } else {
          toast.error("Erro ao adicionar: " + error.message);
        }
      } else {
        toast.success(`"${movie.title}" adicionado à lista!`, {
          icon: '✅',
        });
        setWatchlist([...watchlist, movie.id]);
        // Recarregar watchlist para garantir sincronização
        await fetchWatchlist();
      }
    }
  };

  const toggleWatched = async (movie) => {
    const currentWatchedStatus = isWatched(movie.id);
    const newWatchedStatus = !currentWatchedStatus;
    const isInList = isInWatchlist(movie.id);

    try {
      // Verificar se o filme já existe na tabela
      const { data: existing, error: checkError } = await supabase
        .from('watchlist')
        .select('movie_id, status')
        .eq('movie_id', movie.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar filme:', checkError);
        toast.error(`Erro ao verificar filme: ${checkError.message}`);
        return;
      }

      let newStatus;
      
      if (existing) {
        // Determinar novo status baseado no estado atual
        const currentStatus = existing.status || 'listed';
        
        if (newWatchedStatus) {
          // Marcando como assistido
          if (currentStatus === 'listed') {
            newStatus = 'both'; // Estava só na lista, agora está na lista E assistido
          } else {
            newStatus = 'watched'; // Não estava na lista, agora só assistido
          }
        } else {
          // Removendo de assistido
          if (currentStatus === 'both') {
            newStatus = 'listed'; // Estava na lista e assistido, agora só na lista
          } else if (currentStatus === 'watched') {
            // Estava só assistido, remover completamente
            const { error } = await supabase
              .from('watchlist')
              .delete()
              .eq('movie_id', movie.id)
              .eq('user_id', user.id);

            if (error) {
              console.error('Erro ao remover:', error);
              toast.error(`Erro ao remover: ${error.message}`);
              return;
            }

            // Atualizar localmente
            const newWatchedSet = new Set(watchedMovies);
            newWatchedSet.delete(movie.id);
            setWatchedMovies(newWatchedSet);
            
            // Recarregar watchlist para garantir sincronização
            await fetchWatchlist();
            
            toast.success(`"${movie.title}" removido dos assistidos!`, {
              icon: '👁️',
            });
            return;
          }
        }

        // Atualizar status
        const { error } = await supabase
          .from('watchlist')
          .update({ status: newStatus })
          .eq('movie_id', movie.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar status:', error);
          // Se for erro 406, pode ser problema de sessão
          if (error.code === 'PGRST301' || error.message?.includes('406')) {
            toast.error('Erro ao processar requisição. Tente novamente.');
          } else {
            toast.error(`Erro ao atualizar status: ${error.message}`);
          }
          return;
        }
      } else {
        // Se não existe, criar registro com status 'watched'
        newStatus = 'watched';
        const { error } = await supabase
          .from('watchlist')
          .insert([
            { 
              movie_id: movie.id, 
              title: movie.title, 
              poster_path: movie.poster_path,
              status: 'watched',
              user_id: user.id
            }
          ]);

        if (error) {
          console.error('Erro ao marcar como assistido:', error);
          // Se for erro 406, pode ser problema de sessão
          if (error.code === 'PGRST301' || error.message?.includes('406')) {
            toast.error('Erro ao processar requisição. Tente novamente.');
          } else {
            toast.error(`Erro ao marcar como assistido: ${error.message}`);
          }
          return;
        }
      }

      // Atualizar localmente para feedback imediato
      const newWatchedSet = new Set(watchedMovies);
      if (newWatchedStatus) {
        newWatchedSet.add(movie.id);
      } else {
        newWatchedSet.delete(movie.id);
      }
      setWatchedMovies(newWatchedSet);

      // Atualizar watchlist se necessário
      if (newStatus === 'both' || newStatus === 'listed') {
        if (!isInList) {
          setWatchlist([...watchlist, movie.id]);
        }
      } else if (newStatus === 'watched' && isInList) {
        // Se mudou para apenas 'watched', remover da lista visual
        setWatchlist(watchlist.filter(id => id !== movie.id));
      }
      
      // Recarregar watchlist para garantir sincronização
      await fetchWatchlist();
      
      toast.success(
        newWatchedStatus 
          ? `"${movie.title}" marcado como assistido!` 
          : `"${movie.title}" removido dos assistidos!`,
        {
          icon: newWatchedStatus ? '✅' : '👁️',
        }
      );
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err);
      toast.error(`Erro inesperado: ${err.message}`);
    }
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
    <div className="w-full max-w-full md:max-w-6xl md:mx-auto px-0 md:px-4 py-4 pb-24 md:pb-4 overflow-x-hidden">
      {/* Título do Catálogo */}
      <div className="mb-6 flex items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-2">
          <Film className="text-blue-600 dark:text-blue-400" size={24} />
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Catálogo de Filmes</h1>
        </div>
        {/* Botão de Toggle de Tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Barra Unificada: Busca + Filtros + Visualização */}
      <div className="bg-white dark:bg-gray-800 rounded-none md:rounded-xl shadow-sm border-x-0 md:border border-gray-100 dark:border-gray-700 mb-6">
        {/* Linha superior: Busca + Controles */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
          {/* Busca */}
          <div className="flex-1 relative w-full md:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Busque um filme..."
              className="w-full p-3 pl-10 pr-10 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={18} />
            {searchQuery && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-2.5 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                title="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Radio buttons para tipo de busca */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="movie"
                checked={searchType === 'movie'}
                onChange={(e) => setSearchType(e.target.value)}
                className="cursor-pointer"
              />
              <span className="text-gray-700 dark:text-gray-300">Filme</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="director"
                checked={searchType === 'director'}
                onChange={(e) => setSearchType(e.target.value)}
                className="cursor-pointer"
              />
              <span className="text-gray-700 dark:text-gray-300">Diretor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="cast"
                checked={searchType === 'cast'}
                onChange={(e) => setSearchType(e.target.value)}
                className="cursor-pointer"
              />
              <span className="text-gray-700 dark:text-gray-300">Elenco</span>
            </label>
          </div>

          {/* Filtros e Visualização */}
          <div className="flex items-center justify-between gap-3 w-full md:w-auto">
            {/* Botão de Filtros */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400 dark:text-gray-500" />
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                title={filtersExpanded ? 'Recolher filtros' : 'Expandir filtros'}
              >
                {filtersExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>

            {/* Botões de Visualização */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Visualização em Grid"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Visualização em Lista"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros (recolhível) */}
        {filtersExpanded && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:flex-nowrap md:items-center gap-3 md:overflow-x-auto">
                {/* Gênero */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-shrink-0">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Gênero:</label>
                  <select 
                    value={tempGenre}
                    onChange={(e) => setTempGenre(e.target.value)}
                    className="border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:min-w-[150px]"
                  >
                    <option value="">Todos</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ano */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-shrink-0">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Ano:</label>
                  <select 
                    value={tempYear}
                    onChange={(e) => setTempYear(e.target.value)}
                    className="border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:min-w-[120px]"
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

                {/* País */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-shrink-0">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">País:</label>
                  <select 
                    value={tempCountry}
                    onChange={(e) => setTempCountry(e.target.value)}
                    className="border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:w-[150px]"
                  >
                    <option value="">Todos</option>
                    {countries.map((country) => (
                      <option key={country.iso_3166_1} value={country.iso_3166_1}>
                        {country.english_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenar por */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-shrink-0">
                  <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Ordenar por:</label>
                  <select 
                    value={tempSortBy}
                    onChange={(e) => setTempSortBy(e.target.value)}
                    className="border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full md:min-w-[180px]"
                  >
                    <option value="popularity.desc">Mais Populares</option>
                    <option value="vote_average.desc">Melhor Avaliados</option>
                    <option value="release_date.desc">Mais Recentes</option>
                    <option value="release_date.asc">Mais Antigos</option>
                    <option value="title.asc">Título (A-Z)</option>
                    <option value="title.desc">Título (Z-A)</option>
                  </select>
                </div>

                {/* Botões de filtro (Na Lista e Assistido) - Alinhados à direita */}
                <div className="flex flex-row gap-2 flex-shrink-0 ml-auto">
                  {/* Botão: Na Lista */}
                  <button
                    onClick={() => {
                      setFilterInList(!filterInList);
                      setPage(1);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg transition flex-shrink-0 ${
                      filterInList
                        ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                    title="Filtrar filmes na lista"
                  >
                    <Bookmark size={18} />
                  </button>

                  {/* Botão: Assistido */}
                  <button
                    onClick={() => {
                      setFilterWatched(!filterWatched);
                      setPage(1);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg transition flex-shrink-0 ${
                      filterWatched
                        ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                    title="Filtrar filmes assistidos"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
              
              {/* Botões de ação: Filtrar e Limpar */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm font-medium"
                >
                  <Filter size={16} />
                  Filtrar
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                >
                  <X size={16} />
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      {loading && allFilteredMovies.length === 0 ? (
        <div className="flex justify-center py-20 px-4 md:px-0">
          <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" size={48} />
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // Visualização em Grid
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 px-4 md:px-0">
              {currentPageMovies.map((movie) => (
                <div key={movie.id} className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">Sem Foto</div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{movie.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{movie.release_date?.split('-')[0]}</p>
                    
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openMovieDetails(movie)}
                        className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        title="Ver detalhes"
                      >
                        <Info size={14} />
                      </button>
                      
                      <button
                        onClick={() => toggleWatched(movie)}
                        className={`flex items-center justify-center p-2 rounded-md transition ${
                          isWatched(movie.id)
                            ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={isWatched(movie.id) ? 'Marcado como assistido' : 'Marcar como assistido'}
                      >
                        <CheckCircle size={14} />
                      </button>
                      
                      {isInWatchlist(movie.id) ? (
                        <button 
                          disabled
                          className="flex-1 flex items-center gap-1 justify-center bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 py-2 rounded-md border border-green-200 dark:border-green-800 cursor-not-allowed text-xs font-semibold"
                        >
                          <CheckCircle size={14} />
                          Na Lista
                        </button>
                      ) : (
                        <button 
                          onClick={() => addToWatchlist(movie)}
                          className="flex-1 flex items-center gap-1 justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200 dark:border-blue-800 text-xs font-semibold"
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
            // Visualização em Lista Miniatura (1 filme por linha no mobile)
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 md:px-0">
              {currentPageMovies.map((movie) => (
                <div key={movie.id} className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition overflow-hidden">
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
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">Sem Foto</div>
                      )}
                    </div>
                    
                    {/* Informações */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate text-gray-800 dark:text-gray-100">{movie.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
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
                          className="flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          title="Ver detalhes"
                        >
                          <Info size={12} />
                        </button>
                        
                        <button
                          onClick={() => toggleWatched(movie)}
                          className={`flex items-center justify-center p-1.5 rounded-md transition ${
                            isWatched(movie.id)
                              ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                          title={isWatched(movie.id) ? 'Marcado como assistido' : 'Marcar como assistido'}
                        >
                          <CheckCircle size={12} />
                        </button>
                        
                        {isInWatchlist(movie.id) ? (
                          <button 
                            disabled
                            className="flex-1 flex items-center gap-1 justify-center bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 py-1.5 rounded-md border border-green-200 dark:border-green-800 cursor-not-allowed text-xs font-semibold"
                          >
                            <CheckCircle size={12} />
                            Na Lista
                          </button>
                        ) : (
                          <button 
                            onClick={() => addToWatchlist(movie)}
                            className="flex-1 flex items-center gap-1 justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200 dark:border-blue-800 text-xs font-semibold"
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
            <div className="flex flex-col items-center gap-4 mt-8 px-4 md:px-0">
              {/* Informação de paginação */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Página {page} de {totalPagesFiltered > 0 ? totalPagesFiltered : 1} • {clientFilteredMovies.length} filme{clientFilteredMovies.length !== 1 ? 's' : ''} encontrado{clientFilteredMovies.length !== 1 ? 's' : ''} • Mostrando {currentPageMovies.length} de {clientFilteredMovies.length}
              </div>
              
              {/* Botões de navegação */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={loading || page === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            ? 'bg-blue-600 dark:bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 dark:text-gray-300"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-[60] p-4" onClick={closeMovieDetails}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-500 dark:text-blue-400" size={48} />
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
                          className="w-full max-w-[200px] md:max-w-none mx-auto md:mx-0 rounded-lg shadow-lg"
                        />
                      ) : (
                        <div className="w-full max-w-[200px] md:max-w-none mx-auto md:mx-0 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                          Sem Poster
                        </div>
                      )}
                    </div>

                    {/* Informações principais */}
                    <div className="md:col-span-2">
                      {/* Sinopse */}
                      {movieDetails.overview && (
                        <div className="mb-6">
                          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Sinopse</h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{movieDetails.overview}</p>
                        </div>
                      )}

                      {/* Diretor */}
                      {movieDetails.director && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-gray-100">Diretor</h3>
                          <p className="text-gray-700 dark:text-gray-300">{movieDetails.director.name}</p>
                        </div>
                      )}

                      {/* Gêneros */}
                      {movieDetails.genres && movieDetails.genres.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Gêneros</h3>
                          <div className="flex flex-wrap gap-2">
                            {movieDetails.genres.map((genre) => (
                              <span key={genre.id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                                {genre.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Onde assistir */}
                      {movieDetails.providers && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Onde Assistir</h3>
                          <div className="flex flex-wrap gap-3">
                            {movieDetails.providers.flatrate && movieDetails.providers.flatrate.length > 0 ? (
                              <>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Streaming:</span>
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
                              <span className="text-sm text-gray-500 dark:text-gray-400">Informação não disponível</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Elenco */}
                  {movieDetails.cast && movieDetails.cast.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Elenco Principal</h3>
                      <ul className="space-y-2">
                        {movieDetails.cast.map((actor) => (
                          <li key={actor.id} className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">{actor.name}</span>
                            {actor.character && (
                              <span className="text-gray-500 dark:text-gray-400"> como {actor.character}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {isInWatchlist(movieDetails.id) ? (
                      <>
                        <button 
                          onClick={() => {
                            toggleWatched(movieDetails);
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition font-semibold ${
                            isWatched(movieDetails.id)
                              ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <CheckCircle size={20} />
                          {isWatched(movieDetails.id) ? 'Marcado como Assistido' : 'Marcar como Assistido'}
                        </button>
                        <button 
                          disabled
                          className="w-full flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 py-3 rounded-lg border border-green-200 dark:border-green-800 cursor-not-allowed font-semibold"
                        >
                          <CheckCircle size={20} />
                          Já está na sua lista
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          addToWatchlist(movieDetails);
                          closeMovieDetails();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-semibold"
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