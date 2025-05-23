
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: process.env.ELECTRON === 'true' ? 'esnext' : 'esnext',
    rollupOptions: {
      external: process.env.ELECTRON === 'true' ? ['electron'] : [],
    },
  },
  base: process.env.ELECTRON === 'true' ? './' : '/',
}));
