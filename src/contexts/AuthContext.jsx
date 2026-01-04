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

  // Verificar sessão ao carregar
  useEffect(() => {
    let mounted = true;
    let sessionChecked = false;

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      sessionChecked = true;
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Erro ao verificar sessão:', error);
      if (mounted) {
        sessionChecked = true;
        setLoading(false);
      }
    });

    // Ouvir mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        // Só setar loading como false após verificar a sessão inicial
        if (sessionChecked) {
          setLoading(false);
        }
      }
    });

    // REMOVIDO: Timeout que estava causando acesso sem autenticação
    // A verificação de sessão deve completar antes de setar loading como false

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
        .single();

      if (existingProfile) {
        return { 
          user: null, 
          error: { message: 'Este username já está em uso. Escolha outro.' } 
        };
      }

      // Criar email baseado no username se não fornecido
      // Usar um domínio válido (Supabase não aceita .local)
      const userEmail = email || `${username}@watchlist.app`;
      
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password,
      });

      if (authError) {
        // Melhorar mensagem de erro de email inválido
        if (authError.message?.includes('invalid') || authError.message?.includes('Email')) {
          throw new Error('Email inválido. Por favor, forneça um email válido ou deixe em branco para usar um email automático.');
        }
        throw authError;
      }

      if (!authData.user) {
        return { user: null, error: { message: 'Erro ao criar usuário' } };
      }

      // Aguardar um pouco para o trigger executar e sessão estar ativa
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar se o profile foi criado pelo trigger (tentar algumas vezes)
      let profileExists = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!profileExists && attempts < maxAttempts) {
        const { data: existingProfileCheck, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single();

        if (existingProfileCheck && !checkError) {
          profileExists = true;
          break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Se o profile não existe, criar manualmente
      if (!profileExists) {
        // Tentar inserir diretamente (requer política de INSERT no RLS)
        // Não verificar sessão aqui, pois o signUp pode não ter sessão ativa imediatamente
        // A política RLS vai verificar auth.uid() internamente
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username,
            email: userEmail,
            full_name: fullName || null,
            birth_date: birthDate || null,
          });

        if (insertError) {
          console.error('Erro ao criar profile:', insertError);
          
          // Verificar se é erro de RLS
          if (insertError.code === '42501') {
            throw new Error(
              'Erro de permissão RLS. Verifique:\n\n' +
              '1. A política "Users can insert own profile" existe e está ativa\n' +
              '2. O RLS está habilitado na tabela profiles\n' +
              '3. A política tem WITH CHECK (auth.uid() = id)\n\n' +
              'Execute este SQL para verificar:\n' +
              'SELECT * FROM pg_policies WHERE tablename = \'profiles\';\n\n' +
              'Se a política não existir, crie:\n' +
              'CREATE POLICY "Users can insert own profile"\n' +
              '  ON profiles FOR INSERT\n' +
              '  WITH CHECK (auth.uid() = id);'
            );
          }
          
          throw new Error(`Erro ao criar perfil: ${insertError.message} (Código: ${insertError.code})`);
        }
      } else {
        // Se o profile já existe (criado pelo trigger), apenas atualizar
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username,
            email: userEmail,
            full_name: fullName || null,
            birth_date: birthDate || null,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Erro ao atualizar profile:', updateError);
          // Não falhar o cadastro se o profile não atualizar, mas logar o erro
        }
      }

      // Recarregar profile (se possível)
      // Nota: Se o email precisar ser confirmado, a sessão pode não estar ativa ainda
      try {
        await fetchProfile(authData.user.id);
      } catch (err) {
        console.warn('Não foi possível carregar profile imediatamente:', err);
        // Não falhar o cadastro por isso
      }

      // Retornar usuário criado
      // Se não houver sessão, o usuário precisará confirmar email e fazer login
      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      // Retornar mensagem de erro mais amigável
      const errorMessage = error.message || error.error_description || 'Erro ao criar conta. Verifique os dados e tente novamente.';
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
        // Melhorar mensagens de erro
        let errorMessage = error.message;
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
          errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
        } else if (error.message?.includes('Email rate limit')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        }
        throw { ...error, message: errorMessage };
      }

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
      let email = null;

      // Primeiro tentar usar função RPC se existir (bypass RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_email_by_username', {
        p_username: username
      });

      if (!rpcError && rpcData) {
        email = rpcData;
      } else {
        // Fallback: tentar buscar profile diretamente
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();

        if (profileError) {
          console.error('Erro ao buscar profile:', profileError);
          // Se erro de RLS ou não encontrado, tentar emails padrão
          if (profileError.code === 'PGRST116' || profileError.code === '42501') {
            // Tentar emails padrão
            email = `${username}@watchlist.app`;
          } else {
            // Tentar email padrão mesmo com erro
            email = `${username}@watchlist.app`;
          }
        } else if (profileData && profileData.email) {
          email = profileData.email;
        } else {
          email = `${username}@watchlist.app`;
        }
      }

      // Tentar login com o email encontrado
      const result = await signIn(email, password);
      
      // Se falhar, tentar variações do email
      if (result.error) {
        const emailVariations = [
          `${username}@watchlist.app`,
          username.includes('_') ? `${username.replace('_', '')}@watchlist.app` : null,
          username.includes('_') ? `${username.replace('_', '.')}@watchlist.app` : null,
        ].filter(Boolean);

        for (const altEmail of emailVariations) {
          if (altEmail !== email) {
            const altResult = await signIn(altEmail, password);
            if (!altResult.error) {
              return altResult;
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erro no login por username:', error);
      return { 
        user: null, 
        error: { message: error.message || 'Erro ao fazer login. Verifique username e senha.' } 
      };
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

  // Reset de senha (esqueci minha senha)
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Erro ao enviar email de reset:', error);
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
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

