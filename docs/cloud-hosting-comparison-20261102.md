# Rillora低成本云服务比较：Cloudflare、Oracle、Google、Azure及其他平台

Status: RESEARCH AND SOURCE FIT REVIEW / PROVIDER NOT SELECTED / NO MIGRATION OR PURCHASE

Last updated: 2026-11-02 (Asia/Hong_Kong)

Owner认为保留现有AWS架构后每月60–80美元仍偏高，先询问Cloudflare和Oracle Cloud，随后要求补充微软、其他高性价比平台及Google。该区间只是[现有资源收敛估计](aws-cost-review-20261102.md)，不是Rillora最低运行成本或Owner已接受的预算。本轮比较最新官方价格、免费限制和活动源码依赖，不开新付费套餐、不迁移真实数据、不改变在审／待重提版本。目标区间仍为Agent建议。

## 判断

Cloudflare和OCI都有可能显著降低当前低流量阶段的现金费用，但路线不同：Cloudflare适合把API和任务改为按请求／事件执行；OCI虚拟机更容易保留完整Node与PostgreSQL进程，但自行管理数据库会增加升级、备份、恢复和故障处理工作。仅把官网搬到Cloudflare省不了当前大头：本次AWS账单的静态分发、存储和API请求费用合计很少，真正需要替换的是全天运行的计算／数据库和额外指标。

补充比较后，按需托管候选为Google Cloud Run或Cloudflare Workers加托管PostgreSQL；若优先低固定现金费用，则比较Hetzner小实例和OCI。Azure Container Apps可行，但不因微软品牌或试用赠金推断整体比AWS便宜。先保持PostgreSQL权限与事务机制，不为追求D1免费额度重写现有安全基础。最终选择取决于完整API兼容性、工作负载实测、7天恢复要求和可获得的账户／区域资源，不以宣传额度判定可上线。

## Google和微软：选对产品比换品牌重要

Google Cloud Run的请求计费服务有每月200万请求、180,000vCPU秒和360,000GiB秒免费额度，按billing account共享、以Tier1价格折算抵扣；地区和计费模式会影响实际金额。实例计费／Jobs的240,000／450,000额度是另一模式，不能拼到同一服务预算。HTTP服务可以min0，数据库、镜像仓库、出站网络、日志、密钥和定时任务仍须单列。

Cloud Run法兰克福europe-west3属于Tier2价格，而且不在其原生Domain Mapping支持地区列表；正式保留域名时需评估现有边缘代理或其他入口，不能遗漏额外负载均衡／网络费用。也不能为了免费Tier1任意改动数据区域。

对当前Express／NodeAPI，Cloud Run通常能保留比Workers更多的常规Node运行方式，这是静态适配判断，不是部署通过。现有AWS镜像为ARM64，Cloud Run当前要求linux/amd64，需本机构建相应镜像；还需调整端口／TLS平台交界、AWS依赖和后台执行方式。30秒轮询不能直接放在请求结束后可能不分配CPU的服务里；Jobs应处理一批后退出，常驻worker pools不自动缩到零。Cloud SQL不能当作Cloud Run免费额度内附送的数据库，便宜shared-core实例也没有SLA。本轮以同一个按需PG方案比较Cloud Run与Workers，避免把不同数据库恢复能力当作算力价格差。

Azure Container Apps的Consumption也有每月200万外部HTTP请求、180,000vCPU秒和360,000GiB秒免费量，按subscription汇总；min0没有计算使用费，保留最少副本则仍可能产生idle费用。Private Endpoints／某些网络及维护选项、镜像仓库、日志、数据库等另计；不用AKS或专用集群作为小型NodeAPI的默认起点。Azure PostgreSQL按计算、存储和配置收费，区域／SKU未选，本轮不把网页默认B1ms示例当法兰克福总报价。

对Rillora，Google Cloud Run应与Workers并列进入小型等价验证；Azure是合理备选，有微软生态或实际优惠资格时再加分。Microsoft/Azure学生／创业优惠与Google新客赠金均只作现金缓冲，资格和允许用途需核实，不计入长期成本，也没有开通任何订阅。

## 其他平台的可比参考

下表为2026年11月2日官方目录／浏览器读回的美元参考项，**不是相同保障的整套Rillora总价**。每个供应商的CPU代际、共享方式、地区及库存不同；未做性能排名。

