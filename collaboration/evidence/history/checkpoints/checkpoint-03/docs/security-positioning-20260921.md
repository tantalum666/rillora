# 信息保护：从竞品宣传到可验证实现

Role: focused evidence review and proposed security positioning  
Status: OPTION2 SELECTED AND IMPLEMENTED IN STAGING; NO E2EE OR CERTIFICATION CLAIM  
Last updated: 2026-09-23 (content encryption rollout; production gates remain open)

## September23 实施增量

Owner已采用应用层内容加密＋独立KMS，完整在线E2EE暂缓。已在现有staging创建并核验保留／轮换的KMS key，部署加密API，迁移既有受保护正文；第二次迁移无重复改动，明文0／无效引用0并启用DB写入拦截。正常服务端仍可在授权后解密。Free／Family保护一致，正式发布和安全宣传没有随测试站自动开放。具体实现、最终权限回读、198项API与真实KMS证据见[实施合同](security-hardening-20260921/implementation/envelope.md)及[当次QA](../output/qa/rillora-content-encryption-20260922/README.md)。

下文为September21–22研究基线，原“未选择／未创建”的叙述只描述当时；不再作为当前执行门。身份／权限元数据仍有明文字段，旧手动快照仍是RDS存储加密，不能扩大成全数据零知识或旧备份已重写。

## September22 工作量跟进 — 历史

Owner进一步询问完整E2EE是否工作量大、能否达到竞品保护。代码及既有证据12份哈希均未变，竞品官方页面已重新读取。当前粗估为信封加密8–15工程日、完整在线E2EE24–40工程日；这是中低置信度工程预算，不含其余发布、外审、平台和实机等待，也不是交付承诺。具体拆分、范围与A离线邀请／多设备恢复难点见[工作量分析](e2ee-effort-20260922.md)。Owner没有在本轮选择或要求实施某一架构，September21建议保持提案状态。

## 本次问题与完成范围

Owner询问竞品的“银行级”等信息保护宣传，以及Rillora如何做到。本轮核查官方来源、当前代码和当天既有运行证据，形成[加固方案](security-hardening-20260921/hardening.md)。我们没有借研究自动发布安全广告、迁移内容加密、购买安全服务或宣布认证。

同时恢复了前轮Logo上传：Owner调整Chrome扩展后，文件选择器实际上传成功。Stripe独立Rillora TEST账户的icon和完整wordmark保存后重载仍存在，预览显示选定03；Google Rillora Identity显示“已保存品牌更改”及当前Logo，仍处Testing，未改scope／发布状态。Auth0自定义Liquid的Free套餐402限制仍独立存在。

## 找到的官方例子

这些是与Owner描述匹配的例子，不能据此确定Owner当时看的究竟是哪一家。

