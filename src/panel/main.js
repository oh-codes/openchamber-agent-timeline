import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

/**
 * Panel for the open chat: one lane per agent level, one bar per reasoning,
 * tool call and text part, scaled against the session's real timings.
 *
 * All data arrives from this package's service via `serviceRequest`; the frame
 * never talks to OpenCode itself and never sees a token.
 */

const STRINGS = {
  en: {
    empty: 'No session open. Open a chat to see its timeline.',
    noSegments: 'This session has no recorded parts yet.',
    loading: 'Loading timeline…',
    reload: 'Reload',
    active: 'active',
    clock: 'clock',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit the whole timeline',
    zoomHint: 'Ctrl+wheel zooms, drag pans, double-click a bar zooms to it.',
    waiting: 'Waiting',
    waitSubagent: 'waiting for',
    waitUser: 'waiting for you',
    toolRun: (n) => `${n} tool calls`,
    compaction: 'Compaction',
    summary: 'Summary',
    reason: 'Reason',
    fontSize: 'Text size',
    fontHint: 'The host passes no interface size to extensions, so this is the panel’s own.',
    mapHint: 'Drag the window, or click the strip to jump.',
    live: 'Follows the newest part',
    session: 'Session',
    lanes: (n) => `${n} lane${n === 1 ? '' : 's'}`,
    segments: (n) => `${n} segment${n === 1 ? '' : 's'}`,
    truncated: 'Tree cut off at the depth/size limit.',
    partial: (n) => `Only the newest ${n} messages per lane are loaded.`,
    failed: (status, message) => `Service ${status}: ${message}`,
    serviceDown: 'The extension service is not answering. Open Settings → Extensions and reload it.',
    running: 'running',
    stalled: 'no progress for minutes',
    stalledShort: 'stalled',
    prompt: 'prompt',
    time: 'Time',
    duration: 'Duration',
    status: 'Status',
    agent: 'Agent',
    model: 'Model',
    tokens: 'Tokens',
    reasoningNotReported: 'reasoning not reported by the provider',
    input: 'Input',
    output: 'Output',
    text: 'Text',
    thinking: 'Thinking',
    tool: 'Tool',
    reasoning: 'Thinking',
    user: 'Prompt',
    legend: { reasoning: 'thinking', tool: 'tool', text: 'text', user: 'prompt', waiting: 'waiting' },
  },
  de: {
    empty: 'Keine Session offen. Öffne einen Chat, dann erscheint seine Zeitachse.',
    noSegments: 'Diese Session hat noch keine aufgezeichneten Teile.',
    loading: 'Zeitachse wird geladen…',
    reload: 'Neu laden',
    active: 'aktiv',
    clock: 'Uhrzeit',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    fit: 'Ganze Zeitachse zeigen',
    zoomHint: 'Strg+Mausrad zoomt, Ziehen verschiebt, Doppelklick auf einen Balken zoomt darauf.',
    waiting: 'Warten',
    waitSubagent: 'wartet auf',
    waitUser: 'wartet auf dich',
    toolRun: (n) => `${n} Tool-Aufrufe`,
    compaction: 'Kompaktierung',
    summary: 'Zusammenfassung',
    reason: 'Grund',
    fontSize: 'Textgröße',
    fontHint: 'Der Host übergibt Erweiterungen keine Interface-Größe, das hier ist die eigene.',
    mapHint: 'Fenster ziehen oder in den Streifen klicken.',
    live: 'folgt dem neuesten Teil',
    session: 'Session',
    lanes: (n) => `${n} Spur${n === 1 ? '' : 'en'}`,
    segments: (n) => `${n} Segment${n === 1 ? '' : 'e'}`,
    truncated: 'Baum an Tiefen-/Größenlimit abgeschnitten.',
    partial: (n) => `Nur die letzten ${n} Nachrichten je Spur geladen.`,
    failed: (status, message) => `Dienst ${status}: ${message}`,
    serviceDown: 'Der Erweiterungsdienst antwortet nicht. Einstellungen → Extensions → neu laden.',
    running: 'läuft',
    stalled: 'seit Minuten kein Fortschritt',
    stalledShort: 'hängt',
    prompt: 'Prompt',
    time: 'Zeit',
    duration: 'Dauer',
    status: 'Status',
    agent: 'Agent',
    model: 'Modell',
    tokens: 'Tokens',
    reasoningNotReported: 'Reasoning-Tokens meldet der Provider nicht',
    input: 'Eingabe',
    output: 'Ausgabe',
    text: 'Text',
    thinking: 'Denken',
    tool: 'Tool',
    reasoning: 'Denken',
    user: 'Prompt',
    legend: { reasoning: 'Denken', tool: 'Tool', text: 'Text', user: 'Prompt', waiting: 'Warten' },
  },
};

const ROW_H = 11;
const BAR_H = 8;

/**
 * Row and bar height follow the panel width and the zoom.
 *
 * Fixed 8px bars read as hairlines in a wide page and stay tiny when zooming
 * into a few minutes, so both the available width and the zoom factor thicken
 * them, up to a cap.
 */
function barMetrics() {
  const width = dom.lanes.clientWidth || 340;
  const widthScale = 1 + clamp01((width - 300) / 700) * 0.9;
  const zoomScale = 1 + Math.min(1.1, Math.log2(Math.max(1, viewZoom())) * 0.38);
  const scale = Math.min(2.6, state.fontScale * widthScale * zoomScale);
  return { row: Math.round(ROW_H * scale), bar: Math.max(6, Math.round(BAR_H * scale)) };
}
const GAP_MS = 15000;
const POLL_MS = 1500;
const STALL_POLL_MS = 15000;

const host = connectHost();
const dom = {
  status: byId('status'),
  agent: byId('agent'),
  title: byId('title'),
  reload: byId('reload'),
  meta: byId('meta'),
  modes: byId('modes'),
  zoom: byId('zoom'),
  zoomFit: byId('zoom')?.querySelector('[data-zoom="fit"]') || null,
  font: byId('font'),
  map: byId('map'),
  mapCanvas: byId('map-canvas'),
  mapWin: byId('map-win'),
  count: byId('count'),
  axis: byId('axis'),
  lanes: byId('lanes'),
  drawer: byId('drawer'),
  drawerKind: byId('d-kind'),
  drawerWhat: byId('d-what'),
  drawerBody: byId('d-body'),
  drawerClose: byId('d-close'),
  legend: byId('legend'),
};

