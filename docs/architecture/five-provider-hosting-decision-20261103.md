# 五家托管方案：完整运行预算、保护映射与推荐

Status: RESEARCH COMPLETE / AWS OPTIMIZATION RECOMMENDED / NO DEPLOYMENT OR MIGRATION
Last updated: 2026-11-04 (Asia/Hong_Kong; Apple scope addendum, November3 cost model unchanged)

Owner要求按正确方法重新比较AWS、Cloudflare、Oracle、Google和Vercel，保障不降低、列全月费与改造并给明确推荐。本轮延续成本调查；没有迁移真实数据、改当前审核、发TestFlight、创建付费资源或发送暂存的供应商询问。

**推荐：当前保留AWS私有托管核心，先做可选监控及按需Preview收敛；第二阶段再验证独立删除任务按需化。继续使用已经适合免费静态托管的Cloudflare公开页面，不为节省很小的前端费用重构整个产品。** 这不是说AWS永远最便宜：本轮现金最低的可设计路线是Oracle付费A2＋自管PostgreSQL，但其新增维护与安全适配成本，目前不足以被约20美元/月的差价抵偿。

这是指定工作负载的**完整云托管预算**，不是只报主机／数据库起价，也不是供应商固定报价、实际新账单或容量测试。新平台的保护映射只有设计证据；所有必要验收通过以前，都不能迁移真实数据或声称等价安全。

## 统一范围及数字的来源

- 一个生产环境每月730小时；隔离Preview运行48小时，停机仍保留磁盘、凭据和恢复材料。现在Preview尚未按此停机。
- 每月10万用户API请求，另外计后台任务；网关预留25万计费单位，包含探针及大载荷的分段计费，不能把大文件一次HTTP请求恒算一个AWS计费单位。
- 每环境5GiB逻辑数据库作为规划输入，AWS／Google各分配20GiB；Oracle独立数据盘最低50GB。不是当前真实数据量或可容纳用户数的测量。
- 私有文件／版本／独立导出／日志档案和少量公开静态产物合计80计费GB，另计40GB原生数据库备份，镜像仓库另计2GB。Oracle不能把数据库WAL偷塞进已经用完的80GB来降低比较结果。
- 生产数据库7天PITR、Preview原有1天、独立恢复日志35天恢复能力；普通恢复记录90天，活动保留令无自动到期。MCP撤销／消费状态不得因恢复而复活。
- 日志2GiB/月，保留30天；16项业务自定义指标、22项标准告警。取消的是126条额外Container Insights序列，November2读回没有告警依赖它们，不删付款、恢复、删除或可用性告警。
- 目标拓扑预留28个独立凭据记录、6个计费密钥版本、30万次加解密、10万次凭据读取。包括新按需探针的两套最小身份；不是本轮重新点数的云端库存。
- 独立状态按40万写单位／40万读单位、2GB状态和1GB日志PITR计；互联网出口10GiB，Google NAT额外按双向20GiB计；每月2小时隔离恢复演练已计费。
- 沿用Auth0、Resend、Zoho及现有域名。示例约束为不超过1,000身份月活、1,000事务邮件/月且100封/日以内，适用原免费量。Stripe／Apple抽成按交易另计，不伪装成托管免费量。
- 不计未获赠金、试用额度、免费计算实例、竞价实例、长期承诺折扣；合理使用持续免费配额。免费配额须由Rillora实际可用，不能借用FanPass余量。只用本机构建，无云CI。

统一金额为USD税前。表覆盖前端、API、后台、数据库、文件、密钥、凭据、恢复、网络、监控、镜像、证书和演练；**共同不变的域名续费、Apple开发者年费、支付手续费、税及人工不属于云资源账单**，没有被记成0。Apple年费等共同支出应加入经营预算，而不会改变五家托管排序。跨云按最小改造保留的AWS部分已计入相应总额。

基线是[November2真实费用与资源读回](../aws-cost-review-20261102.md)，本轮读取当前活动源码及November3官方区域价。AWS CLI实际已过期；没有为研究要求Owner再次MFA，也没有伪称已刷新实时库存。原始安全账单明确：**October资源120.63，抵扣83，实际支付37.63，余下额度0**。37.63不是无抵扣的长期整套费用。当前结构按本表未来满月假设为146.42，也不是重写October发票。

