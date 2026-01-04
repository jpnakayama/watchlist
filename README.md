# 🎬 MoviePicker (Watchlist App)

Uma aplicação web moderna para gerenciar sua lista de filmes favoritos, com busca avançada, filtros e visualizações personalizadas. **PWA (Progressive Web App)** totalmente funcional que pode ser instalada como app no celular.

## ✨ Funcionalidades

- **🔐 Autenticação de Usuários**: Sistema completo de login e cadastro com isolamento de dados por usuário
- **🔍 Busca Inteligente**: Busque filmes por título com debounce para otimizar performance
- **📋 Gerenciamento de Lista**: Adicione e gerencie seus filmes favoritos
- **🎲 Sorteador de Filmes**: Sorteie um filme aleatório da sua lista quando não souber o que assistir
- **🎨 Visualizações Flexíveis**: 
  - Modo Grid: Visualização em grade com 1 cartaz por linha no mobile
  - Modo Lista: Visualização compacta com 1 filme por linha no mobile (padrão)
- **🔧 Filtros Avançados**:
  - Filtro por gênero
  - Filtro por ano (dropdown com últimos 100 anos)
  - Filtro por país
  - Filtro por filmes na lista
  - Filtro por filmes assistidos
  - Ordenação por popularidade, avaliação, data de lançamento ou título
- **📄 Paginação**: Navegação intuitiva com 50 filmes por página
- **📱 Responsivo e Mobile-First**: 
  - Interface totalmente adaptada para mobile
  - Menu de navegação fixo no rodapé
  - Layout com largura 100% no mobile
  - Barra de busca e filtros otimizada para telas pequenas
- **📱 PWA (Progressive Web App)**: 
  - Instalável como app no celular
  - Funciona offline (com cache)
  - Atualização automática
- **🌓 Modo Escuro**: Suporte completo a tema claro e escuro
- **🔒 Segurança**: 
  - Row Level Security (RLS) no Supabase
  - Isolamento completo de dados por usuário
  - Proteção de rotas com redirecionamento automático
- **⚡ Performance Otimizada**: 
  - Carregamento paralelo de páginas
  - Cancelamento de requisições duplicadas
  - Debounce na busca

## 🛠️ Tecnologias