const state = {
  lang: 'en',
  session: null,
  timeline: null,
  mode: 'active',
  error: null,
  loading: false,
  inflight: false,
  selected: null,
  seq: 0,
  timer: null,
  detailSeq: 0,
  laneInfo: new Map(),
  /** Visible slice of the timeline in scale fractions (0..1); [0,1] is the whole span. */
  view: { start: 0, end: 1 },
  /** The same slice in wall-clock ms, so a growing span cannot move it. */
  anchor: null,
  /** The slice touches the newest end: keep it there and let it grow. */
  follow: true,
  /** Width of the following window in chart milliseconds (null = the whole span). */
  followMs: null,
  scale: null,
  /** Text scale on top of the host's root size (which carries no size setting). */
  fontScale: 1,
  /** The next render should open on the last DEFAULT_WINDOW_MS, not the whole span. */
  viewPending: true,
  /** A pan just moved the view; the click that follows must not open a segment. */
  panEndedAt: 0,
};

const MIN_VIEW = 0.0008;
const FONT_STEPS = [0.85, 1, 1.15, 1.3, 1.5];
/** What a freshly opened chat shows: the last ten minutes, following. */
const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

const t = () => STRINGS[state.lang] || STRINGS.en;

function byId(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function fmtClock(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleTimeString(state.lang === 'de' ? 'de-DE' : 'en-GB', { hour12: false });
}

function fmtDur(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/* ------------------------------------------------------------------ scale */

function mergeSpans(spans) {
  const sorted = spans.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b >= a).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 1) last[1] = Math.max(last[1], b);
    else out.push([a, Math.max(a + 1, b)]);
  }
  return out;
}

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * Time → fraction of the track.
 *
 * `clock` is linear. `active` cuts every idle stretch longer than GAP_MS down
 * to GAP_MS, so ten minutes of waiting between two turns stop squeezing the
 * work into a sliver. Cut positions are returned so the lanes can mark them.
 */
function buildScale(bounds, segments, mode) {
  const spans = mergeSpans(segments.map((s) => [s.start, s.end]));
  if (!spans.length) return null;

  const start = typeof bounds?.start === 'number' ? bounds.start : spans[0][0];
  const end = typeof bounds?.end === 'number' ? bounds.end : spans[spans.length - 1][1];

  if (mode !== 'active') {
    const total = Math.max(1, end - start);
    return {
      map: (time) => clamp01((time - start) / total),
      unmap: (fraction) => start + fraction * total,
      cuts: [],
    };
  }

  const parts = [];
  const cuts = [];
  let virtualEnd = 0;

  const addPart = (from, to, width) => {
    if (to - from <= 0) return;
    parts.push({ from, to, virtualStart: virtualEnd, virtualLength: Math.max(1e-6, width) });
    virtualEnd += Math.max(1e-6, width);
  };

  for (let i = 0; i < spans.length; i++) {
    const [from, to] = spans[i];
    const gapStart = i === 0 ? start : spans[i - 1][1];
    const gap = from - gapStart;
    if (gap > 0) {
      if (gap > GAP_MS) cuts.push({ at: from, gap });
      addPart(gapStart, from, Math.min(gap, GAP_MS));
    }
    addPart(from, to, Math.max(1, to - from));
  }
  const total = Math.max(1e-6, virtualEnd);
  const ratio = (part) => (part.to - part.from) / part.virtualLength;

  return {
    total,
    map: (time) => {
      for (const part of parts) {
        if (time <= part.to) {
          const clamped = Math.min(Math.max(time, part.from), part.to);
          return clamp01((part.virtualStart + (clamped - part.from) / ratio(part)) / total);
        }
      }
      return 1;
    },
    unmap: (fraction) => {
      const target = clamp01(fraction) * total;
      for (const part of parts) {
        if (target <= part.virtualStart + part.virtualLength) {
          return part.from + (target - part.virtualStart) * ratio(part);
        }
      }
      return parts[parts.length - 1].to;
    },
    cuts: cuts.map((cut) => ({ ...cut, fraction: 0 })),
  };
}

/**
 * Segments that overlap only by a handover touch share a row.
 *
 * OpenCode emits the tool call a few hundred ms before the reasoning part is
 * marked complete, so a strict "no overlap" rule pushed almost every tool into
 * a second row for an artifact of 0.2–0.6 s. Real parallel calls are minutes
 * apart from this threshold.
 */
const OVERLAP_MS = 400;

/**
 * A burst of tool calls becomes one bar.
 *
 * Ten calls in four seconds are ten hairlines that hide the shape of the turn.
 * Calls that follow each other within TOOL_RUN_GAP are merged; the drawer then
 * lists them one by one. A reasoning or text part ends the run, so thinking
 * still separates the phases.
 */
const TOOL_RUN_GAP = 1500;

function groupTools(segments) {
  const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
  const out = [];
  let run = null;
  for (const segment of sorted) {
    if (segment.kind !== 'tool') {
      run = null;
      out.push(segment);
      continue;
    }
    const last = run?.items[run.items.length - 1];
    // A waiting call is a phase of its own, not part of a burst.
    if (run && !segment.wait && !last.wait && segment.start - last.end <= TOOL_RUN_GAP) {
      run.items.push(segment);
      run.end = Math.max(run.end, segment.end);
      run.status = segment.status === 'error' || run.status === 'error' ? 'error' : segment.status === 'running' || run.status === 'running' ? 'running' : run.status;
      continue;
    }
    run = {
      kind: 'tool',
      name: segment.name,
      start: segment.start,
      end: segment.end,
      status: segment.status,
      wait: segment.wait,
      items: [segment],
      lane: segment.lane,
      messageId: segment.messageId,
      index: segment.index,
    };
    out.push(run);
  }
  // A run of one is just the segment itself.
  return out.map((item) => (item.items && item.items.length === 1 ? item.items[0] : item));
}

