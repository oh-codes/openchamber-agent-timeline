# Changelog

All notable changes to this extension are documented here. The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [0.1.0] — 2026-11-10

First working release.

### Added

- Swimlane timeline of the open chat: one lane per agent level, one bar per reasoning, tool, text and prompt segment, subagents indented below the root.
- Detail drawer on click: agent, session, model, tokens, duration, input and output.
- Two time scales: `active` (idle gaps over 15 s compressed) and `clock` (linear).
- Zoom with buttons, Ctrl+wheel at the pointer, drag to pan and double-click on a bar; `fit` / `0` resets.
- Overview strip showing the whole session as a density map with the visible slice as a draggable window.
- Waiting calls (`subagent`, `question`) drawn hatched instead of as work, with the child agent or the question in the tooltip and the drawer.
- Text size in five steps, persisted through guest storage.
- Rail panel and full-width page from the same entry.

### Notes

- A picked slice stays on its timestamps while new segments arrive; a slice touching the newest end follows it.
- Polling runs while any lane is working, including a subagent that outlives the parent turn.
- Guest text size cannot follow the app's interface-size setting yet; see [openchamber#6758](https://github.com/openchamber/openchamber/issues/6758).
