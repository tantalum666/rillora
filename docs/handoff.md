# Rillora 当前交接

Status: AI NEXT-VERSION PLAN / WEB LIVE / APPLE WAITING FOR REVIEW / NO NEW RUNTIME
Last updated: 2026-10-15 (Asia/Hong_Kong)

## 当前任务

Owner 要求审核期间继续开发，新能力放入下一版本，并让各主要 AI 更容易发现、推荐和使用 Rillora；不能只考虑两家。执行[跨平台 AI 发现与使用方案](architecture/ai-discovery-vnext-20261015.md)。当前交付是研究／方案与公开只读检查，尚未实现 MCP 或新的官网运行代码。

下一版本工作位于原项目目录 /Users/tantalum/Documents/电子遗嘱app，分支 codex/ai-discovery-vnext-20261015，起点 fec1ad3bcd97984768eed8b2fd95a86ac4f01f35。发布工作树 /Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app 和原发布分支保持。旧交接已存为 [HISTORICAL](handoff-history-20261015-before-ai-vnext.md)。本轮 QA 为 output/qa/rillora-ai-discovery-20261015，可读原件见[验证记录](../collaboration/verification/ai-discovery-20261015/README.md)。

## 已完成

- 完整复用旧 385 行 AI/MCP 提案，核对跨平台官方接入、搜索发现及目录差异；补足 Gemini、Perplexity、Copilot、Grok、开发者客户端和其他消费 AI 的评估范围。
- 公开官网四次匿名 GET 显示：原始 HTML 没有正文，首页／中文价格同一壳层，robots／sitemap 为 404；这些是待改进项，不是完全未索引或所有 AI 无法读取的证明。
- 建立下一版阶段及 14 组双语评估问题（28 个语言变体）；尚未运行模型测评、建立真实连接或提交目录。
- 先前发布完成证据保留：Web 源码 40c76496f／CI153、117 资源线上一致；普通 Web 年付已开放。Apple 提交 6537a10c-38f2-425e-8b8e-c76e5fa730b1 的 App1.0(14)／年订阅／群组于香港 October15 09:49 等待审核。archive39 已独立远端认证，收尾 fec1ad3bc／CI155 通过；本轮不重做。

## 证据边界与外部等待

平台支持 MCP 不等于 Rillora 已兼容；源码方案、目录批准、发布、搜索引用和增长分别验收。本轮未部署、未读取真实事项给 AI、未创建凭据、未花模型 API 额度。既有 USD88.99 Web 年费、Apple USD119.99／HKD888、数据、收费开关和 FanPass 保持。

Apple 当前审核独立等待，手动发布保持。若收到具体反馈，按原[提审合同](app-review-preflight-20261014.md)处理；获批后处理简化购买、手动发布，再验 Production 授权／通知／对账后开放两条 Apple 普通新购。Sandbox 审核登记当前至 October27，实际延后时仅维护原范围。Auth0 外壳继续暂缓；Owner 已停止余下真机检查，不重新要求参与；不发 TestFlight。

## 唯一下一步

在下一版分支实施 D0 公开官网候选：预渲染真实正文、逐页双语元数据、可达 robots／sitemap，并验证现有视觉及平台指南登录边界。先形成可审查候选，再独立安排发布；不更换正在审核的 App14 或部署未验收 MCP。
