import { defineConfig } from 'vite';
import path from 'node:path';
import dts from 'vite-plugin-dts';
import compression from 'vite-plugin-compression';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      tsconfigPath: 'tsconfig.json',
      rollupTypes: true,
      outDir: 'types',
      insertTypesEntry: true,
    }),
    compression(),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Ziehen',
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    minify: 'esbuild',
    sourcemap: false,
  },
});
