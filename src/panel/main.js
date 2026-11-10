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
    lanes: (n) => `${n} lane${n === 1 ? '' : 's'}`,
    segments: (n) => `${n} segment${n === 1 ? '' : 's'}`,
    truncated: 'Tree cut off at the depth/size limit.',
    partial: (n) => `Only the newest ${n} messages per lane are loaded.`,
    failed: (status, message) => `Service ${status}: ${message}`,
    serviceDown: 'The extension service is not answering. Open Settings → Extensions and reload it.',
    running: 'running',
    prompt: 'prompt',
    time: 'Time',
    duration: 'Duration',
    status: 'Status',
    agent: 'Agent',
    model: 'Model',
    tokens: 'Tokens',
    input: 'Input',
    output: 'Output',
    text: 'Text',
    thinking: 'Thinking',
    tool: 'Tool',
    text: 'Text',
    reasoning: 'Thinking',
    user: 'Prompt',
    legend: { reasoning: 'thinking', tool: 'tool', text: 'text', user: 'prompt' },
  },
  de: {
    empty: 'Keine Session offen. Öffne einen Chat, dann erscheint seine Zeitachse.',
    noSegments: 'Diese Session hat noch keine aufgezeichneten Teile.',
    loading: 'Zeitachse wird geladen…',
    reload: 'Neu laden',
    active: 'aktiv',
    clock: 'Uhrzeit',
    lanes: (n) => `${n} Spur${n === 1 ? '' : 'en'}`,
    segments: (n) => `${n} Segment${n === 1 ? '' : 'e'}`,
    truncated: 'Baum an Tiefen-/Größenlimit abgeschnitten.',
    partial: (n) => `Nur die letzten ${n} Nachrichten je Spur geladen.`,
    failed: (status, message) => `Dienst ${status}: ${message}`,
    serviceDown: 'Der Erweiterungsdienst antwortet nicht. Einstellungen → Extensions → neu laden.',
    running: 'läuft',
    prompt: 'Prompt',
    time: 'Zeit',
    duration: 'Dauer',
    status: 'Status',
    agent: 'Agent',
    model: 'Modell',
    tokens: 'Tokens',
    input: 'Eingabe',
    output: 'Ausgabe',
    text: 'Text',
    thinking: 'Denken',
    tool: 'Tool',
    reasoning: 'Denken',
    user: 'Prompt',
    legend: { reasoning: 'Denken', tool: 'Tool', text: 'Text', user: 'Prompt' },
  },
};

const ROW_H = 11;
const BAR_H = 8;
const GAP_MS = 15000;
const POLL_MS = 1500;

const host = connectHost();
const dom = {
  status: byId('status'),
  agent: byId('agent'),
  title: byId('title'),
  reload: byId('reload'),
  meta: byId('meta'),
  modes: byId('modes'),
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
  byKey: new Map(),
};

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

  const pieces = [];
  const cuts = [];
  let virtualEnd = 0;
  for (let i = 0; i < spans.length; i++) {
    const [from, to] = spans[i];
    const gapStart = i === 0 ? start : spans[i - 1][1];
    const gap = from - gapStart;
    if (gap > GAP_MS) {
      cuts.push({ at: from, gap });
      virtualEnd += GAP_MS;
    } else if (gap > 0) {
      virtualEnd += gap;
    }
    pieces.push({ from, to, virtualStart: virtualEnd });
    virtualEnd += Math.max(1, to - from);
  }
  const total = Math.max(1, virtualEnd);

  return {
    map: (time) => {
      for (const piece of pieces) {
        if (time <= piece.to) return clamp01((piece.virtualStart + Math.max(0, Math.min(time, piece.to) - piece.from)) / total);
      }
      return 1;
    },
    unmap: (fraction) => {
      const target = fraction * total;
      for (const piece of pieces) {
        const length = Math.max(1, piece.to - piece.from);
        if (target <= piece.virtualStart + length) return piece.from + Math.max(0, target - piece.virtualStart);
      }
      return pieces[pieces.length - 1].to;
    },
    cuts: cuts.map((cut) => ({ ...cut, fraction: 0 })),
  };
}

