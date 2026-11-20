import fs from 'node:fs';

const isProduction =
  process.env.NODE_ENV === 'production' ||
  !process.env.npm_lifecycle_event?.includes('dev');

const bundleUrl = new URL('./server.bundle.mjs', import.meta.url);

if (isProduction && fs.existsSync(bundleUrl)) {
  await import('./server.bundle.mjs');
} else {
  await import('./server.core.ts');
}
