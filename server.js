import fs from 'node:fs';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const bundleUrl = new URL('./server.bundle.mjs', import.meta.url);

if (fs.existsSync(bundleUrl)) {
  await import('./server.bundle.mjs');
} else {
  await import('./server.core.ts');
}
