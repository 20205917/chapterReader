# Chapter Reader 云端 Codex 开发工作流

## 1. 目标与角色

- 项目定位：个人使用的 Cursor 阅读插件。
- 流程目标：快速交付、闭环验证、结果可追溯，不引入团队型 PR / CI 负担。
- 角色分工：
  - 你负责：提出需求、确认较大方案、决定是否提升 `major` 版本、做必要的本地 Cursor 验收。
  - Codex 负责：仓库勘察、方案 Draft、实现、测试、版本判断、打包、GitHub Release、旧版本清理、交付总结。

## 2. 默认执行规则

### 2.1 任务入口

- 默认由聊天直接下达需求、问题或目标。
- Codex 收到任务后，先做非变更性勘察，确认影响面、现状和风险。

### 2.2 Draft 触发条件

- 满足以下任一条件，必须先给 Draft，待你明确确认后再实现：
  - 新增用户可感知能力。
  - 修改阅读器 UI、webview 行为、命令、快捷键、扩展入口或安装体验。
  - 涉及多个子系统，或需要跨文件重构。
  - 需要调整数据结构、存储格式或对外行为约定。
- 可直接实现的明显小修：
  - 文案、注释、轻微样式或低风险交互修正。
  - 范围清晰的单点 bug 修复。
  - 不改变行为的测试补强或内部重构。

### 2.3 代码流转

- 默认直接在 `main` 开发，不建立常驻分支。
- 每个完成的代码任务对应一次独立交付，默认形成：
  - 1 个版本号
  - 1 个 commit
  - 1 个 GitHub Release
- 纯流程文档或规则更新不发版，但仍应记录到 [`docs/ai-worklog.md`](./ai-worklog.md)。

### 2.4 失败阻断

- 只要编译、测试、打包、发布任一步失败，任务不能算完成。
- Codex 应优先在当前任务内修复；无法修复时，明确说明 blocker、影响范围和下一步建议。

## 3. 交付标准

### 3.1 自动验证基线

- 每个代码任务至少执行：
  - `npm run compile`
  - `npm test`
- 每个需要版本交付的代码任务还必须执行：
  - `npx @vscode/vsce package`
- 纯流程文档或规则任务跳过打包与发版。
- 验证未通过，不允许进入版本、Release 和交付阶段。

### 3.2 人工验收触发条件

- 满足以下任一条件，Codex 完成交付后必须附带本地安装验证清单：
  - 改动阅读器 UI / webview 行为。
  - 改动命令、快捷键、扩展入口、安装体验。
  - 改动 `src/extension.ts`、`src/webview/html.ts`、`package.json` 中与交互或打包相关的部分。
- 人工验收不是默认 pre-push 门禁。Codex 先完成实现、验证、打包、push 和 Release，再由你本地验证。

### 3.3 交付输出格式

- 每次阶段性交付统一使用：
  - `Done`
  - `Decision`
  - `Next`

## 4. 版本、打包与 Release

### 4.1 版本规则

- 版本格式固定为 `X.Y.Z`，Git tag 固定为 `vX.Y.Z`。
- `.vsix` 文件名固定为 `chapter-reader-X.Y.Z.vsix`。
- 当前仓库历史版本 `0.0.3` 视为旧阶段版本；首次按本流程发版时，从 `1.0.0` 开始。
- `major`：
  - 仅在你明确要求时递增。
- `minor`：
  - 由 Codex 用于新增用户可感知能力。
  - 典型场景：新增命令、阅读器行为增强、安装/交互流程扩展。
- `patch`：
  - 由 Codex 用于修复、解析兼容、性能调整、重构、测试补强、小型体验修正。
  - 当 `minor` / `patch` 边界不清晰时，默认使用 `patch`。

### 4.2 打包规则

- 任何影响插件交付内容的代码任务都必须打包。
- `.vsix` 不进入 git，继续由 `.gitignore` 排除。
- 纯流程文档或规则更新不打包、不发版。

### 4.3 Git 与发布规则

