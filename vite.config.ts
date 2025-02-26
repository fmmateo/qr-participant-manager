
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: '/', // Importante para rutas en producción
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist', // Directorio de salida para la build
    emptyOutDir: true, // Limpia el directorio antes de build
    sourcemap: false, // Deshabilita sourcemaps en producción
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'), // Especifica el punto de entrada
      },
    },
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
}));