## 可比的完整月费

| 路线 | 实际部署范围 | 月均云费模型 | 建议预留预算 | 判断 |
| --- | --- | ---: | ---: | --- |
| AWS阶段A | 原RDS／API／独立worker；去可选性能指标，Preview每月48h | **73.35** | 85 | 优先做，改造较少；尚未部署 |
| AWS目标 | 阶段A＋有界独立删除任务；所有凭据仍用Secrets Manager | **65.71** | 80 | 当前明确推荐的最终方向；先通过任务故障／恢复验收 |
| Cloudflare公开层＋AWS核心 | CF只放公开静态面，私有API／数据库／密钥等仍为上行AWS目标 | **65.71** | 80 | 完整混合账单；不声称产品全部迁入CF |
| Oracle付费A2＋自管PG | 两环境分别API／DB虚机，原生Vault／对象存储／独立Functions／状态表 | **46.07** | 60 | 现金低，但需要最多运维与安全重构；区域容量尚未核实 |
| Google Cloud Run＋私有Cloud SQL | Google计算／PG；保留AWS对象／密钥／恢复状态及现有入口 | **86.11** | 110 | 含受限出站NAT，不再只报Cloud Run低调用费；共有两家云账单 |
| Vercel公开层＋AWS核心 | 独立Pro团队承载公开静态面，私有核心保持AWS目标 | **85.71** | 100 | 比AWS目标多Pro20，当前没有降本理由 |

预留预算是处理波动的管理建议，不是已批准购买、固定月费或自动断服务上限。Oracle的A2若不可用，按同一内存／磁盘范围换付费E4，模型**62.06**；不能拿免费A1容量承诺替代。Google上述g1-small共享核没有Cloud SQL SLA；换专用1vCPU／3.75GiB时总计**116.61**。这两项不能省略后仍宣称相同服务承诺。

如果把原托管数据库的供应商SLA也列为不可降低的保障，Google应采用116.61的专用方案；86.11仅是披露该差异后的技术成本备选，不自动视为合格替代。Oracle则必须明确由项目承担数据库可靠性维护，不能用VM的SLA冒充托管PostgreSQL承诺。

CF全核心Workers＋Neon，以及Vercel全核心Functions＋Neon，仍有未报价／未验收项目，**完整总额为未确定**。它们不能混入上表已明示范围的混合总账，也不能用旧168.59／157.15／200.95的托管VPN案例代表最低费用。Vercel已有Pro PrivateLink，但Advanced Networking基础费、连接范围及现有保护映射没有闭合；CF核心区域／独立密钥／私网路径亦未闭合。原先8次CF合成运行只证明限定兼容性。见[CF验证](cf-neon-validation-20261102.md)和[Vercel复核](vercel-cost-method-20261103.md)。

## 总账拆分

下表每一列是整套路线的一部分；所有行相加才是前述总费。小数四舍五入可产生0.01差异，精确结果见[可执行模型](../../collaboration/verification/five-provider-decision-20261103/model.py)及[完整输入／输出](../../collaboration/verification/five-provider-decision-20261103/model.json)。

| 费用项 | AWS目标 | Oracle A2 | Google混合 |
| --- | ---: | ---: | ---: |
| API／独立任务／Preview计算及对应IP | 14.06 | 26.45，含PG虚机计算 | 2.68 |
| 托管PG计算＋常驻磁盘／OCI全部启动盘和数据盘 | 20.26 | 12.75 | 40.84 |
| 原生数据库备份 | 2.06 | 1.02 | 3.84 |
| 独立凭据＋密钥服务 | 18.54 | 0，明确配额内 | 18.54，仍付AWS |
| 私有文件／版本／独立档案及对象请求 | 2.06 | 2.20 | 2.06，仍付AWS |
| 恢复日志／MCP状态 | 0.61 | 2.77，Preview另付费 | 0.61，仍付AWS |
| DNS／发现／网关／调度／出站 | 3.41 | 0.75 | 14.26 |
| 监控告警 | 3.05 | 0，明确配额内 | 3.05，保留原业务告警 |
| 镜像存储 | 0.20 | 0.05 | 0.15 |
| 可导出内部TLS证书月均 | 1.39 | 0，OCI证书服务 | 0，托管TLS路径需验收 |
| 隔离恢复演练 | 0.08 | 0.09 | 0.10 |
| **精确模型总和取两位** | **65.71** | **46.07** | **86.11** |