/** The span of the scale that covers `targetMs` of wall-clock time at its end. */
function spanForDuration(scale, targetMs) {
  const endTime = scale.unmap(1);
  if (endTime - scale.unmap(0) <= targetMs) return 1;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    // The further right the window starts, the less time it covers.
    if (endTime - scale.unmap(middle) > targetMs) low = middle;
    else high = middle;
  }
  return Math.max(MIN_VIEW, 1 - high);
}

function packRows(segments) {
  const rows = [];
  for (const segment of [...segments].sort((a, b) => a.start - b.start || a.end - b.end)) {
    let row = rows.find((candidate) => segment.start >= candidate.end - OVERLAP_MS);
    if (!row) {
      row = { end: segment.end, items: [] };
      rows.push(row);
    }
    row.items.push(segment);
    row.end = Math.max(row.end, segment.end);
  }
  return rows;
}

/* -------------------------------------------------------------- viewport */

/** Clamp a slice of the scale to [0,1] and to a minimum span. */
function setViewFrac(start, end) {
  let from = Math.min(Math.max(0, start), 1);
  let to = Math.min(Math.max(0, end), 1);
  if (to - from < MIN_VIEW) {
    const middle = (from + to) / 2;
    from = Math.min(Math.max(0, middle - MIN_VIEW / 2), 1 - MIN_VIEW);
    to = from + MIN_VIEW;
  }
  state.view = { start: from, end: to };
  anchorView();
}

/**
 * Pin the visible slice to the times behind it.
 *
 * The view is stored as a fraction of the total span, and the span grows while
 * the chat works. Without this anchor the same fraction covered different
 * times after every poll, so a section the user picked drifted away.
 *
 * A window that touches the newest end is the exception: there the user wants
 * to stay attached to the end, so it keeps its width and follows instead.
 */
function anchorView() {
  if (!state.scale) return;
  const span = state.view.end - state.view.start;
  if (state.view.end > 0.995) {
    state.follow = true;
    state.followMs = Math.max(1000, state.scale.unmap(state.view.end) - state.scale.unmap(state.view.start));
    state.anchor = null;
    return;
  }
  state.follow = false;
  state.followMs = null;
  // The whole span is not a place: following the data is what it means.
  if (span > 0.999) {
    state.anchor = null;
    return;
  }
  state.anchor = {
    from: state.scale.unmap(state.view.start),
    to: state.scale.unmap(state.view.end),
  };
}

/** Zoom around a point given as a fraction of the *current* view. */
function zoomAt(fraction, factor) {
  const wasFollowing = state.follow;
  const { start, end } = state.view;
  const span = Math.max(MIN_VIEW, end - start);
  const next = Math.min(1, Math.max(MIN_VIEW, span * factor));
  if (wasFollowing) {
    // Zooming while the window hangs on the newest end should stay there:
    // "show me the last minutes, closer" is what this gesture means.
    const from = Math.max(0, 1 - next);
    state.view = { start: from, end: from + next };
    anchorView();
    return;
  }
  const anchor = start + fraction * span;
  setViewFrac(anchor - fraction * next, anchor - fraction * next + next);
}

function zoomToSegment(segment) {
  if (!state.scale) return;
  const from = state.scale.map(segment.start);
  const to = state.scale.map(segment.end);
  const margin = Math.max((to - from) * 0.1, MIN_VIEW);
  setViewFrac(from - margin, to + margin);
}

function resetView() {
  state.view = { start: 0, end: 1 };
  // Back to the whole span: follow the data again instead of staying pinned.
  state.follow = true;
  state.followMs = null;
  state.anchor = null;
}

const viewZoom = () => 1 / Math.max(MIN_VIEW, state.view.end - state.view.start);

/* -------------------------------------------------------------------- map */

/**
 * The whole timeline as a density strip, the visible slice as a window.
 * Without it a zoomed view gives no clue where inside the chat you are.
 */
function drawMap(scale, segments) {
  const canvas = dom.mapCanvas;
  if (!canvas) return;
  const width = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
  const height = Math.max(1, Math.round(canvas.getBoundingClientRect().height));
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const buckets = Math.max(24, Math.min(400, Math.floor(width / 2)));
  const counts = new Float32Array(buckets);
  for (const segment of segments) {
    const from = Math.max(0, Math.floor(scale.map(segment.start) * buckets));
    const to = Math.min(buckets - 1, Math.floor(scale.map(segment.end) * buckets));
    for (let i = from; i <= to; i++) counts[i] += 1;
  }
  let peak = 1;
  for (const count of counts) if (count > peak) peak = count;

  const tokens = getComputedStyle(document.documentElement);
  ctx.fillStyle = (tokens.getPropertyValue('--oc-primary') || '#6c8cff').trim();
  ctx.globalAlpha = 0.5;
  const barWidth = width / buckets;
  for (let i = 0; i < buckets; i++) {
    if (!counts[i]) continue;
    const barHeight = Math.max(1, (counts[i] / peak) * (height - 2));
    ctx.fillRect(i * barWidth, height - barHeight - 1, Math.max(1, barWidth - 0.5), barHeight);
  }
  ctx.globalAlpha = 1;

  // Compactions are invisible in a short window, so they get a tick on the strip.
  const compactionColor = (tokens.getPropertyValue('--oc-warning') || '#d29922').trim();
  ctx.fillStyle = compactionColor;
  for (const segment of segments) {
    if (segment.kind !== 'compaction') continue;
    ctx.fillRect(Math.round(scale.map(segment.start) * width), 0, 1, height);
  }

  const span = Math.max(MIN_VIEW, state.view.end - state.view.start);
  if (span > 0.999) {
    dom.mapWin.hidden = true;
  } else {
    dom.mapWin.hidden = false;
    dom.mapWin.style.left = `${(state.view.start * 100).toFixed(3)}%`;
    dom.mapWin.style.width = `${(span * 100).toFixed(3)}%`;
    dom.mapWin.classList.toggle('live', state.follow);
    dom.mapWin.title = state.follow ? t().live : '';
  }
}

/* --------------------------------------------------------------- fetching */

