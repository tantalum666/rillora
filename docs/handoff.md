# Rillora 当前交接

Status: LOW-COST HOSTING COMPARISON COMPLETE / NO MIGRATION SELECTED / NATURAL SANDBOX EXPIRY VERIFIED / RESUBMISSION HELD
Last updated: 2026-11-02 (Asia/Hong_Kong)

## 当前任务

Owner认为保留AWS架构后60–80美元/月仍贵，要求比较Cloudflare／Oracle，并进一步纳入微软、Google及其他高性价比平台。[当前托管比较](cloud-hosting-comparison-20261102.md)是聚焦入口；[原账单诊断](aws-cost-review-20261102.md)保留。当前仅研究，没有把咨询当成已选择新provider／批准新付款／完成迁移；价格、真实资料、历史购买归属、FanPass和重提／TestFlight暂停保持。[前一交接](handoff-history-20261102-before-hosting-comparison.md)为HISTORICAL。

## 已完成

- 10月AWS实际资源费120.63减额度83＝应付37.63，当前赠送额度0；两套数据库、四常驻任务、126Container Insights指标，原25美元预算零通知。资源收敛仍为方案，未停服务或改变配置。
- 已按最新官方文档比较Workers5美元基础、R2免费量、D1的SQLite边界、Hyperdrive外部Postgres和Neon当前按需价格。具体算术示例15.95／24.695美元只含Worker与假设数据库用量，完整预算仍须加恢复、密钥和剩余依赖；不宣称5美元包全套。
- OCI免费主文档1500OCPU/9000GB小时与价目表付费租户3000/18000小时分别记录；未确认实际账户／区域容量。A1不计免费额度的1OCPU4GB算力11.68美元/月，不含盘和运维，不能当完整托管PG报价。
- 新增Azure／Google按需容器、Hetzner、DO、Akamai、Railway和Render比较：云端免费计算不含数据库；Hetzner采用June15新价且库存未验；Render7天PITR需25美元Pro工作区，不能拿13美元组合当满足当前要求的总价。
- 当前API为Node／Express／Postgres并有AWS密钥、独立日志／对象依赖；数据库权限和事务不能直接换D1。worker30秒轮询需改成按需，才可获得数据库休眠节省。已存在CF＋Neon合成MCP候选，旧证据可复用，未重跑。
- Apple真实购买／恢复和November2自然到期后台核对保持通过：同一HKD888订单expired_read_only，期末November1 15:04:08香港时间，事件applied且验签正常；Owner手机为Free。手动取消／退款未观察，不重买或恢复。

## 证据边界

Agent建议把Cloud Run＋按需PG与Workers＋按需PG并列比较，最低固定费用另看Hetzner／OCI；这是建议，未选定迁移或锁定20–30美元预算。免费额度不代替备份、区域、独立权限和实际容量证据。当前没有申请Oracle账户、升级CF／Neon、移动数据库、切DNS或新原生包。

[安全研究回执](../collaboration/verification/hosting-comparison-20261102/README.md)为普通Git；原成本／到期回执与archives1–59保持，不重复云端查询、应用测试或归档。本轮只做文档／算术与精确base发布检查，无子代理或云端CI。原17-r2已安装，新双语购买错误文案仍留待集中候选。

## 唯一下一步

先比较Cloud Run与既有CF合成候选的完整API最小兼容性／全部费用，保留PostgreSQL安全模型；以Hetzner／OCI自管路线作固定成本对照，待比较后再选托管。成本止损的额外指标／预算通知缺口仍需实施，不能因研究迁移而标成已解决。现有生产和真实数据保持，最终审核材料另行对齐，不发TestFlight或重提。
