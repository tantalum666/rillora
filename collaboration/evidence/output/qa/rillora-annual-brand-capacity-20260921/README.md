# September21 年付、品牌与容量 QA

Status: STAGING AND PROVIDER RETIREMENT VERIFIED; EXTERNAL BRAND GAPS RETAINED  
Date: 2026-09-21, Asia/Hong_Kong

## 阅读与授权

本轮延续已有发布／品牌／定价工作，复用[92份文件、20,554行完整正文阅读记录](../rillora-release-readiness-20260919/full-read-completion.json)，不是新一轮全量阅读声明。压缩后恢复AGENTS、product、handoff、最新决策及价格／商业／发布／基础设施／品牌焦点文件；范围与指纹用途见[补读记录](read-recovery.json)。依赖、缓存、构建、第三方包及生成output仍在排除范围内。

Owner已明确取消新月付；没有批准更高Apple年价。本轮未公开销售、购买Auth0套餐、生产切换、提审或重做UI。Owner另已确认主App图标问题解决；全面检查仍发现Preview及外部provider遗漏。

## 实施与发布

- 目录可购账期只有annual；历史月付金额保留。0063将月付报价标retired；API拒绝新月付Checkout，历史对账仍识别旧价。
- 原生新购ID集合只含annual；恢复、状态和事务更新集合仍保留monthly。17项CommerceStore测试覆盖这两个方向。
- Apple英文应用草稿已保存annual subscription；月付未提交商品6803958645可售地区0。年度价格未擅自变更。
- Preview缺失AppIcon已修复，主App／Preview构建安装成功。[桌面实图](simulator-icons.jpg)、[首页实图](simulator-overview.jpg)。
- [CDK diff](aws-diff.log)仅改变API／migration镜像、Web资源和两项限区域只读诊断权限。[部署](aws-activate.log)exit0，API33运行1／pending0；[迁移](annual-only-migration-logs.json)exit0。
- [已发布HTTP／资源核对](aws-http-verification.json)30/30；[实际GLOBAL_US目录](annual-catalog-response.json)只含annual8880，purchasable=false、billingOpen=false。
- [provider回读](provider-readbacks.json)：三代Stripe TEST月付Price均归档，两个v1有效测试订阅保留。没有删除旧订阅、改写收据或完成本轮新年价付款。

## 本轮检查与失败记录

API最终179/179及TypeScript构建通过。首次完整运行有一例旧测试用monthly触发重复Checkout；新规则更早拒绝monthly，因此改为annual来继续验证重复订阅行为，再完整重跑通过。

原生17项CommerceStore测试通过，实际结果包为XcodeBuildMCP目录下的
`test_sim_2026-09-21T04-59-46-964Z_pid48280_fc545bf2.xcresult`。
没有宣称完整原生套件重跑。[基础设施](infra-checks.log)typecheck及21/21通过。
Web release构建成功，保留既有Rollup注释和chunk大小警告；没有本轮完整Web业务套件声明。
恢复时基础设施结果被截断，小套件重跑一次并保存日志；没有为增加数字重复无必要测试。

## 100用户私有接口与限流

100个独立合成身份，各20项事项，共2,000项。使用管理员植入的短期native会话，不创建Auth0身份、不执行真人同意、不发送邮件。凭据仅保存在忽略的私有目录，QA中的种子脚本只包含哈希。请求经过真实API Gateway和运行数据库。

| 检查 | 实际结果 | 解释 |
| --- | --- | --- |
| [300次、目标5rps](capacity-load.json) | 298成功、2次429，P95约1471ms | 达到来源IP的300次／15分钟限制 |
| [180次有界复测](capacity-retest.json) | 179成功、1次客户端传输失败 | 等待自然窗口重置；该次没有保存curl原错误，不能断言服务端超时 |
| [同一失败账号／接口](capacity-single-recovery.json) | 3/3为200，各返回20项 | 只证明随后恢复，不证明原失败原因 |
| [60次短测](capacity-peak.json) | 60/60为200，P95约1532ms、最大1824ms | 目标10rps、最多10个worker；不等于100人同时操作 |

旧传输失败行的seconds=10是脚本写入的超时预算占位，**不是实测10秒服务端延迟**；脚本现已改为记录真实elapsed、curl退出码和简短错误。原失败文件保留，没有伪造来源、放宽保护、隐藏重试或压测Auth0／Stripe。

[24小时指标](capacity-live.json)及[负载时段指标](capacity-during-load.json)确认单任务0.25vCPU／512MiB、连接池5、RDSmicro／20GiB。日均API CPU1.64%／内存12.17%，RDS CPU4.43%。测试时API最大CPU12.32%／内存14.26%，RDS CPU7.75%、连接数2、最低FreeableMemory约171MiB。没有因100低频用户而预购资源；共享IP／CDN来源归属、生产邮件及恢复仍需各自验收。

CloudWatch初次被IAM拒绝；仅给现有角色添加eu-central-1范围的GetMetricStatistics／DescribeTaskDefinition。Stripe秘密读取被拒绝后未扩大权限，改用已有认证的Rillora TEST后台。

精确清理及独立回读：[任务](capacity-cleanup-status.json)、[清理日志](capacity-cleanup-logs.json)、[最终数据库读取](capacity-final-check-logs.json)。旧合成token也返回[HTTP401](capacity-cleanup-http.json)；未删除真实Owner数据。

## 品牌与外部依赖

[Auth0基础品牌](auth0-brand-readback.json)保存／回读成功，默认域名预览显示03；单独打开真实login.rillora.xyz发现旧Liquid仍隐藏widgetLogo。Free套餐模板API返回402，源模板已准备Logo／favicon替换，尚未应用，没有自动订购或删除旧模板。

Stripe和GoogleOAuth目前没有Logo。Chrome文件选择器返回Not allowed；已按工具文档交回Owner开启扩展文件权限。访问chrome://extensions又被URL策略拒绝，没有改用CDP、原生界面或其他表面绕过。Chrome恢复后已实际回读Google Rillora Identity为Testing、法律链接正确、Logo为空；Auth0 Google连接只请求email/profile。

[Auth0额度](auth0-quota-observation.json)：Free2/25,000外部MAU、M2M0/1,000，日更报表。尚无自定义SMTP；官方内建邮件仅开发用途且10封／分钟。AppStore图标需要上传构建，不以模拟器代替商店证据。[根域名观察](root-home-observation.json)只是公开HTML读取，不是正式应用发布或视觉验收。法律站现有Sites6资产与选定源SHA相符，没有重发法律正文或要求用户重新同意。

## 文档收尾

更新product、monetization、当前pricing、StoreKit、release-readiness、infrastructure、service-registry、Auth0 README、此前研究状态及[本轮焦点合同](../../../docs/annual-brand-capacity-20260921.md)；在[decision-log](../../../docs/decision-log.md)追加Owner决定，在[journey](../../../docs/journey/PROJECT_JOURNEY.md)记录目标／尝试／判断／结果／未完成项。[handoff](../../../docs/handoff.md)只保留一个当前下一步，旧版标为HISTORICAL。

链接、状态及时间检查见closeout.json。待回复问题仅涉及Chrome上传权限；经营登记和实体设备仍按Owner暂缓。实现、测试、部署、provider配置与真实生产／用户结果分别记录。
