# 正式用户 MCP 与 Google 地图续接

Status: PRODUCTION ENABLED / REAL CODEX MODEL AND REVOCATION VERIFIED / REGISTRY ACTIVE
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


## Historical implementation checkpoint — superseded by live acceptance below

The standard provider and signed PostgreSQL flow pass 33 focused checks; the complete API suite passes 580 checks, infrastructure 68, and package generation 6. The live Web build includes a credential-free deterministic download and an explicit client-first authorization flow; existing closed/review builds keep AI disabled. These are implementation/build results, not production customer acceptance. The prepared change set holds the current API and identity-worker task images while adding only protocol storage, its protected configuration, the compatible journal writer and maintenance task image. Migration and enablement remain separate actions.

## 历史生产准备与迁移检查点

源码aa1864fbd／CI182和静态包校验修正bbde68a2e／CI183均三任务通过。准备栈已部署，原API及身份删除worker镜像、既有参数保持；加密生产快照已可用。固定broker的迁移／核验任务exit0，schema103→106，原103份迁移校验和、68张表的行数／指纹及角色设置全部保持，仅新增3张空AI表。强制RLS与内容加密通过。专用签名／存储／Cookie密钥直接写入精确AWS秘密，未保存本地明文。API启用与Web发布仍需各自读回，不能以准备完成冒充客户可用。

正式浏览器实际已退出登录，当前条款／原Google账号登录确认已询问Owner；尚未选择真实资料。Auth0管理CLI另已过期，一次原会话续期被拒；客户接入复用既有Web登录，不依赖这次管理权限，不将其误报为生产运行阻塞。

正式路由探测发现：健康、资源／授权发现200，但MCP因AWS代理转发后的Host被精确校验拒绝403，不能当作客户端可用。修正是在现有私有API Gateway集成中把后端Host固定为已验证的TLS名称，仅MCP启用时生效；保留应用的精确Host／Origin校验，不开放通配域、不信任任意转发头、不改TLS或数据库。依据[AWS请求参数映射](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-parameter-mapping.html)，该独立路由修正正在验收，Web入口继续等待其正式结果。

Host修正1b96a114f／CI184已部署并验收，实际MCP匿名／无效令牌401、非法Origin403；7个登记客户端的授权起点与安全Cookie也通过。Web已完成部署、89文件及下载包逐字核验、3条发现路由200且no-store。Owner已当场确认条款并成功复用原Google登录。

真实Codex进一步发现授权服务器动态生成了内部Host和去掉/api后的端点，驱动拒绝继续，未发生资料授权。当前修正把oidc-provider的请求上下文固定为配置中的公开issuer，覆盖不可信转发头，并保留浏览器实际/api路径对应的Cookie匹配。新增真实HTTP代理模拟检查发现／回跳／换码，另验证公开JWKS的ID Token签名。只滚动替换API镜像，不重跑迁移、付款、原生或此前官网验收；正式客户端读取／撤销仍待此修正实际交付。

## 当前实际交付与验收

公开issuer修正c6beccfde／CI185已完成窄范围滚动部署；只替换API镜像，既有worker、维护任务及数据库不再变动。实际发现文件中的授权、换码、JWKS和UserInfo地址均指向app.rillora.xyz/api/ai/oauth，代理后的Host及路径不再泄漏为客户端端点。API和Web各自的部署完成、最终模板及线上HTTP均已核对；原89份Web文件、公开下载包和三条根发现路由匹配。

Owner当场批准仅把合成事项Release acceptance 2026-10-01授权给真实Codex，读取名称／类别／状态并检查通用缺项，不提供邮箱／备注／其他事项，验收后立即撤销。第一次本机回调监听在等待确认时超时；相同范围续接无需重复批准。Codex0.163.0-alpha.10.2实际完成S256授权、工具发现和一次临时模型会话，模型调用两项只读工具，仅返回1条选定合成事项及intended_outcome缺项。原始字段值、其他事项、邮箱和备注均未返回。

随后在正式Web撤销，页面读回“通过此授权发起的新请求已被阻止”。同一客户端重新启动、仍使用原凭据时，初始化被拒绝，authStatus变为notLoggedIn且工具列表为空。移除仅本次验收alias的凭据，未改变用户全局Codex配置或其他插件。当前没有为本轮保留有效AI访问授权。