async function request(path, query) {
  let result;
  try {
    result = await host.serviceRequest({ method: 'GET', path, query });
  } catch (error) {
    // The host answers with a code instead of a response when the service
    // process is down; that is not something the user can read as a number.
    const down = error?.code === 'SERVICE_FAILED' || error?.code === 'NO_SERVICE' || error?.code === 'DISABLED';
    const wrapped = new Error(down ? t().serviceDown : error?.message || String(error));
    wrapped.status = 0;
    throw wrapped;
  }
  let body = null;
  try {
    body = JSON.parse(result.body || 'null');
  } catch {
    body = { error: 'unparseable response' };
  }
  if (result.status !== 200) {
    const error = new Error(body?.error || 'request failed');
    error.status = result.status;
    throw error;
  }
  return body;
}

async function load({ fresh = false } = {}) {
  const session = state.session;
  if (!session?.id) {
    state.timeline = null;
    state.error = null;
    render();
    return;
  }
  if (state.inflight) return;
  state.inflight = true;
  state.loading = !state.timeline;
  // The first fetch of a chat takes seconds; without this the frame sits empty
  // and looks like a broken panel rather than a loading one.
  if (state.loading) render();
  state.seq += 1;
  const seq = state.seq;
  try {
    // The first request of a cold panel starts the service process; the host
    // says ready once /health answers, so a first attempt can still miss.
    // An idle session polls nothing, so retry here instead of leaving an error.
    let timeline = null;
    for (let attempt = 1; ; attempt++) {
      try {
        timeline = await request('/timeline', fresh ? { session: session.id, fresh: '1' } : { session: session.id });
        break;
      } catch (error) {
        if (attempt >= 3 || seq !== state.seq) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 700));
        if (seq !== state.seq) return;
      }
    }
    if (seq !== state.seq) return;
    state.timeline = timeline;
    state.error = null;
  } catch (error) {
    if (seq !== state.seq) return;
    state.error = error;
  } finally {
    state.inflight = false;
    state.loading = false;
    render();
    schedule();
  }
}

/**
 * Is anything in this tree still moving?
 *
 * A subagent can run in the background after the chat's own turn ended: the
 * root is idle while a child keeps writing. Gating the poll on the root alone
 * froze those lanes on the snapshot taken when the parent stopped.
 */
function workingLanes() {
  return (state.timeline?.lanes || []).filter((lane) => lane.status === 'working');
}

function isBusy() {
  const working = workingLanes();
  if (working.length) return working.some((lane) => !lane.stalled);
  return Boolean(state.session?.busy);
}

/** Busy, but nothing has arrived for minutes: a run that died mid-stream. */
function isStalled() {
  const working = workingLanes();
  return working.length > 0 && working.every((lane) => lane.stalled);
}

function schedule() {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  if (!state.session?.id) return;
  // A stalled tree still gets asked, just rarely: it may revive.
  const delay = isBusy() ? POLL_MS : isStalled() ? STALL_POLL_MS : 0;
  if (!delay) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    load();
  }, delay);
}

function setSession(session) {
  const previous = state.session?.id || null;
  state.session = session || null;
  if ((session?.id || null) === previous) {
    schedule();
    return;
  }
  state.timeline = null;
  state.error = null;
  state.selected = null;
  state.viewPending = true;
  resetView();
  closeDrawer();
  render();
  if (session?.id) load();
}

/* ----------------------------------------------------------------- render */

