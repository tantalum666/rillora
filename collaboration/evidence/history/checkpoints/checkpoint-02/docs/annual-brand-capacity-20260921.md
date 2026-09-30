# 年付实施、品牌覆盖与100用户容量

Role: September21执行、provider回读与运行容量证据  
Status: ANNUAL-ONLY STAGING DEPLOYED; EXTERNAL BRAND GAPS EXPLICIT; CAPACITY CHECK RECORDED  
Last updated: 2026-09-21 (Asia/Hong_Kong)

## Owner决定与销售边界

Owner明确取消月付；新购只有永久Free及US$88.80年付Family。Free1／Family5、
一位建议贡献者、历史已付期、授权截止副本、恢复／导出／删除继续遵守原合同。
Apple99.99／119.99渠道价是未批准建议，不由取消月付自动采纳。正式销售未开放。

目录保留历史月付金额但标historicalOnly；0063只将月付报价标retired。
API拒绝新月付Checkout、历史provider对账仍识别retired报价。StoreKit只加载／
购买annual，新旧两种ID仍用于事务更新和恢复。两端移除多余的单选账期切换。

实际已完成：API33／migration26部署到原staging，0063成功；179项API测试、
17项原生CommerceStore测试、21项基础设施测试及30项已发布HTTP／资源检查通过。
Web构建与主App／Preview构建安装成功。测试没有开启生产购买，也没有本轮新年价付款。

| 渠道 | September21回读 | 保留事项 |
| --- | --- | --- |
| Stripe独立Rillora TEST账户 | v1/v2/v3月付Price均已归档，88.80年付保留 | 两个v1有效测试订阅和所有历史对象未删除；归档不等于取消旧订阅 |
| Apple未提交月付商品6803958645 | 已选销售地区从8改为0 | 保留商品ID和历史金额；没有已发布客户订阅 |
| Apple应用草稿 | 英文描述已保存为annual subscription | 无提交构建／审核；精确Apple年价仍待选定 |

Apple下架会同时影响新购和续订；这次是未发布商品，不套用Stripe只归档Price的语义。
[Apple供应情况规则](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-availability-for-an-auto-renewable-subscription/)。

## Logo覆盖审计

所有修改沿用已选Legacy Imprint03完整几何；不改现有AppUI、不另设计Logo。

| 位置 | 当前证据／结果 |
| --- | --- |
| iOS主App桌面、首页及现有品牌组件 | 正确03；本轮主App重新构建安装，实际截图核对 |
| Rillora Preview桌面图标 | 找到AppIcon配置为空，已修正、重新安装；桌面截图同时显示主App和Preview正确图标 |
| Web应用及浏览器资源 | 当前构建／CloudFront资源匹配；页头沿用完整03，tiny favicon独立小尺寸资源 |
| 法律站 | 现有Sites6品牌资产在线且与选定源SHA一致；未重发法律正文／要求重新同意 |
| Auth0基本品牌 | tenant icon/favicon、default-theme lockup、Web/iOS client logo已应用并读回；默认Auth0域名预览正确 |
| 实际login.rillora.xyz | 旧Liquid模板隐藏widgetLogo并使用文字；模板API在Free套餐返回402。完整03替换源已准备，**未部署到此模板** |
| Stripe品牌 | 首次被文件权限阻止；Owner调整后，icon及完整wordmark已上传、保存并重载核对。只操作独立Rillora TEST账户，未开启收费 |
| AppStore产品页 | 尚无提交构建；图标来自上传的Xcode构建，不能靠模拟器截图声称商店页完成 |
| 正式根首页及GoogleOAuth品牌 | 根域名仍是预发布独立页面；Owner调整文件权限后Google已保存03 Logo，隐私／条款URL正确。仍处Testing，没有改为Production或提交品牌审核 |

Chrome此前需要的文件权限已由Owner调整并用成功上传验证；[后续保存证据](security-positioning-20260921.md)。
Auth0付费模板不能通过Basic品牌保存推定完成；不自动购买套餐、取消旧模板或改版。
[Apple图标来源](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon)。

## 容量：已测配置与判断

