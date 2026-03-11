# Chapter Reader (Cursor Extension)

`Chapter Reader` 是一个 Cursor/VS Code 扩展，用于本地 TXT/EPUB 与在线章节阅读。

## 功能

- 侧边栏阅读器视图
- 本地导入：`TXT`、`EPUB`
- 在线解析：站点解析 + 通用兜底
- 书籍删除、阅读进度持久化
- 阅读设置：字体大小、行高
- 紧凑工具栏（支持单行/展开）

## 快捷键

- 上一章：`Space` + `Left`
- 下一章：`Space` + `Right`

注：以上快捷键仅在 `webview` 聚焦时生效（`when: webviewFocus`）。

## 安装与更新（普通用户，无需克隆仓库）

### 方式 A：手动安装（最稳妥）

1. 打开 GitHub Releases：`https://github.com/20205917/chapterReader/releases`
2. 下载最新的 `chapter-reader-*.vsix`
3. 在 Cursor 执行 `Extensions: Install from VSIX...`

### 方式 B：自动安装（macOS / Linux）

前提：本机已安装 `node` 和 `cursor` 命令。

```bash
curl -fsSL -o /tmp/install-chapter-reader.js https://raw.githubusercontent.com/20205917/chapterReader/main/scripts/install-latest-release.js
node /tmp/install-chapter-reader.js
```

### 方式 C：自动安装（Windows PowerShell）

前提：本机已安装 `node`，且可执行 `cursor` 命令。

```powershell
$script = "$env:TEMP\install-chapter-reader.js"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/20205917/chapterReader/main/scripts/install-latest-release.js" -OutFile $script
node $script
```

### 自动更新（轮询）

macOS / Linux:

```bash
node /tmp/install-chapter-reader.js --interval-sec 300
```

Windows PowerShell:

```powershell
node $env:TEMP\install-chapter-reader.js --interval-sec 300
```

### 脚本常用参数

`<script-path>` 指已下载脚本路径，例如 `/tmp/install-chapter-reader.js` 或 `$env:TEMP\install-chapter-reader.js`。

```bash
# 只查看将安装哪个版本，不执行安装
node <script-path> --dry-run

# 强制重装当前最新版本
node <script-path> --force

# 指定轮询间隔（秒）
node <script-path> --interval-sec 120

# 指定仓库（默认 20205917/chapterReader）
node <script-path> --repo owner/name

# 指定 Cursor CLI 路径（当 cursor 命令不在 PATH 时）
node <script-path> --cursor-bin /path/to/cursor
```

私有仓库建议设置：

- `GH_TOKEN` 或 `GITHUB_TOKEN`（避免 API 限流并支持私有 Release）。
- `CHAPTER_READER_REPO`（覆盖默认仓库地址）。

### 常见问题

- 报错 `no available release found`：
  当前仓库还没有可用 Release，需先发布至少一个包含 `.vsix` 的版本。
- 报错 `cannot find Cursor CLI`：
  先确认 `cursor --help` 可执行，或使用 `--cursor-bin` 指定路径。

## 开发（本仓库）

```bash
npm install
npm run compile
npm test
```

在 Cursor/VS Code 中按 `F5` 启动 Extension Host 调试。

## 发布（云端 Codex）

```bash
# 常规修复/小改（patch）
npm run release:task -- --summary "修复章节跳转" --bump patch

# 新增用户可感知能力（minor）
npm run release:task -- --summary "新增在线书源管理" --bump minor --manual-qa yes

# 首次按本项目流程发版
npm run release:task -- --summary "首个正式版本" --version 1.0.0
```

注意：

- 发布前必须确保 `gh` 已安装并登录。
- 自动安装脚本要求仓库至少已有一个包含 `.vsix` 的 Release。

## 文档索引

- 正式工作流：[`docs/ai-workflow.md`](docs/ai-workflow.md)
- 工作记录：[`docs/ai-worklog.md`](docs/ai-worklog.md)
- 人工验收模板：[`docs/manual-qa-template.md`](docs/manual-qa-template.md)
