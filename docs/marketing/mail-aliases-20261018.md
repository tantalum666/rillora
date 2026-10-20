# Rillora 营销平台邮箱别名

Status: BOTH ALIASES CONFIGURED AND SEND/RECEIVE VERIFIED / INITIAL SOCIAL REPLY RETRY RECORDED
Last updated: 2026-10-19 (Asia/Hong_Kong)

Owner明确要求配置social@rillora.xyz和hello@rillora.xyz，沿用现有Zoho邮箱作为别名，验证正常收发，不额外购买邮箱。这是营销准备的当前操作任务；OpenAI开发者身份验证仍按Owner决定暂后。

## 配置范围

| 地址 | 用途 | 交付方式 |
| --- | --- | --- |
| social@rillora.xyz | 品牌营销平台注册、验证和账号通知 | 现有support邮箱的别名 |
| hello@rillora.xyz | 品牌公开联系和合作沟通 | 同一现有邮箱的别名 |

保留support@主地址、privacy@和security@原别名、现有用户数和订阅。别名共用一个邮箱，不是新的独立账号或安全隔离；本轮不建立额外用户、群组、外部转发、付费套餐、平台营销账号或邮件群发活动。不改变现有DNS、Resend系统发信或产品法律页面。

Zoho官方支持同一用户的别名收发，并可按To/Cc过滤分类：[别名说明](https://www.zoho.com/mail/help/adminconsole/user-settings.html#email-alias)。当前只按实际后台能力操作，若地址已存在先检查归属，不重复创建。

## 收发验收

使用既有Owner控制的Gmail，向两个别名各发一封仅含测试编号和目的的验证邮件。确认Zoho实际收到后，分别选用对应别名作为From回复，再在Gmail独立核对发件地址、主题、正文与收件位置；能取得原始认证头时记录SPF／DKIM／DMARC结果。不得仅凭Sent或provider的Delivered提示就宣称外部收到。

编号为RLM-20261018-SOCIAL和RLM-20261018-HELLO。没有客户资料、密码、验证码或真实产品事项。该目的限定收发属于Owner此次明确要求的验证，不扩大成营销外发授权。

## 当前观察

Owner已完成原Zoho登录。首次管理页停在Loading，普通刷新后恢复；没有再次登录、改密码或扩权。实际后台确认Mail Lite年度订阅、1个用户、1份许可证；原主地址及privacy/security别名均存在。

social@和hello@已添加到同一邮箱，显示名均为Rillora；support@仍为主地址，原别名保留，创建后后台用户数／许可证仍为1。没有DNS、Resend、转发或套餐变化。

两封Gmail测试均已实际进入Zoho INBOX，正文／目标别名匹配，显示TLS。邮箱页面在新建别名前打开，发件下拉仍缓存旧地址；保存本次social测试草稿后普通刷新，两个新别名均可选。分别核对对应From、既有Owner Gmail收件人和测试正文后发送，没有用support@代发。

hello@的外部回复已实际进入Gmail INBOX，From／收件人／主题／HTML正文匹配，Google收信认证中的SPF、DKIM、DMARC均pass。social@的第一封回复已进入Zoho Sent，但Google返回4.3.0临时拒收，Zoho明确显示In Retry Queue并会自动重试；未把此封标为外部送达，也未手动重复发送或取消。Google将4xx归类为临时失败并由发件服务器重试：[官方说明](https://knowledge.workspace.google.com/admin/support/troubleshooting/about-smtp-error-messages)。

为区分首封队列延迟与social@当前发信能力，只增加一次独立新邮件测试RLM-20261019-SOCIAL-OUTBOUND，仍发往同一Owner Gmail、无凭据或产品内容。该新邮件已实际进入Gmail INBOX，From、收件人、主题及正文匹配，Google SPF／DKIM／DMARC也全部pass。因此两个别名的收／发能力均有外部实测；原首封回复的重试状态独立保留，不伪造该邮件送达或保证未来每封都不会延迟。

总共提交5封目的限定测试：2封Gmail来信、2封Zoho回复及1封social独立新发信；已在双方收件箱实读4封，首封social回复仍由提供方管理重试。没有再发送第三个social探针。

使用时继续登录原support邮箱收取全部别名邮件；主动发信在From下拉选择social@或hello@。不建立新密码或购买独立用户；本轮没有设置转发、注册营销平台、公开修改网站联系地址或开展营销外发。

QA：output/qa/rillora-marketing-mail-20261018，任务编号保留开始日October18；实际配置／回执跨到Hong Kong October19。身份／原始邮件截图留在保护目录，安全收发摘要和别名配置截图另存[本轮交付](../../collaboration/verification/marketing-mail-20261018/README.md)。
