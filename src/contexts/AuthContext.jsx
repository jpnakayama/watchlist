import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Verificar sessão ao carregar
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar profile do usuário
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Erro ao buscar profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Cadastro
  const signUp = async (email, password, username, fullName, birthDate) => {
    try {
      // Criar email baseado no username se não fornecido
      const userEmail = email || `${username}@watchlist.local`;
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Atualizar profile com dados adicionais (incluindo email)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username,
            email: userEmail,
            full_name: fullName || null,
            birth_date: birthDate || null,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Erro ao atualizar profile:', profileError);
          // Não falhar o cadastro se o profile não atualizar
        }

        // Recarregar profile
        await fetchProfile(authData.user.id);
      }

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { user: null, error };
    }
  };

  // Login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { user: null, error };
    }
  };

  // Login por username (buscar email do profile primeiro)
  const signInWithUsername = async (username, password) => {
    try {
      // Buscar profile pelo username para obter o email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        return { user: null, error: { message: 'Usuário não encontrado' } };
      }

      // Se não tiver email no profile, tentar padrão
      const email = profileData.email || `${username}@watchlist.local`;
      
      return await signIn(email, password);
    } catch (error) {
      console.error('Erro no login por username:', error);
      return { user: null, error };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithUsername,
    signOut,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

