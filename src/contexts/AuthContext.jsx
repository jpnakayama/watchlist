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

  // Buscar profile do usuário
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    
    try {
      // Usar maybeSingle() para não dar erro se o profile não existir
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // Ignorar erro PGRST116 (nenhum resultado encontrado) - é esperado se o profile não existir ainda
        if (error.code !== 'PGRST116') {
          console.error('Erro ao buscar profile:', error);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Erro ao buscar profile:', err);
      setProfile(null);
    }
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    let mounted = true;
    let timeoutId;
    let sessionChecked = false;

    // Timeout de segurança para garantir que loading sempre seja false
    timeoutId = setTimeout(() => {
      if (mounted && !sessionChecked) {
        console.warn('Timeout na verificação de sessão, definindo loading como false');
        setLoading(false);
        sessionChecked = true;
      }
    }, 1000); // 1 segundo de timeout (mais rápido)

    // Verificar sessão atual
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      sessionChecked = true;
      // Limpar timeout
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setLoading(false);
        return;
      }

      console.log('Sessão verificada:', session?.user?.id || 'sem usuário');
      setSession(session);
      setUser(session?.user ?? null);
      
      // Definir loading como false ANTES de buscar o profile
      setLoading(false);
      
      // Buscar profile em background (não bloquear)
      if (session?.user) {
        // Não usar await aqui para não bloquear
        fetchProfile(session.user.id).catch((err) => {
          console.error('Erro ao buscar profile:', err);
        });
      }
    }).catch((err) => {
      if (!mounted) return;
      sessionChecked = true;
      clearTimeout(timeoutId);
      console.error('Erro inesperado ao verificar sessão:', err);
      setLoading(false);
    });

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Limpar timeout quando houver mudança de estado
      clearTimeout(timeoutId);
      
      console.log('Auth state changed:', event, session?.user?.id || 'no user');
      
      // Atualizar estado imediatamente
      setSession(session);
      setUser(session?.user ?? null);
      
      // Definir loading como false ANTES de buscar o profile
      // para não travar a aplicação se o profile demorar
      setLoading(false);
      
      // Buscar profile em background (não bloquear)
      if (session?.user) {
        // Não usar await aqui para não bloquear
        fetchProfile(session.user.id).catch((err) => {
          console.error('Erro ao buscar profile:', err);
        });
      } else {
        // Limpar profile quando não há sessão (logout)
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Cadastro
  const signUp = async (email, password, username, fullName, birthDate) => {
    try {
      // Verificar se username já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingProfile) {
        return { 
          user: null, 
          error: { message: 'Este username já está em uso. Escolha outro.' } 
        };
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        // Melhorar mensagem de erro
        let errorMessage = authError.message || 'Erro ao criar conta';
        if (authError.message?.includes('Database error')) {
          errorMessage = 'Erro no banco de dados. Verifique se o trigger está configurado corretamente no Supabase.';
        } else if (authError.message?.includes('User already registered')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (authError.message?.includes('Password')) {
          errorMessage = 'A senha não atende aos requisitos de segurança.';
        }
        return { user: null, error: { message: errorMessage } };
      }

      if (!authData.user) {
        return { user: null, error: { message: 'Erro ao criar usuário' } };
      }

      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar se o profile foi criado pelo trigger
      const { data: createdProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      // Se o profile não foi criado pelo trigger, criar usando RPC
      if (!createdProfile && !checkError) {
        console.warn('Profile não foi criado pelo trigger, criando via RPC...');
        const { error: rpcError } = await supabase.rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_email: authData.user.email || email,
          p_username: username,
          p_full_name: fullName || null,
          p_birth_date: birthDate || null,
        });

        if (rpcError) {
          console.error('Erro ao criar profile via RPC:', rpcError);
          // Tentar criar diretamente como último recurso
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: authData.user.email || email,
              username: username,
              full_name: fullName || null,
              birth_date: birthDate || null,
            });

          if (insertError) {
            console.error('Erro ao criar profile diretamente:', insertError);
            // Continuar mesmo assim, o usuário pode atualizar depois
          }
        }
      } else if (createdProfile) {
        // Atualizar profile com dados adicionais se já existe
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username,
            full_name: fullName || null,
            birth_date: birthDate || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar profile:', updateError);
          // Tentar usar RPC como fallback
          await supabase.rpc('create_user_profile', {
            p_user_id: authData.user.id,
            p_email: authData.user.email || email,
            p_username: username,
            p_full_name: fullName || null,
            p_birth_date: birthDate || null,
          });
        }
      }

      // Recarregar profile
      await fetchProfile(authData.user.id);

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      const errorMessage = error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.';
      return { user: null, error: { message: errorMessage } };
    }
  };

  // Login
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message?.includes('Email rate limit')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        }
        throw { ...error, message: errorMessage };
      }

      // Atualizar estado imediatamente após login
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        if (data.session.user) {
          await fetchProfile(data.session.user.id);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { user: null, error };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      // Fazer logout no Supabase primeiro
      const { error } = await supabase.auth.signOut();
      
      // Limpar estado local após logout (o onAuthStateChange também vai fazer isso, mas garantimos aqui)
      setUser(null);
      setProfile(null);
      setSession(null);
      
      if (error) {
        console.error('Erro no logout do Supabase:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
      // Mesmo em caso de erro, limpar estado local
      setUser(null);
      setProfile(null);
      setSession(null);
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
    signOut,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

