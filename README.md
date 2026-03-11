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

## AI 开发流程

本项目后续由云端 Codex 按统一流程开发、验证、打包与发布。正式流程文档见 [`docs/ai-workflow.md`](docs/ai-workflow.md)，轻量交付记录见 [`docs/ai-worklog.md`](docs/ai-worklog.md)。

如需安装最新构建，请从 GitHub Release 下载对应 `.vsix`，再在 Cursor 中执行 `Extensions: Install from VSIX...`。

推荐直接自动安装：

```bash
npm run install:latest
```

如需持续轮询并自动更新：

```bash
npm run install:latest:watch
```
