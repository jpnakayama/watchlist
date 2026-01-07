-- ============================================
-- CONFIGURAÇÃO SUPABASE PARA AUTENTICAÇÃO
-- ============================================
-- Execute estes scripts no SQL Editor do Supabase
-- ============================================

-- 1. AJUSTAR POLÍTICAS RLS DA TABELA watchlist
-- Remover políticas públicas que permitem acesso sem autenticação
DROP POLICY IF EXISTS "Allow public delete on watchlist" ON watchlist;
DROP POLICY IF EXISTS "Allow public insert on watchlist" ON watchlist;
DROP POLICY IF EXISTS "Allow public select on watchlist" ON watchlist;
DROP POLICY IF EXISTS "AddMovieOnList" ON watchlist;

-- Verificar se as políticas por usuário estão corretas
-- Se não existirem, criar:
CREATE POLICY IF NOT EXISTS "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own watchlist"
  ON watchlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 2. AJUSTAR POLÍTICAS RLS DA TABELA profiles
-- Manter política pública apenas para SELECT (necessária para login por username)
CREATE POLICY IF NOT EXISTS "Public profiles are viewable for login"
  ON profiles FOR SELECT
  USING (true);

-- Garantir que outras políticas estão corretas
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- ============================================

-- 3. CRIAR TRIGGER PARA PROFILE AUTOMÁTICO
-- IMPORTANTE: Se o trigger estiver causando erro 500, você pode desabilitá-lo temporariamente
-- e criar o profile manualmente via código (já implementado no AuthContext.jsx)

-- Opção 1: Trigger simples que NUNCA falha
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usar um bloco aninhado para capturar qualquer erro
  BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, COALESCE(NEW.email, ''))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignorar completamente o erro - não logar nada para evitar problemas
      NULL;
  END;
  
  -- SEMPRE retornar NEW
  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ALTERNATIVA: Se o trigger continuar causando problemas, desabilite-o:
-- ============================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- O código JavaScript já cria o profile manualmente se o trigger falhar

-- ============================================

-- 4. FUNÇÃO RPC PARA CRIAR PROFILE (FALLBACK SE O TRIGGER FALHAR)
-- Remover função antiga se existir (com todas as variações possíveis)
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_username TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_birth_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, birth_date)
  VALUES (p_user_id, p_email, p_username, p_full_name, p_birth_date)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    username = COALESCE(EXCLUDED.username, profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date);
END;
$$;

-- 5. FUNÇÃO RPC PARA BUSCAR EMAIL POR USERNAME (OPCIONAL)
-- Útil se quiser suportar login por username no futuro
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM profiles
  WHERE username = p_username
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- ============================================
-- CONFIGURAÇÕES NO DASHBOARD (FAZER MANUALMENTE):
-- ============================================
-- 1. Ir em Authentication > Settings
-- 2. Desabilitar "Enable email confirmations"
-- 3. (Opcional) Configurar "Site URL" para sua URL de produção
-- ============================================

