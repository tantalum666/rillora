# Rillora 营销准备复核：SEO、GEO、MCP 与插件

Status: HISTORICAL AUDIT / SUPERSEDED BY OCTOBER18 CUSTOMER DELIVERY
Last updated: 2026-10-18 (Asia/Hong_Kong)

Owner要求先完成已有工作，再完整复核已做SEO／GEO、MCP及各AI入口，转向低成本获客。这里是可宣传范围和缺口清单；不是流量、收入或目录通过证明。当前审核、正式API／数据、价格、收费、FanPass和TestFlight保持。

**当前状态入口：**下文保留October18较早时点的完整复核，不能作为部署后的现状。后续[正式MCP交付](../architecture/customer-mcp-20261018.md)已完成7客户端登记、客户授权入口、Codex实际模型调用／撤销和官方Registry active；[Google地图](../architecture/google-sitemap-20261018.md)已成功解析两种语言共28网址。下文“客户未就绪／Google无法读取／未登记Codex”等为已被取代的历史发现。消费端目录批准、文章收录、AI推荐和获客效果仍未由这些技术结果证明。

## 结论

官网已有真正可抓取的内容与技术基础，但还没有证明它带来了搜索用户或AI推荐。MCP有真实运行的合成环境及五种客户端的分阶段协议证据，尚不是可供普通客户安装的产品。营销优先使用已开放的Web价值，AI接入作为下一版小规模验证，不用“覆盖所有AI”宣传。

本轮重读当前内容、生成器、客户端登记和来源文档；沿用同一工作流已完成的逐文件部署、双语页面和OAuth验收，没有重复部署、支付、本人认证或真机工作。即时发现检查与旧验收分别记录。

## SEO／GEO 完整盘点

| 层面 | 已有证据 | 本轮判断与剩余工作 |
| --- | --- | --- |
| 公开内容 | 6个不同主题，各有完整中英文；28个规范语言网址，不是28篇文章 | 全部正文复核；不是批量同义词页面。后续优先具体使用案例和真实反馈，不为了数量扩页 |
| 无脚本抓取 | 发布产物含完整标题、正文、链接与FAQ | 沿用62文件实际交付证据；本轮没有再构建或部署官网 |
| 语言与重复地址 | 每页独立title／description、canonical、双向hreflang和x-default | 已核对生成代码和全部语言词条；旧无语言地址有规范链接，不能据此算新文章 |
| 抓取文件 | robots允许公开网站，sitemap含28网址；文章lastmod来自内容日期 | 账号、邀请及合成MCP没有进入地图；没有为了排名刷新日期 |
| 结构化信息 | Organization、WebSite、WebPage／CollectionPage、Article、Breadcrumb、ItemList | 对应可见正文；无虚构评价、评分或法律／安全认证。Article图片可作为后续展示优化，非当前索引故障依据 |
| 内容可信度 | 可见署名、真实核对日期、具体虚构例子、苹果／谷歌官方来源 | 6篇文章对应定义、清单、共享、平台安排、密码工具区别、选择工具；不保证访问、遗嘱效力或转移 |
| 站内入口 | 页脚文章目录、相关内容、产品／安全链接 | 遵守Owner决定，整理方法不回到主导航 |
| 分享预览 | 大图OG／Twitter预览、批准的品牌资产 | 已发布证据保持；不把图片预览当搜索排名证明 |
| Google地图 | 本轮实际详情：上次读取2026/10/18，无法读取，0已发现 | **仍开放**。此前代表文章与XML实时测试成功不能覆盖此失败；本轮没有再次提交。根因未确定，不能简单归因为等待或代码错误 |
| Google生成式搜索 | 本轮实际设置显示“生成式AI搜索：包含”；robots文件均有效，52抓取请求／过去90天 | 已纳入资格设置；52是抓取请求，不是用户、收录数或推荐数 |
| Bing地图 | 同日已取得Success、28网址、0错误／警告 | 沿用回执，不重复提交；收录与AI引用另记 |
| 排名／引用 | 已有双语评估种子，无可信的当前引用／转化基线 | 未测记unknown，不能写成0；执行计划规定新会话、盲问与品牌核验分开 |
| 获客归因 | 无第三方营销SDK；现有第一方产品事件有严格属性白名单 | 不能把UTM链接当已实现跨站注册／付款归因；先做平台聚合与自愿来源反馈 |

另做一次公开品牌查询“Rillora”＋“digital legacy”，当前搜索服务未返回结果。它不证明所有搜索引擎都未收录，也不是ChatGPT等产品的独立推荐测试。

