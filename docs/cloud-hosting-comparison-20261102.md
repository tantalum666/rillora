# Cloudflare、Oracle Cloud与Rillora低成本托管

Status: RESEARCH AND SOURCE FIT REVIEW / PROVIDER NOT SELECTED / NO MIGRATION OR PURCHASE

Last updated: 2026-11-02 (Asia/Hong_Kong)

Owner认为保留现有AWS架构后每月60–80美元仍偏高，询问Cloudflare和Oracle Cloud。该区间只是[现有资源收敛估计](aws-cost-review-20261102.md)，不是Rillora最低运行成本或Owner已接受的预算。本轮比较最新官方价格、免费限制和活动源码依赖，不开新付费套餐、不迁移真实数据、不改变在审／待重提版本。目标区间仍为Agent建议。

## 判断

Cloudflare和OCI都有可能显著降低当前低流量阶段的现金费用，但路线不同：Cloudflare适合把API和任务改为按请求／事件执行；OCI虚拟机更容易保留完整Node与PostgreSQL进程，但自行管理数据库会增加升级、备份、恢复和故障处理工作。仅把官网搬到Cloudflare省不了当前大头：本次AWS账单的静态分发、存储和API请求费用合计很少，真正需要替换的是全天运行的计算／数据库和额外指标。

当前优先候选是Cloudflare Workers加按需托管PostgreSQL；OCI小实例作为保留现有运行方式的备选。先保持PostgreSQL权限与事务机制，不为追求D1免费额度重写现有安全基础。最终选择取决于完整API兼容性、工作负载实测、7天恢复要求和可获得的账户／区域资源，不以宣传额度判定可上线。

## Cloudflare最新价格与适用范围

2026年11月2日实读官方Workers、R2、D1和Hyperdrive文档：

| 能力 | 当前公开价格／额度 | 对本项目的含义 |
| --- | --- | --- |
| Workers静态资源 | 静态资源请求免费且不限量 | 适合公开站和前端构建产物；不代表动态API免费无限量。 |
| Workers Free | 每日100,000请求、每次10ms CPU | 合成预览可优先利用；完整Apple验签／加密操作需测CPU，不能按平均流量推断单请求可通过。 |
| Workers Paid | 账户最低US$5／月，含1,000万请求与3,000万CPU毫秒；超量另计 | 低流量正式API的预算可以从此起步；不必购买Workers for Platforms或网站Pro套餐来运行普通Worker。 |
| R2 Standard | 每月10GB月存储、100万A类／1,000万B类操作免费，Internet出站无带宽费；超额存储US$0.015／GB月 | 小型密文文件和备份可能落在额度内，但保留周期、多版本、操作及区域限制仍需计算。 |
| D1 | Free共5GB、每日500万读行／10万写行；使用SQLite语义 | 不是当前PostgreSQL的直接替代品，迁移的权限与事务重写成本可能大于节省。 |
| Hyperdrive | Workers含相应额度，连接已有Postgres／MySQL | 它是连接／缓存服务，不附送一台PostgreSQL数据库；数据库账单要另算。 |

Workers目前已提供Node HTTP兼容接口，不能用旧认知声称Express必须全部重写。但导入成功不代表所有Node API、Apple服务端库、OIDC库和AWS SDK路径都能运行，必须对实际依赖验证。Containers也能跑现有镜像，但默认磁盘是临时的，重启／休眠后不能把本地Postgres数据目录当作持久数据库；快照或FUSE不自动等价于现有数据库耐久性。常驻容器本身仍按运行资源收费。

Workers Logs页面公告2026年12月1日切到Cloudflare Observability价格，实际迁移预算必须复核届时日志费用；不能把今天日志额度写成长期不变的承诺。所有Paid额度都有超额计费，US$5不是整套系统的硬上限。

## 保留PostgreSQL的示例账单

Neon当前价格页（October31更新）给Free每项目1GB、100 CU小时及空闲5分钟休眠；Free恢复窗口至多6小时或1GB变化量，不能直接当成现有正式7天恢复要求。Launch为US$0.106／CU小时、US$0.35／GB月，最多7天恢复历史按变化数据另计。没有把其营销“Typical spend15美元”当固定套餐。

两个纯算术情景，均假设Worker请求／CPU在US$5套餐包含量内、数据库1GB：

- 数据库每月100 CU小时：5＋100×0.106＋1×0.35＝**US$15.95／月**。
- 数据库0.25CU连续运行730小时：5＋730×0.25×0.106＋0.35＝**US$24.695／月**。

这些数值不含恢复历史／额外备份、密钥、剩余AWS依赖、超额网络与第三方服务，也不代表已测得Rillora需要100CU小时。低流量完整部署可把**约US$20–30／月作为需要验证的目标**，并为恢复／密钥费用留余量；若无法满足完整保障或运行量更高，应报告真实预算，不硬凑目标。开发／合成预览可以争取US$0–5云资源增量，不复制生产真实资料。

