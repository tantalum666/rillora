# Cloudflare＋Neon 隔离验证与完整成本边界

Status: SCOPED LOCAL AND CLOUD RUNTIME PASSED / MIGRATION NOT READY / COMPLETE QUOTE OPEN
Last updated: 2026-11-03 (Asia/Hong_Kong)

Owner选择先验证CF＋Neon，优先使用适用免费量，原安全保障不降低、不迁移真实数据、不影响当前审核，完成后推Git。此选择取代[六组合报告](../hosting-six-pair-decision-20261102.md)里Agent先验Cloud Run的建议。当前交付是可复现的隔离验证、完整费用分类与迁移清单；不是生产切换、已完成所有业务验收或已经取得创业赠金。

## 结论

完整API模块能够装入Workers，并已在真实Cloudflare Free上完成本轮固定探针；Hyperdrive也已实际接通既有Neon合成项目。打包阶段没有发现的Apple库导入时随机数、Pino浏览器分支和证书模块问题已在独立验证包解决，未改应用源码。

**不能据此按十几美元预算迁移生产。** 当前私有数据库、7天PITR、独立KMS、外部强制恢复日志、隔离身份删除与地域边界没有被免费候选覆盖。按下方保守架构，已知费用小计约US$168.59/月，另外仍有区域控制报价和实际用量差额；若Neon明确支持当前单项目只配置一个endpoint服务，该同一模型的小计才降至约US$107.27。这是一个明确假设下的工程参考，不是CF＋Neon的最低可能价格，也不是购买决定。

低成本路径依然可能存在，但需要供应商确认网络／地域能力，以及真正完成按需任务改造。当前没有足够证据证明在保留所有既有保护时，完整迁移比收敛原AWS更划算；先不迁移真实数据是当前正确边界。不得用公开数据库、较短恢复窗口或同进程主密钥来使预算成立。

## 实际做了什么

[验证源码](../../infra/hosting-validation/README.md)独立于apps和现有AWS部署。使用Wrangler4.156.1、Miniflare5.20261101.0-beta及真实workerd，依赖锁文件已保存。完整构建含外部公开Apple根证书约2,778KiB，gzip约763KiB。上云JavaScript SHA256为`0ee187785cde74ee1179e7a6c022d7d6a10ef5f3b4e1e610a6b1aa069d8df4da`。

| 范围 | 当次证据 | 不应扩大为的结论 |
| --- | --- | --- |
| 真API路由 | 健康200、未认证事项／付款／文件401、不可信Origin403及安全响应头，在本机和实际Worker均符合预期 | 没有把完整已登录CRUD、邀请、导出或真实支付算成通过 |
| 探针隔离 | 无口令及未知路径404；只允许固定GET检查、短时随机口令、明确过期时间 | 没有任意SQL、代理URL、普通客户入口或生产凭据 |
| Stripe SDK | 内存合成事件的真实HMAC验证通过，改动后的原文拒绝 | 没有新Stripe付款／退款，没有访问Live账户 |
| Apple SDK | 原固定G3根证书DER哈希、自签名验证、SDK构造和非法JWS拒绝通过 | 未证明新的有效Apple证书链／在线OCSP或真实购买；旧真实购买／恢复／到期证据沿用 |
| 文件加密 | 实际LegacyContentCipher的4KiB、8MiB上限往返、错误主人及篡改拒绝，在本机和云端通过 | 密钥为一次性内存合成替身，不冒充KMS、S3／R2文件上传或最终删除验收 |
| Neon连接 | 实际Hyperdrive→Neon只读事务；登录非superuser／BYPASSRLS／建库／建角色／inherit，未签名authority无效 | 沿用105迁移的旧合成候选；未执行新108迁移、签名写入或7天PITR |
| 延迟 | 两次DB检查3373ms、771ms；客户端总墙钟4.362s、1.765s | 样本小、不是生产SLO或CPU计费值；Placement优化尚未实测 |

