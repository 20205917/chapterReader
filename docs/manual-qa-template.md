# Chapter Reader 人工验收清单模板

用于所有触发人工验收的交付任务。Codex 在交付末尾必须输出与本模板一致的结构。

## 基本信息

- 版本：`{{version}}`
- Tag：`{{tag}}`
- Release：`{{release_url}}`
- 任务摘要：{{summary}}

## 操作步骤

1. 从上述 GitHub Release 下载对应 `.vsix`。
2. 在本地 Cursor 中执行 `Extensions: Install from VSIX...`。
3. 安装完成后重载 Cursor，并打开 `Chapter Reader`。
4. 验证本次变更点：{{summary}}
5. 回归检查：
   - 阅读器可以正常打开。
   - 章节切换正常。
   - 本地导入与在线导入未出现明显回归。

## 验收结果

- 是否通过：`[ ] 通过` / `[ ] 不通过`
- 备注：________________