function fmtWindow(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return '0s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function render() {
  const strings = t();
  const session = state.session;
  const timeline = state.timeline;

  dom.status.className = `dot ${isBusy() ? 'working' : isStalled() ? 'stalled' : 'idle'}`;
  dom.status.title = isBusy() ? strings.running : isStalled() ? strings.stalled : '';
  dom.agent.textContent = session?.agent || timeline?.session?.agent || '—';
  dom.title.textContent = session?.title || '';
  dom.title.title = session?.title || '';
  dom.reload.title = strings.reload;
  dom.reload.textContent = state.loading ? '…' : '↻';

  for (const button of dom.modes.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    button.textContent = strings[button.dataset.mode] || button.dataset.mode;
  }

  const lanes = timeline?.lanes || [];
  const segments = timeline?.segments || [];
  const narrow = window.innerWidth < 420;
  dom.meta.textContent = timeline
    ? [timeline.session?.model || session?.model, narrow ? null : session?.id].filter(Boolean).join(' · ')
    : session?.model || '';

  dom.legend.innerHTML = [
    ['reasoning', 'reasoning'],
    ['tool', 'tool'],
    ['waiting', 'tool waiting'],
    ['text', 'text'],
    ['user', 'user'],
  ]
    .map(([key, classes]) => `<span><i class="seg ${classes}" style="position:static;display:inline-block"></i>${esc(strings.legend[key])}</span>`)
    .join('');

  if (!session?.id) return showNote(strings.empty);
  if (state.error) return showNote(state.error.message || String(state.error), true);
  if (!timeline) return showNote(state.loading ? strings.loading : '');
  if (!segments.length) return showNote(strings.noSegments);

  const scale = buildScale(timeline.window, segments, state.mode);
  if (!scale) return showNote(strings.noSegments);
  state.scale = scale;

  // A pinned slice is re-derived from its times: the span it was a fraction of
  // has probably grown since the last poll. A slice at the newest end instead
  // keeps its width and moves with the end.
  if (state.viewPending) {
    // A chat opens on the recent work, not on three hours of history.
    state.viewPending = false;
    state.follow = true;
    state.followMs = DEFAULT_WINDOW_MS;
    state.anchor = null;
  }
  if (state.follow) {
    // followMs is wall-clock time; null means the whole span (that is what fit does).
    const width = state.followMs;
    const span = width == null ? 1 : spanForDuration(scale, width);
    state.view = { start: 1 - span, end: 1 };
  } else if (state.anchor) {
    state.view = { start: scale.map(state.anchor.from), end: scale.map(state.anchor.to) };
  }

  const { start: viewFrom, end: viewTo } = state.view;
  const viewSpan = Math.max(MIN_VIEW, viewTo - viewFrom);
  /** Time → percent inside the visible slice; may fall outside 0..100. */
  const pct = (time) => ((scale.map(time) - viewFrom) / viewSpan) * 100;

  const tickCount = Math.max(2, Math.min(6, Math.floor(trackWidth() / 76)));
  const ticks = Array.from({ length: tickCount }, (_, index) => index / (tickCount - 1));
  syncChildren(
    dom.axis,
    ticks.map((tick) => tick.toFixed(4)),
    () => document.createElement('span'),
    (span, key) => {
      const tick = Number(key);
      span.style.left = `${(tick * 100).toFixed(3)}%`;
      span.textContent = fmtClock(scale.unmap(viewFrom + tick * viewSpan));
    },
  );

  const cuts = scale.cuts
    .map((cut) => ({ ...cut, at: pct(cut.at) }))
    .filter((cut) => cut.at >= -0.5 && cut.at <= 100.5);

  state.laneInfo = new Map();
  const byLane = new Map();
  for (const lane of lanes) state.laneInfo.set(lane.id, lane);

  /*
   * One lane per agent level, not per session: two `coder` subagents spawned
   * from the same parent are the same level and share a lane, with their bars
   * packed into sub-rows where they overlap. Indentation still comes from depth.
   */
  const groups = [];
  const byGroupKey = new Map();
  const groupOfLane = new Map();
  for (const lane of lanes) {
    const key = `${lane.depth}:${lane.agent || '?'}`;
    let group = byGroupKey.get(key);
    if (!group) {
      group = { key, depth: lane.depth, agent: lane.agent || '?', sessions: [], models: [], segments: [] };
      byGroupKey.set(key, group);
      groups.push(group);
    }
    group.sessions.push(lane);
    if (lane.model && !group.models.includes(lane.model)) group.models.push(lane.model);
    groupOfLane.set(lane.id, group);
  }

  for (const segment of segments) {
    const group = groupOfLane.get(segment.lane);
    if (!group) continue;
    if (!byLane.has(group.key)) byLane.set(group.key, []);
    byLane.get(group.key).push(segment);
  }

  const visible = groups.filter((group) => (byLane.get(group.key) || []).length);
  // Drop the loading/empty note: the lanes now carry the state. (syncChildren
  // only recycles keyed nodes, so a leftover note would sit under the lanes.)
  for (const stray of dom.lanes.querySelectorAll('[data-note="state"]')) stray.remove();
  if (dom.count) {
    const visibleMs = Math.abs(scale.unmap(viewTo) - scale.unmap(viewFrom));
    dom.count.textContent = [
      fmtWindow(visibleMs),
      strings.lanes(visible.length),
      narrow ? null : strings.segments(segments.length),
    ].filter(Boolean).join(' · ');
  }
  const zoom = viewZoom();
  dom.lanes.classList.toggle('zoomed', zoom > 1.02);
  if (dom.zoomFit) {
    // The zoom factor belongs on the button that undoes it, not in the counter
    // (where it was the first thing to get truncated in a narrow rail).
    dom.zoomFit.hidden = zoom <= 1.02;
    dom.zoomFit.textContent = `fit ${zoom.toFixed(1)}×`;
  }
  if (dom.zoom) dom.zoom.title = strings.zoomHint;

  const { row: rowHeight, bar: barHeight } = barMetrics();

  syncChildren(
    dom.lanes,
    visible.map((group) => group.key),
    () => {
      const row = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'name';
      const track = document.createElement('div');
      track.className = 'track';
      track.addEventListener('click', (event) => {
        // A pan ends with a click; that one must not open a segment. Compaction
        // markers handle their own click — do not resolve it to a nearby bar.
        if (performance.now() - state.panEndedAt < 300) return;
        if (event.target.closest('.mark')) return;
        const hit = nearestBar(track, event);
        if (!hit) return;
        select(hit.segment, track.querySelector(`[data-key="${CSS.escape(hit.key)}"]`));
      });
      track.addEventListener('dblclick', (event) => {
        const hit = nearestBar(track, event);
        if (!hit) return;
        event.preventDefault();
        zoomToSegment(hit.segment);
        render();
      });
      row.append(name, track);
      row.name = name;
      row.track = track;
      // Compaction markers live in their own layer so they do not disturb the
      // keyed reconciliation of the bars.
      const marks = document.createElement('div');
      marks.className = 'marks';
      track.append(marks);
      row.marks = marks;
      row.cutsKey = '';
      return row;
    },
    (row, key) => {
      const group = byGroupKey.get(key);
      const laneRaw = byLane.get(key) || [];
      // Compactions are point events: markers, not bars.
      const compactions = laneRaw.filter((segment) => segment.kind === 'compaction');
      const laneSegments = groupTools(laneRaw.filter((segment) => segment.kind !== 'compaction'));
      const rows = packRows(laneSegments);

      row.className = group.depth === 0 ? 'lane root' : 'lane';
      row.title = [
        group.agent,
        group.models.join(', '),
        group.sessions.length > 1 ? group.sessions.map((lane) => lane.title).join(' · ') : group.sessions[0]?.title,
      ].filter(Boolean).join(' — ');
      row.name.innerHTML = `${group.depth ? `<span class="depth">${'·'.repeat(Math.min(group.depth, 4))} </span>` : ''}${esc(group.agent)}${group.sessions.length > 1 ? `<span class="nb">×${group.sessions.length}</span>` : ''}${group.sessions.some((lane) => lane.stalled) ? `<span class="nb warn">${esc(strings.stalledShort)}</span>` : ''}`;

      const track = row.track;
      track.style.height = `${rows.length * rowHeight + 2}px`;

      const cutsKey = cuts.map((cut) => cut.at.toFixed(3)).join(',');
      if (row.cutsKey !== cutsKey) {
        row.cutsKey = cutsKey;
        for (const mark of track.querySelectorAll('.cut')) mark.remove();
        for (const cut of cuts) {
          const mark = document.createElement('div');
          mark.className = 'cut';
          mark.style.left = `${cut.at.toFixed(3)}%`;
          mark.title = `+${fmtDur(cut.gap)} idle`;
          track.append(mark);
        }
      }

      const order = [];
      const geometry = new Map();
      rows.forEach((packed, rowIndex) => {
        for (const segment of packed.items) {
          // A zoomed view holds a fraction of the timeline: drop the bars outside it.
          const from = pct(segment.start);
          const to = pct(segment.end);
          if (to < 0 || from > 100) continue;
          const key2 = segmentKey(segment);
          order.push(key2);
          geometry.set(key2, { segment, rowIndex, left: Math.max(0, from), right: Math.min(100, to) });
        }
      });

      // Hit targets for the nearest-click resolver: a 2 px tick cannot be hit
      // reliably, so the click is matched by distance in the track instead.
      track._bars = [...geometry.entries()].map(([barKey, entry]) => ({
        key: barKey,
        segment: entry.segment,
        left: entry.left,
        right: entry.right,
      }));

      syncChildren(
        track,
        order,
        (barKey) => {
          const bar = document.createElement('div');
          bar.className = 'seg';
          return bar;
        },
        (bar, barKey) => {
          const { segment, rowIndex, left, right } = geometry.get(barKey);
          // Thinking is the backdrop to the work: a slimmer bar than a tool call.
          const height = segment.kind === 'reasoning' ? Math.max(4, Math.round(barHeight * 0.6)) : barHeight;
          const className = `seg ${segment.kind}${segment.status ? ` ${segment.status}` : ''}${segment.wait ? ' waiting' : ''}${state.selected === barKey ? ' sel' : ''}`;
          if (bar.className !== className) bar.className = className;
          bar.style.left = `${left.toFixed(3)}%`;
          bar.style.width = `${Math.max(right - left, 0.12).toFixed(3)}%`;
          bar.style.top = `${rowIndex * rowHeight + 1 + Math.round((barHeight - height) / 2)}px`;
          bar.style.height = `${height}px`;
          const waitNote = segment.wait === 'subagent'
            ? `${strings.waitSubagent} ${segment.waitLabel || ''}`.trim()
            : segment.wait === 'user'
              ? strings.waitUser
              : '';
          const countNote = segment.items?.length > 1 ? strings.toolRun(segment.items.length) : '';
          bar.title = [
            countNote || `${segment.name} · ${fmtDur(segment.end - segment.start)}`,
            countNote ? fmtDur(segment.end - segment.start) : '',
            waitNote,
            countNote ? segment.items.map((item) => item.name).slice(0, 8).join(', ') : segment.preview,
          ].filter(Boolean).join('\n');
        },
      );

      // Compaction markers: a dashed line at the moment the summary ran.
      const visibleCompactions = compactions
        .map((segment) => ({ segment, at: pct(segment.start) }))
        .filter((entry) => entry.at >= -1 && entry.at <= 101);
      row.marks._map = new Map(visibleCompactions.map((entry) => [entry.segment.messageId, entry.segment]));
      syncChildren(
        row.marks,
        visibleCompactions.map((entry) => entry.segment.messageId),
        (markKey) => {
          const mark = document.createElement('div');
          mark.className = 'mark';
          mark.addEventListener('click', () => {
            const segment = row.marks._map.get(markKey);
            if (segment) select(segment, mark);
          });
          return mark;
        },
        (mark, markKey) => {
          const entry = visibleCompactions.find((candidate) => candidate.segment.messageId === markKey);
          const segment = entry.segment;
          mark.style.left = `${entry.at.toFixed(3)}%`;
          mark.className = `mark${segment.status ? ` ${segment.status}` : ''}`;
          mark.title = [
            `${strings.compaction} · ${fmtClock(segment.start)}`,
            segment.reason,
            segment.preview,
          ].filter(Boolean).join('\n');
        },
      );
    },
  );

  if (timeline.truncated) {
    if (!dom.lanes.querySelector('[data-note="truncated"]')) {
      const marker = note(strings.truncated);
      marker.dataset.note = 'truncated';
      dom.lanes.append(marker);
    }
  } else {
    dom.lanes.querySelector('[data-note="truncated"]')?.remove();
  }

  if (timeline.partial) {
    const existing = dom.lanes.querySelector('[data-note="partial"]');
    const text = strings.partial(timeline.limit);
    if (!existing) {
      const marker = note(text);
      marker.dataset.note = 'partial';
      dom.lanes.append(marker);
    } else if (existing.textContent !== text) {
      existing.textContent = text;
    }
  } else {
    dom.lanes.querySelector('[data-note="partial"]')?.remove();
  }

  dom.map.hidden = false;
  dom.map.title = strings.mapHint;
  drawMap(scale, segments);
}