现有身份删除worker每30秒轮询数据库。如果直接把数据库搬到支持休眠的服务而保留这种轮询，它仍可能一直被唤醒。按需调度、事件驱动及正确重试是成本迁移的一部分，不能只换连接字符串就宣称会自动省钱。

## Oracle Cloud的费用与账户差异

当前Always Free主文档写A1每月1,500 OCPU小时和9,000GB小时，折合2 OCPU／12GB；另含200GB启动／块存储及5份卷备份。当前总价目表的Container Instances段却明确为**付费租户**写3,000 OCPU小时／18,000GB小时，旧教程亦常写4核24GB。不同页面／账户类型存在差异，不能承诺新免费账户一定得到4核24GB；需要账户控制台确认资格、共享用量和home region容量。

官方明确免费实例可能缺容量，低利用率Always Free实例可能被回收。因此免费OCI很适合合成开发候选，但不把它作为唯一正式数据服务的无条件可用性保证，也不通过造负载规避回收规则。

不依赖免费额度，按A1官方单价US$0.01／OCPU小时＋US$0.0015／GB内存小时，以730小时算：

- 1 OCPU／4GB：**US$11.68／月计算费**。
- 2 OCPU／8GB：**US$23.36／月计算费**。

还需启动／数据盘、备份、密钥／审计、网络超额和税费；这不是Oracle托管PostgreSQL的总价，也不是已证明上述规格足以满足正式容量。可以在OCI Linux实例部署现有ARM Node容器和PostgreSQL，从而减少运行时改造；数据库由我们维护时，必须把自动备份／时间点恢复、补丁、告警和恢复演练一起交付。OCI赠送的Autonomous数据库不是现有PostgreSQL的直接替换。

## 当前代码与已有证据

- API为Express5／Node22，依赖pg、Apple服务端库、Stripe、OIDC及AWS KMS／DynamoDB／S3／Secrets Manager／Lambda／ACM客户端；不把服务器镜像等同于无AWS依赖。
- 当前数据库使用PostgreSQL事务锁、PL/pgSQL、分离角色、FORCE RLS和签名authority。D1的SQLite接口不能只改驱动就保留这些控制。
- 身份删除worker有独立权限／KMS证明边界，不能为合并到一个便宜进程把Auth0删除凭据放回HTTP进程。
- [October17的CF＋Hyperdrive＋Neon合成候选](architecture/ai-hosting-20261017.md)已经记录105条迁移、受限角色和真实OAuth／撤销结果，可以复用经验；它只有两项只读MCP工具，不是完整生产API／支付／文件／删除／独立恢复日志的等价证明。该历史实例额度不代表今天新套餐额度，本轮也没有重跑旧验收。
- 当前法兰克福数据／密钥区域与发布承诺不因费用咨询自动改变。评估Cloudflare执行位置、数据库／对象区域和第三方处理说明后，才能形成确切切换方案。

## 建议下一步与完成边界

先对现有CF合成候选做完整API的最小兼容性与费用验证：登录／会话、一个受RLS保护的读写、一次非扣款的签名验真、文件流与独立任务／恢复日志适配。只运行新增相关用例；原真实购买、恢复、到期和原生安装证据保留。若Worker适配过大或破坏现有控制，再比较OCI实例的完整运维成本。

这一步形成可以评估的完整账单和迁移差异后，再决定具体托管。AWS已查明的额外指标与无通知预算仍是独立的止损项，研究替代平台不把旧账单费用自动暂停。当前没有创建Oracle账号、升级Cloudflare／Neon、移动真实数据库、切换DNS、改变价格或重提Apple。

官方来源：

- [Workers价格与静态资源](https://developers.cloudflare.com/workers/platform/pricing/)、[Node兼容性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)、[兼容日期／HTTP支持](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)。
- [R2价格](https://developers.cloudflare.com/r2/pricing/)、[D1价格](https://developers.cloudflare.com/d1/platform/pricing/)、[D1 SQLite语义](https://developers.cloudflare.com/d1/best-practices/query-d1/)、[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)、[Containers磁盘行为](https://developers.cloudflare.com/containers/faq/)。
- [Neon当前价格](https://neon.com/pricing)。
- [OCI Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)、[Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)、[OCI价目表](https://www.oracle.com/cloud/price-list/)、[A1公开单价](https://www.oracle.com/cloud/compute/arm/)。

本轮仅研究和静态适配判断；安全来源与算术见[回执](../collaboration/verification/hosting-comparison-20261102/README.md)。没有新工程测试、实际容量或迁移完成声明。
