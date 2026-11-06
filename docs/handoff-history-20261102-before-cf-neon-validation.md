# HISTORICAL — CF＋Neon验证前交接

Status: HISTORICAL / SIX-COMBINATION COST REVIEW COMPLETE / NO MIGRATION SELECTED / NATURAL SANDBOX EXPIRY VERIFIED / RESUBMISSION HELD
Last updated: 2026-11-02 (Asia/Hong_Kong)

## 当前任务

Owner要求仔细比较Oracle／Cloudflare／Google分别配Neon或Supabase，考虑长期用户增长。[六组合报告](hosting-six-pair-decision-20261102.md)现为当前入口；[广泛比较](cloud-hosting-comparison-20261102.md)与[真实AWS账单](aws-cost-review-20261102.md)保留。[上一交接](handoff-history-20261102-before-six-pair-comparison.md)已标HISTORICAL。研究不等于选供应商、批准付费或完成迁移；生产、价格、真实资料、历史购买归属、FanPass及重提／TestFlight暂停保持。

## 已完成

- 三档明确假设下的六组合核心账单已可复算，Google价格实际选择法兰克福读回；Oracle按正常A1／Balanced盘价格计，不预支未核实免费额度。所有数值是组件算术，不是同等吞吐或完整账单承诺。
- 当前Agent首个验证建议收敛为Cloud Run＋Neon；Cloudflare适合公开前端及后续轻CPU高请求API，Oracle适合固定持续算力／出口。没有Owner最终托管决定。
- 同样7天PITR，Supabase需要至少Small，Pro＋计算减抵扣＋恢复约130.05美元/月起；Neon按CU／数据／WAL计量。Neon IP白名单／私网属于Scale，不能用Launch低价冒充私有RDS同等保护；长期持续大规格或高WAL时Supabase可能反超。
- 源码核对补齐Stripe／Apple重试、保留、删除证明、内容孤儿及独立删除worker，不只一条30秒轮询；S3当前需要版本感知删除，不能直接换R2端点。KMS、工作负载身份、独立恢复日志、地域和监测必须纳入完整方案。
- 沿用本日原RDS聚合指标：CPU小时桶平均约4.5%、连接2–3，逻辑库大小／代表性CPU／WAL及跨云性能未测。未重新查真实数据或扩大SQL权限。
- 10月AWS资源费120.63减额度83＝应付37.63，当前额度0；双数据库、四常驻任务、126额外容器指标、25美元预算零通知已查明，成本止损仍未部署。
- 原17-r2真实HKD888购买／恢复以及November2自然到期核对保持通过，同一订单expired_read_only、已验签事件正常；Owner手机Free。手动取消／退款未观察，新双语购买错误文案留待集中候选，不重复购买／恢复／安装。

## 证据边界

[本轮安全回执](../collaboration/verification/hosting-six-pair-20261102/README.md)包含25项官方来源、公开选区价格、纯算术脚本和完整假设。五项算术校验通过，文档／全量可读清单／确切base本机发布检查分别记录。没有新应用测试、生产迁移、开账户、付费、切DNS、子代理或云端CI；旧archives1–59未重做。

先前20–30美元完整月费只是待验证目标，新增网络／权限需求可能使它不成立；不为凑低价删除现有保护。六组合核心小计未含全部密钥／日志／对象／任务／私网费用，实际用量和操作维护仍需核算。数据库引擎保留PostgreSQL，候选未验证完整可上线。

## 当时下一步（HISTORICAL）

按六组合报告准备有界、仅合成资料的Cloud Run＋Neon代表性兼容性与成本验证：取得合适的只读逻辑容量，测CPU／等待、DB活跃／WAL和出口，核验原角色／恢复／独立任务／身份与网络地域；再形成准确配置和完整报价后决定是否迁移。当前未选provider／预算，不自动创建六套常驻环境或搬真实数据。已知AWS可选指标和预算通知缺口仍需作为止损处理，不能因研究完成而记为已解决；不重提或发TestFlight。
