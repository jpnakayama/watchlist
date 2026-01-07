-- ============================================
-- DESABILITAR TRIGGER E CRIAR PROFILE MANUALMENTE
-- ============================================
-- Execute este script se o trigger estiver causando erro 500
-- O código JavaScript já cria o profile manualmente
-- ============================================

-- Desabilitar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- A função pode permanecer, mas não será usada
-- O código JavaScript criará o profile via RPC ou INSERT direto

