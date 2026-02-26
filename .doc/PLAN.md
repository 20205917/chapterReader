# Cursor 摸鱼小说阅读插件实施计划（在原计划基础上仅补充文档落盘规则）

## Summary
保持上一版计划的全部功能范围与技术方向不变。  
仅新增一条实施前置动作：开始编码前，先将计划全文保存到仓库 `.doc/` 目录下的 Markdown 文档中，作为项目基线文档。

## 实施前置动作（新增）
1. 创建目录 `.doc/`（若不存在）。
2. 保存计划全文到 `.doc/implementation-plan.md`（Markdown）。
3. 后续所有 AI 生成的“代码无关文档”统一放在 `.doc/` 下，使用 `.md` 格式。

## 原计划保持不变（执行顺序）
1. M1：插件骨架与本地阅读闭环
- 左侧独立视图、书架页、阅读页框架。
- TXT 导入、目录识别、进度持久化、基础快捷键。
2. M2：在线阅读闭环
- 白名单站点解析框架。
- 至少 2 个站点支持，解析失败明确提示“不支持”。
- 章节缓存与清理策略。
3. M3：体验完善
- EPUB 支持、阅读设置（字体/行高/主题）、缓存管理可视化。
- 稳定性与回归修复。
4. M4：后续增强（暂不进入 MVP）
- 伪装模式相关能力单独评审后立项。

## Public APIs / Interfaces / Types
1. 命令接口
- `chapterReader.open`
- `chapterReader.addOnlineBook`
- `chapterReader.importLocalBook`
- `chapterReader.nextChapter`
- `chapterReader.prevChapter`
- `chapterReader.clearCache`
2. 核心类型
- `Book`
- `Chapter`
- `ReadingProgress`
- `CacheEntry`
- `ParserResult`
- `ParserError`
3. 解析器接口
- `canHandle(url): boolean`
- `parseBook(url): Promise<ParserResult>`
- `parseChapter(chapterUrl): Promise<string>`

## Test Cases & Scenarios
1. 在线
- 白名单站点解析成功（>=2 站点）。
- 非支持站点返回明确错误提示，不崩溃。
2. 本地
- TXT/EPUB 导入、目录、阅读、续读正确。
- 异常文件（编码/损坏）有可理解错误。
3. 状态与缓存
- 重启 Cursor 后恢复进度。
- 缓存命中加速明显，超阈值淘汰生效。
4. 交互
- 快捷键翻页/切章可用，冲突场景有回退提示。

## Assumptions & Defaults
1. 技术栈默认 `TypeScript + VS Code Extension API + Webview`。
2. 仅本地存储，不做云同步。
3. 在线解析为白名单 + 内置规则，用户不可编辑规则。
4. 合规边界为公开可访问页面，不处理登录态与付费绕过。
5. 伪装模式暂不纳入当前实施批次。
