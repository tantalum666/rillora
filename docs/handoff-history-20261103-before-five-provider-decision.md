# HISTORICAL - Before five-provider full decision

Superseded by [current handoff](handoff.md). Historical instructions and next step are not active.

# Rillora 当前交接

Status: VERCEL AND COST-METHOD REVIEW COMPLETE / NO CHEAPEST-PLATFORM CLAIM / NO MIGRATION
Last updated: 2026-11-03 (Asia/Hong_Kong)

## 当前任务

Owner要求核对Vercel并弄清“为何候选都比AWS贵”是否来自比较误区。[本轮报告](architecture/vercel-cost-method-20261103.md)为当前入口，[上一交接](handoff-history-20261103-before-vercel-method.md)为HISTORICAL。保留现有保障／真实数据／价格／收费／购买归属／FanPass，重提和TestFlight暂停。Cloudflare及Neon供应商询问均未发，原暂存决定保持。

## 已完成

- 确认方法问题：早先核心组件价低估、后续昂贵托管跨云路径又不足以代表供应商最低成本。既有157.15／200.95／168.59等明确范围的算术保留，但不能推导所有迁移都无价值。旧报告顶部已增加推论边界。
- 当前Vercel Pro20美元/月含一个部署成员和20美元适用额度；Hobby限非商业。Fluid activeCPU／内存／调用按实际计量，当前Pro调用从首个按量计，再使用额度；直接官方页覆盖搜索缓存旧额度。
- September1原生PrivateLink已可在Pro使用，与100美元StaticIPs、Enterprise SecureCompute／BYOC是不同选项。公告列首条随AdvancedNetworking包含、额外每条30美元和0.04/GB；AdvancedNetworking基础费及确切项目连接数未明，不能写0、套100或重复加AWS端点／VPN／辅助服务器。
- 7项十进制／额度检查通过：一个条件明确的Pro＋NeonLaunch核心例子33.35，始终活跃数据库敏感性42.10。二者都不是完整账单，且使用公网认证TLS和未完成的按需任务改造，不是已批准的私网替换或安全等价证明。
- 原安全结果与当前实现分别列出。源码确认普通Functions4.5MB载荷限制与本项目8MiB上传不兼容；Pro Cron每分钟与当前30秒重试有差异；VercelKMS为签名，不能替换原信封加密。短期OIDC／独立身份可研究，无须默认增加常驻代理。
- 真实AWS旧账单的主要支出仍是双环境RDS／CloudWatch／ECS，全部S3与CloudFront当月合计约0.048美元；只搬前端难以消除大头。原降本配置仍未部署，不能声称已省钱。

## 证据边界

[安全来源和示例](../collaboration/verification/vercel-method-20261103/README.md)保留当前官方引用、局部算术和未知项。没有开户、付费、接入新服务、改网络／权限、真实数据读写／迁移、线上部署或新运行／安全测试；没有外发、子代理或云端CI。旧CF限定运行、MCP和真实付款证据沿用不重跑。现有保护没有被研究文档削弱。

## 唯一下一步

后续成本设计以“保护结果→最简可验证控制→实际用量／全账单”为顺序，先形成一个明确的按需目标并验证关键差异，再决定原AWS收敛或候选迁移；Vercel保留为候选，尚未选供应商、批准预算或网络政策变化。原生私网能力优先核实，不默认叠加所有网络附加项，也不把公网TLS自动判成等价。继续保持外发草稿、真实迁移和审核／TestFlight暂停。