| 平台／产品 | 已核实价格参考 | 对当前项目的取舍 |
| --- | --- | --- |
| Hetzner欧洲CX23 | 2vCPU／4GB／40GB，US$6.49/月，不含IPv4和税 | 低固定费用值得优先看；数据库自行维护，实际库存未确认。 |
| Hetzner欧洲CAX11 | 2Arm／4GB／40GB，US$6.99/月，不含IPv4和税 | 与当前ARM应用方向接近；仍需独立权限／备份，不是托管PG。 |
| DigitalOcean Basic Regular | 2GiB／1vCPU／50GiB为US$12；4GiB／2vCPU／80GiB为US$24 | 常规VM路线，文档和资源配置明确；数据库、补丁和恢复由我们管理。 |
| AWS Lightsail Linux套装 | 官方2GB／2vCPU／60GB套装US$12/月 | 同一AWS里也有便宜VM路线，但数据库自行维护；不能把当前Fargate/RDS账单当所有AWS产品的价格。 |
| Akamai/Linode Shared CPU | 2GB／1CPU／50GB为US$12；4GB／2CPU／80GB为US$24 | 与DO同一类比较；地区可能有价差，不拿最小1GB宣传价当完整服务。 |
| Railway | Hobby最低US$5、Pro最低US$20，最低消费抵用实际用量 | 容器部署方便；CPU、内存、卷和出站按量，不能理解为5美元无限应用／数据库。 |
| Render | Web512MB为US$7；PG256MB为US$6，PG1GB为US$19；Pro工作区US$25另加compute | 部署与托管PG方便，但7天PITR需要Pro以上，因此13美元起步不是当前恢复要求下的完整价格。 |

Hetzner已于2026年6月15日调价，CX23旧4.99美元、CAX11旧5.49美元不用于当前预算。自动备份额外按服务器价格20%，共7个日备份槽；附加Volumes不包含在这些镜像备份中，也不等价于Postgres任意时点恢复。Hetzner和DO都不会因为只关机就停止VM计费；不能照搬RDS暂时停止的操作来省钱。

Railway用量单价为RAM10美元／GB月、CPU20美元／vCPU月、卷0.15美元／GB月、出站0.05美元／GB。应按所有服务合计实际资源计算；Hobby使用8美元资源时总额是8美元，不是5＋8美元。完整数据库恢复和隔离任务能力需单独核验。

Render的当前动态页面已实际打开：最小Web＋256MBPG为7＋6＝13美元；加满足7天PITR的Pro工作区后为38美元；若选择1GBPG和一个独立512MBworker，则7＋19＋7＋25＝58美元，仍未含额外存储、密钥及网络。这些只是不同资源组合的算术，不断言256MB足以运行当前迁移和支付业务。低预算情况下，Render应按便利程度比较，不按13美元宣传价判为最便宜。

Vultr也在检索范围内，但本轮官方价格页返回403，因此未编造实时价或把它放入有确价的排序。OVHcloud／Scaleway等可留后续，当前已有足够候选，不为了平台数量无限扩展研究。

## 收敛后的候选顺序

1. **少维护、低流量按需运行：Google Cloud Run＋托管PG，与Cloudflare Workers＋托管PG做同等范围验证。** Google保留常规Node更直接，Cloudflare已有合成候选和较低基础费用；完整兼容与账单未实测。
2. **优先最低固定现金费用：Hetzner小VM＋明确的PG备份／恢复与权限方案。** 目标可以比原AWS60–80美元低很多，但增加自行运维工作；库存与符合当前区域要求的方案先核实。
3. **部署体验优先：Railway；Render依实际7天恢复／worker配置计算后决定。** 两者不是无上限固定5／13美元。
4. **微软生态／实际优惠有优势：Azure Container Apps。** 不是简单把AWS全部组件逐项换成Azure同类产品。
5. **OCI、DO、Akamai为VM备选。** 在同样内存、存储、恢复与权限要求下比较，不把试用额度当长期报价。

没有依据宣称一个平台在所有规模和地区都最便宜。也未把公开免费CPU量当作当前真实应用测得的零账单。保留已发现的AWS止损工作；新的供应商研究不停止现有账单。

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

## 增长后的性价比与免费PostgreSQL范围

Owner进一步问CF／Oracle／Cloud Run在用户增长后的性价比、当前免费PG是否足够、未来是否应换数据库。没有一个按注册人数就能确定的永久赢家；应看月活／请求量、每次CPU与等待时长、峰值并发、数据库活跃时间、存储增长及恢复／运维要求。以下是基于当前单价与源码的条件判断，不是跨平台性能实测或未来价格保证。

