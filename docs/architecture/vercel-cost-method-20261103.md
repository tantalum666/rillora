# Vercel复核与托管成本比较方法纠正

Status: METHODOLOGY CORRECTED / VERCEL FACTS CHECKED / NO COMPLETE QUOTE OR MIGRATION
Last updated: 2026-11-03 (Asia/Hong_Kong)

Owner质疑为何每个候选都比AWS贵，并要求检查Vercel及比较方法。当前仍是同一成本调查，不是选择供应商、接受网络保护变化或开通付费。真实数据、原价格／收费、审核／TestFlight、FanPass保持；供应商询问继续暂存。

## 已确认的误区

此前价格的部分算术有依据，但由它们推导迁移价值的方法不充分：先只报核心组件，容易低估；随后固定一套昂贵的跨云托管VPN／辅助服务路径，容易把该路径的不经济扩大成平台不经济。上一轮157.15／200.95等只能说明所列数据库与托管网络示例的费用，不能证明Oracle／Google最低生产费用，不能据此判断所有迁移都没价值。

具体需要纠正：

1. **安全结果与部署形态混用。** 租户隔离、独立加密密钥、强制恢复／删除记录、TLS、近期认证和七天恢复需要保留，但不自动要求三个常驻服务或特定厂商VPN。独立任务可有独立短期身份、按需执行；仍要验证权限和重试语义，不能只合并角色省钱。
2. **没有完成最低成本合格架构的比较。** 只计算一个保守路径，即使注明不是最低价，也不足以据此推荐留AWS或排除其他平台。应先筛选能满足保护结果的路径，再对实际需要的组件定价。
3. **当前代码与改造后目标混在排序里。** 当前轮询会保持计算／数据库活跃；这是当前模式的真实成本因素，不是Serverless的必然成本。另一边按需费用要计改造／验收，不能预支收益，也不能永远按旧循环否定按需方案。
4. **网络可达与数据授权是不同控制。** 公网地址上的TLS认证数据库不是公开可读数据库；私网也不能替代租户鉴权与内容加密。但取消现有网络隔离会移除一层防御，不能仅凭TLS就宣称不降安全。本轮保留当前配置，替代控制只列待评估方案。
5. **不同范围的数字不能横比。** AWS37.63是双环境历史资源120.63减83赠金；旧候选为部分组件或单环境规划。比较时必须统一环境、活跃时长、流量、恢复、权限、免费条件和运维责任。

因此，结论修正为：**尚未完成所有合理候选的同标准经济性验证；不能下“都比AWS贵，所以不用迁移”的结论，也不能承诺迁移必省。** 旧报告保留数值、来源与假设，新增本说明限制其推论。

## 保护合同的分类

| 内容 | 当前事实／目标 | 可以重新设计的部分 |
| --- | --- | --- |
| 授权与租户隔离 | 服务端身份、RLS、事务授权和撤销仍强制 | HTTP运行平台／驱动适配；不删检查 |
| 加密与密钥 | 应用层信封加密、非导出包装密钥、用途／主人绑定 | SDK与短期身份的接入；不能把根密钥放普通环境变量 |
| 恢复与删除 | 七天PITR、外部强制日志、重放撤销／删除、独立身份删除权限 | 按需任务和队列；不能用日备份偷换任意时点恢复 |
| 网络隔离 | 当前AWS RDS无公网入口，且来源受限 | 原生私网连接、同云网络、经过验证的其他路径；公网TLS不是自动等价替换 |
| 处理区域 | 当前核心应用／数据／密钥采用Frankfurt平面 | 审查目标区域／合同；不将其扩大成未经Owner提出的“所有平台元数据均不得离开EU”企业要求 |
| 执行与维护 | 当前API和独立worker常驻，预览也长期运行 | 有界任务、事件触发、预览按需；不是安全要求必须全天轮询 |

[OWASP数据库建议](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)同时讨论限制连接来源、隔离、认证和传输加密；没有给出可直接把所有保护替换为一个产品的证明。现有正式合同未被本研究修改。

