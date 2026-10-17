# Rillora 下一版本：跨平台 AI 发现、推荐与使用

Role: next-version product and distribution plan
Authority scope: public discovery, cross-platform integration priorities and measurable acceptance
Status: PUBLIC GEO LIVE / SYNTHETIC MCP HOSTED / CUSTOMER INTEGRATION AND DIRECTORY PENDING
Last updated: 2026-10-18 (Asia/Hong_Kong)
Source baseline: fec1ad3bcd97984768eed8b2fd95a86ac4f01f35
Working branch: codex/ai-discovery-vnext-20261015

## October18 当前营销复核

[完整复核](../marketing/readiness-audit-20261018.md)与[获客计划](../marketing/acquisition-plan-20261018.md)为当前状态入口。官网28语言页／6篇双语文章已发布；长期合成候选及Claude Code、Cursor、Qwen Code协议闭环通过。Codex／Gemini此前通过的是已清理的临时环境，不能声称当前长期host已注册。Google地图失败尚未关闭，生成式搜索实际设置为包含。下方October15—16的计划与检查点保留日期；客户MCP、模型任务、目录及增长仍待独立证据。

## 1. Owner 方向与交付边界

Owner 要求在当前 Apple 审核期间继续开发，新增能力放入下一版本，不打断现有审核；目标是让用户在 Codex、ChatGPT、Claude 以及其他 AI 中谈到数字遗产时，更容易发现、推荐和使用 Rillora。Owner 随后明确不能只考虑两家 AI。

Owner 随后明确按本方案实施并推 GitHub。现已完成官网候选、最小只读 MCP、独立选择授权与平台配置生成器，具体范围与验证见[实施记录](ai-discovery-implementation-20261015.md)。下文规划中尚未实施的工具、真实连接、目录批准及增长指标保持独立，不据此宣称已上线。沿用[原 AI/MCP 安全与工程方案](ai-mcp-plan-20261005.md)的边界。

App 1.0(14) 的既有审核、手动发布和审核账号服务继续保留；新分支不替换构建、不分发 TestFlight。既有生产身份、真实数据、定价、收费开关和 FanPass 不在本轮修改范围。Apple 后续发布次序仍见 [提审记录](../app-review-preflight-20261014.md)。

## 2. 三个目标分别建设

| 用户场景 | 所需能力 | 不能由此推出的结论 |
| --- | --- | --- |
| 未认识 Rillora，问如何整理数字遗产或选择工具 | 可抓取的公开内容、准确产品事实、独立可信引用、搜索可见性；通常称 SEO/GEO/AEO | 无法保证某次回答出现品牌、排名第一，或不用联网的模型立即知道最新产品 |
| 在 AI 的工具目录中找到 Rillora 并安装 | 平台目录资料、准确适用场景、审核、发布、支持与示例 | 上架或进入 MCP Registry 不等于默认安装、官方背书或无条件推荐 |
| 已连接用户让 AI 检查自己选定事项还缺什么 | 委托授权、MCP 工具、最小字段、撤销、可靠错误行为 | 谈到数字遗产不等于授权读取账号；MCP 也不把产品自动加入模型训练或所有人的工具集合 |

推荐目标应是“在适合的需求中被准确发现，并在连接后可靠完成任务”。用户只是问通用知识时，应先回答知识；不为提高调用量强行读私密事项。

## 3. October15 改造前的官网缺口（历史基线）

本轮仅对公开 www 域名做四个匿名 HTTP GET，并对照活动源码；[检查回执](../../collaboration/verification/ai-discovery-20261015/public-http-check.json)保存请求、结果和证据限制。

- 首页和中文价格地址返回同一份 1,334 字节 HTML；root 节点为空，正文由浏览器 JavaScript 生成。原始响应未含 canonical、hreflang 或 JSON-LD。
- robots.txt 与 sitemap.xml 返回 404。缺少 robots.txt 不等于禁止抓取，缺少 sitemap 也不是索引必然失败；但目前没有明确的公共抓取策略和站点地图。
- [public.html](../../apps/web/public.html) 和 [公开路由](../../apps/web/worker/public-router.js)与实测一致：多个公开页面都映射同一个 HTML，路由白名单没有上述发现文件。只添加两个文件而不更新发布路由仍会返回 404。
- [公开构建脚本](../../apps/web/scripts/prepare-public-build.mjs)生成资源指纹与访问校验；后续改造应延续这套发布核对，而非替换整套 UI。

