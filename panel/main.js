(() => {
  // node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;

  // node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root = doc.documentElement;
    if (root.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root.setAttribute("data-oc-scrollbar-activity", "");
    const timers = /* @__PURE__ */ new WeakMap();
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== void 0)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1e3));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;

  // node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;

  // node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;

  // node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = /* @__PURE__ */ new Set();
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== void 0 && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = /* @__PURE__ */ new Set();
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/manifest.js
  var TRACKER_URL_TOKENS = ["{id}", "{segment}", "{segments+}"];
  var TRACKER_URL_TOKEN_SET = new Set(TRACKER_URL_TOKENS);

  // node_modules/@openchamber/sdk/dist/session-events.js
  var GUEST_SESSION_EVENT_TYPES = [
    "turn-finished",
    "turn-failed",
    "permission-asked",
    "question-asked",
    "turn-started",
    "session-created",
    "session-archived",
    "session-deleted"
  ];
  var SESSION_EVENTS_IDLE_MS = 10 * 6e4;
  var EVENT_TYPES = new Set(GUEST_SESSION_EVENT_TYPES);

  // node_modules/@openchamber/sdk/dist/service-host.js
  var SERVICE_SCHEDULE_IDLE_MS = 10 * 6e4;
  var MENTIONS_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0; index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16e3;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request2) => {
    try {
      if (String(request2.id) !== request2.id || !GUEST_POPOVER_ID.test(request2.id) || !Number.isFinite(request2.anchor.x) || Math.abs(request2.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request2.anchor.y) || Math.abs(request2.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request2.anchor.width) || !Number.isFinite(request2.anchor.height) || request2.anchor.width <= 0 || request2.anchor.height <= 0 || request2.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request2.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request2.width) || request2.width < GUEST_POPOVER_WIDTH_MIN || request2.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request2.height) || request2.height < GUEST_POPOVER_HEIGHT_MIN || request2.height > GUEST_POPOVER_HEIGHT_MAX || request2.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request2.side) || request2.focus !== void 0 && request2.focus !== true && request2.focus !== false || !hasBoundedJsonTree(request2.data) || !isFiniteJson(request2.data))
        return false;
      return JSON.stringify(request2.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_BLOCK_ANSWER_MAX = 2e3;
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32e3;
  var GUEST_COMPOSE_TEXT_MAX = 16e3;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2e3;
  var GUEST_ATTACH_TEXT_MAX = 16e3;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16e3;
  var GUEST_REQUEST_PATH_MAX = 2e3;
  var GUEST_REQUEST_TIMEOUT_MS = 2e4;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2e6;
  var GUEST_GENERATE_PROMPT_MAX = 64e3;
  var GUEST_GENERATE_SYSTEM_MAX = 8e3;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
  var GUEST_GENERATE_TIMEOUT_MS = 96e4;
  var GUEST_GENERATE_LATE_KEEP_MS = 60 * 6e4;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "REQUEST_FAILED",
    "RESPONSE_TOO_LARGE",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === void 0)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request2) => {
    const id = request2.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request2.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request2.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request2.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request2.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request2.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request2.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request2.branches?.head);
      const base = clampBranch(request2.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request2.data)) {
      next.data = request2.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request2) => {
    const next = clampAttachRequest(request2);
    if (request2.projectId)
      next.projectId = request2.projectId;
    if (request2.navigation)
      next.navigation = request2.navigation;
    if (request2.worktree) {
      next.worktree = request2.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request2) => {
    const next = {
      text: request2.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request2.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "service-event",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved",
    "generate-late"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire) => {
    if (!isNonEmptyString(wire.id))
      return null;
    if (wire.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: true
      };
      if (Object(wire.payload) === wire.payload) {
        message.payload = wire.payload;
      }
      return message;
    }
    if (wire.ok === false && isNonEmptyString(wire.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: false,
        error: wire.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : void 0)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire = asWireRecord(data);
    if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire.type === "result")
      return readResultMessage(wire);
    if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
      return null;
    return wire;
  };

  // node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
  var HostRequestError = class extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.name = "HostRequestError";
      this.code = code;
    }
  };
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === void 0)
      return void 0;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : void 0;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = /* @__PURE__ */ new Set();
    const directoryListeners = /* @__PURE__ */ new Set();
    const sessionListeners = /* @__PURE__ */ new Set();
    const lifecycleListeners = /* @__PURE__ */ new Set();
    const connectionListeners = /* @__PURE__ */ new Set();
    const settingsListeners = /* @__PURE__ */ new Set();
    const itemListeners = /* @__PURE__ */ new Set();
    const blockListeners = /* @__PURE__ */ new Set();
    const serviceEventListeners = /* @__PURE__ */ new Set();
    const statusControlListeners = /* @__PURE__ */ new Set();
    const popoverClosedListeners = /* @__PURE__ */ new Set();
    const lateGenerateListeners = /* @__PURE__ */ new Set();
    const unclaimedLateGenerate = [];
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = /* @__PURE__ */ new Set();
    const fileSavedListeners = /* @__PURE__ */ new Set();
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = /* @__PURE__ */ new Map();
    const workspaceListeners = /* @__PURE__ */ new Map();
    const shellsListeners = /* @__PURE__ */ new Map();
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const listenForLateGenerate = () => {
      if (disposed || target.parent === target || lateGenerateListeners.size === 0 || lastReady?.features?.lateGenerateResults !== true)
        return;
      post({ channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION, type: "generate-late-listen" });
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        if (message.payload.block)
          emit(blockListeners, message.payload.block);
        listenForLateGenerate();
        return;
      }
      if (message.type === "service-event") {
        emit(serviceEventListeners, message.payload);
        return;
      }
      if (message.type === "generate-late") {
        if (lateGenerateListeners.size === 0)
          unclaimedLateGenerate.push(message.payload);
        else
          emit(lateGenerateListeners, message.payload);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer });
        post(message);
      });
    };
    const request2 = (message) => send(message).then(() => void 0);
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      void closePopover(lastReady.popover.id, "escape").catch(() => void 0);
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : void 0;
      if (!popover)
        return;
      const active2 = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active2)
        return;
      popoverActivityReported = active2;
      void setPopoverAnchorActive(popover.id, active2).catch(() => void 0);
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request2({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request2({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request2({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active2) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request2({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active: active2 } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== void 0 && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== void 0 && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request2({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : void 0;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onBlock: (listener) => {
        blockListeners.add(listener);
        if (lastReady?.block)
          listener(lastReady.block);
        return () => {
          blockListeners.delete(listener);
        };
      },
      onServiceEvent: (listener) => {
        serviceEventListeners.add(listener);
        return () => {
          serviceEventListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request2({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request2({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      answerBlock: (text) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "block-answer",
        id: nextId(ids),
        payload: { text: text.trim().slice(0, GUEST_BLOCK_ANSWER_MAX) }
      }),
      openSurface: (surfaceId) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== void 0)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== void 0)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== void 0)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 18e4);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input) => {
        const prompt = input.prompt.trim();
        const system = input.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== void 0 && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input.maxOutputTokens === void 0 ? void 0 : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input.maxOutputTokens)));
        if (maxOutputTokens !== void 0 && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== void 0)
          payload.system = system;
        if (maxOutputTokens !== void 0)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      onLateGenerateResult: (listener) => {
        lateGenerateListeners.add(listener);
        for (const result of unclaimedLateGenerate.splice(0))
          emit([listener], result);
        listenForLateGenerate();
        return () => {
          lateGenerateListeners.delete(listener);
        };
      },
      setBadge: (count) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request2({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        blockListeners.clear();
        serviceEventListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
        lateGenerateListeners.clear();
        unclaimedLateGenerate.length = 0;
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.select",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize",
    "browser.close"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
  var SOURCE_CONTROL_PROVIDER_IDLE_MS = 10 * 6e4;
  var NOTIFICATIONS_PROVIDER_IDLE_MS = 10 * 6e4;
  var TRACKER_PROVIDER_IDLE_MS = 10 * 6e4;
  var QUOTA_PROVIDER_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);

  // node_modules/@openchamber/sdk/dist/ui/theme.js
  var TOKEN_VARS = [
    ["--oc-bg", "background"],
    ["--oc-elevated", "elevated"],
    ["--oc-fg", "foreground"],
    ["--oc-muted", "muted"],
    ["--oc-subtle", "subtle"],
    ["--oc-border", "border"],
    ["--oc-hover", "hover"],
    ["--oc-selection", "selection"],
    ["--oc-focus", "focus"],
    ["--oc-primary", "primary"],
    ["--oc-muted-surface", "mutedSurface"],
    ["--oc-elevated-fg", "elevatedForeground"],
    ["--oc-active", "active"],
    ["--oc-selection-fg", "selectionForeground"],
    ["--oc-primary-fg", "primaryForeground"],
    ["--oc-primary-text", "primaryText"],
    ["--oc-success-text", "successText"],
    ["--oc-warning-text", "warningText"],
    ["--oc-error-text", "errorText"],
    ["--oc-info-text", "infoText"],
    ["--oc-success", "success"],
    ["--oc-warning", "warning"],
    ["--oc-error", "error"],
    ["--oc-info", "info"],
    ["--oc-font", "font"],
    ["--oc-mono", "mono"],
    ["--oc-radius", "radius"],
    ["--surface-background", "background"],
    ["--surface-elevated", "elevated"],
    ["--surface-foreground", "foreground"],
    ["--surface-muted-foreground", "muted"],
    ["--surface-subtle", "subtle"],
    ["--interactive-border", "border"],
    ["--interactive-hover", "hover"],
    ["--interactive-selection", "selection"],
    ["--interactive-focus-ring", "focus"],
    ["--primary", "primary"],
    ["--surface-muted", "mutedSurface"],
    ["--surface-elevated-foreground", "elevatedForeground"],
    ["--interactive-active", "active"],
    ["--interactive-selection-foreground", "selectionForeground"],
    ["--primary-foreground", "primaryForeground"],
    ["--primary-text", "primaryText"],
    ["--success-text", "successText"],
    ["--warning-text", "warningText"],
    ["--error-text", "errorText"],
    ["--info-text", "infoText"],
    ["--status-success", "success"],
    ["--status-warning", "warning"],
    ["--status-error", "error"],
    ["--status-info", "info"],
    ["--font-sans", "font"],
    ["--font-mono", "mono"],
    ["--radius", "radius"]
  ];
  var SYNTAX_TOKEN_VARS = [
    ["--oc-syntax-keyword", "--syntax-keyword", "syntaxKeyword"],
    ["--oc-syntax-string", "--syntax-string", "syntaxString"],
    ["--oc-syntax-number", "--syntax-number", "syntaxNumber"],
    ["--oc-syntax-function", "--syntax-function", "syntaxFunction"],
    ["--oc-syntax-type", "--syntax-type", "syntaxType"],
    ["--oc-syntax-comment", "--syntax-comment", "syntaxComment"],
    ["--oc-syntax-variable", "--syntax-variable", "syntaxVariable"],
    ["--oc-syntax-operator", "--syntax-operator", "syntaxOperator"]
  ];
  var applyHostTheme = (theme, root) => {
    root.style.colorScheme = theme.mode;
    for (const [name, key] of TOKEN_VARS) {
      root.style.setProperty(name, theme.tokens[key]);
    }
    for (const [alias, hostName, key] of SYNTAX_TOKEN_VARS) {
      const value = theme.tokens[key] ?? "";
      root.style.setProperty(alias, value);
      root.style.setProperty(hostName, value);
    }
    root.style.setProperty("font-family", theme.tokens.font);
    root.style.setProperty("font-size", "0.875rem");
    root.style.setProperty("line-height", "1.45");
    root.style.setProperty("color", theme.tokens.foreground);
  };
  var applyHostReady = (ctx, root) => {
    applyHostTheme(ctx.theme, root);
    if (root.dataset) {
      root.dataset.ocSurface = ctx.surface;
      root.dataset.ocTheme = ctx.theme.mode;
    }
  };

  // node_modules/@openchamber/sdk/dist/ui/style.js
  var OC_ALIAS = {
    "surface-background": "bg",
    "surface-elevated": "elevated",
    "surface-elevated-foreground": "elevated-fg",
    "surface-foreground": "fg",
    "surface-muted-foreground": "muted",
    "surface-muted": "muted-surface",
    "surface-subtle": "subtle",
    "interactive-border": "border",
    "interactive-hover": "hover",
    "interactive-active": "active",
    "interactive-selection": "selection",
    "interactive-selection-foreground": "selection-fg",
    "interactive-focus-ring": "focus",
    "primary": "primary",
    "primary-foreground": "primary-fg",
    "primary-text": "primary-text",
    "success-text": "success-text",
    "warning-text": "warning-text",
    "error-text": "error-text",
    "info-text": "info-text",
    "status-success": "success",
    "status-warning": "warning",
    "status-error": "error",
    "status-info": "info",
    "font-sans": "font",
    "font-mono": "mono",
    "radius": "radius"
  };
  var v = (name, fallback) => `var(--${name}, var(--oc-${OC_ALIAS[name]}, ${fallback}))`;
  var bg = v("surface-background", "transparent");
  var elevated = v("surface-elevated", "transparent");
  var elevatedFg = v("surface-elevated-foreground", "inherit");
  var fg = v("surface-foreground", "inherit");
  var muted = v("surface-muted-foreground", "gray");
  var secondary = v("surface-muted", "transparent");
  var border = v("interactive-border", "currentColor");
  var hover = v("interactive-hover", "transparent");
  var active = v("interactive-active", "transparent");
  var selection = v("interactive-selection", "transparent");
  var selectionFg = v("interactive-selection-foreground", "inherit");
  var primary = v("primary", "currentColor");
  var primaryText = v("primary-text", "inherit");
  var errorText = v("error-text", "inherit");
  var font = v("font-sans", "inherit");
  var mono = v("font-mono", "monospace");
  var radius = v("radius", "9px");
  var controlRadius = `calc(${radius} - 2px)`;
  var smallRadius = `calc(${radius} - 4px)`;
  var mix = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  var focusFill = `background-image: linear-gradient(${hover}, ${hover});`;
  var field = (edge, width = "0.5px") => `box-shadow: inset 0 0 0 ${width} ${edge}, var(--oc-sdk-field-lift);`;
  var raised = "border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);";
  var litButton = "box-shadow: var(--oc-sdk-lit);";
  var darkLift = `inset 0 0.5px 0 0 ${mix(fg, 8)}, 0 1px 2px 0 rgb(0 0 0 / 0.4)`;
  var THEME_VARS = `
:root {
  --oc-sdk-edge: ${mix(fg, 16)};
  --oc-sdk-field-bg: ${elevated};
  --oc-sdk-raised-bg: ${bg};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 1.5px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.2), 0 1px 1.5px 0 rgb(0 0 0 / 0.1);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.14);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.7), 0 1px 2px -0.5px rgb(0 0 0 / 0.06), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.06);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${mix(fg, 14)};
  --oc-sdk-field-bg: ${mix(bg, 50, elevated)};
  --oc-sdk-raised-bg: ${elevated};
  --oc-sdk-field-lift: ${darkLift};
  --oc-sdk-raised-lift: ${darkLift};
  --oc-sdk-lit: ${darkLift};
  --oc-sdk-float-edge: rgb(0 0 0 / 0.55);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.04), inset 0 0 0 0.5px rgb(255 255 255 / 0.08), 0 8px 16px 0 rgb(0 0 0 / 0.25), 0 4px 8px 0 rgb(0 0 0 / 0.25);
}`;
  var tone = (name) => {
    const color = v(`status-${name}`, "currentColor");
    return `
.oc-sdk[data-tone="${name}"], .oc-sdk [data-tone="${name}"] { --oc-sdk-tone: ${color}; --oc-sdk-tone-text: ${v(`${name}-text`, "inherit")}; }`;
  };
  var UI_SIZE_CSS = `
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }
.oc-sdk-progress-value { display: inline-flex; align-items: center; gap: 2px; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { font-weight: 600; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`;
  var GUEST_UI_LOOK_CSS = `${THEME_VARS}
.oc-sdk { color: ${fg}; font-family: ${font}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${focusFill} }
.oc-sdk-mono { font-family: ${mono}; }
.oc-sdk-muted { color: ${muted}; }
${tone("success")}${tone("warning")}${tone("error")}${tone("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${primary}; --oc-sdk-tone-text: ${primaryText}; }

.oc-sdk-btn { border-radius: ${controlRadius}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${smallRadius}; }
.oc-sdk-btn[data-variant="default"] { color: ${primaryText}; background: ${mix(primary, 10, bg)}; border-color: ${mix(primary, 12)}; ${litButton} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${mix(primary, 16, bg)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${mix(primary, 22, bg)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${secondary}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${active}, ${active}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${hover}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${active}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${v("status-error", "red")}; color: ${errorText}; background: ${mix("var(--oc-sdk-tone)", 7, bg)}; border-color: ${mix("var(--oc-sdk-tone)", 12)}; ${litButton} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${mix("var(--oc-sdk-tone)", 9, bg)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${mix("var(--oc-sdk-tone)", 11, bg)}; box-shadow: none; }

.oc-sdk-field-note { color: ${muted}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${errorText}; }
.oc-sdk-input { border-radius: ${controlRadius}; background: var(--oc-sdk-field-bg); color: ${elevatedFg}; ${field("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${muted}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${field(mix(fg, 26), "1px")} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${field(v("status-error", "red"), "1px")} }
.oc-sdk-input[data-mono="true"] { font-family: ${mono}; }

.oc-sdk-search-icon { color: ${muted}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${primary}; }
.oc-sdk-search-clear { border-radius: ${smallRadius}; color: ${muted}; }
.oc-sdk-search-clear:hover { background: ${hover}; color: ${fg}; }

.oc-sdk-trigger { border-radius: ${controlRadius}; background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${muted}; }
.oc-sdk-trigger-chevron { color: ${muted}; }
/* The app's floating level: the glass edge (a hairline ring and a lit top line, dark outside and light inside in dark themes) over soft shadows. The outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${elevatedFg}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${elevated}; background-clip: padding-box; color: ${elevatedFg}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${hover}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-option-check { color: ${fg}; }
.oc-sdk-option[data-destructive="true"] { color: ${errorText}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${mix(v("status-error", "red"), 10)}; }
.oc-sdk-option-hint { color: ${muted}; }
.oc-sdk-popup-empty { color: ${muted}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${border}; border-radius: 4px; color: ${fg}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${mix(fg, 60, border)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${border}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${bg}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${primary}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${focusFill} }
.oc-sdk-check-desc { color: ${muted}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${mix(fg, 4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${muted}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${fg}; }
.oc-sdk-tab[aria-selected="true"] { color: ${selectionFg}; background: ${selection}; border-color: ${border}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${elevatedFg}; background: var(--oc-sdk-raised-bg); ${raised} }
.oc-sdk-tab-count { color: ${muted}; }

/* The app's neutral badge: a step of the text colour, the same in every theme. */
.oc-sdk-badge { border-radius: 9999px; background: ${mix(fg, 6)}; color: ${muted}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${mix("var(--oc-sdk-tone)", 15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${hover}; }
.oc-sdk-row[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-row-lead { font-family: ${mono}; color: ${muted}; }
.oc-sdk-row-sub { color: ${muted}; }
.oc-sdk-row-meta { color: ${muted}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${muted}; }

.oc-sdk-empty-body { color: ${muted}; }

.oc-sdk-spinner { color: ${muted}; }
.oc-sdk-spinner-ring { border-color: ${border}; border-top-color: ${primary}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${mix("var(--oc-sdk-tone)", 10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${muted}; }

.oc-sdk-separator { color: ${muted}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${mix(border, 40)}; }

.oc-sdk-progress-label { color: ${muted}; }
/* The app's progress: a groove a step of the text colour, green once done. Older bundles mark done only through aria-valuenow. */
.oc-sdk-progress-track { border-radius: 9999px; background: ${mix(fg, 6)}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${primary}); }
.oc-sdk-progress-track[aria-valuenow="100"] > .oc-sdk-progress-fill:not([data-tone]) { background: ${v("status-success", "currentColor")}; }
.oc-sdk-progress[data-done="true"] .oc-sdk-progress-value { color: ${v("success-text", "inherit")}; }

.oc-sdk-text a { color: ${primaryText}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${mix(border, 60)}; }
`;
  var UI_CSS = `
${GUEST_SCROLLBAR_CSS}
${UI_SIZE_CSS}
${GUEST_UI_LOOK_CSS}`;

  // src/panel/main.js
  var STRINGS = {
    en: {
      empty: "No session open. Open a chat to see its timeline.",
      noSegments: "This session has no recorded parts yet.",
      loading: "Loading timeline\u2026",
      reload: "Reload",
      active: "active",
      clock: "clock",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      fit: "Fit the whole timeline",
      zoomHint: "Ctrl+wheel zooms, drag pans, double-click a bar zooms to it.",
      waiting: "Waiting",
      waitSubagent: "waiting for",
      waitUser: "waiting for you",
      toolRun: (n) => `${n} tool calls`,
      compaction: "Compaction",
      summary: "Summary",
      reason: "Reason",
      fontSize: "Text size",
      fontHint: "The host passes no interface size to extensions, so this is the panel\u2019s own.",
      mapHint: "Drag the window, or click the strip to jump.",
      live: "Follows the newest part",
      session: "Session",
      lanes: (n) => `${n} lane${n === 1 ? "" : "s"}`,
      segments: (n) => `${n} segment${n === 1 ? "" : "s"}`,
      truncated: "Tree cut off at the depth/size limit.",
      partial: (n) => `Only the newest ${n} messages per lane are loaded.`,
      failed: (status, message) => `Service ${status}: ${message}`,
      serviceDown: "The extension service is not answering. Open Settings \u2192 Extensions and reload it.",
      running: "running",
      prompt: "prompt",
      time: "Time",
      duration: "Duration",
      status: "Status",
      agent: "Agent",
      model: "Model",
      tokens: "Tokens",
      reasoningNotReported: "reasoning not reported by the provider",
      input: "Input",
      output: "Output",
      text: "Text",
      thinking: "Thinking",
      tool: "Tool",
      reasoning: "Thinking",
      user: "Prompt",
      legend: { reasoning: "thinking", tool: "tool", text: "text", user: "prompt", waiting: "waiting" }
    },
    de: {
      empty: "Keine Session offen. \xD6ffne einen Chat, dann erscheint seine Zeitachse.",
      noSegments: "Diese Session hat noch keine aufgezeichneten Teile.",
      loading: "Zeitachse wird geladen\u2026",
      reload: "Neu laden",
      active: "aktiv",
      clock: "Uhrzeit",
      zoomIn: "Vergr\xF6\xDFern",
      zoomOut: "Verkleinern",
      fit: "Ganze Zeitachse zeigen",
      zoomHint: "Strg+Mausrad zoomt, Ziehen verschiebt, Doppelklick auf einen Balken zoomt darauf.",
      waiting: "Warten",
      waitSubagent: "wartet auf",
      waitUser: "wartet auf dich",
      toolRun: (n) => `${n} Tool-Aufrufe`,
      compaction: "Kompaktierung",
      summary: "Zusammenfassung",
      reason: "Grund",
      fontSize: "Textgr\xF6\xDFe",
      fontHint: "Der Host \xFCbergibt Erweiterungen keine Interface-Gr\xF6\xDFe, das hier ist die eigene.",
      mapHint: "Fenster ziehen oder in den Streifen klicken.",
      live: "folgt dem neuesten Teil",
      session: "Session",
      lanes: (n) => `${n} Spur${n === 1 ? "" : "en"}`,
      segments: (n) => `${n} Segment${n === 1 ? "" : "e"}`,
      truncated: "Baum an Tiefen-/Gr\xF6\xDFenlimit abgeschnitten.",
      partial: (n) => `Nur die letzten ${n} Nachrichten je Spur geladen.`,
      failed: (status, message) => `Dienst ${status}: ${message}`,
      serviceDown: "Der Erweiterungsdienst antwortet nicht. Einstellungen \u2192 Extensions \u2192 neu laden.",
      running: "l\xE4uft",
      prompt: "Prompt",
      time: "Zeit",
      duration: "Dauer",
      status: "Status",
      agent: "Agent",
      model: "Modell",
      tokens: "Tokens",
      reasoningNotReported: "Reasoning-Tokens meldet der Provider nicht",
      input: "Eingabe",
      output: "Ausgabe",
      text: "Text",
      thinking: "Denken",
      tool: "Tool",
      reasoning: "Denken",
      user: "Prompt",
      legend: { reasoning: "Denken", tool: "Tool", text: "Text", user: "Prompt", waiting: "Warten" }
    }
  };
  var ROW_H = 11;
  var BAR_H = 8;
  function barMetrics() {
    const width = dom.lanes.clientWidth || 340;
    const widthScale = 1 + clamp01((width - 300) / 700) * 0.9;
    const zoomScale = 1 + Math.min(1.1, Math.log2(Math.max(1, viewZoom())) * 0.38);
    const scale = Math.min(2.6, state.fontScale * widthScale * zoomScale);
    return { row: Math.round(ROW_H * scale), bar: Math.max(6, Math.round(BAR_H * scale)) };
  }
  var GAP_MS = 15e3;
  var POLL_MS = 1500;
  var host = connectHost();
  var dom = {
    status: byId("status"),
    agent: byId("agent"),
    title: byId("title"),
    reload: byId("reload"),
    meta: byId("meta"),
    modes: byId("modes"),
    zoom: byId("zoom"),
    zoomFit: byId("zoom")?.querySelector('[data-zoom="fit"]') || null,
    font: byId("font"),
    map: byId("map"),
    mapCanvas: byId("map-canvas"),
    mapWin: byId("map-win"),
    count: byId("count"),
    axis: byId("axis"),
    lanes: byId("lanes"),
    drawer: byId("drawer"),
    drawerKind: byId("d-kind"),
    drawerWhat: byId("d-what"),
    drawerBody: byId("d-body"),
    drawerClose: byId("d-close"),
    legend: byId("legend")
  };
  var state = {
    lang: "en",
    session: null,
    timeline: null,
    mode: "active",
    error: null,
    loading: false,
    inflight: false,
    selected: null,
    seq: 0,
    timer: null,
    detailSeq: 0,
    laneInfo: /* @__PURE__ */ new Map(),
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
    panEndedAt: 0
  };
  var MIN_VIEW = 8e-4;
  var FONT_STEPS = [0.85, 1, 1.15, 1.3, 1.5];
  var DEFAULT_WINDOW_MS = 10 * 60 * 1e3;
  var t = () => STRINGS[state.lang] || STRINGS.en;
  function byId(id) {
    return document.getElementById(id);
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }
  function fmtClock(ms) {
    if (typeof ms !== "number" || !Number.isFinite(ms)) return "\u2014";
    return new Date(ms).toLocaleTimeString(state.lang === "de" ? "de-DE" : "en-GB", { hour12: false });
  }
  function fmtDur(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "\u2014";
    if (ms < 1e3) return `${Math.round(ms)} ms`;
    if (ms < 6e4) return `${(ms / 1e3).toFixed(ms < 1e4 ? 2 : 1)} s`;
    const minutes = Math.floor(ms / 6e4);
    const seconds = Math.round(ms % 6e4 / 1e3);
    if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
  }
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
  var clamp01 = (value) => value < 0 ? 0 : value > 1 ? 1 : value;
  function buildScale(bounds, segments, mode) {
    const spans = mergeSpans(segments.map((s) => [s.start, s.end]));
    if (!spans.length) return null;
    const start = typeof bounds?.start === "number" ? bounds.start : spans[0][0];
    const end = typeof bounds?.end === "number" ? bounds.end : spans[spans.length - 1][1];
    if (mode !== "active") {
      const total2 = Math.max(1, end - start);
      return {
        map: (time) => clamp01((time - start) / total2),
        unmap: (fraction) => start + fraction * total2,
        cuts: []
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
      cuts: cuts.map((cut) => ({ ...cut, fraction: 0 }))
    };
  }
  var OVERLAP_MS = 400;
  var TOOL_RUN_GAP = 1500;
  function groupTools(segments) {
    const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);
    const out = [];
    let run = null;
    for (const segment of sorted) {
      if (segment.kind !== "tool") {
        run = null;
        out.push(segment);
        continue;
      }
      const last = run?.items[run.items.length - 1];
      if (run && !segment.wait && !last.wait && segment.start - last.end <= TOOL_RUN_GAP) {
        run.items.push(segment);
        run.end = Math.max(run.end, segment.end);
        run.status = segment.status === "error" || run.status === "error" ? "error" : segment.status === "running" || run.status === "running" ? "running" : run.status;
        continue;
      }
      run = {
        kind: "tool",
        name: segment.name,
        start: segment.start,
        end: segment.end,
        status: segment.status,
        wait: segment.wait,
        items: [segment],
        lane: segment.lane,
        messageId: segment.messageId,
        index: segment.index
      };
      out.push(run);
    }
    return out.map((item) => item.items && item.items.length === 1 ? item.items[0] : item);
  }
  function spanForDuration(scale, targetMs) {
    const endTime = scale.unmap(1);
    if (endTime - scale.unmap(0) <= targetMs) return 1;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 24; i++) {
      const middle = (low + high) / 2;
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
  function anchorView() {
    if (!state.scale) return;
    const span = state.view.end - state.view.start;
    if (state.view.end > 0.995) {
      state.follow = true;
      state.followMs = Math.max(1e3, state.scale.unmap(state.view.end) - state.scale.unmap(state.view.start));
      state.anchor = null;
      return;
    }
    state.follow = false;
    state.followMs = null;
    if (span > 0.999) {
      state.anchor = null;
      return;
    }
    state.anchor = {
      from: state.scale.unmap(state.view.start),
      to: state.scale.unmap(state.view.end)
    };
  }
  function zoomAt(fraction, factor) {
    const wasFollowing = state.follow;
    const { start, end } = state.view;
    const span = Math.max(MIN_VIEW, end - start);
    const next = Math.min(1, Math.max(MIN_VIEW, span * factor));
    if (wasFollowing) {
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
    state.follow = true;
    state.followMs = null;
    state.anchor = null;
  }
  var viewZoom = () => 1 / Math.max(MIN_VIEW, state.view.end - state.view.start);
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
    const ctx = canvas.getContext("2d");
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
    ctx.fillStyle = (tokens.getPropertyValue("--oc-primary") || "#6c8cff").trim();
    ctx.globalAlpha = 0.5;
    const barWidth = width / buckets;
    for (let i = 0; i < buckets; i++) {
      if (!counts[i]) continue;
      const barHeight = Math.max(1, counts[i] / peak * (height - 2));
      ctx.fillRect(i * barWidth, height - barHeight - 1, Math.max(1, barWidth - 0.5), barHeight);
    }
    ctx.globalAlpha = 1;
    const compactionColor = (tokens.getPropertyValue("--oc-warning") || "#d29922").trim();
    ctx.fillStyle = compactionColor;
    for (const segment of segments) {
      if (segment.kind !== "compaction") continue;
      ctx.fillRect(Math.round(scale.map(segment.start) * width), 0, 1, height);
    }
    const span = Math.max(MIN_VIEW, state.view.end - state.view.start);
    if (span > 0.999) {
      dom.mapWin.hidden = true;
    } else {
      dom.mapWin.hidden = false;
      dom.mapWin.style.left = `${(state.view.start * 100).toFixed(3)}%`;
      dom.mapWin.style.width = `${(span * 100).toFixed(3)}%`;
      dom.mapWin.classList.toggle("live", state.follow);
      dom.mapWin.title = state.follow ? t().live : "";
    }
  }
  async function request(path, query) {
    let result;
    try {
      result = await host.serviceRequest({ method: "GET", path, query });
    } catch (error) {
      const down = error?.code === "SERVICE_FAILED" || error?.code === "NO_SERVICE" || error?.code === "DISABLED";
      const wrapped = new Error(down ? t().serviceDown : error?.message || String(error));
      wrapped.status = 0;
      throw wrapped;
    }
    let body = null;
    try {
      body = JSON.parse(result.body || "null");
    } catch {
      body = { error: "unparseable response" };
    }
    if (result.status !== 200) {
      const error = new Error(body?.error || "request failed");
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
    if (state.loading) render();
    state.seq += 1;
    const seq = state.seq;
    try {
      let timeline = null;
      for (let attempt = 1; ; attempt++) {
        try {
          timeline = await request("/timeline", fresh ? { session: session.id, fresh: "1" } : { session: session.id });
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
  function isBusy() {
    if (state.session?.busy) return true;
    const lanes = state.timeline?.lanes || [];
    if (lanes.length) return lanes.some((lane) => lane.status === "working");
    return state.timeline?.session?.status === "working";
  }
  function schedule() {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    if (!state.session?.id) return;
    if (!isBusy()) return;
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
    state.viewPending = true;
    resetView();
    closeDrawer();
    render();
    if (session?.id) load();
  }
  function fmtWindow(ms) {
    if (!Number.isFinite(ms) || ms < 0) return "\u2014";
    if (ms < 1e3) return "0s";
    if (ms < 6e4) return `${Math.round(ms / 1e3)}s`;
    const minutes = Math.round(ms / 6e4);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  function render() {
    const strings = t();
    const session = state.session;
    const timeline = state.timeline;
    dom.status.className = `dot ${isBusy() ? "working" : "idle"}`;
    dom.status.title = isBusy() ? strings.running : "";
    dom.agent.textContent = session?.agent || timeline?.session?.agent || "\u2014";
    dom.title.textContent = session?.title || "";
    dom.title.title = session?.title || "";
    dom.reload.title = strings.reload;
    dom.reload.textContent = state.loading ? "\u2026" : "\u21BB";
    for (const button2 of dom.modes.querySelectorAll("button")) {
      button2.setAttribute("aria-pressed", String(button2.dataset.mode === state.mode));
      button2.textContent = strings[button2.dataset.mode] || button2.dataset.mode;
    }
    const lanes = timeline?.lanes || [];
    const segments = timeline?.segments || [];
    const narrow = window.innerWidth < 420;
    dom.meta.textContent = timeline ? [timeline.session?.model || session?.model, narrow ? null : session?.id].filter(Boolean).join(" \xB7 ") : session?.model || "";
    dom.legend.innerHTML = [
      ["reasoning", "reasoning"],
      ["tool", "tool"],
      ["waiting", "tool waiting"],
      ["text", "text"],
      ["user", "user"]
    ].map(([key, classes]) => `<span><i class="seg ${classes}" style="position:static;display:inline-block"></i>${esc(strings.legend[key])}</span>`).join("");
    if (!session?.id) return showNote(strings.empty);
    if (state.error) return showNote(state.error.message || String(state.error), true);
    if (!timeline) return showNote(state.loading ? strings.loading : "");
    if (!segments.length) return showNote(strings.noSegments);
    const scale = buildScale(timeline.window, segments, state.mode);
    if (!scale) return showNote(strings.noSegments);
    state.scale = scale;
    if (state.viewPending) {
      state.viewPending = false;
      state.follow = true;
      state.followMs = DEFAULT_WINDOW_MS;
      state.anchor = null;
    }
    if (state.follow) {
      const width = state.followMs;
      const span = width == null ? 1 : spanForDuration(scale, width);
      state.view = { start: 1 - span, end: 1 };
    } else if (state.anchor) {
      state.view = { start: scale.map(state.anchor.from), end: scale.map(state.anchor.to) };
    }
    const { start: viewFrom, end: viewTo } = state.view;
    const viewSpan = Math.max(MIN_VIEW, viewTo - viewFrom);
    const pct = (time) => (scale.map(time) - viewFrom) / viewSpan * 100;
    const tickCount = Math.max(2, Math.min(6, Math.floor(trackWidth() / 76)));
    const ticks = Array.from({ length: tickCount }, (_, index) => index / (tickCount - 1));
    syncChildren(
      dom.axis,
      ticks.map((tick) => tick.toFixed(4)),
      () => document.createElement("span"),
      (span, key) => {
        const tick = Number(key);
        span.style.left = `${(tick * 100).toFixed(3)}%`;
        span.textContent = fmtClock(scale.unmap(viewFrom + tick * viewSpan));
      }
    );
    const cuts = scale.cuts.map((cut) => ({ ...cut, at: pct(cut.at) })).filter((cut) => cut.at >= -0.5 && cut.at <= 100.5);
    state.laneInfo = /* @__PURE__ */ new Map();
    const byLane = /* @__PURE__ */ new Map();
    for (const lane of lanes) state.laneInfo.set(lane.id, lane);
    const groups = [];
    const byGroupKey = /* @__PURE__ */ new Map();
    const groupOfLane = /* @__PURE__ */ new Map();
    for (const lane of lanes) {
      const key = `${lane.depth}:${lane.agent || "?"}`;
      let group = byGroupKey.get(key);
      if (!group) {
        group = { key, depth: lane.depth, agent: lane.agent || "?", sessions: [], models: [], segments: [] };
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
    for (const stray of dom.lanes.querySelectorAll('[data-note="state"]')) stray.remove();
    if (dom.count) {
      const visibleMs = Math.abs(scale.unmap(viewTo) - scale.unmap(viewFrom));
      dom.count.textContent = [
        fmtWindow(visibleMs),
        strings.lanes(visible.length),
        narrow ? null : strings.segments(segments.length)
      ].filter(Boolean).join(" \xB7 ");
    }
    const zoom = viewZoom();
    dom.lanes.classList.toggle("zoomed", zoom > 1.02);
    if (dom.zoomFit) {
      dom.zoomFit.hidden = zoom <= 1.02;
      dom.zoomFit.textContent = `fit ${zoom.toFixed(1)}\xD7`;
    }
    if (dom.zoom) dom.zoom.title = strings.zoomHint;
    const { row: rowHeight, bar: barHeight } = barMetrics();
    syncChildren(
      dom.lanes,
      visible.map((group) => group.key),
      () => {
        const row = document.createElement("div");
        const name = document.createElement("div");
        name.className = "name";
        const track = document.createElement("div");
        track.className = "track";
        track.addEventListener("click", (event) => {
          if (performance.now() - state.panEndedAt < 300) return;
          if (event.target.closest(".mark")) return;
          const hit = nearestBar(track, event);
          if (!hit) return;
          select(hit.segment, track.querySelector(`[data-key="${CSS.escape(hit.key)}"]`));
        });
        track.addEventListener("dblclick", (event) => {
          const hit = nearestBar(track, event);
          if (!hit) return;
          event.preventDefault();
          zoomToSegment(hit.segment);
          render();
        });
        row.append(name, track);
        row.name = name;
        row.track = track;
        const marks = document.createElement("div");
        marks.className = "marks";
        track.append(marks);
        row.marks = marks;
        row.cutsKey = "";
        return row;
      },
      (row, key) => {
        const group = byGroupKey.get(key);
        const laneRaw = byLane.get(key) || [];
        const compactions = laneRaw.filter((segment) => segment.kind === "compaction");
        const laneSegments = groupTools(laneRaw.filter((segment) => segment.kind !== "compaction"));
        const rows = packRows(laneSegments);
        row.className = group.depth === 0 ? "lane root" : "lane";
        row.title = [
          group.agent,
          group.models.join(", "),
          group.sessions.length > 1 ? group.sessions.map((lane) => lane.title).join(" \xB7 ") : group.sessions[0]?.title
        ].filter(Boolean).join(" \u2014 ");
        row.name.innerHTML = `${group.depth ? `<span class="depth">${"\xB7".repeat(Math.min(group.depth, 4))} </span>` : ""}${esc(group.agent)}${group.sessions.length > 1 ? `<span class="nb">\xD7${group.sessions.length}</span>` : ""}`;
        const track = row.track;
        track.style.height = `${rows.length * rowHeight + 2}px`;
        const cutsKey = cuts.map((cut) => cut.at.toFixed(3)).join(",");
        if (row.cutsKey !== cutsKey) {
          row.cutsKey = cutsKey;
          for (const mark of track.querySelectorAll(".cut")) mark.remove();
          for (const cut of cuts) {
            const mark = document.createElement("div");
            mark.className = "cut";
            mark.style.left = `${cut.at.toFixed(3)}%`;
            mark.title = `+${fmtDur(cut.gap)} idle`;
            track.append(mark);
          }
        }
        const order = [];
        const geometry = /* @__PURE__ */ new Map();
        rows.forEach((packed, rowIndex) => {
          for (const segment of packed.items) {
            const from = pct(segment.start);
            const to = pct(segment.end);
            if (to < 0 || from > 100) continue;
            const key2 = segmentKey(segment);
            order.push(key2);
            geometry.set(key2, { segment, rowIndex, left: Math.max(0, from), right: Math.min(100, to) });
          }
        });
        track._bars = [...geometry.entries()].map(([barKey, entry]) => ({
          key: barKey,
          segment: entry.segment,
          left: entry.left,
          right: entry.right
        }));
        syncChildren(
          track,
          order,
          (barKey) => {
            const bar = document.createElement("div");
            bar.className = "seg";
            return bar;
          },
          (bar, barKey) => {
            const { segment, rowIndex, left, right } = geometry.get(barKey);
            const height = segment.kind === "reasoning" ? Math.max(4, Math.round(barHeight * 0.6)) : barHeight;
            const className = `seg ${segment.kind}${segment.status ? ` ${segment.status}` : ""}${segment.wait ? " waiting" : ""}${state.selected === barKey ? " sel" : ""}`;
            if (bar.className !== className) bar.className = className;
            bar.style.left = `${left.toFixed(3)}%`;
            bar.style.width = `${Math.max(right - left, 0.12).toFixed(3)}%`;
            bar.style.top = `${rowIndex * rowHeight + 1 + Math.round((barHeight - height) / 2)}px`;
            bar.style.height = `${height}px`;
            const waitNote = segment.wait === "subagent" ? `${strings.waitSubagent} ${segment.waitLabel || ""}`.trim() : segment.wait === "user" ? strings.waitUser : "";
            const countNote = segment.items?.length > 1 ? strings.toolRun(segment.items.length) : "";
            bar.title = [
              countNote || `${segment.name} \xB7 ${fmtDur(segment.end - segment.start)}`,
              countNote ? fmtDur(segment.end - segment.start) : "",
              waitNote,
              countNote ? segment.items.map((item) => item.name).slice(0, 8).join(", ") : segment.preview
            ].filter(Boolean).join("\n");
          }
        );
        const visibleCompactions = compactions.map((segment) => ({ segment, at: pct(segment.start) })).filter((entry) => entry.at >= -1 && entry.at <= 101);
        row.marks._map = new Map(visibleCompactions.map((entry) => [entry.segment.messageId, entry.segment]));
        syncChildren(
          row.marks,
          visibleCompactions.map((entry) => entry.segment.messageId),
          (markKey) => {
            const mark = document.createElement("div");
            mark.className = "mark";
            mark.addEventListener("click", () => {
              const segment = row.marks._map.get(markKey);
              if (segment) select(segment, mark);
            });
            return mark;
          },
          (mark, markKey) => {
            const entry = visibleCompactions.find((candidate) => candidate.segment.messageId === markKey);
            const segment = entry.segment;
            mark.style.left = `${entry.at.toFixed(3)}%`;
            mark.className = `mark${segment.status ? ` ${segment.status}` : ""}`;
            mark.title = [
              `${strings.compaction} \xB7 ${fmtClock(segment.start)}`,
              segment.reason,
              segment.preview
            ].filter(Boolean).join("\n");
          }
        );
      }
    );
    if (timeline.truncated) {
      if (!dom.lanes.querySelector('[data-note="truncated"]')) {
        const marker = note(strings.truncated);
        marker.dataset.note = "truncated";
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
        marker.dataset.note = "partial";
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
  var segmentKey = (segment) => `${segment.lane}|${segment.messageId}|${segment.index}`;
  function nearestBar(track, event) {
    const bars = track._bars || [];
    const rect = track.getBoundingClientRect();
    if (!bars.length || !rect.width) return null;
    const x = (event.clientX - rect.left) / rect.width * 100;
    const tolerance = 7 / rect.width * 100;
    let best = null;
    for (const bar of bars) {
      const distance = x < bar.left ? bar.left - x : x > bar.right ? x - bar.right : 0;
      if (distance > tolerance) continue;
      if (!best || distance < best.distance) best = { ...bar, distance };
    }
    return best;
  }
  function trackWidth() {
    const track = dom.lanes.querySelector(".track");
    if (track && track.clientWidth) return track.clientWidth;
    return Math.max(140, dom.lanes.clientWidth * 0.6);
  }
  function syncChildren(parent, keys, create, update) {
    const existing = /* @__PURE__ */ new Map();
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
    const div = document.createElement("div");
    div.className = isError ? "note error" : "note";
    div.textContent = text;
    return div;
  }
  function showNote(text, isError = false) {
    dom.axis.replaceChildren();
    dom.lanes.replaceChildren();
    dom.map.hidden = true;
    const marker = note(text, isError);
    marker.dataset.note = "state";
    dom.lanes.append(marker);
  }
  function select(segment, bar) {
    const key = `${segment.lane}|${segment.messageId}|${segment.index}`;
    state.selected = key;
    for (const other of dom.lanes.querySelectorAll(".seg.sel")) other.classList.remove("sel");
    bar?.classList.add("sel");
    if (segment.items?.length > 1) openToolRun(segment);
    else openDetail(segment);
  }
  function openToolRun(run) {
    const strings = t();
    state.detailSeq += 1;
    dom.drawer.hidden = false;
    dom.drawerKind.textContent = strings.toolRun(run.items.length);
    dom.drawerWhat.textContent = `${fmtClock(run.start)} \u2192 ${fmtClock(run.end)} \xB7 ${fmtDur(run.end - run.start)}`;
    const list = document.createElement("ul");
    list.className = "runs";
    for (const item of run.items) {
      const row = document.createElement("li");
      const button2 = document.createElement("button");
      button2.type = "button";
      button2.className = "run-row";
      button2.innerHTML = [
        `<span class="run-name">${esc(item.name)}</span>`,
        `<span class="run-dur">${esc(fmtDur(item.end - item.start))}</span>`,
        item.status ? `<span class="run-status ${esc(item.status)}">${esc(item.status)}</span>` : ""
      ].join("");
      button2.addEventListener("click", () => openDetail(item));
      row.append(button2);
      list.append(row);
    }
    dom.drawerBody.replaceChildren(list);
  }
  function closeDrawer() {
    dom.drawer.hidden = true;
    dom.drawerBody.replaceChildren();
    state.selected = null;
    for (const other of dom.lanes.querySelectorAll(".seg.sel")) other.classList.remove("sel");
  }
  async function openDetail(segment) {
    const strings = t();
    state.detailSeq += 1;
    const seq = state.detailSeq;
    dom.drawer.hidden = false;
    dom.drawerKind.textContent = segment.kind === "tool" ? segment.name : strings[segment.kind] || segment.kind;
    dom.drawerWhat.textContent = `${fmtClock(segment.start)} \u2192 ${fmtClock(segment.end)} \xB7 ${fmtDur(segment.end - segment.start)}`;
    dom.drawerBody.replaceChildren(note(strings.loading));
    try {
      const detail = await request("/detail", {
        session: segment.lane,
        message: segment.messageId,
        index: String(segment.index)
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
    const isCompaction = part?.type === "compaction";
    const facts = isCompaction ? [
      [strings.model, message.model ? `${message.model.providerID || "?"}/${message.model.id || "?"}${message.model.variant ? `#${message.model.variant}` : ""}` : "\u2014"],
      // A compaction is a moment, not a span.
      [strings.time, fmtClock(segment.start)]
    ] : [
      [strings.agent, message.agent || "\u2014"],
      [strings.model, message.model ? `${message.model.providerID || "?"}/${message.model.id || "?"}${message.model.variant ? `#${message.model.variant}` : ""}` : "\u2014"],
      [strings.time, `${fmtClock(segment.start)} \u2192 ${fmtClock(segment.end)}`],
      [strings.duration, fmtDur(segment.end - segment.start)]
    ];
    const lane = state.laneInfo.get(segment.lane);
    if (lane) facts.splice(1, 0, [strings.session, lane.title]);
    if (part?.status) facts.push([strings.status, part.status]);
    if (part?.reason) facts.push([strings.reason, part.reason]);
    if (part?.wait) {
      const waitText = part.wait === "subagent" ? `${strings.waitSubagent} ${part.waitLabel || ""}`.trim() : strings.waitUser;
      facts.push([strings.waiting, waitText]);
    }
    if (message.tokens) {
      const tokens = ["input", "output", "reasoning"].filter((key) => typeof message.tokens[key] === "number").map((key) => `${key} ${message.tokens[key]}`);
      if (message.tokens.reasoning === 0 && part?.text && part.type === "reasoning") tokens.push(strings.reasoningNotReported);
      if (tokens.length) facts.push([strings.tokens, tokens.join(" \xB7 ")]);
    }
    const list = document.createElement("dl");
    for (const [key, value] of facts) {
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = value;
      list.append(dt, dd);
    }
    nodes.push(list);
    const block = (caption, text) => {
      if (!text) return;
      const cap = document.createElement("p");
      cap.className = "cap";
      cap.textContent = caption;
      const pre = document.createElement("pre");
      pre.textContent = text;
      nodes.push(cap, pre);
    };
    if (part) {
      if (part.input) block(strings.input, typeof part.input === "string" ? part.input : JSON.stringify(part.input, null, 2));
      if (part.text) block(part.type === "compaction" ? strings.summary : part.type === "reasoning" ? strings.thinking : strings.text, part.text);
      if (part.output) block(strings.output, part.output);
    } else if (detail?.text) {
      block(strings.prompt, detail.text);
    }
    return nodes;
  }
  dom.reload.addEventListener("click", () => load({ fresh: true }));
  dom.drawerClose.addEventListener("click", closeDrawer);
  dom.modes.addEventListener("click", (event) => {
    const button2 = event.target.closest("button[data-mode]");
    if (!button2 || button2.dataset.mode === state.mode) return;
    state.mode = button2.dataset.mode;
    resetView();
    render();
  });
  dom.zoom?.addEventListener("click", (event) => {
    const button2 = event.target.closest("button[data-zoom]");
    if (!button2) return;
    if (button2.dataset.zoom === "in") zoomAt(0.5, 1 / 1.7);
    else if (button2.dataset.zoom === "out") zoomAt(0.5, 1.7);
    else resetView();
    render();
  });
  dom.lanes.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const track = event.target.closest(".track");
      if (!track) return;
      event.preventDefault();
      const rect = track.getBoundingClientRect();
      const fraction = clamp01((event.clientX - rect.left) / Math.max(1, rect.width));
      zoomAt(fraction, event.deltaY > 0 ? 1.22 : 1 / 1.22);
      render();
    },
    { passive: false }
  );
  var drag = null;
  var panFrame = 0;
  function onPanMove(event) {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved < 4) return;
    dom.lanes.classList.add("panning");
    const shift = -(dx / drag.width) * drag.span;
    const from = Math.min(Math.max(0, drag.from + shift), 1 - drag.span);
    state.view = { start: from, end: from + drag.span };
    anchorView();
    dom.drawerWhat.textContent = "M" + Math.round(drag.moved) + " " + from.toFixed(2) + " f" + (state.follow ? 1 : 0);
    if (panFrame) return;
    panFrame = requestAnimationFrame(() => {
      panFrame = 0;
      render();
    });
  }
  function endPan() {
    window.removeEventListener("pointermove", onPanMove);
    window.removeEventListener("pointerup", endPan);
    window.removeEventListener("pointercancel", endPan);
    dom.lanes.classList.remove("panning");
    if (drag && drag.moved >= 4) state.panEndedAt = performance.now();
    drag = null;
  }
  dom.lanes.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const track = event.target.closest(".track");
    if (!track) return;
    drag = {
      x: event.clientX,
      width: Math.max(1, track.getBoundingClientRect().width),
      moved: 0,
      from: state.view.start,
      span: Math.max(MIN_VIEW, state.view.end - state.view.start)
    };
    dom.drawerWhat.textContent = "D " + state.view.start.toFixed(2) + "-" + state.view.end.toFixed(2);
    window.addEventListener("pointermove", onPanMove);
    window.addEventListener("pointerup", endPan);
    window.addEventListener("pointercancel", endPan);
  });
  var mapDrag = null;
  var mapFrame = 0;
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
    dom.map.classList.remove("dragging");
    window.removeEventListener("pointermove", onMapMove);
    window.removeEventListener("pointerup", endMapDrag);
    window.removeEventListener("pointercancel", endMapDrag);
  }
  dom.map?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const fraction = mapFraction(event.clientX);
    const span = Math.max(MIN_VIEW, state.view.end - state.view.start);
    const inside = span <= 0.999 && fraction >= state.view.start && fraction <= state.view.end;
    if (!inside) {
      const from = Math.min(Math.max(0, fraction - span / 2), 1 - span);
      state.view = { start: from, end: from + span };
      anchorView();
      render();
    }
    mapDrag = { grab: fraction - state.view.start, span };
    dom.map.classList.add("dragging");
    window.addEventListener("pointermove", onMapMove);
    window.addEventListener("pointerup", endMapDrag);
    window.addEventListener("pointercancel", endMapDrag);
  });
  function applyFontScale(scale, persist = true) {
    state.fontScale = scale;
    document.body.style.setProperty("--fs-scale", String(scale));
    if (dom.font) {
      dom.font.textContent = `Aa ${Math.round(scale * 100)}%`;
      dom.font.title = `${t().fontSize} \u2014 ${t().fontHint}`;
    }
    if (persist) host.storage?.set?.("fontScale", scale)?.catch?.(() => {
    });
    render();
  }
  async function restoreFontScale() {
    try {
      const stored = await host.storage.get("fontScale");
      if (typeof stored === "number" && stored >= 0.5 && stored <= 2.5) {
        applyFontScale(stored, false);
        return;
      }
    } catch {
    }
    applyFontScale(state.fontScale, false);
  }
  host.onReady((context) => {
    applyHostReady(context, document.documentElement);
    const hostSize = context?.theme?.tokens?.fontSize;
    if (typeof hostSize === "string" && hostSize) document.documentElement.style.setProperty("--host-font-size", hostSize);
    state.lang = String(context.locale || "").toLowerCase().startsWith("de") ? "de" : "en";
    setSession(context.session);
    restoreFontScale();
  });
  host.onSession((session) => setSession(session));
  dom.font?.addEventListener("click", () => {
    const index = FONT_STEPS.indexOf(state.fontScale);
    applyFontScale(FONT_STEPS[(index + 1) % FONT_STEPS.length] ?? 1);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.drawer.hidden) closeDrawer();
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "+" || event.key === "=") {
      zoomAt(0.5, 1 / 1.7);
      render();
    } else if (event.key === "-" || event.key === "_") {
      zoomAt(0.5, 1.7);
      render();
    } else if (event.key === "0") {
      resetView();
      render();
    }
  });
  var resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      render();
    }, 150);
  });
  render();
})();
