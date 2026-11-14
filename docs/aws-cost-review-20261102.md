# AWS 10 月账单与降本方案

Status: INVOICE RECONCILED / READ-ONLY DIAGNOSIS COMPLETE / COST CHANGES PROPOSED, NOT DEPLOYED

Last updated: 2026-11-02 (Asia/Hong_Kong)

Owner报告10月应付US$37.63，要求解释未正式上架阶段的支出并提出解决办法。本轮读取真实AWS邮件、Cost Explorer、账号额度、预算、两个集群／数据库、指标和告警；没有停止服务、迁移资料、修改收费或购买承诺折扣。Apple重提和TestFlight继续暂停。

## 同日后续：Owner要求更低成本路线

Owner认为60–80美元仍偏高，要求比较CF和Oracle。[最新托管比较](cloud-hosting-comparison-20261102.md)明确该区间只是维持旧AWS架构的估计，不是产品最低成本；新增Workers＋按需PG与OCI候选，未选择provider、付款或实际迁移。以下账单事实保持，三项AWS收敛仍未部署。

## 已核实的费用

11月2日AWS账单邮件指向2026年10月。Cost Explorer的完整单页月度结果为estimated=false：

- 资源费用：US$120.6338910658。
- 额度抵扣：US$83.0000000000。
- 净额：US$37.6338910658，四舍五入与邮件US$37.63一致。
- 当前账号PAID／ACTIVE，可用赠送额度US$0。11月1日尚不完整的费用仍有抵扣分录，不代表今后持续享有免费额度。

| 服务 | 10月资源费用，USD | 说明 |
| --- | ---: | --- |
| RDS数据库 | 33.94 | 约1,489.5实例小时、40GiB月存储及少量备份；当前正式／预览各一套db.t4g.micro和20GiB。 |
| CloudWatch | 33.79 | 自定义指标32.7484、告警1.0391；主要不是日志存储。 |
| ECS Fargate | 27.61 | 容器按CPU／内存运行时间收费，当前四个常驻任务。 |
| VPC | 12.16 | 2,431.86个公网IPv4小时；本次费用条目为地址费，没有NAT费用条目。 |
| Secrets Manager | 7.73 | 秘密数量按保留时间计费及少量调用费。 |
| KMS | 3.27 | 保留的加密密钥费用。 |
| Route 53 | 2.00 | 四个计费HostedZone单位；不据此认定四个均可删除，服务发现可能依赖它们。 |
| 其他服务合计 | 0.14 | S3、API Gateway、Cloud Map、ECR、Lambda等；不值得优先迁移静态站来省这部分。 |

逐项金额有四舍五入差异，以原始十进制总额为准。抵扣覆盖了本月全部CloudWatch、几乎全部RDS和部分ECS；这不改变资源的持续计费属性。上述是账户范围账单，已发现的活动应用资源属于Rillora；没有据此修改FanPass或其他服务。

## 当前资源与成本控制缺口

正式和预览各有一个API服务、一个身份删除worker，desired/running均为1，合计四个常驻任务；每个任务使用公网IPv4出站。两个私有数据库都处于available，正式保留7天备份，预览1天。

两个集群的`containerInsights=enabled`。最近3小时可见`ECS/ContainerInsights`126条指标，每个集群63条；另有支付、保留与公共健康等16条近期业务指标。22个现有告警全部OK，均未直接引用Container Insights。两组性能日志本就只保留1天，单纯再缩短日志保留不能解决指标费用。当前源码也在两个集群显式启用了此选项。

预算`Rillora-Staging-Monthly-25`的限额为US$25，但没有CostFilters，实际覆盖整个账户；IncludeCredit=true；`describe-notifications-for-budget`返回空列表。预算对象存在不等于有人会收到提醒，更不是消费硬上限。该预算11月初预测为US$149.712，更新时间11月1日23:07（香港）；这是早月估计，不是11月账单或已发生费用。

## 建议执行顺序

### 1. 先收敛额外性能指标，保留业务监控

把两个集群的额外Container Insights关闭，并同步基础设施源码。保留ECS默认CPU／内存指标、现有业务／支付／保留告警、安全和应用日志。先检查确切CloudFormation差异只涉及两个集群的设置；不更换任务、停止服务或改网络。

