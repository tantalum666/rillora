import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { extname, resolve } from 'node:path';

const route = runInNewContext(`${await readFile('worker/public-router.js', 'utf8')}; handler`);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const csp = "default-src 'none'; base-uri 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const querystring = Object.fromEntries([...url.searchParams].map(([name, value]) => [name, { value }]));
  const result = route({ request: { method: req.method, uri: url.pathname, querystring } });
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (result.statusCode) {
    for (const [name, entry] of Object.entries(result.headers)) res.setHeader(name, entry.value);
    res.writeHead(result.statusCode); res.end(); return;
  }
  try {
    const body = await readFile(resolve('dist-public', '.' + result.uri));
    res.setHeader('Content-Type', types[extname(result.uri)] || 'application/octet-stream');
    res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(404); res.end(); }
}).listen(4197, '127.0.0.1', () => console.log('Public information preview: http://127.0.0.1:4197'));
