# AI/MCP 计划：本轮文档 QA

Status: DOCUMENTATION REVIEW / NO RUNTIME IMPLEMENTATION  
Last updated: 2026-10-05 (Asia/Hong_Kong)

## 授权与分支

- Owner 要求整理未来 AI/MCP 方案并推到 Git；本轮不实施运行功能
- 从已远端核对的 `codex/strict-review-20261002` / `2cc95f77c1279bdad43547b7e58a8faca9da7a93` 创建 `codex/ai-mcp-plan-20261005`
- [主要交付](../../architecture/ai-mcp-plan-20261005.md)全部新接口/任务为 PROPOSAL/TODO；没有新产品可用性声明
- 未合并 Web 验收分支；只引用其已验证固定文档链接

## 读取与证据范围

本轮延续此前同题官方研究与只读源码映射，不是重新开启全项目代码审查。
聚焦读取根 AGENTS、产品当前锁定项/Authority Map、完整现行 handoff、decision/journey 最新相关记录、
完整 Git/source-control 与 collaboration 入口、分享/导出合同及计划所引源码。
保留原审查中 184 Markdown/686 source 的历史记录，不冒称本轮重新完整阅读或重跑它们。
未读取真实数据库、凭据、会话或原始加密归档；生成证据镜像、依赖与历史二进制不进入本轮检查。
未来实际修改产品/工程实现前，按当时 AGENTS 完成必要阅读与实施验收。

官方页面在 2026-10-04 UTC / 2026-10-05 Hong Kong 的同次研究中检索并实际打开；
计划第 13 节保留直接来源。规则会变化，实施/提交前必须重新核验。

## 文档变更清单

1. 新增 `docs/architecture/ai-mcp-plan-20261005.md`
2. `docs/product.md` 仅增加提案路由、更新日期，不修改已锁定产品决定
3. `docs/handoff.md` 仅加文档提案说明、更新日期，保留真实核心验收与唯一下一步
4. `docs/decision-log.md` 追加 Owner 文档/Git 范围；技术细节标记 PROVISIONAL
5. `docs/journey/PROJECT_JOURNEY.md` 追加目标、研究、判断变化、结果与未完成项
6. 新增本 QA 记录；后续远端/CI 回执为同目录文档证据

没有修改 `apps/`、`infra/`、`tools/`、`config/`、迁移、工作流、collaboration 历史清单或加密归档。
本 QA 采用已有 `docs/qa/` 直接可读文档路线，不生成截图/运行证据，不将忽略的 output 文件误报为远端交付。

## 已做的文档检查

- 基线原文保留式更新；decision/journey 只追加新段并改头部日期；handoff 保留一个 Single next step
- 九条主要新文档相对链接和全部固定基线源码路径，经已远端读取的 Git 树检查，无缺失目标
- 独立文档复核完成，补入 production-review allowlist 不可绕过，以及幂等回执返回前当前连接/grant 重新授权与投影的专项用例
- 人工核对提案/实现区别、导出 preview 副作用、draft 与真实 Matter 写入区别、指南登录限制、AI 独立同意、加密与外部复制边界
- 不新增账户邮箱、真实密钥、token、恢复钥匙、能力链接或操作性个人信息；原 handoff 既有内容不重新扩散到计划
- 首次批量 Git tree 请求未返回可确认结果；回读确认目标分支仍在原基线后，改用逐文件 Contents API 提交。未移动其他分支、无强推/合并
- 中间文档保存提交使用仓库已有 `[skip ci]` 惯例；本条完成文档提交不加跳过标记，允许 Verify source 验证汇总后的全部文档状态

## 待最终回执记录

提交后按不可变 commit 读回正文并逐字符比较；核对累计只改文档。
本次普通提交触发的 Verify source 跟进至终态，CI 只验证既有源码/出版保护，
不证明 AI 功能已实现。最终纯回执提交可以沿用 `[skip ci]` 并明确标记。

新功能单测、合成/真实 OAuth、MCP Inspector、生产浏览器、部署和目录验证全部未执行。
不得借用 Web 验收分支的 CI50 或旧 CI48 作为本次新提交结果。
