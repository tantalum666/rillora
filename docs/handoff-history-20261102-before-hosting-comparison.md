# HISTORICAL — Before hosting comparison

Superseded by [current handoff](handoff.md). Cost actions below were proposals, not deployed changes.

# Rillora 当前交接

Status: AWS COST DIAGNOSIS COMPLETE / COST REDUCTION PROPOSED / REAL SANDBOX EXPIRY VERIFIED / RESUBMISSION HELD
Last updated: 2026-11-02 (Asia/Hong_Kong)

## 当前任务

Owner报告AWS10月账单US$37.63，要求查明原因和解决办法；同轮确认Apple已到期、Rillora为Free。[成本诊断和分阶段方案](aws-cost-review-20261102.md)是当前聚焦文件。原[真实Apple验收](apple-purchase-acceptance-20261101.md)继续保留；手机由Owner手动操作，重提／TestFlight暂停，价格、真实资料、历史归属和FanPass保持。[前一交接](handoff-history-20261102-before-cost-review.md)已标为HISTORICAL。

## 已完成

- Gmail真实账单与Cost Explorer精确对上：10月资源费用120.6338910658、额度抵扣83、净额37.6338910658美元，邮件37.63。当前赠送额度0，PAID／ACTIVE。
- 当前正式／预览各一数据库、一API和一身份worker，共四个常驻任务，两个集群Container Insights开启。126条近期容器指标、22个现有告警无Container Insights引用；10月CloudWatch33.79中32.75为自定义指标。
- 25美元预算无费用过滤，实际为全账户；IncludeCredit=true且通知列表为空。11月初预测149.712美元为估计，不是新账单。
- 已形成按顺序收敛性能指标、预览按需运行、补齐预算通知的方案；当前没有实施这些配置，也不把预计节省写成已省钱。
- Owner确认Apple到期／Rillora Free。一次新的受限只读任务退出0，匹配同一原HKD888订单：paid_reconciled、expired_read_only、期末November1 15:04:08香港时间、事件applied／验签通过／无错误，目录未变。真实自然到期通过；未观察手动取消或新退款，不为此重买／恢复。
- 原17-r2已安装和November1购买／恢复证据保留；新双语错误文案仍仅源码，未另外安装。原本机9项语言、20项API及此前44＋19项原生证据不重跑。

## 证据边界与保存

当前为只读诊断与具体方案，不是降本部署或费用硬上限。RDS停止仍收存储费且7天会自动重启；正式数据服务不能随预算阈值停机。原预算对象不代表已送达费用告警。当前无新IAM授权、任务版本、服务设置、数据库／付款数据或审核变更。

证据在output/qa/rillora-cost-review-20261102/；[安全回执](../collaboration/verification/cost-review-20261102/README.md)只保存必要费用／资源摘要和到期结果。实际邮箱／支付详情、AWS原始身份、验证码页面与运行令牌不进Git。AWS插件不可用；CLI确实过期后Owner完成一次MFA，主体核对一致。一个不支持的登录参数和一次部署角色日志读取拒绝均保留，复用已有operator成功，没有扩大权限。

原archive1–59不重封、不重下；本轮无应用代码变化、应用重测、子代理或云端CI。源与回执按精确main base本机发布门保存，远端状态另录。

## 唯一下一步

先落实成本方案第一阶段：以确切差异收敛两个集群的额外Container Insights、保留全部现有业务告警并补齐费用通知；再核对持续账单趋势和预览按需方案。原真实购买／恢复／到期证据不重做，最终候选／审核材料继续保持待对齐与Owner重提暂停。