| 产品／原链接 | 官网如何说明 | 我们应如何理解 |
| --- | --- | --- |
| [Everplans对bank-level的解释](https://help.everplans.com/hc/en-us/articles/215665828-What-does-bank-level-security-mean)、[现行安全页](https://www.everplans.com/security) | 描述AES256、按用户／计划生成密钥、2FA、访问审计及SOC2 TypeII审查 | 不是只买一张HTTPS证书；帮助页日期较旧，当前安全页与旧细节需分开看 |
| [Trustworthy安全页](https://www.trustworthy.com/security)、[FAQ](https://www.trustworthy.com/faq) | 描述AES256、MFA／硬件密钥、tokenization及外部审查 | 按它自己的公开声明记录；未取得私有审计报告全文，不替其验证绝对安全 |
| [GoodTrust官方支持说明](https://support.mygoodtrust.com/support/solutions/articles/66000503693-what-security-does-goodtrust-have-) | 2026-02-02更新，列出文件AES256、2FA、权限和SOC2 TypeII | 支持页面可读，单独security地址本次抓取失败；不把失败地址当已读证据 |

“银行级／军事级”这类描述本身没有说明具体审查范围、密钥持有人或失效条件。
AES256是加密算法规格，不是整个App已经通过银行或政府认证。[NIST AES标准](https://csrc.nist.gov/pubs/fips/197/final)。
SOC2属于组织控制的独立鉴证／报告，不由使用AWS或Auth0自动继承。[AICPA原始说明](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services)。

## September21研究时的保护基线

| 层面 | 可验证基础 | 不能据此推出 |
| --- | --- | --- |
| 存储介质 | 既有staging回读RDSStorageEncrypted=true，代码要求私网数据库 | 合法SQL查询仍可返回普通事项正文；不是全产品零知识 |
| 网络 | 用户公开HTTPS入口、CloudFront最低TLS1.2、数据库verify-full | Gateway到运行时的私网跳未配置TLS；不能宣传每一跳都已验证加密 |
| 会话和权限 | 自有typed会话、哈希token、Cookie／CSRF、KeychainThisDeviceOnly、租户RLS、逐项逐人披露 | 支持Passkey不等于强制所有人MFA；Keychain不等于App已具有FaceID锁 |
| 加密导出 | Start Here路径使用客户端AES-256-GCM及HPKE | 只适用于该恢复包，不覆盖全部在线地图、普通备份或草稿 |
| 数据最小化 | 不提供银行卡密码、私钥／助记词存储字段 | 不能保证任意自由文本绝不会被用户填入秘密 |
| 运行维护 | 有监控、脱敏意图、依赖检查及自助退出基础 | 独立生产恢复、全链路日志验证、独立渗透检查和SOC2尚未完成 |

RDS官方明确说明它透明地加解密底层存储，数据库客户端不需要改变；这也解释了它与应用层内容加密的区别。[AWS原文](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html)。
本轮Auth0guardian/policies读取因缺read:mfa_policies被拒绝；没有扩大权限或重新要求Owner登录，也没有凭未知状态断言统一MFA已经开启或关闭。

## 推荐的实施方向

我建议首发采用[选项2：应用层信封加密](security-hardening-20260921/proposals/private-content-boundary.md)。要覆盖事项标题、平台／账号提示、位置、Notes、钱包地址，以及共享旧副本和维护历史中的相同敏感内容。数据库保存密文与被封装的数据密钥；数据密钥由独立KMS保护。先验证当前授权，再解密并只返回该接收人获准字段。业务数据库读取泄露与应用运行时失陷是不同威胁，后者仍需防护；不能宣称平台无法解密。

共同上线门包括：抗钓鱼认证优先；导出、敏感共享修改和恢复后的重新认证；明确的管理员最小权限及异常访问记录；Web草稿和iOS本地解锁策略；生产邮件／异常通知；逐跳TLS；至少7日的生产备份及实际恢复／删除重放。按OWASP ASVS5适用L1＋L2要求建立覆盖矩阵，不能把部分检查或零已知公告写成全面认证。[OWASP官方级别说明](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x03-What-is-the-ASVS.md)。

若Owner要求“连Rillora运营者也无法读取在线正文”，应另外选择客户端E2EE方案。它需要两端的多设备密钥、A/B/C分层密钥、设备遗失／恢复、已共享旧副本和撤销后的新版本规则。不能为了保留方便的密码重置而把恢复密钥偷偷交还服务器，也不能承诺抹去已被接收人保存的内容。

## 成本与独立证据

不需要每户一台服务器或一套HSM。按少量每环境KMS包装密钥＋大量数据密钥设计，避免把100用户变成100把按月收费的KMS主密钥。AWS公开对称KMS示例为每主密钥US$1／月，另计调用；20,000次/月免费调用额度有适用范围，超出示例单价US$0.03／10,000次。轮换、多区域、日志、存储、实际合同和税另计，不能据此把整个安全运营说成每月1美元。[KMS价格](https://aws.amazon.com/kms/pricing/)、[密钥类型](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html)。本轮未创建密钥或发生此新增订阅。

更主要的投入是正确实现、故障恢复、持续补丁和独立验证。AI可以执行自动检查、组织证据和修复代码；独立渗透检查或SOC2鉴证仍需要相应外部主体。一次性采购独立服务与长期雇员是两回事，实际费用要按代码／云范围询价。本轮未询价、发送邮件、采购或承诺审查期限。

## 对外怎么说

现在可在开发／测试证据语境下说明“数据库存储加密”“按人按事项授权”“不收集直接转账秘密”等具体事实；不能把staging证据直接包装成已上线产品证明。

建议在生产验证后使用短主张：**Your information, shared on your terms.**
下面用三个有证据的要点说明加密保护、分享范围和可恢复／可退出能力，再链接简洁的安全页，列出密钥持有人、最近检查日期和仍存在的边界。应用层加密全部覆盖并验证后才说“敏感内容在写入数据库前加密，密钥独立管理”；全产品E2EE及独立报告有相应证据后才使用对应术语。

安全是所有用户共同的底线，有助于建立信任和转化；不把Free用户的基础保护撤掉来制造付费理由。Family的价格继续由持续协作／共享服务支撑。我们没有在当前网页或App加入“银行级认证”“100%防泄露”或未获证实的认证徽章。

## 证据边界与交付

[结构化方案](security-hardening-20260921/hardening.json)与[完整技术比较](security-hardening-20260921/proposals/private-content-boundary.md)包含源哈希、三种架构、迁移、回滚及验收。它们是提案，不是运行实现。前一阶段179API等测试和云端容量结果仍保留原日期，本轮没有重复运行这些套件或安全扫描。Logo保存／重载是本轮真实操作，见[QA](../output/qa/rillora-security-positioning-20260921/README.md)。
