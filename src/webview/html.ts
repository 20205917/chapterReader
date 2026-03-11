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
      --surface-2: color-mix(in srgb, var(--surface) 86%, var(--bg) 14%);
      --text: var(--vscode-editor-foreground);
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
      --hover: var(--vscode-list-hoverBackground);
      --active: var(--vscode-list-activeSelectionBackground);
      --btn-bg: var(--vscode-button-secondaryBackground);
      --btn-fg: var(--vscode-button-secondaryForeground);
      --btn-primary: var(--vscode-button-background);
      --btn-primary-fg: var(--vscode-button-foreground);
      --danger: var(--vscode-errorForeground);
      --accent: var(--vscode-textLink-foreground);
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      height: 100vh;
      overflow: hidden;
      background:
        radial-gradient(circle at 10% -20%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 38%),
        radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--btn-primary) 10%, transparent), transparent 45%),
        var(--bg);
      color: var(--text);
      font-family: 'Avenir Next', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', var(--vscode-font-family);
      font-size: 13px;
    }
    button {
      font: inherit;
      color: var(--btn-fg);
      border: 1px solid transparent;
      border-radius: 10px;
      background: var(--btn-bg);
      padding: 7px 12px;
      cursor: pointer;
      transition: transform 90ms ease, filter 120ms ease, background 120ms ease;
    }
    button:hover {
      filter: brightness(1.06);
    }
    button:active {
      transform: translateY(1px);
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
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, var(--panel), color-mix(in srgb, var(--panel) 70%, var(--bg) 30%));
      backdrop-filter: blur(2px);
    }
    .toolbar-main {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .toolbar-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .toolbar-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 86%, var(--bg) 14%);
      white-space: nowrap;
    }
    .topbar button {
      min-height: 30px;
      font-size: 12px;
      border-radius: 999px;
      padding: 0 12px;
      border-color: color-mix(in srgb, var(--border) 50%, transparent);
    }
    #toggleToolbar {
      min-width: 54px;
      font-weight: 600;
      color: var(--btn-primary-fg);
      background: var(--btn-primary);
    }
    .toolbar-extra {
      display: none;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      animation: slide-down 140ms ease;
    }
    .topbar.toolbar-expanded .toolbar-extra {
      display: flex;
    }
    @keyframes slide-down {
      from {
        transform: translateY(-5px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    #toggleStealth.active {
      border-color: color-mix(in srgb, var(--btn-primary) 68%, transparent);
      background: color-mix(in srgb, var(--btn-primary) 20%, var(--btn-bg) 80%);
      color: var(--text);
    }
    .settings-bar {
      display: none;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--panel) 72%, var(--bg) 28%);
      font-size: 12px;
    }
    .settings-bar.show {
      display: flex;
      animation: slide-down 120ms ease;
    }
    .settings-bar label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted);
      background: var(--surface-2);
      border: 1px solid var(--border);
      padding: 6px 8px;
      border-radius: 8px;
    }
    .settings-bar input {
      width: 74px;
      font: inherit;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 7px;
      background: var(--surface);
      padding: 5px 6px;
    }
    .settings-bar button {
      background: var(--btn-primary);
      color: var(--btn-primary-fg);
    }
    .main {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: minmax(250px, 30%) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
      gap: 12px;
      padding: 12px;
    }
    .main.shelf-collapsed {
      grid-template-columns: 1fr;
    }
    .main.shelf-collapsed .shelf-panel {
      display: none;
    }
    .panel {
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--panel) 88%, var(--bg) 12%);
      border-radius: 14px;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      box-shadow: 0 6px 24px color-mix(in srgb, black 12%, transparent);
    }
    .panel-title {
      margin: 0;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
      background: var(--surface);
    }
    .shelf-list {
      height: calc(100% - 46px);
      min-height: 0;
      overflow: auto;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .book-row {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 8px;
      border: 1px solid color-mix(in srgb, var(--border) 64%, transparent);
      border-radius: 10px;
      background: color-mix(in srgb, var(--surface) 78%, var(--bg) 22%);
      transition: background 120ms ease, border-color 120ms ease;
    }
    .book-row.active {
      border-color: color-mix(in srgb, var(--accent) 50%, var(--border) 50%);
      background: color-mix(in srgb, var(--active) 72%, var(--surface) 28%);
    }
    .book-main {
      flex: 1;
      min-width: 0;
      cursor: pointer;
      border-radius: 8px;
      padding: 2px;
    }
    .book-main:hover {
      background: var(--hover);
    }
    .book-title {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .book-meta {
      margin-top: 3px;
      font-size: 11px;
      color: var(--muted);
    }
    .delete-btn {
      align-self: center;
      font-size: 11px;
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 10%, var(--surface) 90%);
      border-color: color-mix(in srgb, var(--danger) 28%, transparent);
      border-radius: 999px;
      padding: 4px 10px;
    }
    .reader {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      min-height: 0;
      height: 100%;
    }
    .reader-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 13px 14px 10px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    #currentBook {
      font-size: 15px;
      font-weight: 700;
      max-width: 70%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #currentChapterMeta {
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
      max-width: 45%;
    }
    .chapter-panel {
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 68%, var(--panel) 32%);
    }
    .chapter-tools {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px dashed color-mix(in srgb, var(--border) 68%, transparent);
    }
    #chapterSearch {
      flex: 1;
      min-width: 0;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      border-radius: 8px;
      padding: 6px 9px;
      font: inherit;
    }
    #chapterCount {
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
    }
    .chapter-list {
      max-height: 170px;
      overflow: auto;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .chapter-list.collapsed {
      display: none;
    }
    .chapter-item {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
      background: color-mix(in srgb, var(--surface) 76%, var(--bg) 24%);
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease;
      font-size: 13px;
    }
    .chapter-item:hover {
      background: var(--hover);
    }
    .chapter-item.active {
      border-color: color-mix(in srgb, var(--accent) 48%, var(--border) 52%);
      background: color-mix(in srgb, var(--active) 72%, var(--surface) 28%);
    }
    .chapter-item .chapter-title {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chapter-item .chapter-meta {
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
    }
    .article-wrap {
      min-height: 0;
      overflow: auto;
      background: linear-gradient(180deg, color-mix(in srgb, var(--bg) 92%, transparent), var(--bg));
    }
    .article {
      min-height: 100%;
      padding: 22px 20px 34px;
      line-height: 1.68;
      font-size: 18px;
      white-space: normal;
      --paragraph-gap: 14px;
    }
    .article p {
      margin: 0 0 var(--paragraph-gap);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .article p:last-child {
      margin-bottom: 0;
    }
    .status-toast {
      position: fixed;
      right: 14px;
      bottom: 14px;
      max-width: min(62vw, 360px);
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: color-mix(in srgb, var(--surface) 88%, var(--bg) 12%);
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 140ms ease, transform 140ms ease;
      pointer-events: none;
      z-index: 30;
    }
    .status-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    body.stealth-mode .status-toast {
      opacity: 0.78;
    }
    body.stealth-mode .shelf-panel {
      display: none;
    }
    body.stealth-mode .main {
      grid-template-columns: 1fr;
      padding: 8px;
    }
    body.stealth-mode .reader {
      border-radius: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      grid-template-rows: minmax(0, 1fr);
    }
    body.stealth-mode .reader-head,
    body.stealth-mode .chapter-panel {
      display: none;
    }
    body.stealth-mode .article-wrap {
      background: transparent;
    }
    body.stealth-mode .article {
      max-width: 980px;
      margin: 0 auto;
      padding-top: 12px;
    }
    @media (max-width: 900px) {
      .main {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(180px, 36%) minmax(0, 1fr);
      }
      .main.shelf-collapsed {
        grid-template-rows: minmax(0, 1fr);
      }
      #currentBook {
        max-width: 60%;
      }
      .chapter-list {
        max-height: 130px;
      }
    }
    @media (max-width: 620px) {
      .topbar {
        padding: 8px 8px 9px;
      }
      .main {
        padding: 8px;
        gap: 8px;
      }
      .article {
        padding: 16px 14px 26px;
      }
      #currentBook {
        max-width: 100%;
      }
      #currentChapterMeta {
        display: none;
      }
      .reader-head {
        justify-content: flex-start;
      }
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
      <div class="toolbar-extra">
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
      <label>段距 <input id="paragraphSpacingInput" type="number" min="0" max="36" step="1" /></label>
      <label>宽度 <input id="contentWidthInput" type="number" min="560" max="1200" step="20" /></label>
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
          <div id="currentChapterMeta">请选择一本书</div>
        </div>
        <div class="chapter-panel">
          <div class="chapter-tools">
            <input id="chapterSearch" type="search" placeholder="搜索章节标题..." />
            <span id="chapterCount">0 章</span>
          </div>
          <div class="chapter-list" id="chapterList"></div>
        </div>
        <div class="article-wrap">
          <div class="article" id="article">请选择一本书并打开章节。</div>
        </div>
      </section>
    </div>
  </div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
let state = {
  books: [],
  chapters: [],
  currentBookId: null,
  currentChapterId: null,
  chapterFilter: '',
  shelfCollapsed: false,
  catalogCollapsed: false,
  settingsOpen: false,
  toolbarExpanded: false,
  settings: {
    fontSize: 18,
    lineHeight: 1.55,
    paragraphSpacing: 14,
    contentWidth: 900,
    stealthMode: false
  }
};

const statusEl = document.getElementById('status');
const bookListEl = document.getElementById('bookList');
const chapterListEl = document.getElementById('chapterList');
const chapterSearchEl = document.getElementById('chapterSearch');
const chapterCountEl = document.getElementById('chapterCount');
const articleEl = document.getElementById('article');
const currentBookEl = document.getElementById('currentBook');
const currentChapterMetaEl = document.getElementById('currentChapterMeta');
const mainRoot = document.getElementById('mainRoot');
const topbarEl = document.querySelector('.topbar');
const toolbarExtraEl = document.querySelector('.toolbar-extra');
const toggleToolbarBtnEl = document.getElementById('toggleToolbar');
const settingsBarEl = document.getElementById('settingsBar');
const fontSizeInputEl = document.getElementById('fontSizeInput');
const lineHeightInputEl = document.getElementById('lineHeightInput');
const paragraphSpacingInputEl = document.getElementById('paragraphSpacingInput');
const contentWidthInputEl = document.getElementById('contentWidthInput');
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
  paragraphSpacingInputEl.value = String(state.settings.paragraphSpacing);
  contentWidthInputEl.value = String(state.settings.contentWidth);
}

