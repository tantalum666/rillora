# 下一版本 MCP：真实 OAuth 与撤销验收

Status: REAL PROVIDER OAUTH AND SCOPED PROTOCOL ACCEPTANCE VERIFIED / HOSTED PRODUCT AND DIRECTORY PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)
Source baseline: 0dc647b21041fbf22b4682899ccc4a038f170fd7

Owner完成此前明确缺少的Auth0连接管理授权后，继续[跨平台方案](ai-discovery-vnext-20261015.md)的隔离验收。沿用完整阅读、源码／本地／旧归档结果；本轮不改变当前审核、正式服务、数据、价格、收费或FanPass。

## 真实环境与结果

采用一个独立的Auth0数据库连接及合成账号，禁止公开注册、不绑定任何既有第一方客户端。仅该合成连接提升为域级。每个AI有自己的第三方公共native客户端、authorization_code、S256、精确回调和只含两scope的subject_type=user grant；资源RS256／900秒，不开refresh或M2M。免费额度下顺序创建／验收／删除，不删除旧9个普通应用或升级套餐。

MCP服务只监听本机127.0.0.1，使用独立disposable PostgreSQL、签名数据库上下文、真实应用内容加密路径及仅测试密钥。准备两条合成事项，仅授权一条；bootstrap开发REST在对外验收前关闭。法律及选择授权行是明确的测试夹具，不冒充Owner的新真实同意或生产KMS验证。

| 检查 | Codex | Gemini CLI |
| --- | --- | --- |
| 版本 | 0.162.0-alpha.17.2 | 0.64.0 |
| 授权路径 | 实际app-server的mcpServer/oauth/login | 安装包原版导出的发现／PKCE／回调／exchange函数，随后实际CLI；不是手写OAuth实现 |
| 实际Auth0授权及令牌 | 通过 | 通过 |
| issuer／audience／client／scope／签名 | 真实服务通过 | 真实服务通过 |
| 实际客户端连接／目录 | oAuth状态，两只读工具 | mcp list返回Connected、exit0 |
| 选定范围与备注隔离 | 通过 | 通过 |
| 撤销后同一未过期令牌 | 两项读取均拒绝 | 两项读取均拒绝 |

具体工具调用由官方MCP SDK使用实际客户端已呈交的令牌进行；没有自然语言模型调用、消费聊天产品连接、模型自动选工具或费用支出。Gemini采用原版导出函数是为了不登录Google模型服务，并由CUA操作真实Auth0页面；其state／issuer检查、令牌交换与缓存机制均保持，未改SDK代码。CLI使用独立profile，仅信任本次合成目录；临时token采用其加密存储，完成后删除，不改用户全局配置。

## 实际发现与修正

Codex会自行根据Rillora的受保护资源元数据加入resource；原setup.sh又设置oauth-resource，导致真实请求含两个同值resource。Auth0实际返回invalid_request: resource parameter must be a string。生成器移除额外覆盖，真实请求随后只有一个resource，资源值、S256与回调仍严格核对，OAuth成功。未放宽服务端audience／issuer／client校验，也未手工修改一次性授权URL来假装产品配置通过。

Gemini驱动最初只调用fallback发现，未先消费401的WWW-Authenticate；按同版authenticate实际顺序修正驱动后成功。该项是测试驱动修正，不把它报告为产品或Auth0缺陷。Codex通知监听名另由源码schema纠正为mcpServer/oauthLogin/completed；已完成登录由真实客户端状态及服务验签证明，没有为补日志重复登录。

回收Codex客户端时，单独删除client grant调用未成功；改为删除本轮目的标记客户端，随后真实读回其grant已级联移除。没有扩大CLI的grant删除权限或触及原客户端。Gemini之后使用独立client ID，避免混用不同供应商身份。

## 清理与保持项

两轮结束后，本机0规划者／0临时runtime角色，MCP监听关闭；Codex仅注销本轮条目；Gemini token／独立profile删除。Auth0两个临时客户端及grants、API、合成用户、合成连接全部删除；原有客户端／资源／绑定哈希相同，租户完整设置相同，原连接均仍非域级。测试密码只经过内存和0600命名管道，未写明文文件；传给浏览器后也已清空该内存字段。

原在审App14、真实数据／法律、WebUSD88.99及AppleUSD119.99／HKD888、收费开关和FanPass保持。没有公网MCP发布、TestFlight、真实交易或新付费基础设施。

## 交付与下一步

[当轮证据](../../collaboration/verification/ai-oauth-validation-20261016/README.md)区分真实提供方、真实客户端、协议执行和未验证的模型行为。生成器2项检查通过；不重跑既有560等产品套件。旧CI163应用任务成功，但证据清单未同步使source失败；本轮重建真实文件清单并核验，不删安全规则或增加扫描豁免。

下一步为独立HTTPS候选中的Web选择授权到MCP闭环，再逐平台检查消费产品／目录及自然语言选工具；官网部署和搜索索引仍分别取证。AWS最初只读STS返回过期，随后复用原浏览器会话自动续期，原部署账户STS成功，无需Owner再次MFA；Auth0已完成追加授权，不再重复申请。
