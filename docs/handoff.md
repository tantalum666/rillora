# Rillora 当前交接

Status: IN PROGRESS — Dot候选整合与Owner已授权的legal域名切换
Last updated: 2026-10-08 (Asia/Hong_Kong)

## 当前任务与已完成

Owner要求跟进Dot新增工作、直接修复并合并；随后明确“不是暂缓，是由你来执行”，
授权本会话接手法律域名的GoDaddy步骤，取代Dot交接里的暂缓记录。TestFlight暂停继续有效。

- 当前操作基线06da36071，手机安装源码35f37e1b2的本地1.0(11)；最近分类栏和Owner恢复Family反馈保留。
- 四条新增refs中外链守卫被Cloudflare交接分支包含；有效三头已在候选codex/dot-integration-20261008
  合并至608a77109，尚未合回原操作分支。唯一冲突为浏览器工作流触发分支，已同时保留两侧。
- 新Markdown和18份中英指南正文已读取；英文原文/URL/权限字段逐项机械比较保持一致。
  8项原生目录测试及186项Web非法律测试通过；原生导航过渡视频和合并后的浏览器检查仍进行中。
- Cloudflare两站既有部署成功状态已读回。新旧Privacy浏览器渲染正文完全相同，原文仅保护保存。
  GoDaddy已有认证和34条记录读取成功；仅legal从custom-domains.chatgpt.site改为
  rillora-legal-pages.pages.dev，TTL600。wrapper已确认应用及其他记录不变；
  额外独立读回曾暂时失败，正在复查DNS解析、域名/证书active和实际页面，不能提前记作迁移验收完成。

## 证据与保留边界

本轮QA位于output/qa/rillora-dot-integration-20261008/；精确refs与当前阶段见sources.json/checkpoint.json。
DNS原始全区快照和法律正文在.local-secrets/legal-cloudflare-cutover-20261008及.local/dns-backups，
不能进入明文Git。旧Cloudflare/Sites部署保留，未重复发布同一包；没有改邮件DNS、app、login或FanPass。
当前API16/schema0093、价格、真实数据、原三身份到期2026-10-08T20:00:00Z及外部邀请/独立删除暂缓保留。

## 唯一下一步

完成本次legal切换的独立DNS/TLS/七页面验收，同时补齐候选代码的原生/浏览器检查和必要修复；
验证通过后创建/附加PR并合回原操作分支，保存新的合并和迁移证据。

[上一交接](handoff-history-20261008-before-dot-integration.md)为HISTORICAL。
