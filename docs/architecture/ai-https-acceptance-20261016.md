# 下一版本 MCP：临时 HTTPS 与 Web 选择授权验收

Status: SYNTHETIC HTTPS SELECTION / OAUTH / READ / REVOCATION PASSED; TEMPORARY RESOURCES REMOVED
Last updated: 2026-10-16 (Asia/Hong_Kong)

接续[托管前置核对](ai-hosted-preflight-20261016.md)。本轮补齐实际浏览器选择授权到公网HTTPS MCP的闭环，未改当前App14、正式API／数据、价格／收费或FanPass。原件位于output/qa/rillora-ai-https-20261016；[可读证据与原件保存](../../collaboration/verification/ai-https-acceptance-20261016/README.md)分别记录Git、远端认证和CI，不能从本文件推导这些后续动作已完成。

## 已取得的实际结果

1. Owner完成原登录后，Dashboard与Teams实际恢复。Teams显示Free/$0且1租户到顶；没有付费升级、新建租户或再次要求同一登录。
2. 新候选在临时trycloudflare.com HTTPS入口运行。11项匿名检查通过：TLS正常、就绪／资源发现正确、未登录／错误token／开发身份头被拒绝、私有文件不可取得。HTML含noindex。Cloudflare会在robots.txt前增加托管规则，因此只确认原始拒绝策略被保留，不声称所有爬虫都被robots禁止；robots也不承担认证保护。
3. Owner明确确认独立合成账号的条款／隐私／电子记录。实际浏览器经Auth0登录回到两条合成事项；前端复用已批准的六项公开经营信息并通过法律发布校验，未发布占位条款。Terms为terms-2026-10-09-1，Privacy为privacy-2026-09-15-1。
4. 在真实Web界面只选择Selected synthetic matter，另一条Unselected synthetic matter未选；启用通用缺项检查并明确保存。页面显示授权成功／1项，数据库有1个活动授权。没有用SQL代替这次授权操作。
5. 实际Codex app-server发起OAuth：独立第三方public client、一个精确resource、S256、两个既定scope、由真实请求产生的精确loopback回调。Auth0成功后Codex发现两个工具且authStatus为oAuth。
6. 使用Codex实际向服务提交的令牌，经官方MCP客户端和同一公网HTTPS服务调用两个工具。只得到选定事项的名称／类别／状态，以及缺少intended_outcome的字段名；未选事项和私密备注未返回。
7. 在Web点击撤销，页面显示新请求已阻止，数据库活动授权归零。同一令牌仍有819秒有效期，两个工具均返回ai_connection_unavailable；没有依赖令牌自然过期。
8. 在Web退出全部合成会话，返回公开首页，活动会话归零。随后关闭验收服务、专用Codex登录和隧道，删除本轮新Auth0资源；独立读回确认三个本机端口关闭、隧道进程不存在、合成规划者及runtime角色均为0。

这不是自然语言模型自主选择工具的证据，也不是长期托管／所有消费端／平台目录上线。此前Codex与Gemini的[两客户端OAuth结果](ai-oauth-validation-20261016.md)沿用，不重复改记成这次的全部公网结果。

## 免费容量与精确恢复

现有Default App没有回调、logout URL、Web origin、API grant、保留期内登录记录或活动源码引用；日志保留有限，不推导历史从未使用。仅将它临时用于第一方合成Web登录；AI仍使用新建、独立的第三方客户端。没有重用4个退役客户端、删除旧应用或扩大生产连接。新合成连接关闭注册、强密码／暴力尝试保护，只有这条连接可供第三方测试；没有发送验证邮件。

新API仅两个用户scope，RS256和900秒令牌，不发refresh／M2M凭据。每次创建前保存修改范围与原绑定；清理时只删除本轮purpose标记资源，并逐项核对其余应用、原连接绑定和完整租户设置。

有一项明确保留差异：原Default App未设置token_endpoint_auth_method，Auth0拒绝PATCH null，清空现代认证字段又要求扩大凭据管理scope。因此保留显式client_secret_post，恢复其原名、空回调、原grant列表、JWT寿命及原连接。不升级或追加管理权限，不轮换client ID／secret。第四轮已精确还原到该声明过的基线；这不等于最初未设置字段的逐字恢复。原回执中的secretUnchanged指未请求／执行密钥变更，最终回执明确没有独立比较前后密钥字节。

## 实际发现与源码修复

- MCP checkReady原先直接通过NOINHERIT基础数据库连接查询app schema，真实受限运行器启动被拒绝。改为既有withAuthDatabase受控事务，未增加基础角色权限；真实数据库回归确认检查前后仍无schema访问权。19项MCP检查通过。
- HTTPS预览原先按NODE_ENV决定Cookie安全标志。先补Secure后，真实浏览器保存授权进一步暴露命名不一致：服务仍发无前缀Cookie，而远程Web只读取__Host前缀，CSRF正确拒绝请求。最终统一所有配置为HTTPS的环境使用__Host／Secure，浏览器仅在HTTP loopback读取无前缀值；不回退生产防护、不信任请求头、不伪造CSRF header。
- 类型检查、4文件42项API检查和27项Web客户端检查通过。包括HTTP／HTTPS普通与loopback、登录／再认证／两种退出，以及旧Cookie／重复值拒绝。实际公网浏览器保存、撤销、退出闭环亦通过。先前41项中间结果和失败记录保留，不能替代最终结果。
- 源码扫描保留32条已登记非秘密，0未知项。既有全量矩阵及原官网部署不重跑；后续GitHub CI作为新的提交结果单列。

操作脚本还修正了首次finally掩盖失败退出、Auth0连接字段白名单／JWT只读字段差异，并保存前三轮失败及清理证据；这些不是额外产品缺陷。最终候选88个文件包含noindex／robots，公开经营信息只进入加密原件包，原始环境文件及身份凭据不进Git。

## 运行及证据边界

只使用专用本机PostgreSQL合成库、随机runtime authority、应用真实加密路径和测试专用密钥提供器。生成数据的开发身份listener先关闭，再开放外部服务；外部ALLOW_DEV_AUTH=false，验签／会话／CSRF／最近认证／授权范围保护实际生效，所有支付／邮件／删除worker关闭。仅接受本轮合成subject，未使用Gmail／QQ资料。

[Cloudflare Quick Tunnels官方说明](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)将它定位为开发测试，且不支持SSE；本轮用JSON响应、无订阅。没有永久域名、后台隧道服务或生产SLA声明。该环境未验AWS KMS、云端数据库TLS及恢复日志，不冒充正式托管部署。

## 下一步

确定可以长期维持的独立身份容量与托管方案，再在该环境补模型实际选工具、其他消费端及目录验收。优先复用免费能力，不把临时Default App测试配置留下充当正式服务；不改在审版本、不再重复已通过的合成闭环。各平台connected、reviewed、published、discoverable分别记录，索引与AI推荐效果仍需真实观测。