云端共8个有界HTTP调用，包含两次相同路由／DB检查用于区分首次与随后调用。控制台显示8次invocations、0错误，CPU Time卡片为12ms；未确认该卡片聚合口径，不把它换算成每次业务请求CPU或未来月费。旧MCP登录／撤销、旧真实购买、原生安装及全套应用测试没有重跑。

## 清理与提供方状态

Workers实际账户为Free；Neon现有候选为Free、aws-eu-central-1、PG16、固定0.25CU、6小时恢复和既有低项目配额。Hyperdrive来源证书verify-full、查询缓存关闭、源连接限制5。未开付费套餐、未创建第二个数据库项目、未改生产DNS／身份／付款／审核或FanPass。

临时Worker只部署到`rillora-hosting-validation-20261102`，不绑定正式域名。验收后其workers.dev与preview地址均关闭，实际访问返回404，DATABASE绑定已解除；原共享Hyperdrive与Neon资源未删除。口令已按原90分钟窗口过期、从编排内存释放；提供方仍保留加密的过期秘密，未宣称已从所有历史版本删除。没有Cron、Queue或邮件触发器，也未连接云端CI。

Cloudflare账单API不支持现有OAuth权限，改用原浏览器Google会话核对Free，未要求Owner重复登录。后续MCP管理连接出现传输错误，清理通过已登录后台完成。AWS CLI在额外只读清单请求中实际过期；本轮不依赖新部署，因此沿用今天账单和当前IaC，不为该可替代读取要求新MFA。没有把工具错误改写成提供方登录或业务故障。

## 迁移必须处理的变化

| 项目 | 具体工作和不得降低的边界 | 本轮状态 |
| --- | --- | --- |
| 启动与HTTP | 用Workers请求入口替代server.listen进程；Apple依赖的初始化放入请求上下文；生命周期不能依赖常驻进程 | 隔离适配实测通过，生产入口未改 |
| 打包／日志／证书 | 固定Pino Node入口，保留原脱敏器；显式打包并校验Apple根证书；生成Wrangler绑定类型 | 构建及基础运行通过；完整日志脱敏回归仍须补 |
| 数据库 | 每请求pool生命周期、Hyperdrive无查询缓存、来源TLS验证；保留真实低权限角色、HMAC事务授权、RLS、锁、完整迁移校验和 | 只读连接／无签名负例通过；签名写入及108迁移未在新目标完成 |
| 网络 | 私网接入完成后还必须显式block_public_connections并验证公网拒绝；仅有TLS或建了PrivateLink不等于已私有 | 当前Free合成项目仍公开TLS；生产未改变 |
| 密钥与云身份 | 保留非导出KMS主密钥、namespace／owner／用途约束和短期工作负载身份；不把管理员Access Key或根密钥塞进Worker | 原AWS实现沿用；跨云受限通道／适配器待实现 |
| 恢复 | 外部日志broker仍独立验签、回执与SQL提交绑定；恢复后重放撤销／删除并核对付款状态，7天窗口需显式配置 | 免费6小时候选不达生产目标，未虚构恢复通过 |
| 删除 | Auth0删除凭据、身份证明解封和claim/finish留在独立无普通HTTP入口的角色；不并回API或连接器 | 待适配，角色边界保留 |
| 后台任务 | Apple30秒、Stripe5分钟、删除证明1分钟、保留和内容孤儿、独立删除循环改为有界可重试任务；只在可靠提交／领取后确认，保留死信和幂等 | 清单完成；不能只换数据库地址就计入休眠节省 |
| OAuth／限流 | 保持__Host Cookie、CSRF、近期认证、原issuer/audience、refresh重放及立即撤销；Dynamo强一致事务不能直接换成最终一致KV；内存限流不能当全局限流 | 迁移差异已确认，完整认证闭环未在新目标运行 |
| 对象存储 | 初期保留版本化S3和所有VersionId删除；后续R2需分别验证条件写、版本恢复、删除证明和竞态 | 没有把R2当替换域名即可完成 |
| 地域与延迟 | 靠近数据库的Placement提示不是驻留保证；认证后应用与数据／密钥边界分别核对。Regional Services和Cron／Queue覆盖不同 | 需供应商确认适配及费用，未放开原地域边界 |
| 运行与回滚 | 原域名、旧iOS合同和回调保持；一个权威写入者、一个付款／任务执行者，回滚须兼容schema／内容格式 | 仅形成后续顺序，当前审核与生产保持 |

