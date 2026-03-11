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

## 安装与更新（本地 Cursor）

### 方式 A：自动安装最新 Release（推荐）

```bash
npm run install:latest
```

说明：

- 自动识别 `origin` 对应的 GitHub 仓库。
- 自动拉取最新非预发布 Release。
- 自动下载 `chapter-reader-*.vsix` 并执行 `cursor --install-extension ... --force`。
- 默认状态目录：`~/.chapter-reader-installer/`（用于记录已安装版本，避免重复安装）。

### 方式 B：持续轮询自动更新

```bash
npm run install:latest:watch
```

默认每 300 秒检查一次新版本。适合长期开着本地终端的场景。

### 方式 C：手动安装（兜底）

1. 从 GitHub Release 下载 `.vsix`。
2. 在 Cursor 执行 `Extensions: Install from VSIX...`。

### 常用参数

```bash
# 只查看将安装哪个版本，不执行安装
npm run install:latest -- --dry-run

# 强制重装当前最新版本
npm run install:latest -- --force

# 指定轮询间隔（秒）
npm run install:latest -- --interval-sec 120

# 指定仓库（当 origin 不可用时）
npm run install:latest -- --repo owner/name

# 指定 Cursor CLI 路径（当 cursor 命令不在 PATH 时）
npm run install:latest -- --cursor-bin /path/to/cursor
```

私有仓库建议设置：

- `GH_TOKEN` 或 `GITHUB_TOKEN`（避免 API 限流并支持私有 Release）。

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
