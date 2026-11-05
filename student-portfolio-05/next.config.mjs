import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVinext = process.argv.some((a) => a.includes('vinext') || a.includes('run-framework'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    if (!isVinext) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'cloudflare:workers': path.resolve(__dirname, 'lib/cloudflare-mock.ts'),
        'styled-jsx/style': path.resolve(__dirname, 'styled-jsx-style.js'),
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: isVinext
      ? {}
      : {
          'cloudflare:workers': './lib/cloudflare-mock.ts',
        },
  },
};

export default nextConfig;