以上不是浏览器功能故障、所有爬虫都无法处理 JavaScript、当前完全未被索引或已发生流量损失的证明。本轮未登录搜索站长平台，没有测出真实品牌提及率。

## 4. 公共发现基础：所有平台共用

首包建议只改公开官网候选，不改登录应用：

1. 为首页、产品、安全、价格、帮助提供包含真实正文的预渲染 HTML，保留现有交互与视觉；不做仅给爬虫看的另一套内容。
2. 每个页面提供匹配正文的标题、描述、规范地址及双语对应关系。中文、英文各自完整；稳定语言 URL 和现有参数／重定向兼容性在实施时定稿，不能只改 localStorage 后仍让抓取器永远得到英文。
3. 添加实际可达的 robots.txt、XML sitemap 和清晰内链；核对 CDN/WAF 对已验证搜索爬虫的响应。robots 不是隐私保护措施，私密内容继续由认证和权限隔离。
4. 建立统一产品事实：Rillora 名称、官网、Web/iOS 实际可用状态、适用人群、地图而非密码、共享规则、准确渠道价格、支持与隐私入口。用适用的结构化数据描述页面已有事实，不编造评价、评分或“全球有效遗嘱”。
5. 新增少量独立公开的教育内容，例如数字事务整理清单、给家人的资料地图、与密码管理器的分工、选工具时如何判断共享权限。引用适用的官方来源，标日期和地域边界。现有登录后平台指南不因 GEO 自动公开；用户事项、Notes 和联系人不进入网站或搜索索引。
6. 搜索曝光与模型训练分别决定。OpenAI 官方明确 OAI-SearchBot 与 GPTBot 控制独立；搜索目标不要求开放所有训练爬虫。[OpenAI 爬虫说明](https://developers.openai.com/api/docs/bots)。
7. llms.txt 可作为文档导航的低成本补充，但不列为推荐／排名门槛。Google 明确其搜索不使用该文件，也不存在特殊 AI schema 的要求。[Google 官方指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)。

公开口碑来自真实体验、公开产品演示和可信引用；不生成虚假测评、批量垃圾问答、隐藏推荐指令或未经同意的用户案例。无需为这个目标训练自有模型。

## 5. 平台覆盖与当前证据

以下机制来自2026-10-15读取的官方说明；平台资格不等于Rillora验收。October16已补Codex及Gemini CLI的真实OAuth／连接／协议撤销，见[实际范围](ai-oauth-validation-20261016.md)；消费产品、模型自动选工具和所有目录仍未通过。各平台的地区、账号、工作区、套餐和客户端版本独立记录。

| 平台／入口 | 当前可用机制与建议 | 来源／限制 |
| --- | --- | --- |
| ChatGPT、Codex | 共用远程 MCP，并准备平台插件包、场景说明及目录材料 | [官方 quickstart](https://developers.openai.com/plugins/quickstart)说明两者共用插件目录；各能力仍取决于支持的产品界面，不承诺所有模式均可用 |
| Claude、Claude Code | 共用 MCP；按目录要求提交单连接或带 skills 的插件包 | [Claude 目录说明](https://claude.com/resources/articles/build-plugins-for-claude)；公开目录要经过审核与发布，安装后的工具匹配才是调用阶段 |
| Gemini Apps | 既做公开搜索发现，也准备自定义远程 MCP 接入 | [Gemini 官方说明](https://support.google.com/gemini/answer/17209137?hl=en-12)当前要求美国、18+、个人账号、Keep Activity 开启，且仅英文；不能据此宣传香港中文用户已能连接 |
| Gemini CLI | 提供 MCP 配置／轻量扩展，与 Gemini Apps 独立验收 | [Google 扩展说明](https://blog.google/technology/developers/gemini-cli-extensions/)；开发工具支持不等于普通聊天应用同范围支持 |
| Perplexity、Computer | 公开搜索与自定义远程连接两条路径并行 | [远程连接文档](https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors)支持 HTTPS、OAuth、Streamable HTTP；自定义接入不等于进入精选目录 |
| Microsoft Copilot | 消费搜索侧做 Bing 索引／引用；Microsoft 365 企业侧另走 MCP／agent／connector 包装 | [Microsoft 365 文档](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/overview-plugins)中的 declarative-agent actions 不能泛化成所有消费版 Copilot 的开放插件市场 |
| Grok | 准备同一远程 MCP 的自定义连接验收 | [官方 connectors](https://docs.x.ai/grok/connectors)支持添加 URL 并认证；公开 catalog 收录条件本轮未验证 |
| Cursor、Qwen Code、Kimi Code 等开发者客户端 | 按各自 OAuth、传输与工具选择差异提供安装说明，共用核心服务 | [Cursor](https://prod.cursor.com/docs/mcp)、[Qwen Code](https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/)、[Kimi Code](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html)；这不证明对应品牌的普通消费聊天端支持相同功能 |
| Mistral、Meta AI、DeepSeek、豆包、腾讯元宝、Kimi／通义消费端等 | 纳入公开内容与中英文发现评估；平台适配前再核对目标客户端的官方外部接入与目录路径 | 本轮未完成这些消费端的统一资格核验，不标成“不支持”或“已兼容”，也不为未确认入口先造独立后端 |
| 开放 MCP 生态及未来客户端 | 成熟后登记官方 MCP Registry，并提供清楚的接入页和能力说明 | [Registry 文档](https://modelcontextprotocol.io/registry/about)定位为可被下游目录使用的元数据源，当前标 preview；登记不替代平台安全审核，不要求公开 Rillora 私有业务源码 |

推广与安装材料可以按平台不同；权限判断、数据投影和业务事务必须共用。平台不兼容时明确限制或暂不接入，不能为了覆盖率降级认证。

## 6. 下一版 MCP 的最小有用范围

沿用原提案的只读优先路线，不把全部 REST API 转成工具。首个闭环建议：用户连接 Rillora，明确选择事项，AI 查看选定事项摘要和待补字段，返回可核对的结果及应用入口。

- 只读工具：选定事项摘要、选定范围内的缺项、符合原访问条件的官方指引。细节工具与 scopes 继续见原方案第 4 节，实施前对最新源码重新映射。
- 后续写入：把对话整理成独立建议草稿，在 Rillora 里确认后保存。草稿本身也是写入；不因叫“预览”就绕过同意或幂等检查。
- 暂不加入 Events、复杂聊天 UI、整库检索、自动分享／删除／导出、支付／退款和身后资料释放。先交付一个完整且有实际价值的闭环。
- AI 同意与普通登录／共享同意分开；仅披露选定数据，按连接可撤销。第一版不返回原始 Notes、秘密、恢复钥匙、完整备份或联系人邮箱。
- 工具说明应准确写清“何时用、何时不该用”，测试直接点名、没有点名但意图适合、以及不应该调用的请求。[OpenAI metadata 官方指引](https://developers.openai.com/plugins/guides/optimize-metadata)。
- 外部 AI 已负责自然语言推理，纯 MCP 服务无需再转调一个自有大模型。服务器、身份与日志仍有成本；后续OAuth验收创建过专用临时客户端／合成身份，已清理，未调用付费模型。原研究阶段没有创建凭据，不能用该历史状态覆盖后续实际验收。

## 7. 可独立交付的顺序

| 顺序 | 工程交付 | 完成证据 |
| --- | --- | --- |
| D0 公共发现 | 官网预渲染、路由级双语元数据、发现文件、事实一致性；首批公开内容大纲 | 无 JS 也有正文；每语言／页面 HTML 正确；发现文件与线上路由一致；现有 UI 和登录指南跳转保持 |
| D1 公共内容与基线 | 少量高质量双语内容；核对已有 Search Console／Bing Webmaster 状态后复用；建立匿名发现评估 | 页面已可索引／被索引与 AI 实际提及分别记录，不能用 sitemap 提交代替 |
| I0 MCP 契约 | 将旧 P0/C0 更新到当前安全修复后的源码，最小 actor／grant／DTO／工具 schema | 明确字段必要性和跨用户负例，第一方会话不直接借给第三方 |
| I1 只读私测 | 委托授权、选择范围、撤销、MCP 服务，先合成账号 | 选用不同供应商的两个真实客户端验证端到端；协议兼容不能代替授权／撤销验证 |
| I2 跨平台接入与目录 | 在同一服务上完成其他目标客户端；分别准备目录材料／安装指南 | 各平台 connected、reviewed、published、discoverable 单独记账；通过一家不代表全部完成 |
| I3 受控建议 | 独立草稿和可信确认写入 | 精确差异、当前权限、版本冲突及幂等通过；不扩权自动分享 |

D0、D1 可在独立官网候选进行；I0、I1 使用隔离环境，不触及正在审核版本的生产依赖。公开网站上线和新 MCP 上线是后续独立交付，不用更换当前 App Review 构建。下一版本号尚未选定。

## 8. 怎么判断真的有效

保留 [双语评估种子](../../collaboration/verification/ai-discovery-20261015/evaluation-seed.json)，本轮只定义问题，不伪造任何模型回答或分数。

- **公共发现**：新会话／未连接 Rillora；区分不点名的需求问题与点名品牌的事实核验。按日期、实际平台／模型、地区、语言、联网状态记录提及、推荐、引用 URL、价格／功能准确性和是否需要购买意图。不能从一次测试推断推荐率。
- **连接后使用**：合成账号＋已选择范围；记录连接成功、正确工具选择、任务完成、拒绝越权和撤销后新请求拒绝。消费者入口与开发者入口分开，模型 API 结果不冒充聊天产品结果。
- **实际转化**：在现有隐私边界内看公开网站转介、注册、首次完成事项、连接后的有效使用；归因缺失记 unknown，不追踪私人事项正文或跨平台身份。未经新增同意不引入新的追踪 cookie。
- **官方指标**：Google Search Console 的可用搜索／AI 指标；[Bing AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)的引用次数与页面；插件目录自己的曝光／安装／搜索数据。引用次数不等于排名、推荐或付费用户。

不设无依据的“30 天必被推荐”或“覆盖所有 AI”承诺。发布完成、索引完成、模型引用和真实业务增长是四种不同结果。

## 9. 当前结果与下一步

研究阶段已完成：复用原385行提案、核对官方路径、检查公开站点、建立双语评估种子。官方OpenAI Docs MCP返回403后使用公开官方正文，无需Owner登录。随后按Owner明确指令实施20页公开HTML、两篇双语文章、两个只读工具、最多20事项的7天授权、撤销／恢复边界，以及五种客户端配置包；源代码和本地检查详见实施记录。

随后真实Auth0／Codex及Gemini CLI验收通过，选定事项读取与同一未过期令牌的撤销拒绝均通过；临时资源全部清理。653093e62／CI165三任务成功，archive42独立GitHub下载认证完成，具体边界见[OAuth记录](ai-oauth-validation-20261016.md)。没有自然语言模型调用或消费端等价证明。

[公开官网两阶段交付](public-discovery-rollout-20261016.md)完成：20双语页面及54文件实际匹配、浏览器语言切换正常；Google和Bing的所有权及站点地图提交完成。Google实际即时提取成功但常规地图报告仍失败／0已发现，Bing地图已Success并解析20网址；未证明全部页面收录或AI推荐。只更新独立www栈，不改变App14、生产API／数据库、定价／收费或FanPass。

[临时HTTPS闭环](ai-https-acceptance-20261016.md)已补齐合成Web选择、Codex真实OAuth、两个工具限定读取及同一未过期token撤销；资源已清理，Cookie与受限数据库就绪检查的实际问题已修。该October16时点未完成长期隔离托管；October17—18已完成合成长期候选。当前仍未完成客户环境、模型实际选工具、其他消费端／目录、索引与推荐效果。继续按[handoff](../handoff.md)唯一下一步推进，不重做已通过的本地矩阵、两客户端OAuth或官网部署。
