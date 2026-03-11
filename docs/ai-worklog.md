# Chapter Reader AI 工作记录

## 记录规则

- 本文件采用追加式维护，不回写历史记录。
- 每个已交付任务追加一条记录。
- 纯文档或规则任务不发版时，`版本号`、`Release 链接` 可填写 `N/A`。
- 固定字段如下：
  - 日期
  - 任务摘要
  - 版本号
  - 验证命令结果
  - Release 链接
  - Commit Hash
  - 人工验收
  - 备注
- 若该记录与对应发版内容落在同一提交中，`Commit Hash` 允许暂记为 `待提交`，以 tag 作为最终锚点。

## 2026-03-10 - 云端 Codex 工作流固化

- 日期：2026-03-10
- 任务摘要：新增正式工作流文档、AI 工作记录模板与发布脚本，并在 README 增加流程入口。
- 版本号：N/A
- 验证命令结果：`node --check scripts/release-task.js`、`node scripts/release-task.js --help`、`npm run compile`、`npm test`
- Release 链接：N/A
- Commit Hash：待提交
- 人工验收：否
- 备注：后续代码任务按 `docs/ai-workflow.md` 执行；本次未执行真实 Release，原因是当前环境缺少 `gh`。

## 2026-03-10 - 固化人工验收模板

- 日期：2026-03-10
- 任务摘要：新增固定人工验收模板，并让发布脚本在 `--manual-qa yes` 时自动输出同一格式。
- 版本号：N/A
- 验证命令结果：`node --check scripts/release-task.js`、模板占位符检查、`npm run compile`、`npm test`
- Release 链接：N/A
- Commit Hash：待提交
- 人工验收：否
- 备注：本次为流程增强任务，不发版。

## 2026-03-11 - 新增跨平台自动安装脚本

- 日期：2026-03-11
- 任务摘要：新增跨平台脚本，自动下载并安装最新 Release 的 `.vsix` 到本地 Cursor，并支持轮询模式。
- 版本号：N/A
- 验证命令结果：`node --check scripts/install-latest-release.js`、`node scripts/install-latest-release.js --help`、`npm run install:latest -- --dry-run`（当前无 Release，返回预期错误）、`npm run compile`、`npm test`
- Release 链接：N/A
- Commit Hash：待提交
- 人工验收：否
- 备注：本次为本地工具链增强，不发版。

## 2026-03-11 - 完善 README 使用说明

- 日期：2026-03-11
- 任务摘要：重构 README，补齐自动安装、轮询更新、手动兜底、参数示例、开发与发布命令说明。
- 版本号：N/A
- 验证命令结果：`README.md` 命令与脚本参数人工核对通过
- Release 链接：N/A
- Commit Hash：待提交
- 人工验收：否
- 备注：本次为文档优化任务，不发版。