function packRows(segments) {
  const rows = [];
  for (const segment of [...segments].sort((a, b) => a.start - b.start || a.end - b.end)) {
    let row = rows.find((candidate) => segment.start >= candidate.end - 1);
    if (!row) {
      row = { end: segment.end, items: [] };
      rows.push(row);
    }
    row.items.push(segment);
    row.end = Math.max(row.end, segment.end);
  }
  return rows;
}

/* --------------------------------------------------------------- fetching */

async function request(path, query) {
  const result = await host.serviceRequest({ method: 'GET', path, query });
  let body = null;
  try {
    body = JSON.parse(result.body || 'null');
  } catch {
    body = { error: 'unparseable response' };
  }
  if (result.status !== 200) {
    const message = body?.error || (result.status === 0 ? t().serviceDown : 'request failed');
    const error = new Error(message);
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
  state.seq += 1;
  const seq = state.seq;
  try {
    const timeline = await request('/timeline', fresh ? { session: session.id, fresh: '1' } : { session: session.id });
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

function schedule() {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  if (!state.session?.id) return;
  const busy = state.session.busy || state.timeline?.session?.status === 'working';
  if (!busy) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    load();
  }, POLL_MS);
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
  closeDrawer();
  render();
  if (session?.id) load();
}

/* ----------------------------------------------------------------- render */

function render() {
  const strings = t();
  const session = state.session;
  const timeline = state.timeline;

  dom.status.className = `dot ${session?.busy || timeline?.session?.status === 'working' ? 'working' : 'idle'}`;
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
  dom.count.textContent = timeline
    ? [strings.lanes(lanes.length), strings.segments(segments.length)].join(' · ')
    : '';

  dom.legend.innerHTML = ['reasoning', 'tool', 'text', 'user']
    .map((kind) => `<span><i class="seg ${kind}" style="position:static;display:inline-block"></i>${esc(strings.legend[kind])}</span>`)
    .join('');

  if (!session?.id) return showNote(strings.empty);
  if (state.error) return showNote(state.error.message || String(state.error), true);
  if (!timeline) return showNote(state.loading ? strings.loading : '');
  if (!segments.length) return showNote(strings.noSegments);

  const scale = buildScale(timeline.window, segments, state.mode);
  if (!scale) {
    dom.lanes.append(note(strings.noSegments));
    return;
  }

  const ticks = window.innerWidth < 420 ? [0, 1] : [0, 0.25, 0.5, 0.75, 1];
  syncChildren(
    dom.axis,
    ticks.map((tick) => tick.toFixed(2)),
    () => {
      const span = document.createElement('span');
      span.style.left = '';
      return span;
    },
    (span, key) => {
      const tick = Number(key);
      span.style.left = `${(tick * 100).toFixed(3)}%`;
      span.textContent = fmtClock(scale.unmap(tick));
    },
  );

  const cuts = scale.cuts.map((cut) => ({ ...cut, fraction: scale.map(cut.at) }));
  const byLane = new Map();
  state.byKey = new Map();
  for (const segment of segments) {
    if (!byLane.has(segment.lane)) byLane.set(segment.lane, []);
    byLane.get(segment.lane).push(segment);
    state.byKey.set(segmentKey(segment), segment);
  }

  const visible = lanes.filter((lane) => (byLane.get(lane.id) || []).length);
  syncChildren(
    dom.lanes,
    visible.map((lane) => lane.id),
    () => {
      const row = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'label';
      const track = document.createElement('div');
      track.className = 'track';
      row.append(label, track);
      row.label = label;
      row.track = track;
      row.cutsKey = '';
      return row;
    },
    (row, key) => {
      const lane = visible.find((candidate) => candidate.id === key);
      const laneSegments = byLane.get(key) || [];
      const rows = packRows(laneSegments);

      row.className = lane.depth === 0 ? 'lane root' : 'lane';
      row.title = `${lane.agent} · ${lane.model || '?'} · ${lane.title}`;
      row.label.innerHTML = `${lane.depth ? `<span class="depth">${'·'.repeat(Math.min(lane.depth, 4))} </span>` : ''}${esc(lane.agent || '?')}`;

      const track = row.track;
      track.style.height = `${rows.length * ROW_H + 2}px`;

      const cutsKey = cuts.map((cut) => cut.fraction.toFixed(4)).join(',');
      if (row.cutsKey !== cutsKey) {
        row.cutsKey = cutsKey;
        for (const mark of track.querySelectorAll('.cut')) mark.remove();
        for (const cut of cuts) {
          const mark = document.createElement('div');
          mark.className = 'cut';
          mark.style.left = `${(cut.fraction * 100).toFixed(3)}%`;
          mark.title = `+${fmtDur(cut.gap)} idle`;
          track.append(mark);
        }
      }

      const order = [];
      const geometry = new Map();
      rows.forEach((packed, rowIndex) => {
        for (const segment of packed.items) {
          order.push(segmentKey(segment));
          geometry.set(segmentKey(segment), { segment, rowIndex });
        }
      });

      syncChildren(
        track,
        order,
        (barKey) => {
          const bar = document.createElement('div');
          bar.className = 'seg';
          bar.addEventListener('click', () => {
            const segment = state.byKey.get(barKey);
            if (segment) select(segment, bar);
          });
          return bar;
        },
        (bar, barKey) => {
          const { segment, rowIndex } = geometry.get(barKey);
          const left = scale.map(segment.start);
          const right = scale.map(segment.end);
          // Thinking is the backdrop to the work: a slimmer bar than a tool call.
          const height = segment.kind === 'reasoning' ? Math.max(4, Math.round(BAR_H * 0.6)) : BAR_H;
          const className = `seg ${segment.kind}${segment.status ? ` ${segment.status}` : ''}${state.selected === barKey ? ' sel' : ''}`;
          if (bar.className !== className) bar.className = className;
          bar.style.left = `${(left * 100).toFixed(3)}%`;
          bar.style.width = `${Math.max((right - left) * 100, 0.35).toFixed(3)}%`;
          bar.style.top = `${rowIndex * ROW_H + 1 + Math.round((BAR_H - height) / 2)}px`;
          bar.style.height = `${height}px`;
          bar.title = `${segment.name} · ${fmtDur(segment.end - segment.start)}${segment.preview ? `\n${segment.preview}` : ''}`;
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
}

const segmentKey = (segment) => `${segment.lane}|${segment.messageId}|${segment.index}`;

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
  dom.lanes.append(note(text, isError));
}

/* ----------------------------------------------------------------- detail */

function select(segment, bar) {
  const key = `${segment.lane}|${segment.messageId}|${segment.index}`;
  state.selected = key;
  for (const other of dom.lanes.querySelectorAll('.seg.sel')) other.classList.remove('sel');
  bar?.classList.add('sel');
  openDetail(segment);
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

  const facts = [
    [strings.agent, message.agent || '—'],
    [strings.model, message.model ? `${message.model.providerID || '?'}/${message.model.id || '?'}${message.model.variant ? `#${message.model.variant}` : ''}` : '—'],
    [strings.time, `${fmtClock(segment.start)} → ${fmtClock(segment.end)}`],
    [strings.duration, fmtDur(segment.end - segment.start)],
  ];
  if (part?.status) facts.push([strings.status, part.status]);
  if (message.tokens) {
    const tokens = ['input', 'output', 'reasoning'].filter((key) => typeof message.tokens[key] === 'number').map((key) => `${key} ${message.tokens[key]}`);
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
    if (part.text) block(part.type === 'reasoning' ? strings.thinking : strings.text, part.text);
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
  render();
});

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  state.lang = String(context.locale || '').toLowerCase().startsWith('de') ? 'de' : 'en';
  setSession(context.session);
});

host.onSession((session) => setSession(session));

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dom.drawer.hidden) closeDrawer();
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
