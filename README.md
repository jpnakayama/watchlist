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
│   │   └── MovieRandomizer.jsx  # Componente para sortear filmes
│   ├── contexts/
│   │   └── ThemeContext.jsx     # Contexto para gerenciar tema claro/escuro
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