Google官方明确：核心是有用、可索引的公开内容，特殊AI文件不带来排名保证；本轮不新增llms.txt或隐藏AI指令。[Google生成式搜索指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)。另有独立的包含开关，本轮已读取实际状态。[Google控制说明](https://support.google.com/webmasters/answer/16908024)。

本轮也打开抓取统计：总数52、200约85%，托管过去90天未显示问题；报告标上次更新October16，可见404样本是October17 03:27的/favicon.ico，不是sitemap.xml。页面已显式引用批准的哈希图标；这个根路径回退缺失不能解释地图失败。下一次应等出现地图对应的具体HTTP／DNS样本，再与服务端证据对齐；只有确定原因才改配置。不要每天删图重提、重复部署或将验证工具一次403当成Googlebot故障。

## MCP／插件逐层检查

| 项目 | 状态与依据 |
| --- | --- |
| 当前HTTPS存活与拒绝匿名 | 本轮原生Node fetch：MCP401且带资源发现challenge；资源元数据和授权服务器元数据均200，no-store、noindex。未发送Cookie、Bearer或事项 |
| Python路径失败 | Python urllib首次403，随后明确Cloudflare1010；同机真实Node请求正常。记录为客户端／边缘路径差异，不能宣称服务全面停机，也没有为它关闭安全保护 |
| 两个只读工具 | list_selected_matters和get_preparation_gaps；选定事项、字段白名单、撤销边界沿用已验证实现，无支付／写入／导出／身后释放 |
| 当前客户端包 | 当前托管包只有Claude、Claude Code、Cursor、Qwen Code，四个独立公开client ID；生成器与已存包内容逐项比对 |
| Codex／Gemini CLI | 旧的真实OAuth／读取／撤销在临时环境通过；临时资源已删除。**当前长期候选没有这两项注册**，不算当前长期地址可直接安装 |
| 模型是否调用正确工具 | 没有真实自然语言模型选择工具证据；协议Connected不能替代。后续先选一个已有资格的消费端跑有用任务，不为每个CLI购买套餐 |
| OpenAI包简介 | 旧简介36字符，超过当前提交上限30；已缩短为Review selected matters并新增真实规则回归检查。family planning改为family organization，避免误导为生育规划 |
| OpenAI目录身份条件 | 当前候选只公开两项事项scope，没有OIDC发现／openid、email与UserInfo。目录工作区域名保护需要单独实现与隐私核对，不把上游Auth0支持OIDC当下游已提供 |
| 正式域与审核材料 | 当前为workers.dev合成候选；生产HTTPS／可控域挑战、审核合成账号、当前工具扫描、演示录像和提供方审核未完成。已准备5正／3负测试草稿，不能伪造通过回执 |
| 客户安全与运营 | 合成包装密钥、数据库和禁注册边界保留；生产KMS、强制恢复日志、用户同意、配额及故障处理仍需独立交付 |

资源元数据只列必需summary scope；授权服务器和各已生成客户端明确列两项scope。这是当前官方OAuth库的requiredScopes行为，不随意同时写入已废弃字段或放宽校验；新客户端必须核对两工具的scope发现与授权结果。

[OpenAI最终目录要求](https://developers.openai.com/plugins/deploy/submission-errors#final-directory-submission)与[UserInfo条件](https://developers.openai.com/plugins/build/auth#support-workspace-domain-restrictions)是本次发现依据；“修好包格式”不等于完成目录提交。

## 平台覆盖：入口、证据和优先级分开

P0为本月重点，P1为客户MCP就绪后的首批接入，P2为有实际用户需求再投入。每行只表达已核对的具体产品入口，不从同品牌API／CLI推断消费端。

| 平台／入口 | 当前Rillora证据 | 下一步／优先级 |
| --- | --- | --- |
| Google Search AI Overviews／AI Mode | 公开SEO、包含设置；索引仍待证据 | 具体地图错误与文章索引、引用；P0 |
| Bing／消费Copilot | Bing已读28URL；无实际推荐 | 用Bing报告与真实消费端问题评估；P0 |
| ChatGPT搜索／OpenAI插件 | 公开发现内容；插件生成器，未装消费端／未上架 | 先测公共事实与引用；客户服务、UserInfo和审核材料再接插件；P0/P1 |
| Codex | 临时HTTPS真实OAuth、两工具与撤销通过 | 当前长期host缺独立登记，不能用旧临时client；P1 |
| Claude Code | 长期候选OAuth、读取、刷新、撤销通过 | 不重测协议；模型有用任务与客户环境另验；P1 |
| Claude／Cowork／Desktop消费连接 | 当前独立登记／材料，无账号验收 | 官方Free也有有限自定义连接；Owner无账号，不能写成必须付费或强迫注册；P1，[官方](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp) |
| Cursor CLI／IDE | CLI长期候选闭环通过；IDE未测 | 不把CLI结果冒充IDE／模型会话；P1 |
| Gemini CLI | 临时真实OAuth及CLI通过 | 当前长期host未注册；P1 |
| Gemini Apps／Spark | 未接入；官方自定义MCP入口有地区／语言／账号要求 | 当前官方页有不同范围表述，专页要求美国、个人18+、英文及Keep Activity；不能以改地区绕过；P2，[专页](https://support.google.com/gemini/answer/17209137) |
| Perplexity／Computer | 公开发现可覆盖；没有Rillora连接证据 | 官方远程自定义连接需实际套餐与OAuth回调核对；不默认免费；P1，[发布说明](https://www.perplexity.ai/changelog/what-we-shipped---march-13-2026) |
| Grok消费连接／xAI API | 官方两种路线存在，Rillora均未测 | 优先公开推荐，消费连接单独登记；API不等于消费账号；P2，[连接说明](https://docs.x.ai/grok/connectors) |
| Microsoft365／Copilot Studio | 仅架构路线，未接企业租户 | 企业客户明确需求后再做；不为覆盖率新买企业服务；P2，[认证](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-create-new-server) |
| GitHub Copilot／VS Code | 本轮补入明确清单；无Rillora运行证据 | 官方支持远程MCP；固定客户端／回调、工作区权限需实测；P2，[官方](https://code.visualstudio.com/docs/agent-customization/mcp-servers) |
| Windsurf／Devin Desktop | 本轮补入；无运行证据 | 官方旧地址现跳转Devin，Cascade与新默认agent配置不同，不能复制过时教程；P2，[官方](https://docs.devin.ai/desktop/cascade/mcp) |
| Qwen Code／千问消费端 | Qwen Code长期候选协议／CLI通过；消费端未测 | 先复用协议结果；模型与消费发现独立；P1/P2 |
| Kimi Code／Kimi消费端 | 官方Code支持HTTP及OAuth；Rillora未登记 | 按原版实际回调和安全存储验证；不推导消费端插件资格；P2，[官方](https://www.kimi.com/code/docs/en/kimi-code-cli/customization/mcp.html) |
| Mistral Le Chat／Vibe | 本轮将官方自定义MCP路线补入；Rillora未连接 | 官方当前教程使用Vibe名，不能据教程保证特定账户入口或免费资格；P2，[官方](https://docs.mistral.ai/resources/cookbooks/mistral-lechat_custom_mcp_server-custom-mcp-server) |
| DeepSeek、豆包、腾讯元宝、百度文心／文小言、夸克AI、Meta AI | 纳入公共发现评估；未找到本次可证明的Rillora消费端接入 | 未核实不是“不支持”；不把各自模型API／云MCP市场当聊天端可装；P2 |
| Cline／Roo、Continue、Zed、Goose、JetBrains AI／Junie、Amazon Q、Manus、Genspark、You.com、Poe、Brave Search／Duck.ai | 新增观察清单，没有资格或运行结论 | 有目标用户使用或明确分发机会后，再核对官方能力／成本；不伪造配置文件或兼容勾选；P2 |
| 官方MCP Registry／各商店 | 未发布 | 可作为技术发现入口，不保证任何AI自动安装／推荐；生产就绪后验证命名空间、登记端点；[官方流程](https://modelcontextprotocol.io/registry/quickstart) |

这份清单覆盖产品类别和主要已知入口，不声称穷尽未来所有AI。优先由实际用户使用的平台决定接入顺序，别让长尾客户端工程挤占获客验证。

## 本轮修正与尚未完成

已修插件简介限制及关键词歧义；商店配置还停在October13“主动撤回”，已按October15实际收件证据修成带观察日期的等待审核记录，保留旧提交历史。没有读取或改变今天的Apple审核状态，也没有更新在审文案。

下一版ASO、8份双语渠道文案、视频脚本、4周实验和指标模板见[获客计划](acquisition-plan-20261018.md)、[执行素材](campaign-kit-20261018.md)。这批素材是可执行草稿，不是已发帖、已收到客户承诺或已产生新增用户。

QA：output/qa/rillora-marketing-readiness-20261018；可读回执见[交付记录](../../collaboration/verification/marketing-readiness-20261018/README.md)。保留既有OAuth、部署、付款和审核证据，不重做。没有购买关键词工具、模型套餐、广告或新增分析SDK。