const segmentKey = (segment) => `${segment.lane}|${segment.messageId}|${segment.index}`;

/**
 * The segment a click in this track means.
 *
 * Bars can be a couple of pixels wide (a prompt has no duration, a text part
 * 40 ms), and widening them would make neighbours overlap. So the click is
 * resolved by distance instead: the bar under the pointer, or the nearest one
 * within a few pixels.
 */
function nearestBar(track, event) {
  const bars = track._bars || [];
  const rect = track.getBoundingClientRect();
  if (!bars.length || !rect.width) return null;
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const tolerance = (7 / rect.width) * 100;
  let best = null;
  for (const bar of bars) {
    const distance = x < bar.left ? bar.left - x : x > bar.right ? x - bar.right : 0;
    if (distance > tolerance) continue;
    if (!best || distance < best.distance) best = { ...bar, distance };
  }
  return best;
}

/** Pixel width of a track: the axis must not put labels closer than they can read. */
function trackWidth() {
  const track = dom.lanes.querySelector('.track');
  if (track && track.clientWidth) return track.clientWidth;
  return Math.max(140, dom.lanes.clientWidth * 0.6);
}

/**
 * Reconcile children by `data-key`, reusing the nodes already in `parent`.
 * A poll every 1.5 s must not rebuild the lanes: a rebuilt bar loses its hover,
 * its tooltip and the click a user was about to make.
 */
function syncChildren(parent, keys, create, update) {
  const existing = new Map();
  for (const child of parent.children) {
    if (child.dataset.key) existing.set(child.dataset.key, child);
  }
  keys.forEach((key, index) => {
    let node = existing.get(key);
    if (node) existing.delete(key);
    else {
      node = create(key);
      node.dataset.key = key;
    }
    update(node, key);
    const current = parent.children[index];
    if (current !== node) parent.insertBefore(node, current || null);
  });
  for (const leftover of existing.values()) leftover.remove();
}

function note(text, isError = false) {
  const div = document.createElement('div');
  div.className = isError ? 'note error' : 'note';
  div.textContent = text;
  return div;
}

/** Empty state: one message instead of lanes, and nothing left to reuse. */
function showNote(text, isError = false) {
  dom.axis.replaceChildren();
  dom.lanes.replaceChildren();
  dom.map.hidden = true;
  const marker = note(text, isError);
  marker.dataset.note = 'state';
  dom.lanes.append(marker);
}

