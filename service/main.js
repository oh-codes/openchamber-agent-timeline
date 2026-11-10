/**
 * OpenChamber extension service: builds a swimlane timeline for one session tree.
 *
 * Contract (packages/sdk/GUEST_SERVICES.md):
 *   - bind 127.0.0.1:$OPENCHAMBER_SERVICE_PORT
 *   - every request carries `Authorization: Bearer $OPENCHAMBER_SERVICE_TOKEN`
 *   - GET /health answers 200 when ready
 *   - OpenCode is reachable at $OPENCHAMBER_OPENCODE_URL, read-only, same bearer
 *
 * The service never writes. It only reads sessions and messages and reduces them
 * to lanes + segments, so the panel gets a small payload instead of a transcript.
 */
import http from 'node:http';

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN;
const OPENCODE = (process.env.OPENCHAMBER_OPENCODE_URL || '').replace(/\/+$/, '');

const MAX_LANES = 24;
const MAX_DEPTH = 4;
/** OpenCode rejects `limit` above 200 with a 400, so this is also the ceiling. */
const MESSAGES_PER_LANE = 120;
const MAX_MESSAGES_PER_LANE = 200;
const PREVIEW = 240;
const CACHE_MS = 1200;
const cache = new Map();

if (!PORT || !TOKEN) {
  console.error('[agent-timeline] missing OPENCHAMBER_SERVICE_PORT or OPENCHAMBER_SERVICE_TOKEN');
  process.exit(1);
}

async function oc(path) {
  if (!OPENCODE) throw new Error('OPENCHAMBER_OPENCODE_URL is not set');
  const res = await fetch(OPENCODE + path, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`opencode ${path} -> ${res.status}`);
  return res.json();
}

function modelLabel(session) {
  const m = session?.model;
  if (!m) return null;
  return `${m.providerID || '?'}/${m.id || '?'}${m.variant ? '#' + m.variant : ''}`;
}

function statusOf(session) {
  if (session?.time?.busy && (!session.time.idle || session.time.busy > session.time.idle)) return 'working';
  return 'idle';
}

/** Sessions directly below `id`, newest first. */
async function childrenOf(id) {
  const body = await oc(`/api/session?parentID=${encodeURIComponent(id)}&limit=100`);
  return Array.isArray(body?.data) ? body.data : [];
}

async function buildLanes(root) {
  const lanes = [root];
  let frontier = [root.id];
  for (let depth = 1; depth < MAX_DEPTH && lanes.length < MAX_LANES; depth++) {
    const next = [];
    for (const parentId of frontier) {
      let kids = [];
      try {
        kids = await childrenOf(parentId);
      } catch {
        kids = [];
      }
      for (const kid of kids) {
        if (lanes.length >= MAX_LANES) break;
        lanes.push(kid);
        next.push(kid.id);
      }
    }
    if (!next.length) break;
    frontier = next;
  }
  return lanes;
}

function segmentKind(part) {
  if (part.type === 'reasoning') return 'reasoning';
  if (part.type === 'tool') return 'tool';
  if (part.type === 'text') return 'text';
  return part.type || 'other';
}

/** Tools that do no work themselves: they wait for a subagent or for the user. */
const WAIT_SUBAGENT = new Set(['subagent', 'task', 'delegate']);

function waitOf(part) {
  if (part?.type !== 'tool') return { wait: null, waitLabel: null };
  const input = part.state?.input || {};
  if (WAIT_SUBAGENT.has(part.name)) {
    const agent = typeof input.agent === 'string' ? input.agent : '';
    const what = typeof input.description === 'string' ? input.description : '';
    return { wait: 'subagent', waitLabel: trim([agent, what].filter(Boolean).join(' — '), 140) || null };
  }
  if (part.name === 'question') {
    const first = Array.isArray(input.questions) ? input.questions[0] : null;
    const text = typeof first?.question === 'string' ? first.question : typeof input.question === 'string' ? input.question : '';
    return { wait: 'user', waitLabel: trim(text, 140) || null };
  }
  return { wait: null, waitLabel: null };
}

function trim(text, max) {
  const s = typeof text === 'string' ? text : text == null ? '' : JSON.stringify(text);
  return s.length > max ? s.slice(0, max) + '…' : s;
}

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * One message's parts as time segments.
 *
 * Real payloads: `reasoning` and `tool` carry `time`, `text` does not, and
 * reasoning can overlap the tool it leads into. Missing bounds are filled from
 * the neighbours inside the same message, so a text part covers the span
 * between the parts around it instead of vanishing.
 */
