# 🎬 Watchlist App

Uma aplicação web moderna para gerenciar sua lista de filmes favoritos, com busca avançada, filtros e visualizações personalizadas.

## ✨ Funcionalidades

- **🔍 Busca Inteligente**: Busque filmes por título com debounce para otimizar performance
- **📋 Gerenciamento de Lista**: Adicione e gerencie seus filmes favoritos
- **🎲 Sorteador de Filmes**: Sorteie um filme aleatório da sua lista quando não souber o que assistir
- **🎨 Visualizações Flexíveis**: 
  - Modo Grid: Visualização em grade com cartazes grandes
  - Modo Lista: Visualização compacta com 3-4 filmes por linha
- **🔧 Filtros Avançados**:
  - Filtro por gênero
  - Filtro por ano (dropdown com últimos 100 anos)
  - Ordenação por popularidade, avaliação, data de lançamento ou título
- **📄 Paginação**: Navegação intuitiva com 50 filmes por página
- **📱 Responsivo**: Interface adaptável para desktop e mobile
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
│   ├── App.jsx                  # Componente raiz com rotas
│   ├── main.jsx                 # Ponto de entrada da aplicação
│   ├── supabaseClient.js        # Configuração do cliente Supabase
│   └── index.css                 # Estilos globais
├── public/                      # Arquivos estáticos
├── package.json                # Dependências do projeto
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

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 👤 Autor

Criado com ❤️ para gerenciar sua lista de filmes favoritos.
