# HISTORICAL — before actual build9 plan acceptance

Superseded by [current handoff](handoff.md).

# Rillora 当前交接

Status: 已部署Dot整合及受限续期；原生9已上传；Apple实际登录失效待恢复
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 当前任务与已完成

Owner最新要求“开始部署和下一步”。源码58fadf357（应用树5a547339a、PR1合并eb5fb1a70）
已部署，不重复上一轮272原生/174Web/17API/66guards/CI73/20浏览器验证。
[本轮准确结果](dot-rollout-20261007.md)。

- API镜像更新后为任务15，原审核期限更新后为16；1个HEALTHY实例、rollout完成。
  镜像sha256:c43336c743d5ecc0cdd24d92b13ca46dd6db2eb47f918b075f91a19bf919fb43。
  schema0093沿用，未执行迁移；与14相比仅镜像/期限变化，角色/密钥/网络/其他环境不变。
- 生产Web86/官网31/Preview86文件全部与发布包匹配；四栈实际模板与审核模板一致。
  官网→Preview中文延续、指南langHint/下划线ID跳转正确，健康200、匿名受保护接口401。
- 已明示并完成原三个身份及原Owner planner Sandbox资格续至2026-10-08T20:00:00Z，
  即香港10月9日04:00；没有新增身份/同意/订单。Auth0复用现有浏览器恢复原CLI范围。
- 1.0(9)归档/导出14检查通过，2026-10-06T19:57:49Z上传成功，未重复旧构建。
  双语测试说明已备好。Apple详情实际authResult=FAILED，当前Chrome停在密码页，已请求Owner。

## 证据边界与阻塞

9的处理、内部组分发和App Store草稿选中尚未读回；8仍是最后已验证的分发/草稿版本。
未提交App Review、未记录9真机安装/购后恢复/跨端权益。已验签HKD888 Sandbox购买保留，
不要重购。Apple美国119.99/Web88.99、Free1/Family5、真实资料和FanPass保持。
Stripe经营/税务事实、Live接通/真实交易和最终客户开放仍未完成；外部邀请和独立账号
删除保持Owner暂缓。此次QA/签名/部署材料已追加archive22：387路径/274对象，55,533,496字节，本地解密核验通过；
已推送codex/dot-rollout-20261007；GitHub独立新下载的274对象/387路径解密核验通过（7d4189371），
自动CI75的source/API/Web-infrastructure三项成功。最后元数据回执不重复部署或产品测试。

## 唯一下一步

Owner在已打开的App Store Connect页面恢复这次实际过期的Apple登录后，读回已上传9的处理
结果，仅分配原内部组/原测试员并更新未提交的手动发布草稿，随后继续真机更新及原购买的恢复验收。
不重传9、不重购、不扩大测试成员或重新申请已完成事项。

[上一交接](handoff-history-20261007-before-dot-rollout.md)为HISTORICAL。
