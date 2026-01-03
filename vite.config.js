import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver mudanças
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Movie Matcher JP',
        short_name: 'MovieMatch',
        description: 'Catálogo e sorteador de filmes para uso pessoal',
        theme_color: '#ffffff', // Cor da barra de status no Android
        background_color: '#ffffff',
        display: 'standalone', // Faz o app abrir sem a barra do navegador
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Permite que o ícone se ajuste a diferentes formatos (circular, quadrado)
          }
        ]
      }
    })
  ]
})