## Vercel当前可以确认的事实

| 项目 | 当前官方结果 | 对Rillora的含义 |
| --- | --- | --- |
| Hobby | 限非商业个人用途 | 不能把商业Rillora按Hobby长期0元计算 |
| Pro | 20美元/月，含一个部署成员及20美元适用用量额度 | 不是20＋20；数据库、额外服务和超量仍另算。以新独立Rillora团队作示例，不动或借用FanPass |
| Functions Fluid Compute | active CPU与处理请求期间的内存分别计量，闲置后暂停；fra1 CPU0.184/小时、内存0.0152/GB小时 | 不能直接套用一整台CPU730小时；也不能只算CPU而漏I/O期间内存 |
| Pro调用量 | 按0.60/百万调用计，适用Pro用量额度 | 当前页面并非Pro先送一百万调用；搜索缓存里旧描述未采用 |
| 当前Pro CDN | 基础Flat Rate CDN档含100万CDN请求／1TB | 搜索缓存里的旧1000万Edge Requests不作为现行基本盘；真实路由和用量另测 |
| 普通TLS数据库连接 | 不要求默认购买固定IP或专用网络 | 不把可选附加项自动相加；是否适合现有保护要单独判定 |
| Static IPs | Pro每项目100美元/月＋对应传输费 | 稳定出口来源，不等于数据库私网；只有选用allowlist路径时才计 |
| 原生AWS PrivateLink | September1已在Pro／Enterprise提供，需Advanced Networking | 不能一概说私网必须Enterprise，也不需要照抄Google／OCI站点VPN |
| Secure Compute／BYOC | Enterprise、定制价 | 用于更专门的独享网络／自有AWS执行账户要求，不能默认给小产品配置 |
| AWS OIDC | 支持精确project/environment条件的短期AWS身份 | 不一定要增加常驻密钥代理；独立删除身份需独立授权边界，不能同一subject同时授予API与删除权限 |

