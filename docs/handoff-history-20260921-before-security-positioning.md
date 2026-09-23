# HISTORICAL — before Logo upload recovery and security positioning

Superseded by the current handoff. Earlier pending upload permission is historical.

# Rillora Current Handoff

Status: ANNUAL-ONLY STAGING DEPLOYED; LOGO EXTERNAL GAPS AND PRODUCTION IDENTITY OPEN  
Last updated: 2026-09-21 (Asia/Hong_Kong)

## 当前任务与已完成

Owner取消新月付，要求全入口Logo核查及100用户容量评估。只有新购年付US$88.80；
未批准Apple99.99／119.99渠道价，Free1／Family5及历史已购权利不变。

- API33／migration26及0063已部署；月付报价retired，新购API拒绝月付，旧receipt仍可对账／恢复。Web目录实际仅annual8880，billingOpen=false；主App及Preview已构建安装。
- Stripe独立TEST账户三代月付Price已归档；保留两个v1有效测试订阅。Apple未提交月付商品销售地区0，应用描述已保存年付。无真实收款、提审或公开产品发布。
- 主App／Preview桌面、现有Web／法律站及默认Auth0预览使用选定03。真实login.rillora.xyz旧Liquid模板与Stripe／GoogleLogo缺口如下，不宣称全覆盖。
- Auth0实际Free额度2/25,000MAU。AWS0.25vCPU/512MiB＋RDSmicro当前低频100用户无需按人数盲目升级；100合成用户／2,000事项已做私有读取检查。

完整状态与来源：[执行合同](annual-brand-capacity-20260921.md)；[QA](../output/qa/rillora-annual-brand-capacity-20260921/README.md)。

## 验证与证据边界

本轮179API、17原生CommerceStore、21infra、30已发布HTTP／资源检查通过；Web和两个原生target构建成功。没有重跑完整原生／Web所有业务套件。

第一轮300请求中298成功、2次IP限流；窗口自然重置后180次中179成功、1次客户端传输失败；同接口3次复查均200。目标10rps、最多10并发的60次短测全200，P95约1.53秒。测试时API最大CPU12.32%／内存14.26%、RDSCPU7.75%；不是100并发／真实注册／送达／支付验收。脚本与失败原记录保留，精确隔离账号清理状态由QA记录。

## 明确未完成与当前阻塞

- Auth0模板API在当前Free套餐返回402。基本品牌保存成功，但真实custom-domain仍是旧文字模板；完整03源修改已准备、未应用。不能自动买套餐或删旧模板改版。无自定义认证邮件provider，内建邮件10封／分钟且不支持生产。
- Stripe与Google目前缺Logo。Chrome文件上传返回Not allowed；访问chrome://extensions又被工具URL策略明确阻止。已请Owner自行开启ChatGPT扩展“Allow access to file URLs”，未获回复前不重试／绕过。Chrome重新连接后ID已变，旧tab绑定不能直接沿用。
- Google后台已新读回Testing、Logo为空，Auth0连接scope为email/profile。官方基本身份例外意味着不能笼统套100测试用户硬上限；生产项目／品牌审核仍独立。
- AppStore没有提交构建，商店图标仍需最终构建；Apple年价点待选。生产隔离、至少7日备份／恢复、生产邮件与身份、购买及审核仍按发布合同完成。经营登记、实体设备沿Owner暂缓，不重问。

## 唯一下一步

完成[发布合同](release-readiness.md)的生产身份与邮件配置：先落实Auth0免费基础页面／保留付费模板的选择，补齐受工具权限阻塞的Stripe／Google品牌，再与独立生产回调及恢复验收衔接；不要重新改价、重做UI或把staging改名上线。

## 压缩后恢复

沿用本工作流92份Markdown完整阅读记录；精简读AGENTS、product、本文件、最新决策及执行合同。AWS、Auth0、Apple会话已恢复，先检查可用性，不重复请求本人登录。历史月付类型／收据ID必须保留。
[被取代交接—HISTORICAL](handoff-history-20260921-before-annual-only.md)。
