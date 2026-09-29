import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import {fileURLToPath} from 'node:url';
export default defineConfig(({mode})=>({
  plugins:[react()],
  base:mode==='android'?'./':'/',
  resolve:{alias:mode==='android'?[{find:/^.*\/env\.mjs$/,replacement:fileURLToPath(new URL('./server/env.android.mjs',import.meta.url))}]:[]},
  build:mode==='android'?{outDir:'android/app/src/main/assets',emptyOutDir:true,target:'es2019'}:{},
  server:{proxy:{'/api':'http://127.0.0.1:8787'}}}));
