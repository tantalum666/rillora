# 正式用户 MCP 与 Google 地图续接

Status: IMPLEMENTING — NOT YET CUSTOMER ENABLED
Last updated: 2026-10-18 (Asia/Hong_Kong)

Owner明确要求补齐Google地图及MCP／插件剩余接入，普通用户能真正使用，不停留在测试环境；能自主完成的直接做，保持当前审核，完成后推Git。这取代上一轮仅准备营销材料的下一步，不重做已通过的协议、支付、真机或官网发布。

## 实施边界

正式MCP使用现有AWS生产应用与数据库，复用内容KMS、强制RLS、当前身份／法律记录、选定事项服务和签名恢复日志。Cloudflare／Neon合成候选继续保持独立，不通过移除synthetic-only断言连接生产资料，不让外部Worker直接访问生产数据库。

选择维护中的oidc-provider标准OAuth／OIDC实现，挂在现有应用的独立AI授权路由。用户先通过现有Rillora网页登录，再在同一账号选择具体事项和第三方应用。外部客户端获得独立的短期opaque令牌，不能拿第一方Cookie、原生Bearer或Auth0应用凭据代替。无需为每个AI客户端额外占用一个Auth0应用，也不更改原iOS登录或审核身份。

OAuth持久状态放在独立、加密的DynamoDB临时存储；ID索引不可直接推导个人标识，内容另作认证加密，签名／存储密钥受Secrets Manager保护。强一致读取、原子单次消费、撤销标记和DB当前连接共同约束授权码／刷新／读取。到期拒绝与底层TTL实际清理分开。权限始终绑定最初的connection UUID，恢复后旧授权失效；账号删除／撤销／范围替换不能靠刷新复活。

协议只开放授权码＋PKCE及受限刷新；预登记客户端、精确回调；仅原生loopback端口按标准处理，不放开任意域／路径。关闭动态注册、客户端凭据授权和不需要的授权类型。元数据、UserInfo、工具读取、用户同意与目录提交分开验证。UserInfo只向获准scope提供当前实际已验证的邮箱，不能为适配平台伪造email_verified。

AI连接有独立、明确、未预选的披露同意，说明字段、提供方、有效期及无法收回既有副本。必要OAuth存储说明随该可选功能展示；原已接受Terms／Privacy及在审iOS合同不被悄悄替换。核心页面、购买和审核路径不依赖新增OAuth存储的可用性。

## 切换顺序

1. 核对现有生产配置／数据与可恢复备份；仅新增OAuth存储／受保护配置，MCP保持关闭。
2. 先更新兼容ai_connection事件的独立恢复日志broker，再原子执行既有0104—0106迁移；不修改历史SQL校验和。当前迁移器本来就把所有待执行迁移放在同一事务，避免0104／0105之间暴露权限中间态。
3. 生产API滚动替换，保留原服务、数据、价格、收费和Apple审核配置；旧任务在新任务健康前继续服务。
4. 部署带正式AI入口的Web及精确发现路由，开放已登记客户端，保存普通用户可取得的配置／说明；不替换iOS构建。
5. 使用明确合成资料完成正式地址上的真实授权、读取、拒绝越权、刷新、撤销及至少一个真实客户端任务。目录自身的审核／账号资格不能冒充完成。

## Google 地图

本轮原始XML为28个唯一规范URL，每个有两种语言对应；正常及声明Googlebot的HTTP请求均200、字节一致。后者不是Google真实抓取证明。继续从已验证的GSC属性／具体抓取回执诊断，不关闭安全保护或反复重新部署。未出现平台成功回执前不写“已解决”。

QA及阅读链：output/qa/rillora-customer-mcp-20261018。AWS原会话实际过期后，Owner完成MFA，已续回操作员与部署角色；此后复用，不重复要求登录。


## Implementation checkpoint

The standard provider and signed PostgreSQL flow pass 33 focused checks; the complete API suite passes 580 checks, infrastructure 68, and package generation 6. The live Web build includes a credential-free deterministic download and an explicit client-first authorization flow; existing closed/review builds keep AI disabled. These are implementation/build results, not production customer acceptance. The prepared change set holds the current API and identity-worker task images while adding only protocol storage, its protected configuration, the compatible journal writer and maintenance task image. Migration and enablement remain separate actions.

## 生产准备与迁移检查点

源码aa1864fbd／CI182和静态包校验修正bbde68a2e／CI183均三任务通过。准备栈已部署，原API及身份删除worker镜像、既有参数保持；加密生产快照已可用。固定broker的迁移／核验任务exit0，schema103→106，原103份迁移校验和、68张表的行数／指纹及角色设置全部保持，仅新增3张空AI表。强制RLS与内容加密通过。专用签名／存储／Cookie密钥直接写入精确AWS秘密，未保存本地明文。API启用与Web发布仍需各自读回，不能以准备完成冒充客户可用。

正式浏览器实际已退出登录，当前条款／原Google账号登录确认已询问Owner；尚未选择真实资料。Auth0管理CLI另已过期，一次原会话续期被拒；客户接入复用既有Web登录，不依赖这次管理权限，不将其误报为生产运行阻塞。

正式路由探测发现：健康、资源／授权发现200，但MCP因AWS代理转发后的Host被精确校验拒绝403，不能当作客户端可用。修正是在现有私有API Gateway集成中把后端Host固定为已验证的TLS名称，仅MCP启用时生效；保留应用的精确Host／Origin校验，不开放通配域、不信任任意转发头、不改TLS或数据库。依据[AWS请求参数映射](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-parameter-mapping.html)，该独立路由修正正在验收，Web入口继续等待其正式结果。
