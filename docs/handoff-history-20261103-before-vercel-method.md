# Rillora 历史交接：Vercel与比较方法纠正前

Status: HISTORICAL / SUPERSEDED BY CURRENT HANDOFF
Last updated: 2026-11-03 (Asia/Hong_Kong)

## 当前任务

Owner要求仔细重查Oracle＋Neon与Google＋Neon，不重复CF的组件价比较错误。[专项报告](architecture/oci-google-neon-cost-review-20261103.md)是当前入口，[前一交接](handoff-history-20261103-before-oci-google-neon.md)为HISTORICAL。保持原安全保障、真实数据、价格、购买归属、FanPass、重提／TestFlight暂停；Cloudflare询问按Owner指示留稿，Neon询问未发。

## 已完成

- 官方Neon文档确认新项目在AWS，Private Networking为同AWS区域的PrivateLink／Scale组织能力；没有Google／OCI原生Neon私网入口的证据。通用跨云VPN可达性不冒充Neon端到端支持或原保护等价。
- 重新读Oracle美元价目、Google实际选择Frankfurt后的VPN／Cloud Run表，以及AWS公开区域SKU。GoogleVPN为0.06/隧道小时，AWS普通VPN0.05/连接小时，AWS两个公网IPv4另计；没有漏把美国默认0.05当GoogleFrankfurt单价。
- 同一0.25CU全天／5GB数据／5GB历史、7天恢复规划下，数据库＋所列托管网络固定费为OCI单路径157.15、Google单路径200.95；Google四隧道HA对照376.15。均不是完整月费、最低可能价、已购配置或整个应用SLA。单项目一端点敏感性／自管隧道均未验证，费用缺项保持null。
- Oracle小规格计算／启动盘13.81与Google普通持续服务54.70分别保留规格／免费条件；Google两服务不能重复扣免费额。Worker pools／按需任务等更便宜运行形态不被保守例子排除，也不冒称已经适配。当前轮询源码说明不能直接把原代码的CPU／Neon活跃时长按0计。
- 12项十进制算术与范围校验通过；迁移清单包括DNS／SNI、短期身份、独立密钥／删除／日志、正式入口、流量、对象版本和恢复。撤回旧六组合报告的Cloud Run＋Neon低成本优先建议，旧组件数字保留为HISTORICAL。
- 旧CF实际8次请求／探针回收、MCP、原17-r2真实HKD888购买／恢复／自然到期证据沿用；没有重复验证或改线上。

## 证据边界

[安全资料](../collaboration/verification/oci-google-neon-20261103/README.md)保存公开SKU、Google选区截图、来源和可复算模型。当前只有研究／算术结果，没有新的VPN、Neon迁移、真实KMS、完整认证业务、恢复演练、容量测试或节省证明。没有新资源、付费、外发消息、子代理或云端CI；原AWS账单继续发生。完整清单和确切base本机发布检查后保存精确远端读回，不把Git成功当生产验收。

## 唯一下一步

后续降本设计先选定一个不引入昂贵跨云固定连接费、又能保留原保护的拓扑，再决定单一合成候选验证；优先比较原AWS按需收敛与应用／数据库同云的方式，Neon不作为不可更换的锁定条件。此为Agent基于新证据的建议，不是Owner已选择新provider或批准购买。当前不推进上述托管VPN迁移，不恢复暂存的供应商外发，不重提或发TestFlight。