按当前126条指标和常见US$0.30／指标月档位，满月量级约US$37.80；考虑10月实际用量与保留业务指标，预算采用约US$30–38／月可减少的资源费用。Cost Explorer没有给出10月每个namespace的分摊，因此不能声称32.7484全数都可省；实施后仍需账单数据验证。

### 2. 预览环境按需启动

正式服务继续在线供真实Web、iOS、付款通知与审核使用。日常源码／自动化测试保留本机；只有外部集成验收时才启动预览。准备明确的休眠状态、待处理测试事件检查、状态页／监控预期和恢复步骤，然后停预览两个任务及数据库计算，保留数据和密钥。

用本次账单反推的单价，730小时下两个小容器计算约US$16.58、两个IPv4约US$7.30、一个数据库计算约US$13.87，合计上限约US$37.75／月；实际仍需减去验收时的运行费用。数据库存储、备份、秘密与密钥继续收费。RDS单次停止最多7天会自动重启，因此必须有可验证的按需／定时控制；不能把点一次Stop当永久省钱。不能删除数据库或把预览原地变成正式库。

### 3. 补齐可到达的预算提醒

复用现有Owner收件地址，分别观察抵扣前资源费用和实际应付；准备实际与预测阈值。应验证通知订阅／送达，避免只新建一个空预算对象。只通知的AWS Budgets免费，但告警有账单延迟，不承诺硬停机上限。不得为达到金额阈值自动关闭正式付款回调或数据库。

### 4. 更低预算再做结构调整

前两项落实后，保留正式环境和休眠预览存储的初步规划区间为US$60–80／月，不含Auth0／邮箱／域名／支付商手续费等第三方费用；它是按当前资源估算，尚未实现，也不是固定报价。若要进一步压到US$10–30，需单独评估身份worker的按需执行、API运行方式和数据库选择，包含恢复／加密／区域／支付重试验收。不能承诺在完全相同的常驻架构下只付十几美元。

现在不推荐买一年／三年预留资源或Savings Plans：预览即将改成按需，持续运行基线尚未稳定。过去已产生的费用不能因现在关闭资源自动退回。

## 同轮真实到期验收

Owner报告Apple订阅页已到期，Rillora个人中心为Free。11月2日09:04（香港）一次新的受限只读维护任务匹配同一原HKD888审核订单：仍为completed／paid_reconciled，订阅`expired_read_only`，本期截止2026年11月1日15:04:08；最新收据金额／币种保持、事件applied、签名验证通过、无事件错误。目录前后指纹一致，没有人工改订单／权益。

因此真实到期及App显示回落已有新证据；Owner未报告亲手取消续期，不能把自然到期冒充手动取消通过。已成功的购买／恢复不重做，不为到期状态重新订阅。最终候选／审核材料和手动取消／退款覆盖仍分别记录。

## 证据与边界

[安全回执](../collaboration/verification/cost-review-20261102/README.md)保存无账户／卡号／令牌的费用拆分、资源摘要和真实到期读回。原邮件、AWS原始资源身份、本人认证截图和运行令牌仅在受保护本机目录；没有复制到Git。Cost Explorer仅两次请求，各一页且无下一页，名义查询费共US$0.02；没有付费小时级报告或资源级历史功能开通。

本轮为诊断和方案，**降本配置尚未实施、节省尚未发生**。普通API／Web／数据库配置、价格、收费开关、既有数据、FanPass均未修改；仅执行一次已部署只读维护命令补到期状态。应用源码未改，不重跑旧应用测试；本机发布检查及Git读回另记。

依据：

- [ECS默认免费指标与额外Container Insights](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/cloudwatch-metrics.html)。
- [Container Insights计费方式](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)。
- [CloudWatch价格与免费额度](https://aws.amazon.com/cloudwatch/pricing/)。
- [RDS停止仍保留存储费、7天自动启动](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_StopInstance.html)。
- [AWS Budgets定价](https://aws.amazon.com/aws-cost-management/aws-budgets/faqs/)与[延迟和实际／预测通知](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)。
- [Cost Explorer API查询计费](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html)。