function applyReadingStyle() {
  articleEl.style.fontSize = state.settings.fontSize + 'px';
  articleEl.style.lineHeight = String(state.settings.lineHeight);
  articleEl.style.setProperty('--paragraph-gap', state.settings.paragraphSpacing + 'px');
  articleEl.style.maxWidth = state.settings.contentWidth + 'px';
  articleEl.style.margin = '0 auto';
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
    meta.textContent = state.settings.stealthMode
      ? ('条目 ' + String(b.chapterCount))
      : (b.sourceType === 'local' ? '本地导入' : '在线书源') + ' · ' + b.chapterCount + ' 章';

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

function renderArticleContent(rawText) {
  const normalized = String(rawText || '').replace(/(\\n\\s*){3,}/g, '\\n\\n').trim();
  articleEl.innerHTML = '';
  if (!normalized) {
    const empty = document.createElement('p');
    empty.textContent = '当前章节没有可显示的内容。';
    articleEl.appendChild(empty);
    return;
  }
  let paragraphs = normalized.split(/\\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    const byLine = normalized.split(/\\n+/).map((p) => p.trim()).filter(Boolean);
    if (byLine.length >= 3) {
      paragraphs = byLine;
    }
  }
  if (paragraphs.length === 0) {
    const single = document.createElement('p');
    single.textContent = normalized;
    articleEl.appendChild(single);
    return;
  }
  for (const paragraph of paragraphs) {
    const p = document.createElement('p');
    p.textContent = paragraph;
    articleEl.appendChild(p);
  }
}

function updateCurrentChapterMeta() {
  if (!currentChapterMetaEl) return;
  if (!state.currentBookId) {
    currentChapterMetaEl.textContent = '请选择一本书';
    return;
  }
  const current = state.chapters.find((c) => c.id === state.currentChapterId);
  if (!current) {
    currentChapterMetaEl.textContent = state.chapters.length > 0 ? ('共 ' + state.chapters.length + ' 章') : '无章节';
    return;
  }
  const prefix = '第 ' + String(current.index + 1) + ' 章';
  currentChapterMetaEl.textContent = state.settings.stealthMode ? prefix : prefix + ' · ' + current.title;
}

function renderChapters() {
  chapterListEl.innerHTML = '';
  const keyword = String(state.chapterFilter || '').trim().toLowerCase();
  const visible = state.chapters.filter((c) => {
    if (!keyword) {
      return true;
    }
    return c.title.toLowerCase().includes(keyword) || String(c.index + 1).includes(keyword);
  });

  if (chapterCountEl) {
    chapterCountEl.textContent = visible.length === state.chapters.length
      ? (state.chapters.length + ' 章')
      : (visible.length + '/' + state.chapters.length + ' 章');
  }

  for (const c of visible) {
    const div = document.createElement('div');
    div.className = 'chapter-item' + (state.currentChapterId === c.id ? ' active' : '');
    const title = document.createElement('div');
    title.className = 'chapter-title';
    title.textContent = state.settings.stealthMode ? ('记录 ' + String(c.index + 1)) : c.title;
    const meta = document.createElement('div');
    meta.className = 'chapter-meta';
    meta.textContent = '序号 ' + String(c.index + 1);
    div.appendChild(title);
    div.appendChild(meta);
    div.onclick = () => post('openChapter', { bookId: c.bookId, chapterId: c.id });
    chapterListEl.appendChild(div);
  }
}

function toggleStealthAndSave() {
  state.settings.stealthMode = !state.settings.stealthMode;
  applyStealthMode();
  renderBooks();
  renderChapters();
  updateCurrentChapterMeta();
  post('saveSettings', { settings: state.settings });
  setStatus('界面模式已切换');
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
        paragraphSpacing: Number(msg.payload.settings.paragraphSpacing ?? state.settings.paragraphSpacing),
        contentWidth: Number(msg.payload.settings.contentWidth ?? state.settings.contentWidth),
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
    state.currentChapterId = msg.payload.progress?.chapterId || null;
    state.chapters = msg.payload.chapters;
    state.chapterFilter = '';
    chapterSearchEl.value = '';
    currentBookEl.textContent = state.settings.stealthMode ? '文档 #' + String(msg.payload.book.id.slice(0, 4)) : msg.payload.book.title;
    updateCurrentChapterMeta();
    renderBooks();
    renderChapters();
    if (msg.payload.progress) {
      post('openChapter', { bookId: msg.payload.book.id, chapterId: msg.payload.progress.chapterId, offset: msg.payload.progress.offset || 0 });
    }
  }
  if (msg.type === 'chapterOpened') {
    state.currentBookId = msg.payload.bookId;
    state.currentChapterId = msg.payload.chapterId;
    renderArticleContent(msg.payload.content || '');
    applyReadingStyle();
    updateCurrentChapterMeta();
    renderChapters();
    if (typeof msg.payload.offset === 'number') {
      articleEl.scrollTop = msg.payload.offset;
    }
  }
  if (msg.type === 'bookCleared') {
    state.currentBookId = null;
    state.currentChapterId = null;
    state.chapters = [];
    state.chapterFilter = '';
    chapterSearchEl.value = '';
    currentBookEl.textContent = '未选择书籍';
    currentChapterMetaEl.textContent = '请选择一本书';
    chapterListEl.innerHTML = '';
    renderArticleContent('请选择一本书并打开章节。');
    renderBooks();
    if (chapterCountEl) {
      chapterCountEl.textContent = '0 章';
    }
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
    toggleStealthAndSave();
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
document.getElementById('toggleStealth').onclick = () => toggleStealthAndSave();
document.getElementById('nextChapter').onclick = () => post('nextChapter');
document.getElementById('prevChapter').onclick = () => post('prevChapter');
chapterSearchEl.addEventListener('input', () => {
  state.chapterFilter = chapterSearchEl.value;
  renderChapters();
});
document.getElementById('saveReadingSettings').onclick = () => {
  const nextFont = Number(fontSizeInputEl.value);
  const nextLine = Number(lineHeightInputEl.value);
  const nextParagraph = Number(paragraphSpacingInputEl.value);
  const nextWidth = Number(contentWidthInputEl.value);
  if (Number.isFinite(nextFont)) {
    state.settings.fontSize = Math.min(40, Math.max(12, nextFont));
  }
  if (Number.isFinite(nextLine)) {
    state.settings.lineHeight = Math.min(2.4, Math.max(1.2, nextLine));
  }
  if (Number.isFinite(nextParagraph)) {
    state.settings.paragraphSpacing = Math.min(36, Math.max(0, nextParagraph));
  }
  if (Number.isFinite(nextWidth)) {
    state.settings.contentWidth = Math.min(1200, Math.max(560, nextWidth));
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
updateCurrentChapterMeta();
</script>
</body>
</html>`;
}
