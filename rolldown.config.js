import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      format: 'esm',
      file: 'dist/index.mjs',
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: 'dist/index.cjs',
      sourcemap: true,
    },
    {
      format: 'iife',
      file: 'dist/index.iife.js',
      sourcemap: true,
      name: 'SimpleLogger',
    }
  ],
});