/* ----------------------------------------------------------------- detail */

function select(segment, bar) {
  const key = `${segment.lane}|${segment.messageId}|${segment.index}`;
  state.selected = key;
  for (const other of dom.lanes.querySelectorAll('.seg.sel')) other.classList.remove('sel');
  bar?.classList.add('sel');
  if (segment.items?.length > 1) openToolRun(segment);
  else openDetail(segment);
}

/** A merged tool run: the drawer lists the calls, each one opens its detail. */
function openToolRun(run) {
  const strings = t();
  state.detailSeq += 1;
  dom.drawer.hidden = false;
  dom.drawerKind.textContent = strings.toolRun(run.items.length);
  dom.drawerWhat.textContent = `${fmtClock(run.start)} → ${fmtClock(run.end)} · ${fmtDur(run.end - run.start)}`;

  const list = document.createElement('ul');
  list.className = 'runs';
  for (const item of run.items) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'run-row';
    button.innerHTML = [
      `<span class="run-name">${esc(item.name)}</span>`,
      `<span class="run-dur">${esc(fmtDur(item.end - item.start))}</span>`,
      item.status ? `<span class="run-status ${esc(item.status)}">${esc(item.status)}</span>` : '',
    ].join('');
    button.addEventListener('click', () => openDetail(item));
    row.append(button);
    list.append(row);
  }
  dom.drawerBody.replaceChildren(list);
}

function closeDrawer() {
  dom.drawer.hidden = true;
  dom.drawerBody.replaceChildren();
  state.selected = null;
  for (const other of dom.lanes.querySelectorAll('.seg.sel')) other.classList.remove('sel');
}

async function openDetail(segment) {
  const strings = t();
  state.detailSeq += 1;
  const seq = state.detailSeq;

  dom.drawer.hidden = false;
  dom.drawerKind.textContent = segment.kind === 'tool' ? segment.name : strings[segment.kind] || segment.kind;
  dom.drawerWhat.textContent = `${fmtClock(segment.start)} → ${fmtClock(segment.end)} · ${fmtDur(segment.end - segment.start)}`;
  dom.drawerBody.replaceChildren(note(strings.loading));

  try {
    const detail = await request('/detail', {
      session: segment.lane,
      message: segment.messageId,
      index: String(segment.index),
    });
    if (seq !== state.detailSeq) return;
    dom.drawerBody.replaceChildren(...renderDetail(detail, segment));
  } catch (error) {
    if (seq !== state.detailSeq) return;
    dom.drawerBody.replaceChildren(note(error.message || String(error), true));
  }
}

function renderDetail(detail, segment) {
  const strings = t();
  const nodes = [];
  const message = detail?.message || {};
  const part = detail?.part || null;

  const isCompaction = part?.type === 'compaction';
  const facts = isCompaction
    ? [
        [strings.model, message.model ? `${message.model.providerID || '?'}/${message.model.id || '?'}${message.model.variant ? `#${message.model.variant}` : ''}` : '—'],
        // A compaction is a moment, not a span.
        [strings.time, fmtClock(segment.start)],
      ]
    : [
        [strings.agent, message.agent || '—'],
        [strings.model, message.model ? `${message.model.providerID || '?'}/${message.model.id || '?'}${message.model.variant ? `#${message.model.variant}` : ''}` : '—'],
        [strings.time, `${fmtClock(segment.start)} → ${fmtClock(segment.end)}`],
        [strings.duration, fmtDur(segment.end - segment.start)],
      ];
  // With lanes grouped by agent, the row no longer says which session a bar is from.
  const lane = state.laneInfo.get(segment.lane);
  if (lane) facts.splice(1, 0, [strings.session, lane.title]);
  if (part?.status) facts.push([strings.status, part.status]);
  if (part?.reason) facts.push([strings.reason, part.reason]);
  if (part?.wait) {
    const waitText = part.wait === 'subagent'
      ? `${strings.waitSubagent} ${part.waitLabel || ''}`.trim()
      : strings.waitUser;
    facts.push([strings.waiting, waitText]);
  }
  if (message.tokens) {
    const tokens = ['input', 'output', 'reasoning'].filter((key) => typeof message.tokens[key] === 'number').map((key) => `${key} ${message.tokens[key]}`);
    // Plenty of OpenAI-compatible servers send reasoning text but no reasoning
    // token count; saying "0" next to visible thinking would be a lie. The
    // configured effort is known, though: it is the variant on the message.
    if (message.tokens.reasoning === 0 && part?.text && part.type === 'reasoning') {
      const variant = message.model?.variant;
      tokens.push(variant && variant !== 'default' ? `${strings.reasoningNotReported} (${variant})` : strings.reasoningNotReported);
    }
    if (tokens.length) facts.push([strings.tokens, tokens.join(' · ')]);
  }

  const list = document.createElement('dl');
  for (const [key, value] of facts) {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  nodes.push(list);

  const block = (caption, text) => {
    if (!text) return;
    const cap = document.createElement('p');
    cap.className = 'cap';
    cap.textContent = caption;
    const pre = document.createElement('pre');
    pre.textContent = text;
    nodes.push(cap, pre);
  };

  if (part) {
    if (part.input) block(strings.input, typeof part.input === 'string' ? part.input : JSON.stringify(part.input, null, 2));
    if (part.text) block(part.type === 'compaction' ? strings.summary : part.type === 'reasoning' ? strings.thinking : strings.text, part.text);
    if (part.output) block(strings.output, part.output);
  } else if (detail?.text) {
    block(strings.prompt, detail.text);
  }

  return nodes;
}

/* ------------------------------------------------------------------- boot */

dom.reload.addEventListener('click', () => load({ fresh: true }));
dom.drawerClose.addEventListener('click', closeDrawer);
dom.modes.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-mode]');
  if (!button || button.dataset.mode === state.mode) return;
  state.mode = button.dataset.mode;
  // The two modes map time differently; a window kept across them would lie.
  resetView();
  render();
});

dom.zoom?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-zoom]');
  if (!button) return;
  if (button.dataset.zoom === 'in') zoomAt(0.5, 1 / 1.7);
  else if (button.dataset.zoom === 'out') zoomAt(0.5, 1.7);
  else resetView();
  render();
});