生产下载包包含7种独立客户端配置、中英文安装说明，以及独立Codex兼容插件与OpenAI便携包。当前Codex真实解析器从下载包正确识别Rillora服务；这是包解析证据，实际模型会话使用同一正式服务的CLI配置，不能称为公开商店安装。ChatGPT／Claude消费端、Cursor IDE及其余模型任务没有在本轮冒称通过；旧Claude Code／Cursor／Gemini／Qwen的隔离协议证据仍按原环境单独保存。Owner没有Claude官网账号，不要求新注册或付费升级。

普通用户入口：[账号设置](https://app.rillora.xyz/account?next=ai-connect)、[公开下载](https://app.rillora.xyz/integrations/rillora-ai-v1.zip)。先由对应AI发起OAuth，再选择事项、明确同意；账号不需要加入旧审核白名单，也不需要访问私有Git或请求管理员生成令牌。配置和账号／地区／套餐资格不同，不宣传“所有AI都可直接安装”。

## 官方MCP Registry

已发布xyz.rillora/rillora@0.1.0，官方发布与独立公开GET均返回active。登记只包含品牌、正式资源地址、公开使用说明和权限边界；没有公开私有业务源码、身份、密码或事项。采用官方DNS签名认证，仅新增1条根TXT域名证明，原36条记录全部保持；两台权威DNS和两个公共解析器均读回。Ed25519私钥仅在内存生成，经既有Owner-only age身份加密并验证后保存；没有明文私钥文件／命令行参数，短期Registry令牌未持久化。

[官方登记](https://registry.modelcontextprotocol.io/v0/servers/xyz.rillora%2Frillora/versions/latest)可被技术目录发现，但不等于ChatGPT／Claude商店批准、自动安装或模型推荐。官方文档的v0.1查询本次超时，实际官方publisher使用的v0接口成功；没有重复发布同一版本。登记源稿见[integrations/ai/registry/server.json](../../integrations/ai/registry/server.json)。

## 验收边界和后续分发

本轮沿用已过API580、infra68、配置6及UI20检查，公开issuer修正另有27项针对性代理／协议检查。没有把这些本地测试重复写为此次真实模型调用；部署、迁移数据保持、模型结果和撤销分别有回执。生产本轮未单独等待令牌到期触发刷新，刷新／重放等边界来自已过真实HTTP集成和先前独立候选检查，不冒称为新的生产到期实测。页面残留双语语言标签已按所选语言修正并独立发布：46d745bf4／CI186、4项聚焦检查、生产构建及89文件线上逐字核验通过；实际Chrome显示中文标签且混合语言标签为0。

当前在审App14、TestFlight暂停、原事项、价格、收费开关、FanPass及原Auth0连接保持。当前正式用户MCP和官方Registry已开放；OpenAI目录仍须独立消费端验收、演示与提供方提交，Claude账号资格及其他消费端同样单独记录。不能复用Apple审核凭据给新的AI平台，也不能把Codex的无邮箱授权扩大为ChatGPT的邮箱披露。

## OpenAI目录实际推进

按[官方提交要求](https://developers.openai.com/plugins/deploy/submission)最终复核，补齐包中独立supportURL及Codex兼容manifest的author，6项配置检查和当前实际解析器通过。只改两个metadata文件，OAuth及其它配置不变；abcaf2af1／CI187三任务通过，正式下载更新已完成，公共ZIP和原首页实际字节匹配。重新prepare已准备的Web产物曾重复插入appearance bootstrap，执行前的字节差异检查阻止了它；原HTML已逐字恢复，最终仅ZIP不同，其他88文件保持，未部署错误候选。

Owner已完成OpenAI Platform登录；实际Plugins上传入口要求先验证开发者身份，并在General展示Individual／Business两个Start。尚未选择／冒填法律身份或上传证件，也未充值／购买API。已准备仅包含公开metadata、配置、品牌图标及5正／3负预期测试草稿的ZIP；没有上传成功回执。Owner明确“稍后验证，先保存其他成果”，因此按其指示停在此门，不再要求同一项或替选法律身份。测试案例草稿不能冒称ChatGPT已通过，视频及专用审核账号仍按平台后续要求完成。

Git保存独立完成：新增archive48已从GitHub新下载、解密并逐对象／路径认证，318对象／439路径匹配；晚到的无秘密包和回执正常追加，不重封先前归档。[可读交付与远端证据](../../collaboration/verification/customer-mcp-20261018/README.md)。
