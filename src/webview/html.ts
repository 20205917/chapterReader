export function renderWebviewHtml(nonce: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chapter Reader</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --panel: var(--vscode-sideBar-background);
      --surface: var(--vscode-editorWidget-background);
      --text: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
      --hover: var(--vscode-list-hoverBackground);
      --active: var(--vscode-list-activeSelectionBackground);
      --btn-bg: var(--vscode-button-secondaryBackground);
      --btn-fg: var(--vscode-button-secondaryForeground);
      --danger: var(--vscode-errorForeground);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      height: 100vh;
      overflow: hidden;
      background: var(--bg);
      color: var(--text);
      font-family: var(--vscode-font-family);
    }
    button {
      font: inherit;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      padding: 7px 10px;
      cursor: pointer;
    }
    .app {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .topbar {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 3px 6px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, var(--panel), var(--surface));
    }
    .toolbar-main {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .toolbar-primary {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .toolbar-primary::-webkit-scrollbar { display: none; }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 1px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--surface);
      white-space: nowrap;
    }
    .topbar button {
      background: var(--btn-bg);
      color: var(--btn-fg);
      font-size: 11px;
      padding: 0 8px;
      height: 18px;
      line-height: 18px;
      border-radius: 999px;
      border-color: transparent;
    }
    #toggleToolbar {
      flex: none;
      min-width: 44px;
      font-weight: 600;
    }
    .toolbar-extra {
      display: none;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .topbar.toolbar-expanded .toolbar-extra {
      display: flex;
    }
    .toolbar-extra .toolbar-group {
      background: transparent;
    }
    #toggleStealth.active {
      border-color: var(--vscode-button-background);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .status-toast {
      position: fixed;
      right: 12px;
      bottom: 12px;
      max-width: min(60vw, 320px);
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 140ms ease, transform 140ms ease;
      pointer-events: none;
      z-index: 30;
    }
    .status-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    .settings-bar {
      display: none;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      background: var(--panel);
      font-size: 12px;
    }
    .settings-bar.show { display: flex; }
    .settings-bar label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted);
    }
    .settings-bar input {
      width: 72px;
      font: inherit;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      padding: 6px 8px;
    }
    .main {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(220px, 30%) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
      gap: 10px;
      padding: 10px;
    }
    .main.shelf-collapsed { grid-template-columns: 1fr; }
    .main.shelf-collapsed .shelf-panel { display: none; }
    .panel {
      border: 1px solid var(--border);
      background: var(--panel);
      border-radius: 10px;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .panel-title {
      margin: 0;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--muted);
      background: var(--surface);
    }
    .shelf-list {
      height: calc(100% - 40px);
      min-height: 0;
      overflow: auto;
    }
    .book-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-bottom: 1px dashed var(--border);
    }
    .book-row.active { background: var(--active); }
    .book-main { flex: 1; min-width: 0; cursor: pointer; }
    .book-main:hover { background: var(--hover); }
    .book-title {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .book-meta { font-size: 11px; color: var(--muted); }
    .delete-btn {
      font-size: 12px;
      color: var(--danger);
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--surface);
    }
    .reader {
      display: grid;
      grid-template-rows: auto auto 1fr;
      min-height: 0;
      height: 100%;
    }
    .reader-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    /* Keep currentBook DOM for logic compatibility, but hide title bar in reader area. */
    .reader-head { display: none; }
    #currentBook {
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chapter-list {
      max-height: 150px;
      overflow: auto;
      border-bottom: 1px solid var(--border);
    }
    .chapter-list.collapsed { display: none; }
    .chapter-item {
      padding: 8px 12px;
      border-bottom: 1px dashed var(--border);
      font-size: 13px;
      cursor: pointer;
    }
    .chapter-item:hover { background: var(--hover); }
    .article {
      min-height: 0;
      overflow: auto;
      padding: 16px 18px 24px;
      background: var(--bg);
      line-height: 1.6;
      font-size: 16px;
      white-space: pre-line;
    }
    body.stealth-mode .status-toast {
      opacity: 0.7;
    }
    body.stealth-mode .shelf-panel {
      display: none;
    }
    body.stealth-mode .main {
      grid-template-columns: 1fr;
      gap: 0;
      padding: 6px;
    }
    body.stealth-mode .reader {
      border-radius: 0;
      border: 0;
      background: var(--bg);
      grid-template-rows: 1fr;
    }
    body.stealth-mode .chapter-list {
      display: none;
    }
    body.stealth-mode .article {
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      letter-spacing: 0.02em;
      white-space: pre-wrap;
      max-width: 980px;
      margin: 0 auto;
      padding-top: 10px;
    }
    @media (max-width: 760px) {
      .main {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(130px, 34%) minmax(0, 1fr);
      }
      .main.shelf-collapsed {
        grid-template-rows: minmax(0, 1fr);
      }
      .main.shelf-collapsed .reader {
        grid-row: 1;
      }
      .chapter-list { max-height: 120px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="topbar">
      <div class="toolbar-main">
        <div class="toolbar-primary">
          <div class="toolbar-group">
            <button id="toggleCatalog">目录</button>
          </div>
          <div class="toolbar-group">
            <button id="prevChapter">上一章</button>
            <button id="nextChapter">下一章</button>
          </div>
          <div class="toolbar-group">
            <button id="toggleStealth">隐蔽</button>
          </div>
        </div>
        <button id="toggleToolbar" aria-expanded="false">更多</button>
      </div>
      <div class="toolbar-extra" id="toolbarExtra">
        <div class="toolbar-group">
          <button id="importLocal">导入</button>
          <button id="addOnline">在线添加</button>
          <button id="toggleShelf">书架</button>
          <button id="toggleSettings">设置</button>
        </div>
      </div>
    </div>
    <div class="status-toast" id="status" aria-live="polite" aria-atomic="true"></div>
    <div class="settings-bar" id="settingsBar">
      <label>字体 <input id="fontSizeInput" type="number" min="12" max="40" step="1" /></label>
      <label>行高 <input id="lineHeightInput" type="number" min="1.2" max="2.4" step="0.05" /></label>
      <button id="saveReadingSettings">保存阅读设置</button>
    </div>

    <div class="main" id="mainRoot">
      <section class="panel shelf-panel">
        <h3 class="panel-title">书架</h3>
        <div class="shelf-list" id="bookList"></div>
      </section>

      <section class="panel reader">
        <div class="reader-head">
          <div id="currentBook">未选择书籍</div>
        </div>
        <div class="chapter-list" id="chapterList"></div>
        <div class="article" id="article">请选择一本书并打开章节。</div>
      </section>
  </div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
let state = {
  books: [],
  chapters: [],
  currentBookId: null,
  currentChapterId: null,
  shelfCollapsed: false,
  catalogCollapsed: false,
  settingsOpen: false,
  toolbarExpanded: false,
  settings: {
    fontSize: 16,
    lineHeight: 1.55,
    stealthMode: false
  }
};

const statusEl = document.getElementById('status');
const bookListEl = document.getElementById('bookList');
const chapterListEl = document.getElementById('chapterList');
const articleEl = document.getElementById('article');
const currentBookEl = document.getElementById('currentBook');
const mainRoot = document.getElementById('mainRoot');
const topbarEl = document.querySelector('.topbar');
const toolbarExtraEl = document.getElementById('toolbarExtra');
const toggleToolbarBtnEl = document.getElementById('toggleToolbar');
const settingsBarEl = document.getElementById('settingsBar');
const fontSizeInputEl = document.getElementById('fontSizeInput');
const lineHeightInputEl = document.getElementById('lineHeightInput');
const toggleStealthBtnEl = document.getElementById('toggleStealth');
let statusTimer = null;

function maskedStatus(text) {
  if (!state.settings.stealthMode) return text;
  if (/失败|错误|error/i.test(text)) return '任务处理失败';
  if (/删除/.test(text)) return '记录已更新';
  return '同步完成';
}
function setStatus(text) {
  if (!statusEl) return;
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
  statusEl.textContent = maskedStatus(text);
  statusEl.classList.add('show');
  statusTimer = setTimeout(() => {
    statusEl.classList.remove('show');
  }, 1800);
}
function post(type, payload = {}) { vscode.postMessage({ type, ...payload }); }

function relabelUI() {
  const labels = state.settings.stealthMode
    ? {
        importLocal: '文件',
        addOnline: '链接',
        toggleShelf: '列表',
        toggleCatalog: '索引',
        toggleSettings: '参数',
        prevChapter: '上条',
        nextChapter: '下条',
        toggleStealth: '标准'
      }
    : {
        importLocal: '导入',
        addOnline: '在线添加',
        toggleShelf: '书架',
        toggleCatalog: '目录',
        toggleSettings: '设置',
        prevChapter: '上一章',
        nextChapter: '下一章',
        toggleStealth: '专注'
      };
  for (const [id, text] of Object.entries(labels)) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

function applyToolbarState() {
  if (!topbarEl || !toggleToolbarBtnEl) return;
  if (state.toolbarExpanded) {
    topbarEl.classList.add('toolbar-expanded');
  } else {
    topbarEl.classList.remove('toolbar-expanded');
  }
  if (toolbarExtraEl) {
    toolbarExtraEl.setAttribute('aria-hidden', String(!state.toolbarExpanded));
  }
  const collapsed = !state.toolbarExpanded;
  toggleToolbarBtnEl.textContent = state.settings.stealthMode
    ? (collapsed ? '展开' : '一行')
    : (collapsed ? '更多' : '一行');
  toggleToolbarBtnEl.setAttribute('aria-expanded', String(state.toolbarExpanded));
  toggleToolbarBtnEl.title = collapsed ? '展开更多操作' : '收缩为一行';
}

function applyStealthMode() {
  if (state.settings.stealthMode) {
    document.body.classList.add('stealth-mode');
    toggleStealthBtnEl.classList.add('active');
  } else {
    document.body.classList.remove('stealth-mode');
    toggleStealthBtnEl.classList.remove('active');
  }
  relabelUI();
  applyToolbarState();
}

function applyPanelState() {
  if (state.shelfCollapsed) {
    mainRoot.classList.add('shelf-collapsed');
  } else {
    mainRoot.classList.remove('shelf-collapsed');
  }
  if (state.catalogCollapsed) {
    chapterListEl.classList.add('collapsed');
  } else {
    chapterListEl.classList.remove('collapsed');
  }
  if (state.settingsOpen) {
    settingsBarEl.classList.add('show');
  } else {
    settingsBarEl.classList.remove('show');
  }
}

function syncSettingsInputs() {
  fontSizeInputEl.value = String(state.settings.fontSize);
  lineHeightInputEl.value = String(state.settings.lineHeight);
}

function applyReadingStyle() {
  articleEl.style.fontSize = state.settings.fontSize + 'px';
  articleEl.style.lineHeight = String(state.settings.lineHeight);
}

function renderBooks() {
  bookListEl.innerHTML = '';
  for (const [idx, b] of state.books.entries()) {
    const row = document.createElement('div');
    row.className = 'book-row' + (state.currentBookId === b.id ? ' active' : '');

    const main = document.createElement('div');
    main.className = 'book-main';
    main.onclick = () => post('openBook', { bookId: b.id });

    const title = document.createElement('div');
    title.className = 'book-title';
    title.textContent = state.settings.stealthMode ? ('文档 #' + String(idx + 1)) : b.title;

    const meta = document.createElement('div');
    meta.className = 'book-meta';
    meta.textContent = state.settings.stealthMode ? ('条目 ' + String(b.chapterCount)) : b.sourceType + ' · ' + b.chapterCount + '章';

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '删除';
    del.onclick = (e) => {
      e.stopPropagation();
      post('deleteBook', { bookId: b.id });
    };

    main.appendChild(title);
    main.appendChild(meta);
    row.appendChild(main);
    row.appendChild(del);
    bookListEl.appendChild(row);
  }
}

function renderChapters() {
  chapterListEl.innerHTML = '';
  for (const c of state.chapters) {
    const div = document.createElement('div');
    div.className = 'chapter-item';
    div.textContent = state.settings.stealthMode ? ('记录 ' + String(c.index + 1)) : c.title;
    div.onclick = () => post('openChapter', { bookId: c.bookId, chapterId: c.id });
    chapterListEl.appendChild(div);
  }
}

window.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg.type === 'snapshot') {
    state.books = msg.payload.books;
    if (msg.payload && msg.payload.settings) {
      state.settings = {
        ...state.settings,
        fontSize: Number(msg.payload.settings.fontSize ?? state.settings.fontSize),
        lineHeight: Number(msg.payload.settings.lineHeight ?? state.settings.lineHeight),
        stealthMode: Boolean(msg.payload.settings.stealthMode ?? state.settings.stealthMode)
      };
      syncSettingsInputs();
      applyReadingStyle();
      applyStealthMode();
    }
    renderBooks();
  }
  if (msg.type === 'bookOpened') {
    state.currentBookId = msg.payload.book.id;
    state.chapters = msg.payload.chapters;
    currentBookEl.textContent = msg.payload.book.title;
    renderBooks();
    renderChapters();
    if (msg.payload.progress) {
      post('openChapter', { bookId: msg.payload.book.id, chapterId: msg.payload.progress.chapterId, offset: msg.payload.progress.offset || 0 });
    }
  }
  if (msg.type === 'chapterOpened') {
    state.currentBookId = msg.payload.bookId;
    state.currentChapterId = msg.payload.chapterId;
    const normalized = String(msg.payload.content || '').replace(/(\\n\\s*){3,}/g, '\\n\\n');
    articleEl.textContent = normalized;
    applyReadingStyle();
    if (typeof msg.payload.offset === 'number') {
      articleEl.scrollTop = msg.payload.offset;
    }
  }
  if (msg.type === 'bookCleared') {
    state.currentBookId = null;
    state.currentChapterId = null;
    state.chapters = [];
    currentBookEl.textContent = '未选择书籍';
    chapterListEl.innerHTML = '';
    articleEl.textContent = '请选择一本书并打开章节。';
    renderBooks();
  }
  if (msg.type === 'toggleShelf') {
    state.shelfCollapsed = !state.shelfCollapsed;
    applyPanelState();
  }
  if (msg.type === 'toggleCatalog') {
    state.catalogCollapsed = !state.catalogCollapsed;
    applyPanelState();
  }
  if (msg.type === 'toggleStealth') {
    state.settings.stealthMode = !state.settings.stealthMode;
    applyStealthMode();
    renderBooks();
    renderChapters();
    post('saveSettings', { settings: state.settings });
    setStatus('界面已更新');
  }
  if (msg.type === 'error') {
    setStatus(msg.payload.message);
  }
  if (msg.type === 'status') {
    setStatus(msg.payload.message);
  }
});