AWS RDS单可用区t4g.micro0.019/h、gp3 0.137/GB月、超出免费分配的备份0.103/GB月，均用Frankfurt SKU；40GB备份中保守按20GB付费，不能把停止Preview当其存储免费。实际分配随库存／保留量改变。当前可导出证书每次签发／续期7美元，198天有效、提前45天续，模型按长期平均约1.39/月；续费月现金为7，非每月实际扣1.39。[RDS价格](https://aws.amazon.com/rds/postgresql/pricing/)、[ACM价格](https://aws.amazon.com/certificate-manager/pricing/)、[续期规则](https://docs.aws.amazon.com/acm/latest/userguide/acm-exportable-certificates.html)。

Google浏览器实际选择Frankfurt：g1-small0.042/h，SSD约0.204/GiB月，备份约0.096/GiB月；7天同区域PITR日志按当前Cloud SQL规则不额外收WAL存储费。Cloud Run混合计费CPU／内存仅扣一次Tier1价值的免费量。外部网络另列，不能用“无需VPC connector”推导“不用NAT”。[Cloud SQL价格](https://cloud.google.com/sql/pricing)、[PITR存储](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/restore)、[Cloud Run计费](https://cloud.google.com/run/pricing)。

Oracle用付费A2每OCPU0.014/h、每GB内存0.002/h；每环境API1OCPU／1GB、DB1OCPU／2GB。A2的一个OCPU是两个物理核，不能与A1或其他云一个vCPU直接画等号。四个50GB启动盘＋两个最低50GB数据盘，共300GB；Balanced10VPU为0.0425/GB月，停机也收费。原生托管Oracle PostgreSQL的0.098/OCPUh是另加的服务费，不是完整数据库价，因此没有拿它冒充这里的自管DB。[USD价目](https://www.oracle.com/cloud/price-list/)、[计算规格](https://docs.oracle.com/en-us/iaas/Content/Compute/References/computeshapes.htm)、[数据盘下限](https://docs.oracle.com/en-us/iaas/Content/Block/Tasks/creatingavolume.htm)、[托管PG计价](https://www.oracle.com/cloud/postgresql/pricing/)。

## 为什么若干行是0

0只在本表界限内成立，不是遗漏，也不计尚未获得的Startup补贴。

| 服务 | 计0的条件／未消失的工作 |
| --- | --- |
| 公共静态前端／边缘／出口 | 保留现有CF静态面及CloudFront按量方案，后者持续额度1TB／1,000万请求覆盖模型；私有响应仍no-store，完整传递Cookie／鉴权头。不是将所有请求缓存来省钱 |
| AWS日志／基础Lambda／Scheduler | 2GiB日志在5GB额度内；有界函数计算和调用低于持续额度；Scheduler低于1,400万调用。业务指标、告警、GetMetricData及Step Functions另收并已列入 |
| Google任务／调度／日志 | 不超过3个Scheduler作业、100万Cloud Tasks计费操作、50GiB日志和150MiB监控数据；任务不能无界轮询。GCP计算另计，原AWS业务告警仍保留。告警新价官方列不早于2027-09-01，不提前收取 |
| OCI密钥／凭据 | 共享Virtual Vault的非导出HSM版本少于20；Secret服务免费。不是购买Dedicated Vault，也不是把包装主密钥塞进环境变量 |
| OCI独立Functions | 两环境合计小于200万次调用／40万GB秒；8MiB文件由API虚机处理，不能送进Functions的6MB后端限制 |
| OCI状态表 | 生产恢复与MCP使用两张免费表；免费上限三张。两张Preview表按各10读／10写吞吐单位、1GB付费，共2.768/月，未声称四张都免费 |
| OCI网络／证书／监控 | 同区域VCN／Service Gateway／受限出站路径，标准OCI证书、私有DNS；10GiB公网出口在10TB配额内；2GiB日志在10GB内、指标／通知亦在额度内。具体账户权限／配额仍需开户后的只读核实 |
| 构建／支持 | 本机构建；各云基础支持，不含付费企业SLA、托管DBA或人工值班 |

依据：[CloudFront持续免费量](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/)、[CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)、[Scheduler](https://aws.amazon.com/eventbridge/pricing/)、[Google监控](https://cloud.google.com/products/observability/pricing)、[Oracle Vault](https://www.oracle.com/security/cloud-security/key-management/)、[OCI免费状态表范围](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)、[OCI网络费用](https://www.oracle.com/cloud/networking/virtual-cloud-network/pricing/)。账户级其他用量若占用额度，应重新计费；不是默认给每个项目重复一份。

## 保护合同与每家改造

| 现有保障 | AWS收敛 | Oracle | Google | CF／Vercel |
| --- | --- | --- | --- | --- |
| 无公网DB、来源受限、全程校验TLS | 保持原RDS／Security Groups | 两个隔离环境；DB私有子网，仅API／授权任务来源；验证后端CA | Cloud SQL私有IP；Direct VPC＋防火墙，全部出站经NAT | 表中混合路线不动AWS保护；全核心网络尚待闭合 |
| 主机出站受限 | 保留443、Apple17/8的80例外及指定5432 | NSG／路由保持对应限制；DB不拥有任意公网出口 | **必须all-traffic**；private-ranges-only会让公网请求绕过VPC防火墙，不合格 | 全核心需另证，不能用TLS代替网络约束 |
| 非导出包装密钥、用途与主人绑定 | 不动既有加密；不迁凭据到SSM | OCI Vault AES／DEK包装、associatedData；须重写SDK并验证跨版本包封、轮换与恢复 | 最小改造保留原AWS KMS，精确工作负载OIDC换短期凭据 | Vercel同名KMS为签名服务，不能直接代替信封加密 |
| RLS／签名租户上下文／近期认证 | 全保留 | 普通Postgres保留schema／角色，发行版／扩展／升级兼容要测 | Cloud SQL角色／扩展／TLS／连接池实测；不能默认有superuser | 普通运行时兼容不等于上述保护已验证 |
| 独立身份删除与限权运行 | 固定有界任务及独立角色 | API VM身份与删除Function／日志Function分离，API无删除服务凭据 | 独立Cloud Run服务账号／Jobs，OIDC条件不能共用高权限subject | 全核心需独立执行权限，不可只换一环境变量 |
| 强制恢复记录／35天可恢复／不复活删除 | 保留原Dynamo条件写与DB签名回执 | NoSQL强一致／CAS＋独立不可变档案；完整重演／故障顺序需重写验证 | 保留AWS broker／Dynamo与对象版本；网络调用失败仍fail closed | 不得用普通最终一致KV或日备份代替 |
| MCP撤销／单次使用状态 | 保留独立表，不回卷已消费令牌 | 独立状态表与强一致、条件更新，恢复后全部旧凭据不得复活 | 保留独立Dynamo状态，OIDC最小权限 | 需保持现有OAuth／撤销语义 |
| 文件版本、删除证明、恢复 | 保持S3 VersionId／KMS | 重写对象适配；**版本化和retention rule不能同桶**，内容桶与不可变档案桶分开 | 最小方案保留S3，计跨云出口 | Vercel4.5MB低于原8MiB；直传明文不是可接受的省钱办法 |
| 核心Frankfurt处理与密钥区域 | 保持 | Frankfurt形状容量／IAM／支持范围待实际核验 | Europe-west3计算与PG，AWS密钥和内容仍eu-central-1 | 公共静态全球CDN和私有核心地域是不同范围 |

Oracle对象存储是强一致，但这不自动证明新日志协议正确；NoSQL多条原子写也有同一shard-key限制。当前日志会更新最新revision，不能随意简化成普通追加文件。活动保留令无TTL必须保留。[Oracle对象语义](https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm)、[版本化限制](https://docs.oracle.com/en-us/iaas/Content/Object/Tasks/usingversioning.htm)、[NoSQL事务边界](https://docs.oracle.com/en/database/other-databases/nosql-database/25.1/nsdev/transactions-nosql-database.html)。

Google的网络预算按每个活跃环境平均4个NAT分配、两枚IPv4整月保留、双向20GiB，总计12.56；这是显式规划量，实际NAT分配受扩缩容影响。采用两个环境各自受限网络，不以共享高权限代理省钱。仅gateway小时费到官方上限时比本模型多29.88；需在隔离验证读取真实NAT计费，不能承诺永远86.11。Direct VPC可能存在30秒至一分钟以上冷连接，必须通过启动／购买回调时延验收。[NAT计价](https://cloud.google.com/nat/pricing)、[Direct VPC限制](https://docs.cloud.google.com/run/docs/configuring/vpc-direct-vpc)。

Google选保留CloudFront入口，而不是Firebase Hosting代理私有API：Firebase会过滤除`__session`外的Cookie，不能静默改掉当前`__Host-`会话／CSRF合同。入口必须保留所有必要鉴权头、Cookie和no-store，并防绕过。[Firebase Cookie规则](https://firebase.google.com/docs/hosting/manage-cache)。Google调用AWS采用精确aud／azp／sub的短期角色，不能下载永久AWS密钥。[官方工作负载联邦方案](https://aws.amazon.com/blogs/security/access-aws-using-a-google-cloud-platform-native-workload-identity/)。

## 实施工作与是否值得

**AWS阶段A：** 禁用已核对无告警依赖的额外Container Insights；保留业务告警及日志；实现只允许操作Preview资源的启动／停止计划，处理RDS停止七天会自动启动、存储持续计费、未完成任务和预览回调。补实际预算通知，按未抵扣资源费监测。原生产API／数据库／worker／付款时序不变。代码／合成验证完成后才能部署，本轮没有执行。

**AWS第二阶段：** 独立删除worker改有界运行。数据库队列仍是持久事实源；私有只读探针只允许执行“有无任务”的窄函数，不持有Auth0删除凭据。固定Step Functions仅可启动确切task definition／角色，不接受用户提供命令、角色或容器覆盖。即时唤醒＋五分钟恢复兜底、超时／重试／死信及并发幂等必须验证；删除证明仍按原请求时刻验证，不能因调度延迟延长用户认证窗口。每月1,000次、每次120秒用于预算。API内原Apple30秒／Stripe五分钟等计时器仍可在常驻API运行，不因这一步被删除。

不把15个凭据转成SSM SecureString的潜在6美元收益放进推荐总费：轮换、版本恢复、尺寸和精确权限未读回验证。原Secrets Manager全部保留，避免把重要安全改造藏进降本数字。

**Google：** 原Node API可复用大部分领域代码，但`server.ts`所有进程定时器要拆成持久有界任务，保留Apple30秒重试语义、Stripe入站／重试、保留与孤儿清理。需改Cloud SQL角色/TLS、私有网络、受限出口、AWS短期身份、部署和回滚；全部启动、重试、支付归属、8MiB、MCP及恢复链路要验收。67,200 job CPU／GiB秒及165,000请求CPU／GiB秒是包含后台与演练的预算，不是用用户请求数推导出的实测。仍有两家云服务，现阶段无成本优势。

**Oracle：** 除相同的任务边界外，还要写Terraform／镜像维护、Postgres安全安装与升级、WAL归档／7天PITR、独立恢复日志和MCP适配、Vault、对象版本／完整删除、主机证书续期、告警／故障替换／磁盘容量管理。每环境API与数据库分机，API不得拿DB主机管理员或删除Function身份；数据库备份不等于原生PITR实证。补丁、恢复失败和夜间故障由项目负责，不是假定云厂商代做。不能声称这些运维永久免费。

**Cloudflare／Vercel：** 只迁公开网站的工作是缓存／重定向／SEO／CSP／发布回滚，私有核心仍付费。现有S3＋CloudFront在October合计仅约0.048美元，搬公开网站不解决RDS／常驻任务／性能指标大头。Vercel商业用途不能用Hobby，Pro20美元只算一次且额度不能抵外部AWS账单。[Vercel Pro](https://vercel.com/docs/plans/pro-plan)、[Hobby限制](https://vercel.com/docs/plans/hobby)。全核心版本要处理前述网络、地域、4.5MB载荷和Cron差异，当前不推荐为它立刻迁移。

## 增长、人工和迁移期间双账单

不能用“用户数”直接预测费用，应每月记录API计费CPU／内存、DB工作集／CPU信用／连接／WAL、对象版本增长、日志与出站；达到容量／延迟门后再升规格。下列只是本模型的边际变化，不是百万用户容量承诺：

- AWS Preview若仍整月运行而非48小时，目标再加35.27；126条额外性能指标再加37.80。这比搬静态官网更值得先处理。
- 同样请求数若数据库CPU信用、文件／WAL、跨AZ流量或日志超量，按实际新增计费，模型不保证固定账单。保留现有单可用区基线，没有假称多区容灾。
- 对象存储额外100GB：AWS约2.45、Oracle约2.55，未含新增读写；Oracle每个环境API与DB各加1GB内存约加3.11。Oracle生产免费状态表不可用时，同50读／50写吞吐规格约加13.31。
- Oracle A2比AWS目标仅省约19.64/月、235.68/年；E4回退后只差约3.65/月。额外维护劳动、重构与过渡运行可以轻易吃掉差价。这是选择AWS的主要理由，不是声称Oracle云资源更贵。

`回本月数＝（一次性改造劳动成本＋过渡双跑费）÷（每月云费节省－新增运维劳动成本）`。分母非正就没有财务回本点。人工没有实测工时，本轮不捏造“维护只需几分钟”或确定开发天数。举例仅为算术：若一次性投入500美元且新增运维成本为0，19.64差价也约需25.5个月；并非工程报价。

过渡期间不能立刻扣掉旧AWS账单：旧数据／密钥／备份须保留至验证及保留期完成。本次不迁移，所以没有产生过渡费；未来某月全量双跑的预算需将旧环境实际费用与新环境运行费相加，再按可删除资源、保存期限和退出流量逐项释放。未核定前不写已省钱。

## 最后验收与下一步

本轮只完成公开单价核对、活动源码控制核对、13项十进制／范围校验和文档发布检查；不是新的性能、迁移、安全攻防或付款验收。旧CF／MCP／真实支付证据沿用，未重跑。

明确排序为：**当前先AWS阶段A → 验证AWS有界worker → 按实测再决定是否值得做Oracle隔离候选**。Google列为托管替代备选；CF保留公开层价值；Vercel目前不增加。无需等待未发出的供应商询问才能确定这个当前建议，亦不把建议写成Owner已批准的新预算。

下一步只准备AWS阶段A的可回滚变更与本机／合成验证，先读回当前配置并确认业务告警依赖；本轮不变更线上。真实数据迁移、审核／TestFlight及供应商外发继续保持原限制。完成模型不等于批准或完成新平台迁移。

## November4补充：Apple云服务的适用范围

Owner询问Apple是否也有云服务。当前官方资料确认三种不同用途：iCloud／iCloud+面向个人文件和设备同步；CloudKit面向App的记录、资源、同步与共享；Xcode Cloud用于构建／测试／交付。CloudKit提供CloudKit JS与Web Services，不能误写成只能用于iPhone；它也不是可直接上传现有Node容器、部署PostgreSQL和长期后台的通用计算平台。[iCloud](https://www.apple.com/hk/icloud/)、[CloudKit](https://developer.apple.com/icloud/cloudkit/)、[CloudKit JS](https://developer.apple.com/documentation/cloudkitjs)、[Xcode Cloud](https://developer.apple.com/xcode-cloud/)。

CloudKit私人数据库依赖用户自己的iCloud身份，数据计入用户个人配额；公共数据库按App容器配额管理，服务器到服务器密钥可用于公共数据库。公共／私人是服务模型，不能把“公共”名称直接当作无需权限保护。官方产品页列最高1PB公共数据能力，本轮没有取得适用于Rillora全运行范围的免费保证或超额报价，因此不据此推出整套免费，也不拿iCloud+个人套餐代替服务器费用。[容器与配额](https://developer.apple.com/documentation/cloudkit/ckcontainer)、[Web Services身份](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/CloudKitWebServicesReference/SettingUpWebServices.html)。

对Rillora的判断：可以研究Apple设备间的可选偏好同步或用户主动保存的备份，但现有Web／邮箱及Google身份、亲友权限、支付回调、独立后台、PostgreSQL RLS和恢复日志不能原样迁入CloudKit。采用它须重新设计存储／身份映射和验收，仍有外部业务服务器费用；当前不把它推荐为整体降本替代。私人iCloud备份也不能直接等同身后自动披露或服务器可替用户解锁。Xcode Cloud是云CI，Owner当前本机验证决定保持。没有新平台开通、运行测试、应用改造或审核变更；原五家费用及下一步不变。