上述要求来自现有[生产／恢复合同](../production-recovery-20260923.md)、[身份／区域合同](../identity-data-region.md)和[安全边界](../security-remaining-five-20261011.md)，不把其历史尚未完成条目重新打开，也不把同区目标扩大解释为“全球所有元数据都从未出欧盟”的法律保证。当前验证没有降低真实环境任何控制。

## 完整费用分类与保守参考

模型为一个生产环境、730小时、10万API请求、Neon0.25CU持续活跃、5GB数据、5GB月保留WAL、7天PITR、22GB总对象／版本／备份／日志。免费账户级额度假定尚可用；额度已被别的用途消耗时须加价。当前逻辑生产库大小和代表性业务CPU未测，规格不是容量承诺。现有循环保持时先按数据库全天活跃估算，不预支按需改造收益。

| 费用项 | 该模型USD/月 | 依据／范围 |
| --- | ---: | --- |
| Workers生产预算 | 5.00 | 本次验证为Free；生产预留Paid的CPU／导出等余量，未购买 |
| Neon Scale计算＋数据＋7天历史 | 43.27 | 182.5CU小时×0.222＋5×0.35＋5×0.20 |
| AWS法兰克福PrivateLink | 70.08 | 当前Neon指南列8个服务，单AZ每项730×0.012；不是默认美国0.01单价 |
| 两侧私网流量 | 0.20 | 假设两家各计10GB，Neon0.01与AWS0.01另计 |
| 私网连接器 | 11.94 | ARM0.25vCPU／0.5GiB及一个IPv4，独立权限 |
| 受限密钥／提供方通道 | 11.94 | 同规格的保守常驻预算；不是已实现或唯一可行架构 |
| 独立身份删除任务 | 11.94 | 保留当前角色分离和循环模型，不把HTTP进程当删除worker |
| KMS | 2.54 | 两个计费key版本＋假设20万对称操作，减可用2万免费量；轮换版本另计 |
| 秘密存储与读取 | 6.05 | 13类当前功能秘密＋2项新连接／运维记录的规划数量，非本轮AWS实读清单 |
| S3存储／版本／备份／日志和操作 | 0.64 | 22GB总计、1万写、10万读；公网出口假设未超共享100GB量，超出另计 |
| 监测、外部日志／队列／Lambda、恢复演练预留 | 5.00 | 预算余量，不是供应商定价套餐 |
| **已知项小计** | **168.59** | **再加Q_region、超出假设的用量与税** |

**Q_region尚未报价，所以完整总价保持unknown，不填0。** 保留同等隔离可能有更少常驻单元的设计，但必须先实现并核验权限／故障／恢复，不能把未完成的节省直接减掉。当前模型不主张一定要长期运行三台主机，也不主张CF在任何设计下都至少168.59美元。

分项展示按美分四舍五入，总额使用未舍入数据；730小时是统一规划月份，不是某一张真实月账单的小时数。