function segmentsOfMessage(laneId, message) {
  const parts = Array.isArray(message.content) ? message.content : [];
  const messageStart = num(message.time?.created);
  const messageEnd = num(message.time?.completed);

  if (message.type === 'user') {
    const start = messageStart;
    if (start == null) return [];
    return [{ lane: laneId, kind: 'user', name: 'prompt', start, end: num(message.time?.completed) ?? start, messageId: message.id, index: -1, preview: trim(firstText(parts), PREVIEW) }];
  }

  /*
   * A compaction is a message of its own with a single timestamp — the moment it
   * ran. It blocks the session while it summarizes, so it is drawn as a marker
   * (see the panel) rather than a bar with an end.
   */
  if (message.type === 'compaction') {
    if (messageStart == null) return [];
    return [{
      lane: laneId,
      kind: 'compaction',
      name: 'compaction',
      start: messageStart,
      end: messageStart,
      status: message.status || null,
      reason: message.reason || null,
      tokens: message.tokens ? { input: message.tokens.input, output: message.tokens.output, cacheRead: message.tokens.cache?.read } : null,
      messageId: message.id,
      index: -1,
      preview: trim(message.summary, PREVIEW),
    }];
  }

  const rows = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const kind = segmentKind(part);
    if (kind === 'other') continue;
    const running = part.type === 'tool' && part.state?.status === 'running';
    rows.push({
      lane: laneId,
      kind,
      name: kind === 'tool' ? part.name || 'tool' : kind,
      start: num(part.time?.created) ?? num(part.time?.ran),
      end: running ? Date.now() : num(part.time?.completed) ?? (kind === 'tool' ? num(part.time?.ran) : null),
      running,
      status: part.type === 'tool' ? part.state?.status || null : null,
      ...waitOf(part),
      messageId: message.id,
      index: i,
      preview: previewOf(part),
    });
  }

  // A text part carries no timing at all. It ends when the message stopped
  // streaming, never when a later tool stopped — a tool that waited for the
  // user would otherwise stretch the text over minutes.
  const ceiling = num(message.time?.streamed) ?? messageEnd;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.start == null) {
      let previous = null;
      for (let j = i - 1; j >= 0 && previous == null; j--) previous = rows[j].end ?? rows[j].start;
      row.start = previous ?? messageStart;
    }
    if (row.start == null) continue;
    if (row.end == null) {
      let next = null;
      for (let j = i + 1; j < rows.length && next == null; j++) next = rows[j].start ?? rows[j].end;
      if (next != null && next > row.start) row.end = ceiling != null ? Math.min(next, ceiling) : next;
      else row.end = ceiling ?? row.start;
    }
    if (row.end <= row.start) row.end = row.start + 40;
    if (row.running) row.end = Math.max(row.end, row.start + 40);
    delete row.running;
  }

  /*
   * A tool call is emitted while the part before it is still open, and that part
   * is only closed a few hundred ms later. Left alone, every think -> act
   * handover claims two things ran at once and pushes the tool into a second
   * row. Thinking and text end where the next timed part begins; a tool's end is
   * real execution time and stays untouched.
   *
   * Parts are not ordered by time in `content` (a text part carries no time and
   * can sit between two timed ones), so this looks for the earliest later start
   * instead of comparing neighbours.
   */
  for (const row of rows) {
    if (row.kind === 'tool' || row.end == null) continue;
    let next = null;
    for (const other of rows) {
      if (other === row || other.start == null) continue;
      if (other.start > row.start && other.start < row.end && (next == null || other.start < next)) next = other.start;
    }
    if (next != null) row.end = next;
  }

  /*
   * Text has no timestamp of its own, so it was given the gap after the previous
   * part — which can sit inside a tool that ran later. Push it to the end of any
   * part it overlaps, so the answer text never claims to run during a tool call.
   */
  for (const row of rows) {
    if (row.kind !== 'text' || row.start == null) continue;
    for (const other of rows) {
      if (other === row || other.kind === 'text' || other.end == null) continue;
      if (other.start <= row.start && other.end > row.start) row.start = other.end;
    }
    if (row.end != null && row.end < row.start) row.end = row.start + 40;
  }

  return rows.filter((row) => row.start != null);
}

function firstText(parts) {
  for (const p of parts) if (typeof p.text === 'string') return p.text;
  return '';
}

function previewOf(part) {
  if (part.type === 'tool') {
    const input = part.state?.input;
    const target = input?.filePath || input?.path || input?.command || input?.pattern || input?.description || '';
    return trim(target ? `${part.name} ${target}` : part.name || 'tool', PREVIEW);
  }
  if (typeof part.text === 'string') return trim(part.text, PREVIEW);
  return '';
}

async function messagesOf(sessionId, limit = MESSAGES_PER_LANE) {
  const body = await oc(`/api/session/${encodeURIComponent(sessionId)}/message?order=desc&limit=${limit}`);
  const data = Array.isArray(body?.data) ? body.data : [];
  return data.reverse();
}