来源：[Pro](https://vercel.com/docs/plans/pro-plan)、[Hobby](https://vercel.com/docs/plans/hobby)、[Fluid价格](https://vercel.com/docs/functions/usage-and-pricing)、[网络分类](https://vercel.com/docs/networking)、[Static IPs](https://vercel.com/docs/networking/static-ips)、[PrivateLink公告](https://vercel.com/changelog/aws-privatelink-is-now-available-on-pro-and-enterprise)、[Secure Compute](https://vercel.com/docs/networking/secure-compute)、[BYOC](https://vercel.com/docs/networking/bring-your-own-cloud)、[AWS OIDC](https://vercel.com/docs/oidc/aws)。

## 原生PrivateLink：已知与未知不能混填

官方公告给出：Advanced Networking包含第一条PrivateLink连接；额外每连接30美元/月；PrivateLink传输0.04/GB。当前文档说明Vercel在目标支持的两个AZ创建端点，并提供团队专用连接principal。该路线与自建AWS端点＋VPN不同，不能机械叠加旧AWS逐端点原价、VPN、固定IP100美元和三台辅助服务。

但读取到的公开页没有明确给出**Advanced Networking本身的完整基础费用、准确计费范围，以及Rillora分离身份／Neon服务集合对应的连接数**。不能把第一条included解读成基础Pro免费，也不能擅自把Static IPs的100美元移作该功能价格。公式保留：`Pro + A_AdvancedNetworking + 30×max(n−1,0) + 0.04×传输GB + Neon + 其他实际用量`。A与n待核实，未创建项目、启用功能或发送询问。

Vercel公告提到S3／DynamoDB gateway endpoints，而当前设置文档明确只支持interface endpoints、暂不支持gateway endpoints。这一冲突按具体设置文档收窄；本轮不以营销公告认定网关端点能力可用。Neon连接还要实际确认服务接受、DNS／SNI、项目绑定、公网拒绝、故障切换与供应商支持范围。

## 一个用于解释差异的低用量算术例子

示例：一个新Pro团队；fra1函数，每月10万次请求，每次10ms active CPU、200ms存活、2GB内存、无重叠请求；Neon Launch每月100CU小时、5GB数据和5GB恢复历史；使用经验证TLS的公网认证连接，**没有IP allowlist或当前私网等价性声明**。该运行模式要求先完成有界后台改造。

- 函数CPU＋内存＋调用原始计量约0.28美元，可由未被其他用量占用的Pro20美元额度覆盖；平台支付仍20，不再额外加0.28，也不把20当可退现金。
- 示例Neon为`100×0.106＋5×0.35＋5×0.20＝13.35`。
- **两组件示例33.35/月**；若Neon0.25CU始终活跃，同数据／历史条件约42.10。

它只说明正常按需／认证连接模型并非天然要150–200美元；**不是Rillora整套月费，也未满足／批准现有私网替换**。文件、KMS、Secrets、恢复日志、独立任务、监控、构建／调度、其他流量和服务仍需具体计价。现有外部Neon账户继续按自身账单核算；不把Vercel用量额度拿来抵扣它。没有用这个例子重新宣布“Vercel最便宜”。

[算术及边界文件](../../collaboration/verification/vercel-method-20261103/illustration.py)把完整总价和Advanced Networking基础费留为null，不将未知项设为0。Neon价格沿用同日[官方核价](../architecture/oci-google-neon-cost-review-20261103.md)。

## 实际迁移不能忽略的适配

- 当前文件上限8MiB，`legacy-content/routes.ts`把整个文件送入API、`assets.ts`在服务器内进行加密后写S3；Vercel普通Functions请求／响应上限4.5MB，不能原样搬。分块或另设受限内容入口需要保留加密、额度、幂等、VersionId和删除证明；不能用“客户端直传”把明文私有文件写进对象存储。
- Pro Cron最短每分钟，不能直接承接当前30秒Apple重试。队列、Workflows／有界处理要保留交易归属、及时性、重试和死信；不依赖请求结束后继续运行的普通定时器。
- Vercel的KMS当前是JWT／消息签名，不是AWS信封加密包装密钥的等价替代。可以研究经精确OIDC授权调用原KMS，不能仅因同名产品而换掉。
- TLS、Cookie／CSRF、回调地址、连接池／HMAC事务授权、日志脱敏和执行区域必须按确切目标检查。Serverless功能可部署不等于完整Rillora已适配。

依据：[Functions限制](https://vercel.com/docs/functions/limitations)、[Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing)、[Vercel KMS](https://vercel.com/docs/kms)及当前活动源码。这些是本轮静态兼容性判断，没有新运行／安全测试通过声明。

## 当前应怎样决策

1. 不以这几份保守网络案例决定永远留AWS；也不因Vercel20美元就马上迁移。
2. 先把现有保护结果映射到候选控制，并列出残余风险、费用与验证方法。对网络入口发生变化的方案保留明确未批准状态，当前线上不变。
3. 对同一低流量目标分别比较现有AWS按需优化、供应商原生私网和经评估的受限连接路径；包含一次性改造、运维和过渡双账单，不只比较套餐名。
4. 成本实测优先记录实际API CPU／内存时长、数据库活跃／逻辑容量／WAL、后台调用量和内容传输；当前100CU小时／5GB样例不能冒充这些实测。

已有账单指出真正大头：October的RDS33.94、CloudWatch33.79、ECS27.61，包含两环境。同期全部S3与CloudFront合计约0.048美元，包含的还不只是前端。因此只搬官网到Vercel，几乎不消除这些大头，还可能新增Pro基础费。原AWS可选性能指标／按需预览的收敛尚未部署，不能把研究过程当已省钱。[原始安全账单记录](../../collaboration/verification/cost-review-20261102/cost-breakdown.json)。

本轮纠正的是**选型方法和结论范围**。Vercel可保留为低运维候选；尚无足够证据选出当前完整保护下的最低总成本平台。后续以最小可验证目标架构推进，不继续通过给每个新平台叠加最复杂附加项来排除它。