- 代码任务验证通过后，Codex 按顺序执行：
  1. 更新 `package.json` 版本号。
  2. 记录本次任务到 [`docs/ai-worklog.md`](./ai-worklog.md)。
  3. 生成 `.vsix`。
  4. 创建 commit。
  5. 打 `vX.Y.Z` tag。
  6. push `main` 与 tag 到 `origin`。
  7. 创建 GitHub Release，并上传 `.vsix` 资产。
- Release tag、`package.json` 版本号、`.vsix` 文件名必须一致。
- 推荐入口：
  - `npm run release:task -- --summary "修复章节跳转" --bump patch`
  - `npm run release:task -- --summary "新增在线书源管理" --bump minor --manual-qa yes`
  - 首次按新流程发版时，使用 `npm run release:task -- --summary "首个正式版本" --version 1.0.0`
- 运行脚本前提：
  - 本地代码修改已完成。
  - `gh` 已安装并完成 GitHub 登录。

### 4.4 Release 保留策略

- 默认仅保留最近 3 个任务版本的 GitHub Release 与资产。
- 你明确要求长期保留的版本，采用 Release 标题前缀 `[keep]` 标记，不参与清理。
- Codex 在创建新 Release 后，清理超出保留数量的非 `[keep]` 旧 Release。

## 5. 人工验收清单

- 当任务触发人工验收时，Codex 在交付末尾必须输出固定模板，模板文件为 [`docs/manual-qa-template.md`](./manual-qa-template.md)。
- 该模板至少包含：
  1. 版本、tag、Release 链接、任务摘要。
  2. 从 GitHub Release 下载并安装 `.vsix` 的步骤。
  3. 本次变更点验证。
  4. 阅读器打开、章节切换、本地/在线导入的回归检查。
  5. 最终是否通过与备注。
- 使用 `npm run release:task -- --manual-qa yes ...` 时，脚本在完成发布后应直接输出该模板对应的验收清单。

## 6. 工作记录

- 所有已交付任务都要追加记录到 [`docs/ai-worklog.md`](./ai-worklog.md)。
- 每条记录固定字段：
  - 日期
  - 任务摘要
  - 版本号
  - 验证命令结果
  - Release 链接
  - commit hash
  - 是否需要人工验收
  - 备注
- 若任务不发版，对应字段使用 `N/A`，但仍保留记录。
- 若工作记录与发版内容位于同一提交中，`Commit Hash` 可以暂记为 `待提交`；发布身份以 `vX.Y.Z` tag 为准。

## 7. 当前阶段约束

- 当前阶段不额外引入 GitHub Actions。
- 云端 Codex 本地执行的编译、测试、打包与 Release 结果，就是本项目的交付门槛。
- 本文档是后续 Codex 执行本项目开发流程的正式依据；README 只保留简短入口，不重复完整流程。

## 8. 本地自动安装（跨平台）

- 目标：你本地无需手动下载 `.vsix`，直接自动拉取并安装最新 Release。
- 脚本：[`scripts/install-latest-release.js`](../scripts/install-latest-release.js)
- 运行方式：
  - 一次执行：`npm run install:latest`
  - 轮询执行：`npm run install:latest:watch`
- 默认行为：
  - 自动识别仓库 `origin` 对应的 GitHub 仓库。
  - 拉取最新非预发布 Release。
  - 下载匹配 `chapter-reader-*.vsix` 的资产。
  - 执行 `cursor --install-extension <vsix> --force`。
  - 记录最近安装状态，避免重复安装同一版本。
- 常用参数：
  - `--repo owner/name`：显式指定仓库。
  - `--interval-sec 300`：按秒轮询。
  - `--force`：强制重装。
  - `--dry-run`：仅打印目标版本与资产，不安装。
  - `--cursor-bin /path/to/cursor`：显式指定 Cursor CLI。
- 私有仓库建议配置：`GH_TOKEN` 或 `GITHUB_TOKEN`。
- 首次使用前提：仓库中至少已有一个可用 GitHub Release（含 `.vsix` 资产）。