当前是合成staging：单个常规Fargate任务0.25vCPU／512MiB，数据库连接池5；
RDSPostgreSQL16.13、db.t4g.micro、20GiBgp3、SingleAZ、备份1天。
过去24小时API平均CPU1.64%／内存12.17%，RDS平均CPU4.43%；空闲存储约17GiB，
CPUCreditBalance288。低流量历史指标不是100人同时在线的压力证明。

建立100个独立隔离账号、各20项事项（2,000项），使用预置的短期native会话读取
真实HTTPS私有接口。第一轮5请求／秒共300次：298成功、2次429；P95约1.47秒。
尾部429来自应用按来源IP的300请求／15分钟限制，返回明确Retry-After，
不是CPU耗尽；没有为了测试放宽保护或伪造不同来源。Gateway另有25rps／burst50。
此次不包含Auth0登录、支付、邮件、浏览器渲染和100个同时发起的请求。

测试时段的1分钟指标：API最大CPU12.32%／内存14.26%，RDS最大CPU7.75%、
连接数2、最低FreeableMemory约171MiB。它支持当前未饱和的判断，不代替更长的
峰值／写入／共享读取及故障恢复验收。

自然等待IP窗口重置后，180次5rps复测179次成功、1次客户端传输失败（没有HTTP状态，
旧脚本没有保存原始curl错误，故不臆断为服务端超时）。该账号的同一事项接口随后
3次均200并返回20项。目标10rps、最多10并发的60次短测全部200，P95约1.53秒、最大1.82秒。
原失败记录保留；没有把部分失败的一轮改称全通过，也没有伪造来源／放宽限流。
复测商业接口确认唯一报价annual8880，billingOpen=false。隔离测试账号和事项
按本轮精确标识清理；独立数据库回读剩余0个合成身份，旧token返回401。

**工程判断：100个低频使用者没有立即扩CPU或付费升级身份MAU的证据。**
100个家庭也要计入接收人；按100位主人＋每户5名不同接收人，最多600个身份，
并不等于600个每天活跃用户。共享Wi-Fi／企业出口、CDN来源归属、流量峰值与恶意请求
需要分层限流验收；不能以注册人数承诺吞吐量或可用性。

| 服务 | 实际情况 | 升级／上线触发 |
| --- | --- | --- |
| Auth0身份人数 | Free，2/25,000外部MAU，M2M0/1,000；DEVELOPMENT租户，报表日更 | 按真实MAU或所需功能评估；100／600身份均不触发25k容量 |
| Auth0模板 | 实际管理API402要求paid | 保留当前高级模板修改能力会触发付费；基础Logo主题已可用，不为人数升级 |
| 认证邮件 | 无外部provider；内建服务不支持生产、10封／分钟 | 正式上线前接可靠事务邮件并验证到达／退信；不能把邮件限制当服务器不够快 |
| AWSAPI/RDS | 上述小规格有当前余量 | 持续CPU／内存／连接压力、错误及延迟触发调整；共享来源限流单独处理 |
| 生产可用性 | 当前single-task、SingleAZ、1日备份只是staging | 独立生产、至少7日备份、隔离恢复和告警验收仍须完成，不能直接改名上线 |

Auth0公开B2CEssentials从500MAU的US$35/月起；这只是当前公开起价，不是给本项目
购买或精确合同报价。不能把Auth0基本Free人数和付费定制功能混为一谈。
[当前定价](https://auth0.com/pricing)、[邮件生产限制](https://auth0.com/docs/customize/email/smtp-email-providers)。

Google基本身份登录适用官方Testing例外，不能笼统宣称最多100人；本轮Auth0连接
回读为email/profile，Google后台实际仍为Testing。新的敏感scope、品牌审核与
生产项目要求另计。
[Google原文](https://support.google.com/cloud/answer/15549945?hl=en)。

不预购更大实例或新的Auth0套餐。先完成生产身份／邮件／恢复，随后以持续P95、
5xx／429、CPU、可用内存、连接数和存储余量决定扩容，而非按用户整数自动加成本。
读指标所需的新IAM权限仅为现有staging角色在eu-central-1的两项只读诊断，不新增秘密读取权限。

证据、脚本、失败原记录及后续复测：[QA](../output/qa/rillora-annual-brand-capacity-20260921/README.md)。