async function buildTimeline(sessionId, limit = MESSAGES_PER_LANE) {
  const rootBody = await oc(`/api/session/${encodeURIComponent(sessionId)}`);
  const root = rootBody?.data;
  if (!root) throw new Error('session not found');

  const lanesMeta = await buildLanes(root);
  const depthOf = new Map([[root.id, 0]]);
  for (const lane of lanesMeta) {
    if (lane.id === root.id) continue;
    const parentDepth = depthOf.get(lane.parentID);
    depthOf.set(lane.id, parentDepth == null ? 1 : parentDepth + 1);
  }

  const lanes = [];
  const segments = [];
  let partial = false;
  for (const session of lanesMeta) {
    const messages = await messagesOf(session.id, limit).catch(() => []);
    if (messages.length >= limit) partial = true;
    let model = modelLabel(session);
    let count = 0;
    for (const message of messages) {
      if (message.model?.id) model = `${message.model.providerID || '?'}/${message.model.id}${message.model.variant ? '#' + message.model.variant : ''}`;
      const laneSegments = segmentsOfMessage(session.id, message);
      count += laneSegments.length;
      segments.push(...laneSegments);
    }
    lanes.push({
      id: session.id,
      parentId: session.parentID || null,
      depth: depthOf.get(session.id) ?? 0,
      agent: session.agent || '?',
      title: session.title || session.id,
      model,
      status: statusOf(session),
      updated: session.time?.updated || null,
      segments: count,
    });
  }

  const times = segments.flatMap((s) => [s.start, s.end]).filter((n) => typeof n === 'number');
  const start = times.length ? Math.min(...times) : Date.now() - 60000;
  const end = times.length ? Math.max(...times) : Date.now();

  return {
    session: { id: root.id, title: root.title || root.id, agent: root.agent, model: modelLabel(root), status: statusOf(root) },
    lanes,
    segments,
    window: { start, end },
    /** The tree hit MAX_LANES / MAX_DEPTH. */
    truncated: lanesMeta.length >= MAX_LANES,
    /** Older messages of at least one lane were left out (the per-lane limit). */
    partial,
    limit,
  };
}

async function detailOf(sessionId, messageId, index) {
  const body = await oc(`/api/session/${encodeURIComponent(sessionId)}/message/${encodeURIComponent(messageId)}`);
  const message = body?.data;
  if (!message) throw new Error('message not found');
  if (message.type === 'compaction') {
    return {
      message: { id: message.id, type: 'compaction', agent: message.agent, model: message.model, time: message.time, tokens: message.tokens },
      part: {
        type: 'compaction',
        name: 'compaction',
        status: message.status ?? null,
        reason: message.reason ?? null,
        text: trim(message.summary, 20000),
        time: message.time,
        wait: null,
        waitLabel: null,
      },
      text: '',
    };
  }
  const part = index >= 0 ? message.content?.[index] : null;
  return {
    message: { id: message.id, type: message.type, agent: message.agent, model: message.model, time: message.time, tokens: message.tokens },
    part: part ? { type: part.type, name: part.name, text: trim(part.text, 8000), input: part.state?.input ?? null, output: trim(part.state?.content, 8000), status: part.state?.status ?? null, time: part.time, ...waitOf(part) } : null,
    /** A prompt segment has no part: the detail view shows the message text instead. */
    text: part ? '' : trim(firstText(Array.isArray(message.content) ? message.content : []), 8000),
  };
}

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload) });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return json(res, 401, { error: 'unauthorized' });

  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  try {
    if (url.pathname === '/health') return json(res, 200, { ok: true });

    if (url.pathname === '/timeline') {
      const session = url.searchParams.get('session');
      if (!session) return json(res, 400, { error: 'session required' });
      const limit = Math.min(MAX_MESSAGES_PER_LANE, Math.max(20, Number(url.searchParams.get('limit')) || MESSAGES_PER_LANE));
      const fresh = url.searchParams.get('fresh') === '1';
      const key = `${session}:${limit}`;
      const hit = cache.get(key);
      if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return json(res, 200, hit.body);
      const body = await buildTimeline(session, limit);
      cache.set(key, { at: Date.now(), body });
      if (cache.size > 32) cache.delete(cache.keys().next().value);
      return json(res, 200, body);
    }

    if (url.pathname === '/detail') {
      const session = url.searchParams.get('session');
      const message = url.searchParams.get('message');
      const index = Number(url.searchParams.get('index'));
      if (!session || !message) return json(res, 400, { error: 'session and message required' });
      return json(res, 200, await detailOf(session, message, Number.isFinite(index) ? index : -1));
    }

    return json(res, 404, { error: 'unknown route' });
  } catch (error) {
    return json(res, 502, { error: String(error?.message || error) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[agent-timeline] listening on 127.0.0.1:${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
