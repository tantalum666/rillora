# Rillora 当前交接

Status: AWS COST CONTROLS AND ISOLATED WORKER REPAIR DEPLOYED / GROWTH AND BENEFITS PLAN COMPLETE
Last updated: 2026-11-04 (Asia/Hong_Kong)

## 当前任务

Owner要求优化AWS、规划用户增长并核实免费权益。[当前执行报告](aws-optimization-20261104.md)为入口；[旧交接](handoff-history-20261104-before-aws-optimization.md)为HISTORICAL。真实数据、价格／收费、购买归属、FanPass及审核／TestFlight保持；未提交赠金申请或发送供应商询问。

## 已完成

- 重新读取实际账号／资源／七天指标。两集群额外Container Insights已关闭，22个业务告警和免费默认ECS指标保留。费用预算原金额25／范围不变，改为抵扣前观察，实际25／50／80和预测80四通知使用原确认收件人；异常门槛改为5美元且40%，仍为DAILY。免费Compute Optimizer已Active，无组织扩展或付费增强历史。
- 查到Preview独立worker实际OOM，正式有相似内存走势。实际旧Linux镜像600次TLS重连RSS84.3→584.2MiB，复用池级受信上下文后90.5→94.5；证书／域名／跨配置信任检查保持。新镜像仅覆盖db.js和worker.js，摘要9944d7ed0780359c8c8fe4b36d409a77a8b7e38f5847b658417b80a2ee488e13。
- Previewworker revision4、正式revision10均UPDATE_COMPLETE／1运行／0失败；普通API任务与部署、角色／秘密／资源／参数保持。正式broker代码／环境／角色和operator策略实际读回一致，公网检查ok=true／failed0。早期新worker内存正式4点约9.18%，Preview28点约10%，尚不构成长周期证明。
- API typecheck/build、16TLS／配置／证明及14隔离业务回归、28infra、4成本边界、6增长算术通过；原失败保留。旧本机fixture0108checksum不符未改写，在新隔离PG16.14验证通过。临时PG55434及本轮恢复的rillora-build已停，其他项目环境未操作。
- 完整AWS增长示例130.78／442.47美元对应100万／1,000万请求假设；多副本前需共享限流／后台协调／连接预算，不能按用户数机械加机器。免费量实际已在使用；EC2／Bedrock各20美元活动尚未完成，截止2027-02-11；[Activate准备](aws-activate-preparation-20261104.md)仅草稿，初始1000／部分5000并未获批。

## 证据边界

[安全回执](../collaboration/verification/aws-optimization-20261104/README.md)保存源码／原始局部失败及成功检查、完整模型、不可变镜像／部署与早期指标。原真实购买、MCP、CF探针和历史归档不重做；没有迁移真人数据、操作真机或发布商店版本。原生/API功能和财务结果不能由本轮成本测试代替。

Preview仍常开、有界worker未实现；73.35／65.71为这些后续改造的条件目标，不是当前新账单。当前剩余额度0，40美元活动及Activate均未到账。新预算邮件仅配置／目标已核验，聚焦Gmail搜索尚未观察到首封；费用回流与长周期内存仍待后续观察。没有云CI或子代理。

## 唯一下一步

完成Preview验收租期、待办／回调排空、部署互斥、休眠提示／监控预期、RDS七天重启兜底及恢复顺序的源码与隔离验证，再按现有范围切换；不直接因低CPU停止数据库。保留当前正常生产、审核／TestFlight暂停及供应商外发草稿状态，不重复已完成的支付／权限／本轮部署和本人认证。
