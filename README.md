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

## 开发

```bash
npm install
npm run compile
npm test
```

在 Cursor/VS Code 中按 `F5` 启动 Extension Host 调试。

## 打包

```bash
npx @vscode/vsce package
```

默认会生成 `chapter-reader-<version>.vsix`。

## 安装到 Cursor

方式 1（命令行）：

```bash
cursor --install-extension chapter-reader-0.0.2.vsix --force
```

方式 2（界面）：

1. 打开命令面板
2. 执行 `Extensions: Install from VSIX...`
3. 选择打包后的 `.vsix`

`--force` 可覆盖已安装旧版本。

## 发布到 GitHub

远程仓库：

```bash
git@github.com:20205917/chapterReader.git
```