- **React 19** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Axios** - Cliente HTTP para requisições à API
- **Supabase** - Backend como serviço para armazenar a watchlist
- **Lucide React** - Biblioteca de ícones
- **React Router** - Roteamento de páginas
- **TMDB API** - The Movie Database API para dados de filmes
- **Vite PWA Plugin** - Suporte a Progressive Web App
- **React Hot Toast** - Notificações toast elegantes

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no [TMDB](https://www.themoviedb.org/) para obter API key
- Conta no [Supabase](https://supabase.com/) para o backend

### Configuração do Supabase

Antes de executar o projeto, você precisa configurar o banco de dados no Supabase:

1. **Criar tabela `profiles`**:
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  birth_date DATE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Adicionar coluna `user_id` na tabela `watchlist`**:
```sql
-- Adicionar coluna como nullable primeiro
ALTER TABLE watchlist 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Criar índice
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);

-- Deletar registros antigos (se houver) ou atribuir a um usuário
DELETE FROM watchlist WHERE user_id IS NULL;

-- Alterar para NOT NULL
ALTER TABLE watchlist 
ALTER COLUMN user_id SET NOT NULL;
```

3. **Configurar Row Level Security (RLS)**:

**Para `profiles`:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Para `watchlist`:**
```sql
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON watchlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);
```

4. **Criar trigger para criar profile automaticamente**:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/watchlist-app.git
cd watchlist-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto `watchlist-app` com:
```env
VITE_TMDB_API_KEY=sua_chave_api_tmdb
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

4. Execute o projeto:
```bash
npm run dev
```

5. Acesse no navegador:
```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
watchlist-app/
├── src/
│   ├── components/
│   │   ├── MovieSearch.jsx      # Componente principal de busca e catálogo
│   │   ├── Watchlist.jsx        # Componente da lista de filmes salvos
│   │   ├── MovieRandomizer.jsx  # Componente para sortear filmes
│   │   ├── Login.jsx           # Tela de login e cadastro
│   │   └── ProtectedRoute.jsx  # Componente para proteger rotas
│   ├── contexts/
│   │   ├── ThemeContext.jsx     # Contexto para gerenciar tema claro/escuro
│   │   └── AuthContext.jsx      # Contexto para gerenciar autenticação
│   ├── App.jsx                  # Componente raiz com rotas e menu fixo
│   ├── main.jsx                 # Ponto de entrada da aplicação
│   ├── supabaseClient.js        # Configuração do cliente Supabase
│   └── index.css                 # Estilos globais
├── public/
│   └── icon.png                 # Ícone do PWA (favicon e app icon)
├── vite.config.js              # Configuração do Vite e PWA
├── package.json                # Dependências do projeto
├── .env                        # Variáveis de ambiente (não versionado)
└── README.md                   # Este arquivo
```

## 🎯 Funcionalidades Detalhadas

### Busca de Filmes
- Busca em tempo real com debounce de 500ms
- Cancelamento automático de requisições sobrepostas
- Carregamento de até 1000 filmes iniciais (50 páginas)

### Filtros
- **Gênero**: Filtra por gênero cinematográfico
- **Ano**: Dropdown com anos de 1924 até 2024
- **Ordenação**: 
  - Mais Populares
  - Melhor Avaliados
  - Mais Recentes
  - Mais Antigos
  - Título (A-Z)
  - Título (Z-A)

### Paginação
- 50 filmes por página
- Navegação por números de página
- Botões anterior/próxima
- Informação de total de filmes encontrados

### Watchlist
- Adicionar filmes à lista pessoal
- Visualizar lista completa
- Remover filmes da lista
- Persistência no Supabase

### Sorteador
- Sorteia um filme aleatório da sua lista
- Ideal para quando não sabe o que assistir

### Autenticação
- **Cadastro**: Crie sua conta com username, nome completo (obrigatório), email (obrigatório), data de nascimento (obrigatório) e senha
- **Login**: Acesse sua conta usando username e senha
- **Recuperação de Senha**: Funcionalidade "Esqueci minha senha" para redefinir senha via email
- **Mostrar/Ocultar Senha**: Toggle para visualizar senha durante digitação
- **Isolamento de Dados**: Cada usuário tem sua própria lista isolada
- **Proteção de Rotas**: Rotas protegidas redirecionam automaticamente para login
- **Segurança**: Row Level Security (RLS) no Supabase garante isolamento no banco de dados
- **Header com Usuário**: Exibe ícone e nome do usuário logado no topo da aplicação
- **Logout**: Botão de sair facilmente acessível no header

## 🔐 Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no arquivo `.env`:

- `VITE_TMDB_API_KEY`: Sua chave de API do TMDB
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🚀 Publicação e Deploy

### Publicando no Vercel

1. **Instale a CLI do Vercel** (se ainda não tiver):
```bash
npm i -g vercel
```

2. **Faça login no Vercel**:
```bash
vercel login
```

3. **Configure as variáveis de ambiente no Vercel**:
   - Acesse o dashboard do Vercel após o deploy
   - Vá em Settings > Environment Variables
   - Adicione as seguintes variáveis:
     - `VITE_TMDB_API_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Faça o deploy**:
```bash
vercel
```

Ou conecte seu repositório GitHub ao Vercel:
- Acesse [vercel.com](https://vercel.com)
- Clique em "Add New Project"
- Importe seu repositório
- Configure as variáveis de ambiente
- Deploy automático a cada push!

### 📱 Instalando como App no Celular (PWA)

Após publicar no Vercel, você pode instalar o app no seu celular:

#### **Android (Chrome)**

1. Abra o site no navegador Chrome
2. Toque no menu (três pontos) no canto superior direito
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme a instalação
5. O app aparecerá na tela inicial como um app nativo

#### **iOS (Safari)**

1. Abra o site no navegador Safari
2. Toque no botão de compartilhar (quadrado com seta para cima)
3. Role para baixo e selecione **"Adicionar à Tela de Início"**
4. Personalize o nome se desejar
5. Toque em **"Adicionar"**
6. O app aparecerá na tela inicial

#### **Características do PWA**

- ✅ Funciona offline (com cache)
- ✅ Atualização automática quando houver novas versões
- ✅ Ícone personalizado na tela inicial
- ✅ Abre em tela cheia (sem barra do navegador)
- ✅ Experiência similar a um app nativo

## 🎨 Melhorias Recentes

### Autenticação e Segurança
- ✅ Sistema completo de autenticação com Supabase Auth
- ✅ Tela de login/cadastro com validação de formulários
- ✅ Campos obrigatórios: nome completo, email e data de nascimento
- ✅ Validação de idade mínima (13 anos)
- ✅ Funcionalidade de recuperação de senha ("Esqueci minha senha")
- ✅ Toggle de mostrar/ocultar senha nos campos de password
- ✅ Proteção de rotas com redirecionamento automático
- ✅ Isolamento de dados por usuário (user_id + RLS)
- ✅ Context global de autenticação
- ✅ Login por username (busca email automaticamente)
- ✅ Header com informações do usuário (ícone + nome)
- ✅ Botão de logout no header
- ✅ Correção de problemas de acesso sem autenticação

### Layout Mobile
- ✅ Barra de busca e filtros reorganizados para mobile
- ✅ Menu de navegação fixo no rodapé
- ✅ Layout com largura 100% no mobile (sem faixas brancas)
- ✅ Visualização em grid: 1 cartaz por linha no mobile
- ✅ Visualização em lista: 1 filme por linha no mobile (padrão)
- ✅ Modal de detalhes otimizado para mobile
- ✅ Título e elementos ajustados para melhor visualização

### PWA
- ✅ Configuração completa de Progressive Web App
- ✅ Ícone personalizado (icon.png)
- ✅ Tema escuro como padrão
- ✅ Atualização automática

### UX/UI
- ✅ Modo escuro/claro com toggle
- ✅ Cores do texto ajustadas para melhor legibilidade
- ✅ Modal com z-index acima do menu fixo
- ✅ Animações e transições suaves

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👤 Autor

Criado com ❤️ para gerenciar sua lista de filmes favoritos.
