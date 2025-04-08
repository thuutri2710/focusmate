import { build } from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Build both content and background scripts
Promise.all([
  // Content script
  build({
    entryPoints: [resolve(__dirname, 'src/content/index.ts')],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    platform: 'browser',
    minify: true,
    target: ['chrome58'],
  }),
  // Background script
  build({
    entryPoints: [resolve(__dirname, 'src/background/background.ts')],
    bundle: true,
    outfile: 'dist/background.js',
    format: 'iife',
    platform: 'browser',
    minify: true,
    target: ['chrome58'],
  })
]).catch(() => process.exit(1));
