// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Optional: load .env values if you need them
  loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    optimizeDeps: {
      // Let esbuild treat .js files as JSX if you have JSX-in-.js
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
      // Prebundle common deps for faster dev + fewer surprises
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'framer-motion',
        'lucide-react',
        // add more heavy libs you actually use, e.g. 'recharts'
      ],
    },
    build: {
      sourcemap: true,          // helpful for debugging in Vercel
      target: 'esnext',
      // This silences the warning (actual size improvements come from manualChunks)
      chunkSizeWarningLimit: 1600, // 1.6 MB
      rollupOptions: {
        output: {
          // Split node_modules into focused vendor chunks
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('/react/')) return 'vendor-react';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('framer-motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('recharts')) return 'vendor-charts';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
