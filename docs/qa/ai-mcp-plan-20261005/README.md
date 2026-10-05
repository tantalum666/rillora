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

## 初版远端与 CI 回执（Events 补充前）

- 实质正文提交：[`ffb9dfb024e1c1a12375788e930e1e221ff0009d`](https://github.com/tantalum666/rillora/commit/ffb9dfb024e1c1a12375788e930e1e221ff0009d)
- 在该不可变 commit 逐一读回六份文档，与准备正文逐字符一致；相对基线的 compare 只有上述六个 docs 路径
- 主计划：280 行、33,857 UTF-8 字节；SHA-256 `6c429d229f3a6a21268fd9523b56dfa8a2294afe9f69424781494221d2bfbec2`；Git blob `fa6778aec45c325fddf53420d0a8bbebaa73a14f`
- [Verify source #51](https://github.com/tantalum666/rillora/actions/runs/37245412500) 在该准确 SHA 终态 success；source、api、web-and-infrastructure 三个 job 全部 success
- 本条仅补最终回执，提交使用仓库 `[skip ci]` 惯例；不把回执提交说成重新跑过 CI，不改计划或运行代码
- 没有 PR、合并、部署、Auth0 配置、凭据创建、数据授权或公开目录提交；原 strict-review、Web 验收与 main 分支未被本任务移动

CI 验证的是既有源码/出版保护与本次文档保存兼容性，不证明 AI 功能已实现。
新 AI 功能单测、合成/真实 OAuth、MCP Inspector、生产浏览器、部署和目录验证全部未执行。
没有借用 Web 验收分支的 CI50 或旧 CI48 作为本次新提交结果。

## October5 MCP Events 增补：文档范围与验收记录

- Owner 提供 [MCP Events 官方页面](https://developers.openai.com/plugins/build/mcp-events)并要求补上；只扩充既有规划，不执行 Events 运行功能
- 本次开始时原文档分支准确 head 为 `554575405f8bb10bb8041fe02f473221184f8ed5`，通过分支列表与文件 SHA 重新核对
- strict-review 已有后续提交，Web/iOS 本地化也在独立分支；本次没有合并它们，不把原计划的固定源码映射当成最新实现 head
- 新增计划第 15 节、P1E/C3E、官方来源 O9，以及前文任意 webhook 禁令中狭窄的已认证协议 callback 例外
- 同步本分支 handoff 的提案说明、append-only journey 与本 QA；不新增产品实现批准或替换原决策，因此无需增加运行时决策条目
- 持续标记 PROPOSAL/NOT IMPLEMENTED；新增 EVT-01–12 仍为 TODO，不把协议文档阅读或 CI 当成 Events 已运行
- 逐项检查真实语义：MCP 2.0/2026-07-28、受支持客户端、draft 参考标签、Rillora 时钟、连接权限/撤销队列、最小 opaque payload、challenge/Standard Webhooks/SSRF、2xx 与任务完成区别、410/413 不重试、重放可选、乱序与循环防护
- 独立核对完成：澄清 outbox 与业务状态必须在同一事务内提交，避免提交后记录的丢事件窗口；P3 显式说明 P1E 可选，只有公开 Events 才新增其验收门
- 本次仅继续同一文档工作，沿用初版聚焦源码映射；没有新声称全库重读/代码验收，没有读取或生成凭据、callback capability、私钥、真实数据
- 中间逐文件保存提交标记 `[skip ci]`；最后正文/QA 提交允许原 Verify source 执行。准确 SHA 的远端回读与 CI 终态另在下方追加，不复用初版 CI51

### Events 增补最终回执

待实际 Git 提交、不可变正文回读和本次 CI 终态后记录；未完成前不把这里当成功证明。