Neon当前[私网指南](https://neon.com/docs/guides/neon-private-networking)要求增加地区列出的全部服务，法兰克福目前列8项；后续扩容条目也有可选性说明。若其官方确认当前单项目可以仅接一个服务且不会损失所需恢复／可用性，同一模型才减61.32至约107.27美元。不能自行把1项当确定需求。AWS官方当前法兰克福Price List的endpoint费为0.012/小时；[价格抽取](../../collaboration/verification/cf-neon-validation-20261102/aws-frankfurt-price-evidence.json)保留SKU、地区、档位和原URL。

将Neon从182.5降至100CU小时可少18.315美元，但须先消除不必要唤醒并保持支付重试／删除的正确性；把一个常驻单元改为经过验证的按需执行，理论毛节省约11.94美元，还要加新调用／调度费用。这些均未实现。现有AWS账单在迁移前继续发生，过渡期两边相加；普通Auth0／Resend额度、域名续费、支付手续费及税继续按原服务和实际用量核算，不因换云消失。

来源：[CF Workers](https://developers.cloudflare.com/workers/platform/pricing/)、[Neon](https://neon.com/docs/introduction/plans)、[AWS PrivateLink](https://aws.amazon.com/privatelink/pricing/)、[Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/)、[KMS](https://aws.amazon.com/kms/pricing/)。完整可复算[模型](../../infra/hosting-validation/monthly-model.py)将未报价项保留为null。

## 免费资源与赠金

| 项目 | 本轮处理 |
| --- | --- |
| Workers Free、workers.dev HTTPS | 已用于实际隔离验证；8次调用，不升级计划 |
| Hyperdrive Free | 已复用；无查询缓存、verify-full来源TLS。100,000/日是SQL语句数量，不等于100,000业务事务 |
| Neon Free | 已复用合成项目，不复制真实记录；6小时恢复不用于冒充正式7天 |
| Workers免费日志／指标 | 已用于本轮错误／调用观察；没有把短保留当生产长期审计 |
| Pages／静态资源免费量 | 可用于公开构建产物；不为“用免费”重复发布当前已工作的官网或改审核URL |
| Workers VPC | 官方目前open beta免费，但仍需要网络中的Tunnel连接器；运行主机和Neon／AWS私网收费另算，正式定价未知 |
| Queues／Durable Objects | 可用于后续耐久任务／限流；尚未实现相同业务语义，不创建无用空资源或把KV当强一致存储 |
| R2免费量 | 已核对，暂不搬用户文件；版本化和删除合同不等价，免费不自动成为迁移理由 |
| Cloudflare Startups | 当前Tier3最高10,000美元、有效一年；Owner确认个人自筹、未注册公司、未获过赠金。表单已按真实身份准备到Contact步骤，但未连接账户、提供支付方式、接受新协议或提交 |

[Startups官方页](https://www.cloudflare.com/startups/)一处欢迎自筹、一处提及公司incorporation；不能替未注册项目认定必然合格。表单明确要求连接Cloudflare账户并有支付方式；条款还涉及超额／到期后的收费。企业附加功能默认不覆盖，不能假设DLS或所有网络费用都由赠金承担。已写[具体官方询问草稿](cf-neon-provider-inquiry-20261102.md)，尚未发送。赠金未获批，不计入长期预算。

Cloudflare赠金仅覆盖其符合条件的服务，不能抵扣Neon或AWS账单。Neon官方页另提供申请私网试用的入口；本轮未申请或启用组织级试用，也没有把试用资格当作已获批。

## 后续顺序与当前门

先取得CF对个人项目资格、区域功能及额度覆盖的确认，并取得Neon对单项目私网endpoint数量／可试用范围的确认；据此重算完整总价。只有价格和保留保护的方案成立，才值得继续新空目标108迁移、真实KMS／私网、签名写入、独立任务和恢复闭环。其后才谈Owner明确允许的真实数据迁移；不靠先买套餐再看账单验证成本。

[安全回执](../../collaboration/verification/cf-neon-validation-20261102/README.md)保存本轮源码／价格来源、实际成功和失败、探针清理与局部验证范围。全量可读清单、确切base本机发布检查和远端读回分别保存；不使用云端CI或子代理，旧archives1–59及已通过的购买／MCP证据不重做。
