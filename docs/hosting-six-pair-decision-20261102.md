# Rillora 六种托管组合：当前成本、增长成本与迁移取舍

Status: HISTORICAL COMPONENT COMPARISON / LOW-COST PRIORITY SUPERSEDED / NO MIGRATION

Last updated: 2026-11-03 (Asia/Hong_Kong)

Owner要求仔细比较Oracle、Cloudflare、Google分别搭配Neon或Supabase，考虑后续增长和最高性价比。本报告收敛[上一轮广泛比较](cloud-hosting-comparison-20261102.md)的候选排序；旧报告保留其他供应商资料。这不是迁移、开通付费或改变恢复／网络保护的批准。当前生产、价格、真实资料、FanPass、原生17及重提／TestFlight暂停均保持。

## November2历史建议，已由November3复核取代

[Oracle／Google＋Neon专项复核](architecture/oci-google-neon-cost-review-20261103.md)进一步确认两者不能原生接入Neon私网，跨云固定费及后台常驻条件改变了低成本判断。下述11.51／24.96等组件样例不能用作生产迁移推荐；原“先验Cloud Run＋Neon”的优先建议不再有效。当前任务与一个下一步只看[handoff](handoff.md)。

后续Owner已选择先验证CF＋Neon。[November2–3实际验证](architecture/cf-neon-validation-20261102.md)取代本节的执行顺序，记录真实Workers／Neon结果、严格保护下的完整费用分类和报价缺口。下表继续是明确排除额外保护／网络的组件比较，不能直接当作迁移总账单。

**当时建议先验证Google Cloud Run＋Neon；Cloudflare适合公开前端，并作为高请求量时的API候选；Oracle保留为持续负载或实际取得免费额度后的固定算力候选。当时不建议为省钱把数据库迁到Supabase。** 这是November2结合当前Node服务、单人维护、低流量和7天任意时点恢复作出的Agent建议，现已由上方后续证据取代，不是Owner已批准的供应商决定。

Neon的具体套餐必须跟网络要求一起选：Launch没有IP白名单和私网；需要这些能力时按Scale和相应网络费用报价。便宜的Launch公开TLS连接只是一种待评估拓扑，不能直接冒充当前私有RDS的同等保护。原保护未验证等价之前，不移动真实资料。

Google的优势是当前Express／Node应用的迁移范围较小、低流量计算可接近免费且不用维护Linux；它不保证长期费用最低。Cloudflare在每次CPU较少、请求／出口流量较多时有明显优势，但完整支付、文件、独立权限和执行地域需要适配。Oracle普通A1价格也有竞争力，不只依赖免费；我们要额外承担主机维护、容量和故障恢复。

## 比较口径与证据

- 统一比较一个生产API、一个PostgreSQL项目、7天任意时点恢复（PITR）、应用出口和数据库出口；沿用Auth0及现有业务安全模型。没有把Supabase附送但未使用的Auth／Storage当作已经省掉的费用。
- 主表列**可以复算的核心费用小计**，不是全包账单、等价性能基准或上线报价。密钥／审计／对象／独立任务及网络隔离等未实测项在后文逐项列出，不按0元冒充已经覆盖。
- 官方价格查于November2，美元、730小时/月、不含税或承诺折扣。Google实际选法兰克福europe-west3读回；不是复制默认Iowa的单价／出口免费量。普通免费配额假定未被同账户其他服务消耗，试用金不计入长期模型。
- [计算脚本](../collaboration/verification/hosting-six-pair-20261102/model.py)、[全部输入和分项结果](../collaboration/verification/hosting-six-pair-20261102/calculations.json)、[官方来源](../collaboration/verification/hosting-six-pair-20261102/sources.json)和两份Google选区读回可复核。五个独立算术校验通过；不是应用测试或实际容量验收。
- 沿用November2已读取的RDS原生聚合指标：24小时桶CPU平均约4.5%、连接2–3；未测逻辑库大小、跨云延迟或真实代表性CPU。当前1GB内是否装得下仍不能下结论。本轮不扩大生产SQL权限或重新读取用户内容。

## 数据库先作判断

| 项目 | Neon Launch | Neon Scale | Supabase Pro＋7天PITR |
| --- | --- | --- | --- |
| 计算 | $0.106/CU小时 | $0.222/CU小时 | 按实例规格持续计时；Pro另$25/月，组织含$10计算抵扣 |
| 普通数据存储 | $0.35/GB月，按实际计量 | 同左 | gp3预配8GB包含，超出约$0.125/GB月 |
| 7天恢复 | 保留的WAL历史$0.20/GB月 | 同左 | $0.137/小时，730小时约$100.01 |
| 最小恢复配置 | 可低规格按需计算 | 可低规格按需计算 | 至少Small，$0.0206/小时 |
| 数据库公网出口 | 500GB/项目/月包含，超出$0.10/GB | 同左 | 未缓存250GB/组织/月包含，超出$0.09/GB，与其他服务共享 |
| IP白名单／私网 | 无 | 有；私网流量另计 | DB和池支持IP限制；不能把它等同于已建私有网络 |
| 空闲计费 | 可以缩至零 | 可以缩至零 | 运行项目按分配规格计费，低CPU不减少这一项 |

