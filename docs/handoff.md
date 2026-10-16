# Rillora 当前交接

Status: TWO REAL PROVIDER OAUTH FLOWS AND SCOPED REVOCATION VERIFIED / ALL TEMPORARY PROVIDER RESOURCES CLEANED / VNEXT HOSTED CANDIDATE PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)

## 当前任务

Owner要求先完成官网GEO／SEO，再推进MCP和各平台接入；新功能留给下一版并推GitHub，保留App1.0(14)审核。当前目录 /Users/tantalum/Documents/电子遗嘱app，分支 codex/ai-discovery-vnext-20261015；发布工作树保持fec1ad3b。最新[真实OAuth验收](architecture/ai-oauth-validation-20261016.md)取代旧的连接权限阻塞；[前份交接](handoff-history-20261016-before-oauth-validation.md)为HISTORICAL。

## 已完成

- [20页双语官网与最小MCP](architecture/ai-discovery-implementation-20261015.md)及既有560等本地检查保留，不重做。新UI和runtime开关仍默认关闭，官网新候选尚未发布。
- Owner完成Auth0追加授权，已实际创建独立合成数据库连接、账号及精确用户委托grant；原三条正式连接始终未提升为域级，也未复用现有客户端。
- Codex实际app-server完成授权码＋S256，真实Auth0令牌验签、issuer／audience／client／scope通过，真实工具发现为两项。
- Gemini CLI0.64.0使用其原版导出的OAuth函数完成真实授权，再由实际CLI读取加密临时存储并返回Connected。没有Google模型登录或调用付费模型。
- 两者都用实际客户端已送达的令牌，经官方MCP SDK读取仅选定事项；未选事项／备注不返回。撤销后同一枚未过期令牌的两个读取操作均拒绝。自然语言模型选工具仍单独待验。
- 已修正真实互通发现的Codex重复resource参数：生成器移除额外oauth-resource，由受保护资源元数据提供唯一规范值；audience校验保持。配置生成2项检查及修正后的真实Auth0流程通过。
- 两个临时客户端／用户grant、独立API、合成用户及域级连接均已删除；本机规划者／临时角色／监听／临时Gemini凭据及profile已清理。原9普通应用／3API／3连接及租户设置指纹全部相同。

## 证据与边界

当轮原件 output/qa/rillora-ai-oauth-20261016；[可读交付](../collaboration/verification/ai-oauth-validation-20261016/README.md)。新增archive42保存44路径／38对象，119,709密文字节，本地完整认证通过；原archive1—41及上一轮普通Git文本不重复封存。Auth0登录URL、code、token、密码和原始提供方资料均排除发布；两张成功回调截图只含完成文字。

Gemini验证覆盖原版OAuth底层实现＋实际CLI连接，未运行交互/mcp auth或模型对话；两家工具执行／撤销由协议驱动核对，不冒称自然语言自动选工具、ChatGPT／Gemini Apps消费端或目录验收。全部事项及账号均为新建合成夹具，无真实事项发送给模型。

旧CI162被后续提交取消；CI163的API和Web／infra通过，source因新增证据未同步readable-manifest失败。完整清单已补齐，12,513文件／0未知扫描通过；最终回执加入后继续刷新清单。不能用旧CI161代替本轮结果；新的提交／CI／远端回执独立补录。

生产服务／数据／官网／定价／收费／FanPass／在审构建均未变，未发TestFlight；已取消真机和暂缓Auth0外壳保持。AWS下一步只读检查曾返回会话过期，随后已复用原浏览器rillora-operator会话自动恢复，部署profile的STS原账户核对成功；未要求Owner再做MFA。Auth0无需再次登录。

## 唯一下一步

完成本轮Git交付与CI闭环，随后执行已核对的独立www官网GEO更新，再推进MCP的HTTPS候选。官网合成差异只有静态上传和公开路由函数两项，复用既有54文件候选；AWS原会话已恢复。保持当前审核与正式数据不变，不重复已通过的两家OAuth／读取／撤销测试。