| 负载形态 | 更值得比较的路线 | 限制 |
| --- | --- | --- |
| 大量CPU较轻、等待数据库／外部API较多的请求 | CF Workers的接口执行费用往往有优势 | 完整SDK、加密／签名验证和当前区域边界仍待验证；全球边缘不自动让PG全球化。 |
| Node依赖较多、流量起伏明显、希望减少主机维护 | Cloud Run的完整容器与按需扩缩具有综合价值 | 计费与分配CPU／内存、实例活跃时长和并发有关，不能只用请求数比价。 |
| 长期稳定、高利用率的计算负载，已有运维能力 | OCI正常价格的VM可有较低原始资源费用 | 单机价格不是同等高可用／备份／运维的总价，也未实测某台VM能承载给定请求量。 |

Rillora当前以事项、权限、邀请、付款状态等关系型操作为主；前两条是现阶段优先候选，OCI仍保留为持续负载／VM路线。不要为尚未出现的用户规模一次铺三套云，也不要把Always Free额度当未来成熟业务的永久成本依据。

### Workers价格敏感性示例

按当前Standard基础5美元、含1,000万请求和3,000万CPU毫秒，超出分别0.30美元／百万请求、0.02美元／百万CPU毫秒计算：

| 月请求数 | 假设每次10ms CPU | 假设每次100ms CPU |
| --- | ---: | ---: |
| 100万 | US$5.00 | US$6.40 |
| 1,000万 | US$6.40 | US$24.40 |
| 1亿 | US$51.40 | US$231.40 |

**这些只是假设的Workers API费用，不是Rillora整套月费、当前实测CPU或可支持用户数。** 假设每次API调用对应一次计费Worker调用。不含数据库、身份／邮件、对象存储、KV／Queues／Durable Objects等额外用量、日志／网络、密钥与剩余AWS依赖及税。CPU执行时间与等待网络的响应耗时不同。OracleVM没有对应的实测吞吐，所以没有把11.68美元单机价格放进每一行冒充等价容量；Cloud Run也没有假造法兰克福并发／实例时长参数。

### PostgreSQL软件与托管商必须分开

PostgreSQL按其开源许可证可无许可费使用，不随用户数量征收数据库软件许可费。Neon、Supabase、RDS、Cloud SQL和自行部署只是不同托管／运维方式。今后Neon费用不适合时，可以继续用PostgreSQL换托管，不必先改数据库引擎。

当前讨论的Neon Free为每项目1GB、100CU小时，恢复窗口最多6小时或1GB变更。固定0.25CU时100CU小时可支撑400活跃小时；按730小时全天运行要182.5CU小时，超过免费量。自动升档时免费活跃小时更少。计费按计算档位乘活跃时间，不按当前CPU占用百分比折算。

现有身份删除worker每30秒处理／查询一次；若不改就搬入Neon，它会妨碍5分钟空闲休眠。开发／合成验收应优先利用Free，但不能直接认定当前正式服务完整落在Free内。6小时恢复也低于当前已选7天目标；7天是当前产品运维目标，不是PostgreSQL许可证或本轮宣称的法律最低要求。

November2实际只读监控：生产RDS最近24个小时桶CPU平均值的算术平均约4.50%，最高单桶观测7.83%，连接数2–3；可用存储约18.308十进制GB（17.05GiB）。这证明当前CPU负载轻，不证明1GB托管存储足够。RDS分配20GiB与实际业务库逻辑大小不同，已用磁盘还含数据库运行开销／日志等；本轮没有读出逻辑数据库大小，也没有读取用户内容。未为得到该数扩大SQL或维护入口，选择前仍需合适的只读容量核验。

### 后期PostgreSQL的性价比

当前没有证据表明需要更换PostgreSQL。它已有适合本项目的关系、事务、角色和RLS机制；未来先核对查询／索引／连接池及并发，再按实际需要升级资源或更换托管。文件与原声继续放对象存储，PG保留元数据／权限，不为容量把大媒体塞入关系库。不能从“注册用户达到某数”推断必须换NoSQL或分库。

Neon Launch的0.106美元／CU小时，按730小时连续运行，单算计算为0.25CU约19.35美元、1CU约77.38美元、4CU约309.52美元；存储另0.35美元／GB月，恢复历史另计。这说明按需服务在长期高占用下未必最便宜，不说明PostgreSQL本身变贵。持续负载时应比较相同内存、恢复和可用性要求下的固定资源PG、自管PG或其他托管PG，不用不同CPU架构或不同保障的标称核心数直接算倍数优势。

