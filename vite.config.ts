import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import gzipPlugin from 'rollup-plugin-gzip';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: 'tsconfig.json',
      rollupTypes: true,
      outDir: 'types',
      insertTypesEntry: true,
    }),
    terser(),
    gzipPlugin(),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Ziehen',
      formats: ['es', 'umd'],
      fileName: (format) => `ziehen.${format}.js`,
    },
  }
});
