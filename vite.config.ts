import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    root: './src/renderer',
    build: {
        outDir: '../../dist/renderer',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src/renderer'),
            '@/components': resolve(__dirname, 'src/renderer/components'),
            '@/store': resolve(__dirname, 'src/renderer/store'),
            '@/hooks': resolve(__dirname, 'src/renderer/hooks'),
            '@/views': resolve(__dirname, 'src/renderer/views'),
            '@/styles': resolve(__dirname, 'src/renderer/styles'),
            '@/shared': resolve(__dirname, 'src/shared')
        }
    },
    server: {
        port: 3000,
        hmr: {
            overlay: false
        }
    }
})