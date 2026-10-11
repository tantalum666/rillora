# HISTORICAL — Owner approved both source operations on October11

The prior pending-approval state below is superseded; do not ask for either approval again.

# Rillora 当前交接

Status: SECURITY REMEDIATION CANDIDATE / TWO EXPLICIT TOOL-REQUIRED APPROVALS PENDING
Last updated: 2026-10-11 (Asia/Hong_Kong)

## 当前任务

Owner 最新明确“先把这两天的发现项先修复了”，并澄清是 Rillora 各份审计报告，取代此前本轮只报告和旧的发布第2项下一步。73条本地导出记录已映射为35组，[当前修复记录](security-findings-remediation-20261011.md)保存逐组处理和证据边界；原扫描没有重启或重写。

工程候选位于已附加的管理工作树 `/Users/tantalum/.codex/worktrees/security-findings-20261011/电子遗嘱app`，分支 `codex/security-findings-20261011`，基线 `647317834bd785ace1499e251f0e501530163239`。继续时先复用该工作树，不在旧源码上重复修复。

## 已完成的候选与验证

- 已实现认证／签名同意／当前邮箱、Cookie、Apple意图与收据恢复绑定、邀请及导出、资源和回滚保护、受限维护broker、源与可读证据扫描等候选；1—94迁移原字节保持。
- 一次独立边界调查及一次独立候选复核完成。复核发现的4处回归已修，最新60项Apple／恢复通过；iOS最终全量287通过／1既有跳过。其余已保存检查点见修复记录；不把重叠子集相加。
- 两份报告中的强前提风险（任意运行时SQL、完整API RCE、同用户凭据目录访问、确定性元数据）已单独校准，没有称为普通账户漏洞或伪称额外隔离已实现。
- 现有价格、真实账号／事项／订阅、FanPass、特定删除账号保留、Auth0免费方向与暂停零碎TestFlight继续有效。本轮未部署、安装、购买、退款、申请或请求重新登录。

## 实际阻塞及证据边界

自动审批要求Owner单独确认两份已准备草稿：①显式live生产源码模式及完整保护校验（线上仍review）；②已有合成常量／公开client ID行号与两条纯测试加密夹具的精确扫描登记。异步确认卡已发，尚未收到答复，不能按经过时间当作批准。对应受保护文件尚未应用，未commit/push；不是登录失效。

最新API全量492/495通过／3失败；随后审核模式专项修正通过，目前剩2个正式模式合法控制等待审批，不能删去测试称全绿。源扫描有32项合成夹具／公开配置命中，精确登记仍被审批拦住。HTTPS回调/AASA、IAM broker、GitHub required-check和新原生候选仍须独立联动发布，源码通过不等于线上修好。

QA入口：`output/qa/rillora-security-remediation-20261011/`；独立原始记录：
`/Users/tantalum/.codex/state/plugins/codex-security/scans/-app/artifacts-525a0c93b7f59f820eedceb469751c489326de4e2e19960e442fe844614ce16a/artifacts/remediation/rillora-20261011/`。

## 唯一下一步

取得两项工具强制的Owner答复后，在现有候选工作树应用获准的精确草稿，完成余下正式模式回归与秘密扫描，再提交／推送所有符合保存政策的新工作并安排联动发布。若拒绝其中一项，保留候选和失败证据，明确该边界未完成；不绕过审批或恢复旧的发布任务。

[上一交接](handoff-history-20261011-before-security-remediation.md)标记为HISTORICAL。旧云端恢复、手机13、付款及归档30证据沿用其日期，不重做。
