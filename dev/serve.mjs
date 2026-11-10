/**
 * Dev loop without installing: run the real service against the local OpenCode
 * and draw the panel in a plain iframe, outside OpenChamber.
 *
 *   npm run dev            # then open the printed URL and add ?session=<id>
 *   npm run dev -- --clock # start in clock mode / --click opens a detail
 *
 * The host normally injects OPENCHAMBER_SERVICE_PORT/TOKEN and a loopback
 * OPENCODE_URL. Here this script plays that role:
 *
 *   harness page ──/svc/*──> file server ──Bearer──> service/main.js
 *   service ──Bearer──> stub ──Basic──> OpenCode (127.0.0.1:28894)
 *
 * The stub exists only because a bare `opencode serve` wants Basic auth while
 * the service speaks the host's bearer token.
 */
import http from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.css': 'text/css' };
const OPENCODE_PORT = Number(process.env.OPENCODE_PORT || 28894);

let password = '';
try {
  password = JSON.parse(readFileSync(path.join(homedir(), '.config/opencode/service.json'), 'utf8')).password;
} catch {
  console.error('No ~/.config/opencode/service.json — start OpenChamber once so it writes one.');
  process.exit(1);
}
const opencodeAuth = 'Basic ' + Buffer.from(`opencode:${password}`).toString('base64');

// 1. Stub: bearer in, basic out.
const stub = http.createServer(async (req, res) => {
  try {
    const upstream = await fetch(`http://127.0.0.1:${OPENCODE_PORT}${req.url}`, {
      headers: { Authorization: opencodeAuth, Accept: 'application/json' },
    });
    const body = await upstream.text();
    res.writeHead(upstream.status, { 'content-type': 'application/json' });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(error) }));
  }
});
await new Promise((resolve) => stub.listen(0, '127.0.0.1', resolve));
const stubUrl = `http://127.0.0.1:${stub.address().port}`;

// 2. The real service, with the env the host would hand it.
const token = 'dev-' + Math.random().toString(36).slice(2);
const servicePort = 46000 + Math.floor(Math.random() * 900);
const service = spawn(process.execPath, [path.join(ROOT, 'service/main.js')], {
  env: {
    ...process.env,
    OPENCHAMBER_SERVICE_PORT: String(servicePort),
    OPENCHAMBER_SERVICE_TOKEN: token,
    OPENCHAMBER_OPENCODE_URL: stubUrl,
  },
  stdio: 'inherit',
});
await new Promise((resolve) => setTimeout(resolve, 700));

// 3. Harness + panel files, and /svc/* to the service.
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  // Dev convenience: newest viewed session, so the harness needs no id.
  if (url.pathname === '/sessions') {
    try {
      const upstream = await fetch(`http://127.0.0.1:${OPENCODE_PORT}/api/session?order=desc&limit=30`, {
        headers: { Authorization: opencodeAuth, Accept: 'application/json' },
      });
      const body = await upstream.json();
      const rows = (body?.data || [])
        .filter((entry) => entry.time?.viewed)
        .sort((a, b) => b.time.viewed - a.time.viewed)
        .slice(0, 5)
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          directory: entry.directory,
          agent: entry.agent,
          busy: Boolean(entry.time?.busy && (!entry.time?.idle || entry.time.busy > entry.time.idle)),
          model: entry.model ? `${entry.model.providerID}/${entry.model.id}${entry.model.variant ? '#' + entry.model.variant : ''}` : undefined,
        }));
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(rows));
    } catch (error) {
      res.writeHead(502).end(String(error));
    }
    return;
  }

  if (url.pathname.startsWith('/svc/')) {
    try {
      const upstream = await fetch(`http://127.0.0.1:${servicePort}${url.pathname.slice(4)}${url.search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.writeHead(upstream.status, { 'content-type': 'application/json' }).end(await upstream.text());
    } catch (error) {
      res.writeHead(502).end(String(error));
    }
    return;
  }

  const rel = decodeURIComponent(url.pathname === '/' ? '/dev/harness.html' : url.pathname);
  const file = path.join(ROOT, rel);
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
server.listen(45997, '127.0.0.1', () => {
  console.log('\nharness   http://127.0.0.1:45997/            (add ?session=<id>)');
  console.log('service   ' + servicePort + '   files  ' + OPENCODE_PORT + ' (opencode)\n');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    service.kill();
    process.exit(0);
  });
}