Supabase仍然是PostgreSQL方案。其Free当前500MB且闲置可能暂停，Pro25美元起包含7天日备份；**7天日备份不等于7天任意时点恢复**。当前7天PITR加购为0.137美元／小时，约100美元／月，不能把25美元Pro直接当成现有恢复目标的便宜替代。原Auth0无需因选择数据库托管商而改动，认证MAU额度也不是PG可容纳用户数量。

MySQL／SQLite-D1／MongoDB等可以作为不同数据需求的工具，但当前迁移会涉及SQL、权限和事务实现，尚无成本收益证明。先保留PG，把托管配置和备份／迁移路径做清楚；没有因本轮问答更换引擎或创建缓存／搜索／分库等新组件。

本轮只增加三个RDS原生聚合指标的只读查询、官方价格复核和可复算数学模型；不重新验收旧购买／恢复／到期，不部署候选、不改数据。后续只补逻辑容量、代表性请求CPU／数据库活跃时间和等价配置性能费用差异，不能把这张表当成真实市场结果。

依据：[PostgreSQL许可证](https://www.postgresql.org/about/licence/)、[行级权限](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)、[性能判断](https://www.postgresql.org/docs/current/performance-tips.html)、[Neon当前免费量](https://neon.com/blog/neon-free-plan-1-gb-per-project)、[Neon休眠](https://neon.com/docs/introduction/scale-to-zero)、[Supabase价格](https://supabase.com/pricing)、[Supabase PITR](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery)。其他计算来源沿用本报告官方Workers／CloudRun／OCI／Neon价格页。

## 自行维护的实际工作量

Owner进一步询问自管是否麻烦。应区分自管应用进程和自管数据库：前者可以通过固定镜像、进程监管、健康检查、自动证书和受控更新减少日常操作；后者还需要持续备份／WAL归档、备份完整性检查、独立恢复环境、数据库升级、容量与故障处理。不能用一个安装面板或每天导出的SQL文件，替代现有7天时间点恢复与恢复后控制日志重放。

对Rillora，恢复后仍须正确保留付款／到期、撤销共享、身份删除和历史收据；恢复昨天的业务库不能把今天已撤销的访问重新放开。这是当前恢复合同的延续，不是新增高可用性或企业认证门。

| 路线 | 我们额外承担的维护 | 当前建议 |
| --- | --- | --- |
| Cloud Run／Workers＋托管Postgres | 应用依赖、配置、权限、业务故障、费用和恢复验收；底层主机与数据库基础设施由平台处理 | 优先作为少运维基线比较。 |
| OCI／Hetzner仅跑应用＋托管Postgres | 另加Linux／容器主机更新、容量和主机故障处理 | 可接受的折中候选，不要求选VM就必须把数据库也放同机。 |
| OCI／Hetzner同时跑应用和Postgres | 另加数据库基础备份／连续日志、升级、完整恢复和机器／磁盘故障恢复 | 现金费用可能低，但运维责任最多；未证明满足原恢复要求前不搬真实资料。 |

定时备份、监测备份年龄、证书续期、日志轮转、进程重启和费用阈值大多能自动化。数据库大版本升级、错误迁移回滚、备份无法恢复、磁盘／主机故障等仍需判断。正常时期可以低频维护，事故时会集中花时间；本轮没有测得工作量，不承诺每月固定几小时或无人值守。

Agent可以实现部署／备份／巡检脚本，在被唤起且凭据有效时排查故障；对话本身不是24小时值守进程。持续工作需要真实调度、可送达的告警和有界自动恢复；本人MFA／账户恢复等不能由总项目授权代替。托管数据库也不会自动修复应用逻辑或代替我们验证恢复结果。

建议先用托管Postgres作为完整成本比较基准。如果完整自管只比它每月少十几美元，对当前单人首发阶段通常不值得增加数据库故障恢复责任。这是Agent建议，不是Owner已选择托管数据库或批准新预算；仍保持供应商比较状态。

依据：[PostgreSQL连续归档与时间点恢复](https://www.postgresql.org/docs/current/continuous-archiving.html)、[升级和支持政策](https://www.postgresql.org/support/versioning/)及[当前单人运维合同](solo-operations-and-portability.md)。

## 当前代码与已有证据

- API为Express5／Node22，依赖pg、Apple服务端库、Stripe、OIDC及AWS KMS／DynamoDB／S3／Secrets Manager／Lambda／ACM客户端；不把服务器镜像等同于无AWS依赖。
- 当前数据库使用PostgreSQL事务锁、PL/pgSQL、分离角色、FORCE RLS和签名authority。D1的SQLite接口不能只改驱动就保留这些控制。
- 身份删除worker有独立权限／KMS证明边界，不能为合并到一个便宜进程把Auth0删除凭据放回HTTP进程。
- [October17的CF＋Hyperdrive＋Neon合成候选](architecture/ai-hosting-20261017.md)已经记录105条迁移、受限角色和真实OAuth／撤销结果，可以复用经验；它只有两项只读MCP工具，不是完整生产API／支付／文件／删除／独立恢复日志的等价证明。该历史实例额度不代表今天新套餐额度，本轮也没有重跑旧验收。
- 当前法兰克福数据／密钥区域与发布承诺不因费用咨询自动改变。评估Cloudflare执行位置、数据库／对象区域和第三方处理说明后，才能形成确切切换方案。

## 建议下一步与完成边界

优先对既有CF合成候选与Google Cloud Run候选作相同完整API边界的最小兼容性和费用比较：登录／会话、一个受RLS保护的读写、一次非扣款的签名验真、文件流与独立任务／恢复日志适配。只运行新增相关用例；原真实购买、恢复、到期和原生安装证据保留。若按需托管适配过大，再比较Hetzner／OCI实例的完整运维成本。

这一步形成可以评估的完整账单和迁移差异后，再决定具体托管。AWS已查明的额外指标与无通知预算仍是独立的止损项，研究替代平台不把旧账单费用自动暂停。当前没有创建Oracle账号、升级Cloudflare／Neon、移动真实数据库、切换DNS、改变价格或重提Apple。

新增官方来源：

- [Google Cloud Run价格](https://cloud.google.com/run/pricing)、[地区与域名支持](https://docs.cloud.google.com/run/docs/locations)、[容器约束](https://docs.cloud.google.com/run/docs/container-contract)、[Cloud SQL说明](https://docs.cloud.google.com/sql/docs/postgres/faq)。
- [Azure Container Apps计费](https://learn.microsoft.com/en-us/azure/container-apps/billing)、[PostgreSQL规格](https://learn.microsoft.com/azure/postgresql/compute-storage/concepts-compute)、[学生优惠资格](https://azure.microsoft.com/en-us/pricing/offers/ms-azr-0170p)。
- [Hetzner当前调价表](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)、[账单规则](https://docs.hetzner.com/cloud/billing/faq/)、[备份范围](https://docs.hetzner.com/cloud/servers/backups-snapshots/overview/)。
- [Lightsail价格](https://aws.amazon.com/lightsail/pricing/)、[Lightsail具体规格](https://docs.aws.amazon.com/lightsail/latest/userguide/baseline-cpu-performance.html)。
- [DigitalOcean目录](https://www.digitalocean.com/pricing/droplets)、[DO关机计费](https://docs.digitalocean.com/products/droplets/details/pricing/)、[Akamai目录](https://www.akamai.com/cloud/pricing/cpu)。
- [Railway价格](https://railway.com/pricing)、[按量规则](https://docs.railway.com/pricing)、[Render动态价格](https://render.com/pricing)、[Render恢复窗口](https://render.com/docs/postgresql-backups)。

原CF／OCI来源：

- [Workers价格与静态资源](https://developers.cloudflare.com/workers/platform/pricing/)、[Node兼容性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)、[兼容日期／HTTP支持](https://developers.cloudflare.com/workers/configuration/compatibility-flags/)。
- [R2价格](https://developers.cloudflare.com/r2/pricing/)、[D1价格](https://developers.cloudflare.com/d1/platform/pricing/)、[D1 SQLite语义](https://developers.cloudflare.com/d1/best-practices/query-d1/)、[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)、[Containers磁盘行为](https://developers.cloudflare.com/containers/faq/)。
- [Neon当前价格](https://neon.com/pricing)。
- [OCI Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)、[Free Tier](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm)、[OCI价目表](https://www.oracle.com/cloud/price-list/)、[A1公开单价](https://www.oracle.com/cloud/compute/arm/)。

本轮仅研究和静态适配判断；安全来源与算术见[回执](../collaboration/verification/hosting-comparison-20261102/README.md)。没有新工程测试、实际容量或迁移完成声明。
