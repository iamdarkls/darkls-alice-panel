import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fingerprint from './build-fingerprint.mjs'
export default defineConfig({plugins:[vue(),fingerprint()],define:{'process.env.NODE_ENV':JSON.stringify('production'),__VUE_OPTIONS_API__:false,__VUE_PROD_DEVTOOLS__:false,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:false},base:'./',build:{outDir:'../app/static/ui',emptyOutDir:true,target:['es2022','safari16.4'],minify:false,lib:{entry:'src/main.ts',formats:['es'],fileName:()=> 'panel.js',cssFileName:'panel'},rolldownOptions:{output:{entryFileNames:'panel.js',chunkFileNames:'[name]-[hash].js'}}}})
