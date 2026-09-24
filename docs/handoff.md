# Rillora Current Handoff

Status: IDENTITY/MAIL PREPARATION — PUBLIC INFORMATION VERIFIED; SES FOLLOW-UP SUBMITTED; PRODUCTION SENDING AWAITS REVIEW
Last updated: 2026-09-25 (Asia/Hong_Kong)

## 当前Owner任务

继续正式生产接入。Owner提出先测试、临上线清理；保留Auth0 Free，不购买US$35起步套餐，不现在清除测试账号。Free实际为25,000MAU；US$35只对应Essentials的500MAU起步档，不能混为同一套餐。[身份／邮件合同](production-identity-mail-20260924.md)。

## 已完成

- 沿用本工作流全量Markdown阅读基线并补读变化文件。AWS在本轮中途过期，Owner已完成本人登录，CLI续期和STS回读通过；无需重复登录。Auth0／GoDaddy原管理身份保留。
- 原EU Auth0新增生产Web／iOS客户端与独立API audience，所有新connection关闭，旧绑定不变。上线前仍需退役测试M2M／会话／旧绑定，并等待已签Management JWT的实际86,400秒寿命加时钟容差后做负向验收；不能只轮换秘密或删除事项。
- Google独立项目的政策、03Logo、官网／法律链接、Owner明确批准的托管OAuth凭据和openid／email／profile已保存。秘密仅保存在忽略目录0600文件；原Auth0 Google测试连接不变，新项目仍Testing。
- RilloraMail已部署；notify／bounce域名、DKIM、TLS、抑制配置、四项邮件告警回读通过。三次SES模拟器产生Send3／Delivery2／Bounce1／Complaint1，SNS告警动作执行；不是普通用户收件／垃圾箱或真实抑制名单验收。
- [公开官网](https://www.rillora.xyz/)及18份指南／支持入口已部署。私有S3、OAC、产物哈希、拒绝路径、DNS和WWW HTTPS验证通过；根域HTTP302、Chrome HTTPS和现代Node监控请求通过。保留早期TLS／403客户端差异。12目标实际云监控ok／failed0。[公开站合同](public-product-website-20260924.md)。

## 当前阻塞与证据边界

SES接口为DENIED／生产发送未启用，但已读取的工单179022088800001实际要求补充发信频率、收件来源、退信／投诉／退订和邮件样例，并邀请继续审核，未说明最终拒绝原因。Owner回复“开始吧”后，已提交原稿并在工单回读01:12:39+08:00的记录，当前状态显示“客户操作已完成”；无需再次确认这份回复。Support API要求付费计划，但普通控制台可用，没有购买Premium Support。Auth0邮件provider和SES发送凭据尚未配置。新增只读核验脚本通过7项边界测试；真实云端15项检查中14项通过，唯一未过项为productionAccessEnabled，不能据工单已提交而开启客户发信。

[本轮QA](../output/qa/rillora-production-identity-20260924/work-state.json)：36infra、9Web公开／指南、8DNS、6monitor、13发布／恢复守卫通过，两个Web构建通过；首次infra并发超时与限制worker后通过分别保留。873文件源扫描仅有22项已审非秘密、0未知，137份Markdown的本地链接检查无缺失。源码已推送独立私有库：工程提交af69a6e及CI预算修正f8d1344；[CI8](https://github.com/tantalum666/rillora/actions/runs/36031875706)三作业通过，实际重跑212API、36infra及Web／构建检查。CI7的两项5秒合成超时保留；改为20秒预算、2worker，没有减弱断言。真实恢复、closed生产API1、staging和iOS仍沿用原检查点，本轮没有重建数据库、重复恢复或原生构建。

公开信息站上线不等于账户／销售开放。最终app.rillora.xyz、原生Release连接、普通交易与Apple提交仍由[发布合同](release-readiness.md)管理；UI、88.80年付、FanPass、E2EE延后及Owner暂缓项不变。

## 唯一下一步

等待AWS本次审核结果后运行只读邮件核验，再完成受限发送身份／Auth0邮件及真实验证／恢复验收，随后进入受控身份切换。回复已发送，不重复提交或重新索取同一授权；不提前清理测试数据或开放客户账号。

[前轮交接—HISTORICAL](handoff-history-20260924-before-identity.md)。

本次续接新增tools/release/check_mail_readiness.py及7项测试，只有AWS读取与报告输出，不发送邮件或创建定时任务；源码／CI收尾记录在本轮QA。前述CI8仍是原工程检查点，新增工具的CI结果单独记录。
