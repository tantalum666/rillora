# Rillora 当前交接

Status: FIVE-PROVIDER FULL HOSTING MODEL COMPLETE / AWS OPTIMIZATION RECOMMENDED / NO LIVE CHANGE
Last updated: 2026-11-04 (Asia/Hong_Kong)

## 当前任务

Owner要求重新比较AWS、CF、Oracle、Google、Vercel，保障不降、列完整月费和改造并明确推荐。[本轮完整报告](architecture/five-provider-hosting-decision-20261103.md)是当前入口；[旧交接](handoff-history-20261103-before-five-provider-decision.md)为HISTORICAL。真实数据、定价、收费、购买归属、FanPass及审核／TestFlight保持；供应商询问继续暂存。

## 已完成

- November4补查Apple：CloudKit支持App数据同步及Web，但不直接托管现有API／PostgreSQL／后台；私人数据使用用户iCloud身份与配额，Xcode Cloud是云CI。结论已追加到原比较报告；原费用模型与AWS建议未改变，没有新增平台或运行验收。
- 同一生产730h／Preview48h及明确低用量模型：AWS阶段A73.35、按需worker目标65.71；CF公开层＋AWS核心65.71；Oracle付费A2自管PG46.07，E4回退62.06；Google私有共享CloudSQL＋保留AWS安全服务86.11，专用SQL116.61；Vercel公开层＋AWS核心85.71美元/月。均为完整指定云托管范围的规划，不是新发票或已实现节省。
- 纳入停机磁盘、备份、35天日志恢复、独立MCP状态、全部Secrets Manager凭据、KMS、监控、网络出口、证书续费和演练；Oracle50GB数据盘下限／三张免费状态表上限、Google全流量出站防火墙＋NAT均已补计。
- 明确推荐先AWS低风险收敛，再验有界独立worker。Oracle是现金低的自管候选，不能把约19.64/月差价与DB维护／安全适配混为免费。Google共享核无CloudSQL SLA，专用方案另算；CF／Vercel完整核心尚未报价验收，不用混合总额冒充全部迁入。
- 13项Decimal／范围校验通过；官方区域SKU、选定公开表行、模型与保护改造清单保存到[安全证据](../collaboration/verification/five-provider-decision-20261103/README.md)。没有新应用代码或运行验收。

## 证据边界

基于November2真实库存／发票与November3活动源码／官方价格。AWS本机会话在November3检查时实际过期，未要求重复MFA也未宣称云端刷新。未来工作量、容量及免费配额都有条件；工程成本和运营劳动没有捏造工时。模型保留40GB额外原生DB备份，不与80GB文件／档案混用。没有部署、数据迁移、付费资源、新安全／付款验收、外发消息、子代理或云端CI；旧证据不重做。研究建议不是Owner新预算／迁移决定。

## 唯一下一步

以报告中的AWS阶段A为后续实施入口，先准备可回滚的可选指标／按需Preview／预算通知变更及合成验证；再次执行云操作前只读核对当前库存和告警依赖。当前本轮止于研究与Git保存，线上保持原状；不启动真实迁移或重新提审，不重做旧支付验收，也不把更低条件预算当已实现节省。
