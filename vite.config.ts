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
            '@': resolve(__dirname, 'src'),
            '@/components': resolve(__dirname, 'src/components'),
            '@/core': resolve(__dirname, 'src/core'),
            '@/database': resolve(__dirname, 'src/database'),
            '@/shared': resolve(__dirname, 'src/shared')
        }
    },
    server: {
        port: 3000
    }
})