document.getElementById('importLocal').onclick = () => post('importLocal');
document.getElementById('addOnline').onclick = () => post('addOnline');
document.getElementById('toggleShelf').onclick = () => {
  state.shelfCollapsed = !state.shelfCollapsed;
  applyPanelState();
};
document.getElementById('toggleCatalog').onclick = () => {
  state.catalogCollapsed = !state.catalogCollapsed;
  applyPanelState();
};
document.getElementById('toggleSettings').onclick = () => {
  state.settingsOpen = !state.settingsOpen;
  applyPanelState();
};
document.getElementById('toggleToolbar').onclick = () => {
  state.toolbarExpanded = !state.toolbarExpanded;
  applyToolbarState();
};
document.getElementById('toggleStealth').onclick = () => {
  state.settings.stealthMode = !state.settings.stealthMode;
  applyStealthMode();
  renderBooks();
  renderChapters();
  post('saveSettings', { settings: state.settings });
  setStatus('界面已更新');
};
document.getElementById('nextChapter').onclick = () => post('nextChapter');
document.getElementById('prevChapter').onclick = () => post('prevChapter');
document.getElementById('saveReadingSettings').onclick = () => {
  const nextFont = Number(fontSizeInputEl.value);
  const nextLine = Number(lineHeightInputEl.value);
  if (Number.isFinite(nextFont)) {
    state.settings.fontSize = Math.min(40, Math.max(12, nextFont));
  }
  if (Number.isFinite(nextLine)) {
    state.settings.lineHeight = Math.min(2.4, Math.max(1.2, nextLine));
  }
  syncSettingsInputs();
  applyReadingStyle();
  post('saveSettings', { settings: state.settings });
  setStatus('阅读设置已保存');
};

articleEl.addEventListener('scroll', () => {
  if (!state.currentBookId || !state.currentChapterId) return;
  post('saveProgress', { bookId: state.currentBookId, chapterId: state.currentChapterId, offset: articleEl.scrollTop });
});

post('init');
syncSettingsInputs();
applyReadingStyle();
applyStealthMode();
applyToolbarState();
</script>
</body>
</html>`;
}
