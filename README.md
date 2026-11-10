# Agent timeline

A swimlane timeline of the chat you have open in [OpenChamber](https://github.com/openchamber/openchamber): one lane per agent level, one bar per thinking / tool / text segment, click a bar for the details.

![Rail and full page](docs/preview.png)

Subagents get their own lane under the root, so a run that fans out to `coder`, `auditor` and back is visible as a tree instead of a wall of text.

## What it shows

| | |
|---|---|
| **Lane** | one agent level. The name sits above its track; subagents are indented with `·`, the root is bold. Two sessions of the same agent at the same level share a lane and show as `coder ×2`. |
| **Bar** | thinking (thin, blue), tool (solid, blue / yellow while running / red on error), text (green), prompt (grey). Anything shorter than 6 px is still drawn 6 px wide, so a 0 ms prompt or a 40 ms text part stays visible and clickable. |
| **Waiting** | hatched, not filled: a `subagent` call waiting for a child, a `question` waiting for you. The tooltip and the drawer name the child agent or repeat the question. |
| **Overlap** | segments that collide get a sub-row inside their lane instead of covering each other. |
| **active** | idle stretches longer than 15 s are compressed, so the work fills the width. |
| **clock** | linear time axis. |
| **Tool run** | consecutive tool calls (within 1.5 s of each other, no thinking in between) merge into one bar. Clicking it lists the calls in the drawer; each row opens its own detail. |
| **Compaction** | a dashed amber line with a corner flag at the moment the context was summarized, plus a tick in the overview strip so it is findable when zoomed in. Clicking it shows reason, model, tokens and the summary. |
| **Zoom** | `+` / `−`, Ctrl+wheel zooms under the pointer, drag pans, double-click a bar zooms onto it, `fit` (or `0`) shows everything again. A chat opens on the **last 10 minutes** and follows the newest end; the spread over the whole session is the `fit` button. Bars and rows grow with the zoom factor and with the panel width. |
| **Overview strip** | the whole session as a density map; the framed window is the visible slice. Drag it, or click beside it to jump. |
| **Aa** | text size in five steps (85–150 %), remembered per extension. |
| **Click** | opens the details: agent, session, model, tokens, duration, input/output. `Esc` closes. |
| **↻** | reloads without using the service cache. |

A picked slice stays on its own timestamps even while new segments arrive. A slice that touches the newest end keeps following it.

The panel polls every 1.5 s while **any** lane is working — including a subagent that keeps running after the parent turn ended. When everything is idle it stops asking.

## Install

**From this repository** — OpenChamber → Settings → Extensions → Install → paste the repository URL. The built panel and service are committed, because the host never compiles TypeScript for you.

**From a folder** — same dialog, choose the folder. A folder install reads the files live, so `npm run build` plus a panel reload is enough after a change.

Then:

1. Grant the two capabilities it asks for: `service` (its own background process) and `opencode` (read-only access to sessions).
2. Open the **Agent timeline** icon in the right rail. The same view is available as a full-width page from the rail's menu.

Requires OpenChamber 2.5.0 or newer (`apiVersion: 1`).

## How the timings are derived

`reasoning` and `tool` parts carry `time.created`, `time.ran` and `time.completed`, so those bars are exact. Two cases need work, both in `service/main.js`:

- **`text` parts carry no time at all.** They take the span from the previous part's end to the moment the message finished streaming (`time.streamed`) — never to the end of a later tool, which would stretch text over a blocking question.
- **Running tools** end at "now", so the bar grows while the tool runs.
- **Handovers are clipped.** OpenCode emits the next tool call 0.3–4 s before it closes the previous part, so thinking and text end where the next timed part begins. Without that, every think → act step looked like two things running at once and pushed the tool into a second row.
- **Waiting calls** (`subagent`, `question`) are marked as such rather than drawn as work.

A second row inside a lane therefore only appears for genuinely parallel calls — more than 0.4 s of real overlap.

## Limits

- The newest **120 messages per lane** are loaded; OpenCode rejects a `limit` above 200. Older turns are missing and the panel says so.
- At most **24 lanes**, **4 levels** deep.
- The service is read-only: sessions, messages, projects, events. Anything else is refused by the host with `403 NOT_A_LISTED_READ`.

### Text size

The host sends guests the font *family* but no size: `applyHostTheme` in the SDK pins the guest root to `0.875rem`, and the app's interface-size setting cannot reach a sandboxed iframe. The panel therefore sizes everything in `em` over that root and ships its own **Aa** factor. `theme.tokens.fontSize` is read when a host ever provides it ([openchamber#6758](https://github.com/openchamber/openchamber/issues/6758)).

## Development

```bash
npm install
npm run build     # src/panel -> panel/ (esbuild, IIFE); index.html copied
npm run dev       # harness in a browser, no reinstall in OpenChamber
```

`npm run dev` starts the real service against your local OpenCode and draws the panel in a plain iframe harness at <http://127.0.0.1:45997/>. Useful parameters:

- `?session=<id>` — a specific session (default: the most recently viewed one)
- `?clock` — start in clock mode
- `?click` — open a detail drawer
- `?zoom=3` — zoom in three steps
- `?font=2` — step the text size

The harness needs `~/.config/opencode/service.json` (OpenChamber writes it on first start) and a running OpenCode on `127.0.0.1:28894` (override with `OPENCODE_PORT`).

## Structure

```
package.json          manifest (openchamber.contributes) + scripts
icon.svg
src/panel/            panel sources (index.html, main.js) — edit only here
panel/                build output; committed, this is what the host loads
service/main.js       service: lanes + segments, /health /timeline /detail
scripts/build.mjs     esbuild
dev/                  harness and dev server, not part of the package
```

CI rebuilds the panel and fails if the committed output differs from the sources.

## License

MIT — see [LICENSE](LICENSE).

Not affiliated with the OpenChamber project. It talks to OpenChamber through the public guest API and to OpenCode through the host's loopback link.