// Ctrl/Cmd + wheel zooms under the pointer; a plain wheel still scrolls the lanes.
dom.lanes.addEventListener(
  'wheel',
  (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const track = event.target.closest('.track');
    if (!track) return;
    event.preventDefault();
    const rect = track.getBoundingClientRect();
    const fraction = clamp01((event.clientX - rect.left) / Math.max(1, rect.width));
    zoomAt(fraction, event.deltaY > 0 ? 1.22 : 1 / 1.22);
    render();
  },
  { passive: false },
);

// Drag to pan. No pointer capture: it retargets pointerup to the container and
// the click that follows then lands there instead of on the bar, which silently
// killed the detail drawer. Listeners on window carry the drag instead.
let drag = null;
let panFrame = 0;

function onPanMove(event) {
  if (!drag) return;
  const dx = event.clientX - drag.x;
  drag.moved = Math.max(drag.moved, Math.abs(dx));
  if (drag.moved < 4) return;
  dom.lanes.classList.add('panning');
  const shift = -(dx / drag.width) * drag.span;
  const from = Math.min(Math.max(0, drag.from + shift), 1 - drag.span);
  state.view = { start: from, end: from + drag.span };
  anchorView();
  dom.drawerWhat.textContent = 'M' + Math.round(drag.moved) + ' ' + from.toFixed(2) + ' f' + (state.follow?1:0);
  if (panFrame) return;
  panFrame = requestAnimationFrame(() => {
    panFrame = 0;
    render();
  });
}

function endPan() {
  window.removeEventListener('pointermove', onPanMove);
  window.removeEventListener('pointerup', endPan);
  window.removeEventListener('pointercancel', endPan);
  dom.lanes.classList.remove('panning');
  // Remember when a drag ended: the click that closes it must not open a segment,
  // but the next deliberate click (well after this) must.
  if (drag && drag.moved >= 4) state.panEndedAt = performance.now();
  drag = null;
}

dom.lanes.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  const track = event.target.closest('.track');
  if (!track) return;
  drag = {
    x: event.clientX,
    width: Math.max(1, track.getBoundingClientRect().width),
    moved: 0,
    from: state.view.start,
    span: Math.max(MIN_VIEW, state.view.end - state.view.start),
  };
  dom.drawerWhat.textContent = 'D ' + state.view.start.toFixed(2) + '-' + state.view.end.toFixed(2);
  window.addEventListener('pointermove', onPanMove);
  window.addEventListener('pointerup', endPan);
  window.addEventListener('pointercancel', endPan);
});

/* ------------------------------------------------------------- overview */

let mapDrag = null;
let mapFrame = 0;

function mapFraction(clientX) {
  const rect = dom.map.getBoundingClientRect();
  return clamp01((clientX - rect.left) / Math.max(1, rect.width));
}

function onMapMove(event) {
  if (!mapDrag) return;
  const fraction = mapFraction(event.clientX);
  const from = Math.min(Math.max(0, fraction - mapDrag.grab), 1 - mapDrag.span);
  state.view = { start: from, end: from + mapDrag.span };
  anchorView();
  if (mapFrame) return;
  mapFrame = requestAnimationFrame(() => {
    mapFrame = 0;
    render();
  });
}

function endMapDrag() {
  mapDrag = null;
  dom.map.classList.remove('dragging');
  window.removeEventListener('pointermove', onMapMove);
  window.removeEventListener('pointerup', endMapDrag);
  window.removeEventListener('pointercancel', endMapDrag);
}

dom.map?.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  const fraction = mapFraction(event.clientX);
  const span = Math.max(MIN_VIEW, state.view.end - state.view.start);
  const inside = span <= 0.999 && fraction >= state.view.start && fraction <= state.view.end;
  if (!inside) {
    // Click beside the window: centre it there instead of nudging.
    const from = Math.min(Math.max(0, fraction - span / 2), 1 - span);
    state.view = { start: from, end: from + span };
    anchorView();
    render();
  }
  mapDrag = { grab: fraction - state.view.start, span };
  dom.map.classList.add('dragging');
  window.addEventListener('pointermove', onMapMove);
  window.addEventListener('pointerup', endMapDrag);
  window.addEventListener('pointercancel', endMapDrag);
});

/* ----------------------------------------------------------- text scale */

function applyFontScale(scale, persist = true) {
  state.fontScale = scale;
  document.body.style.setProperty('--fs-scale', String(scale));
  if (dom.font) {
    dom.font.textContent = `Aa ${Math.round(scale * 100)}%`;
    dom.font.title = `${t().fontSize} — ${t().fontHint}`;
  }
  if (persist) host.storage?.set?.('fontScale', scale)?.catch?.(() => {});
  render();
}

async function restoreFontScale() {
  try {
    const stored = await host.storage.get('fontScale');
    if (typeof stored === 'number' && stored >= 0.5 && stored <= 2.5) {
      applyFontScale(stored, false);
      return;
    }
  } catch {
    /* no storage scope: keep the default */
  }
  applyFontScale(state.fontScale, false);
}

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  // Forward-looking: the host does not send a size yet (openchamber#6758), but
  // when it does, the panel follows without another change here.
  const hostSize = context?.theme?.tokens?.fontSize;
  if (typeof hostSize === 'string' && hostSize) document.documentElement.style.setProperty('--host-font-size', hostSize);
  state.lang = String(context.locale || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  setSession(context.session);
  restoreFontScale();
});

host.onSession((session) => setSession(session));

dom.font?.addEventListener('click', () => {
  const index = FONT_STEPS.indexOf(state.fontScale);
  applyFontScale(FONT_STEPS[(index + 1) % FONT_STEPS.length] ?? 1);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dom.drawer.hidden) closeDrawer();
  if (event.target instanceof HTMLInputElement) return;
  if (event.key === '+' || event.key === '=') {
    zoomAt(0.5, 1 / 1.7);
    render();
  } else if (event.key === '-' || event.key === '_') {
    zoomAt(0.5, 1.7);
    render();
  } else if (event.key === '0') {
    resetView();
    render();
  }
});

// The axis label count depends on the width: rail vs page surface.
let resizeTimer = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    render();
  }, 150);
});

render();















