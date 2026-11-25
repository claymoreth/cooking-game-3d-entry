// Copper Ladle Kitchen 3D — tiny static server (Node stdlib only).
// Serves the game/ folder at http://localhost:8080 (or --port <n>).
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = resolve(join(here, 'game'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

let port = 8080;
const portArg = process.argv.indexOf('--port');
if (portArg >= 0 && process.argv[portArg + 1]) {
  const parsed = Number(process.argv[portArg + 1]);
  if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) port = parsed;
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = resolve(join(gameDir, pathname));
    // Reject anything outside game/.
    if (filePath !== gameDir && !filePath.startsWith(`${gameDir}/`)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    const stat = statSync(filePath);
    if (!stat.isFile()) throw new Error('not a file');
    const body = readFileSync(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Copper Ladle Kitchen 3D at http://localhost:${port}`);
});