来源：[Neon套餐](https://neon.com/docs/introduction/plans)、[恢复计量](https://neon.com/docs/postgres/backup-restore/history-window)、[Supabase计算](https://supabase.com/docs/guides/platform/manage-your-usage/compute)、[PITR](https://supabase.com/docs/guides/platform/backups)、[磁盘](https://supabase.com/docs/guides/platform/manage-your-usage/disk-size)、[出口](https://supabase.com/docs/guides/platform/manage-your-usage/egress)、[IP限制](https://supabase.com/docs/guides/platform/network-restrictions)。

Supabase的正式起步恢复配置为`25 + 730×0.0206 −10 +730×0.137 = $130.048/月`，尚未加应用服务。$25的Pro日备份保留7天，不等于可还原到这7天内任意时点；不能为得到便宜排名悄悄降低现有恢复目标。计算和PITR也不受普通Spend Cap覆盖，费用提醒不等于硬性总价上限。

Neon付费项目恢复历史**默认1天**，需要明确设成7天；历史GB月指保留的WAL变化量，不是数据库逻辑大小，也不是简单把数据库GB乘7。Launch无最低月费，但不能据此认定正式系统可一直免费。Neon Free的1GB／100CU小时和6小时受限恢复适合独立合成开发，当前正式恢复目标不满足；Supabase Free同样不能用来替代上述生产配置。

两家都提供PostgreSQL。今后更换托管商可以保留关系模型、事务和RLS，仍需验证角色／扩展／池化与恢复；不因费用上升就重写为D1或NoSQL。CU和Supabase规格的近似内存只用于预算选型，不代表CPU性能、IOPS或可用性相同。

## 三种明确假设下的六组合

| 假设项 | 起步 | 增长期 | 较大持续用量 |
| --- | ---: | ---: | ---: |
| API请求/月 | 10万 | 1,000万 | 1亿 |
| 每次CPU／响应耗时 | 10ms／200ms | 同左 | 同左 |
| Cloud Run有效重叠并发 | 1 | 5 | 8 |
| 应用互联网出口/月 | 3GiB | 200GiB | 2,000GiB |
| Neon计算量 | 100CU小时 | 730CU小时 | 2,920CU小时 |
| Neon数据／恢复历史GB月 | 1／1 | 20／10 | 100／70 |
| 数据库公网出口/月 | 5GB | 200GB | 1,000GB |
| Supabase规格／预配盘 | Small／8GB | Medium／20GB | XL／100GB |
| Oracle应用VM假设 | 1台1OCPU4GB | 1台2OCPU8GB | 2台2OCPU8GB |

这是三个预算工作负载，不对应固定注册用户数，也不是Rillora实测预测。初期Neon100CU小时相当于0.25CU运行400小时；后两档是1CU／4CU运行730小时。Oracle每台另含50GB Balanced启动盘，采用正常付费价格，不把尚未取得的免费容量写进基本盘。OracleVM数量是容量假设，未证明能以同等延迟承载表中请求／峰值，亦未证明双机高可用。

Cloud Run按1vCPU／0.5GiB请求模式，以`max(请求数×耗时/实际重叠并发, 请求数×CPU耗时)`估算活跃实例秒数，另计有界后台请求及20%计费时长余量；这20%是规划假设，不是测得的冷启动数据。配置并发上限不能直接当有效并发。原后台循环必须先改成有界执行，才可使用这种按需模型。

| 组合 | 起步核心小计/月 | 增长期核心小计/月 | 较大持续用量核心小计/月 |
| --- | ---: | ---: | ---: |
| **Google Cloud Run＋Neon Launch** | **$11.51** | $130.59 | $814.35 |
| **Cloudflare Workers＋Neon Launch** | $16.15 | **$92.79** | $459.99 |
| **Oracle A1＋Neon Launch** | $24.96 | $111.87 | $459.49 |
| Google Cloud Run＋Supabase | $130.41 | $220.73 | $809.86 |
| Cloudflare Workers＋Supabase | $135.05 | $182.92 | $455.50 |
| Oracle A1＋Supabase | $143.85 | $202.00 | $455.00 |

**不能从小计中的几毛钱差异判断赢家。** Oracle资源吞吐未实测；Google高用量列仍按请求模式展示，为了公平也必须考虑改用实例计费。法兰克福1vCPU／0.5GiB连续730小时的实例计算费约$54.70（仍需出口／入口／峰值扩容等），不是该列必须一直支付的请求计费金额。增长阶段应先优化同平台配置，再决定跨平台迁移。

Google小计已包含一种假设的同源Pages Functions代理：起步在Free日额度和CPU限制内；增长期Paid，代理按1ms CPU／请求估算为$5和$33.40。因为法兰克福不支持原生Cloud Run Domain Mapping，不能默认省略正式域名入口费用，也不强行购买Google负载均衡。Pages子域可用现有DNS的CNAME，不要求更改整个域的nameserver；这里没有实际改DNS，代理安全／地域仍待验证。若采用其他入口，须替换该项费用，不能重复相加。

Google法兰克福向EU／北美／香港的假设出口，前1,024GiB为$0.12/GiB、随后至10,240GiB为$0.11/GiB；故2,000GiB单项已$230.24。不同目的地另算，不能复制Iowa的首1GiB免费或把全球目的地全按该费率。Oracle前10TB出口包含；Workers没有普通网络等待时长／出口计费，但数据库和对象源站仍会收费。

来源：[Workers](https://developers.cloudflare.com/workers/platform/pricing/)、[Cloud Run价格](https://cloud.google.com/run/pricing)、[Google出口](https://cloud.google.com/vpc/network-pricing)、[计费模式选择](https://docs.cloud.google.com/run/docs/configuring/billing-settings)、[Pages子域](https://developers.cloudflare.com/pages/configuration/custom-domains/)、[Oracle A1](https://www.oracle.com/cloud/compute/arm/)、[Oracle磁盘价目](https://www.oracle.com/cloud/price-list/)、[Oracle网络](https://www.oracle.com/cloud/networking/virtual-cloud-network/pricing/)。

## 会改变排序的四个因素

**网络保护。** 同样三档数据量，Neon Scale的数据库小计分别为$22.75／$171.06／$747.24，Launch为$11.15／$86.38／$408.52；这是新增IP限制等能力的真实成本差。需要固定出口时，Cloud Run的NAT／IP以及私网端点还会收费，不能只升Neon套餐便宣称隔离完成。Supabase的数据库／池IP限制不保护PostgREST等HTTPS接口；使用其普通服务身份不能代替当前最小权限角色。当前私有RDS并未开放到公网。

**持续负载。** 上述4CU／约16GB数据库场景中，Supabase约$404.03，Neon Launch约$408.52，只差$4.49，不值得单因这点差价迁库；若原本必须用Neon Scale，则约$747.24，对比差额约$343，值得做性能／恢复／保护等价的迁移评估。Supabase XL与Neon4CU并非已经证明同吞吐或同SLA，数字只说明固定算力路线可能在长期持续用量下反超。

**写入历史与并发。** 增长期若7天保留的WAL计量从10增加到500GB月，Neon Launch数据库小计会从$86.38增至$184.38，高于同一Supabase预算$176.52。Google增长期有效并发从5降到1，其应用＋出口／代理小计由$44.21升到$112.04；并发10则约$36.15。Cloudflare一亿次请求的平均CPU从10ms变为100ms，纯Workers费用由$51.40升到$231.40。必须测实际负载，不能用“用户更多”直接下结论。

**Oracle实际免费资格。** 取得并持续可用的免费计算／启动盘，起步模型可少$13.81，Oracle＋Neon Launch核心小计降至$11.15；仍有Neon与其他保护费用，不能成为整套0元。免费主文档的1500OCPU／9000GB小时与价目表付费租户3000／18000小时分开记录，当前无账户／home-region容量证明；不承诺注册就有4核24GB或升级付费后必不回收。免费VM被回收主要影响API可用性，外部Neon数据库不随这台VM一起被删除；但需实际可恢复部署，不能无视服务中断。[Oracle免费说明](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)。

## 完整账单必须再纳入的项目

| 项目 | 对本项目的核算方式／约束 |
| --- | --- |
| S3文件、原声和版本 | 初期保留现有版本化S3。按实际版本字节、读写请求、跨云源站出口和备份计费；不以PG容量代表文件总量。源站S3出口与GoogleAPI向用户出口可能各收一次。 |
| KMS、秘密与工作负载身份 | 保留区域密钥／加密上下文、分离权限与临时工作负载身份。KMS计费按实际解密／生成／签名操作，不与API请求数机械一比一。当前不是只有一个$1密钥。不能把人用AWS登录凭据部署到新云。 |
| 删除／恢复日志 | 原独立恢复日志、撤销重放、身份删除证明与耐久重试必须延续。不能为少一个worker把Auth0删除权限塞回HTTP进程。 |
| 调度与后台执行 | 现有Stripe每5分钟、Apple每30秒、删除证明每分钟、内容孤儿每5分钟、保留worker和独立删除worker均须处理。不能只改一条30秒循环就宣称数据库会休眠；不能让请求返回后的冻结CPU承担可靠重试。 |
| 诊断日志、告警与备份演练 | Workers默认日志7天不能自动替代当前保留要求；必要日志应正确导出和归档。标准Workers日志November30前20M事件包含，超量$0.60/M；December1公告改按Observability流量／存储计费。业务审计不可因为采样普通日志而丢失。 |
| 私网／固定出口／执行地区 | Neon Launch无IP限制；Scale也需实际网络路线。Cloudflare普通$5套餐不承诺仅在EU执行业务，Regional Services属Enterprise附加能力，且不覆盖Cron／Queue等触发，代码／secrets仍全球部署；需要限定处理地域时不能按普通Workers价冒充完成。 |
| 其他与维护 | 保留Auth0／Resend／支付费用；前端、镜像仓库、任务、备用容量和过渡双运行费另算。Oracle增加补丁、容量、证书／主机故障处理，不能把Agent会话当24小时值守，也不能拿无人员成本的单VM与多副本托管作等价SLA对比。 |

这张清单不是另设上线门，而是现有能力换供应商后的费用和责任。低用量原“$20–30完整目标”只能继续作为待验证的目标，**不能当确定报价**；具体网络／权限拓扑可能使它无法成立。若保留原安全保障后不再划算，应报告真实差额，而不是为了凑价删除保护。当前AWS已查明的可选性能指标和预算零通知仍未修，研究迁移不停止原账单。

当前文件删除代码会列举并删除S3对象的全部VersionId和delete markers；[R2 S3兼容表](https://developers.cloudflare.com/r2/api/s3/api/)并不提供等价完整版本化能力，因此本报告没有假定“把S3改成R2域名”就能保留删除证明。Neon、Supabase也均有其他后端能力；本轮只用它们托管PG，避免额外认证／内容迁移扰动。

[Cloudflare执行地域](https://developers.cloudflare.com/data-localization/how-to/workers/)、[Regional Services套餐](https://developers.cloudflare.com/data-localization/regional-services/)、[日志新价格](https://developers.cloudflare.com/observability/pricing/)、[Workers日志导出](https://developers.cloudflare.com/logs/logpush/pricing/)、[KMS价格](https://aws.amazon.com/kms/pricing/)支持以上差异。Cloudflare地域注意也适用于前述Google边缘代理候选，不能借代理绕过数据处理边界。

## 怎样避免将来再付一次迁移代价

1. **保留标准PostgreSQL、现有Auth0、对象和密钥边界。** 先替换真正昂贵的空闲计算／数据库托管，避免同轮把认证、支付、文件、数据库引擎都换掉。代码中的云接口可以适配，但不能无证据承诺零改造。
2. **开发预览按需，生产保持恢复能力。** 合成资料用免费／临时环境，不把生产真数据复制进免费分支；不再默认复制第二套全天运行的生产资源。
3. **费用触发复核，而不是人数触发搬迁。** 月账单中计算、数据库CU小时、保留WAL、出口或日志任一项成为大头，连续观察代表性负载，再比较候选。Cloud Run先比较并发／请求和实例计费；Neon先看总CU小时与唤醒来源；Oracle先验峰值和运维。
4. **只在净节省足够时迁移。** 用“迁移与验收投入÷每月净节省”看回收期，同时计入维护差异。每月省$4不能支持一轮数据库迁移；多节省几百美元时才更有理由做等价性能／恢复验证。不虚构固定维护工时、用户规模或事故概率。

## November2历史候选顺序（非活动下一步）

当时将Neon作为第一验证对象，套餐由原网络边界决定，并建议先验证Cloud Run的完整Node路径。随后Owner选定CF隔离验证，November3又明确复核Oracle／Google组合；当前不再依据此旧排序推进迁移。Supabase持续负载等候选分析仍仅是有日期的研究，未成为产品或供应商决定。

当时拟定的代表性兼容性与成本检查清单包括逻辑库聚合容量、请求CPU／等待、DB活跃时间、WAL与出口，以及分离角色／事务池／支付验签／文件流／独立删除和恢复重放、工作负载身份／地域及冷启动。未完成项仍不得冒领；已由后续验证覆盖的检查按精确证据沿用。研究本身没有授权或完成新资源购买、迁移或部署，不创建六套常驻云环境。
