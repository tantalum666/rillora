# Trust, Safety And Legal Boundaries

Role: non-negotiable trust boundary  
Authority scope: sensitive data, triggering, disclosure, legal claims and service continuity  
Superseded by: stricter applicable law, platform rule, security evidence or Owner decision  
Do not use for: personal legal advice  
Status: ACTIVE; MVP BOUNDARIES LOCKED  
Last updated: 2026-09-11 (focused entry/detail revision; not a new full security or legal review)  

## September11 locator fields and Notes

Crypto custody, network and a public wallet address locate an asset; they do not prove ownership, balance, access or authority. These fields and Notes are private data with explicit Details-level sharing. The form never asks for a private key, seed phrase, banking password or device unlock code. Free text is bounded and accompanied by concise guidance; this is not a claim that arbitrary secrets can be perfectly detected. No death/incapacity/unreachable or legal-release boundary changes. See [entry contract](account-matter-ux.md).

## Core Separation

每个条目必须先分类，不能统一叫“数字资产”：

1. 可继承或可能可转移的经济财产；
2. 受平台许可限制、通常不可转让的账号或内容；
3. 个人数据、照片、通信和创作资料；
4. 债务、订阅和持续义务；
5. 密码、恢复码、私钥和助记词等秘密；
6. 具有情感价值或可能伤害他人的私密消息。

产品不得从“用户记录了某项事务”推导出“该事项必然属于遗产、可以继承、可以登录或可以转移”。

## Data Minimization — LOCKED

MVP允许保存：

- 机构或平台名称；
- 遮罩账号或识别提示；
- 价值区间与重要程度；
- 资料位置；
- 指定角色和处理意愿；
- 官方设置完成状态；
- 必要的审计与版本信息。

MVP默认禁止保存：

- 银行、券商和支付账户密码；
- 完整加密货币助记词和私钥；
- 可直接绕过2FA的完整恢复码；
- 无明确目的的大规模邮箱、云盘或通讯录副本；
- 为分析目的发送的真实账号、文档内容和联系人身份。

## Claim State Machine — LOCKED

真实披露能力未来必须至少采用：

`ACTIVE -> CONTACT_FAILED -> CLAIM_OPENED -> IDENTITY_REVIEW -> DOCUMENT_REVIEW -> MULTI_PARTY_CONFIRMATION -> COOLING_OFF -> STAGED_RELEASE`

同时必须存在：

- 本人取消与恢复；
- 关联方通知；
- 申诉与人工升级；
- 全程审计；
- 对不可逆动作的更高门槛。

未登录、未签到、邮件退信、订阅停止、联系人单方声明或讣告链接均不能独立触发敏感资料披露。

## Separate Life Events

- `Death`：需要死亡事实和合法角色验证。
- `Incapacity`：需要授权书、监护或适用的能力证明；不等同于死亡。
- `Missing/Unreachable`：默认只允许有限通知和可逆支持，不自动进入遗产流程。

三者使用不同文案、证据、权限和终止条件。

### Wearable and device signals — LOCKED interpretation

Apple Watch、HealthKit、Fall Detection、Crash Detection、设备活动、网络状态和任何未来可穿戴数据都只能作为`SafetySignal`，不能成为死亡事实、行为能力、失联事实、申请人身份、合法角色或披露授权。具体要求如下：

- 没有心率样本、没有签到、没有设备活动、未响应提醒、设备离线、权限被拒、低电量或同步延迟一律解释为`UNKNOWN`，不得推导为死亡或危险；
- 跌倒、严重车祸、低／高心率或不规则节律等正向事件最多开启不披露Matter的可逆`WelfareCheck`；Apple系统Emergency SOS和当地应急服务优先；
- `SafetySignal`不得直接创建`CLAIM_OPENED`、跳过身份／文件／合法角色／多人核验、缩短冷静期、改变申诉权或建立任何资料访问；
- 福利联系人、可信联系人、执行人和接收人是不同角色。收到福利提醒不增加其计划权限，也不能让其以单方按钮“确认死亡”；
- 真实死亡申请必须由可识别申请人另行提出，并继续按死亡事实与合法角色的独立证据链处理；没有设备数据时该流程仍必须完整可用；
- 在另行批准、平台entitlement、目的适配、威胁模型、DPIA／法务筛查、数据最小化和实体设备测试之前，Rillora不得请求健康权限或收集原始心率流。

完整Apple能力矩阵与路线建议见[`docs/apple-watch-death-signal-research.md`](apple-watch-death-signal-research.md)。

### Death evidence and authority sources — LOCKED separation; RELEASE CLOSED

全球存在死亡登记、法院、公证与遗嘱认证等权威来源，但不得从“权威记录存在”推导出“Rillora拥有可调用的全球开放API”。每个真实死亡case必须独立验证`DeathFactVerification`、`ClaimantIdentityVerification`、`AuthorityVerification`和`RilloraDisclosureScope`；其中一个通过不能替代其他三个。

证据按以下层级处理：

- 获准的权威来源结构化结果，以及可验证数字签名／官方在线核验的电子证明，可以在适用法域与用途通过审查后支持对应判断；
- 受监管机构或合资格专业人士的结构化attestation只证明其明确声明的事实，不自动证明所有权限或披露范围；
- 上传扫描件、照片、截图、讣告和自由文本只用于case intake与风险分流，不能单独触发披露；
- OCR、AI篡改检测和字段一致性检查只能发现风险或减少录入，不能把不可验证图片升级为权威证明。

律师、公证人和probate practitioner可以帮助申请官方文件、判断法域、形成受监管意见或把可验证结果提交给Rillora，但不能统一替代登记机构、法院或Rillora自己的最小披露规则。专业协助若未来上线，应作为独立`Assisted Case`路径，并逐法域解决委托关系、执业资格、利益冲突、保密、保险、转介费、数据角色和投诉责任。

当前没有任何已批准的`Verified Release Corridor`。在完成本地法律、数据来源、数字签名／撤销、身份、通知、申诉、冷静期、最小披露和真实端到端测试前，Rillora只提供全球规划与指引，不执行真实自动或半自动释放。完整证据等级、权威来源现实和专业服务边界见[`docs/death-verification-evidence-research.md`](death-verification-evidence-research.md)。

### Current non-operative rehearsal

当前本地实现只把上述区别变成可审阅的策略演练，不是把真实申请机提前上线。死亡、失能和失联各自使用事件前缀状态、独立证据说明和不同终止条件；共同包含多人核验、规划者取消、申诉以及示意冷静期。死亡示意为14天，失能为7天，失联支持流程为3天；这些只是产品演练参数，不是法律期限、后台计时器或生产默认值。

演练只向已登录规划者展示可信联系人、执行人和接收人将来可能看到的精确字段投影。数据库、API、Web和iOS共同要求`simulationOnly: true`，并强制`operative / identityVerified / documentsVerified / multiPartyVerified / notificationsSent / dataReleased`均为`false`；操作按钮只改变演练状态，不验证身份或文件、不发送通知、不创建真实case、不建立权限也不释放资料。完整字段与状态合同见`docs/disclosure-rehearsal.md`。

## Disclosure Rules

- 逐项、逐角色、逐阶段披露；默认最小权限。
- 规划者保存的可信联系人、执行人或接收人只是Rillora内部角色记录，不是身份核验、同意、法院任命、遗嘱效力、账号访问或所有权证明。接收人必须绑定具体事项；邀请证据一旦存在不得通过编辑角色来改写。
- 人员撤销或事项归档会撤销相关活动角色与邀请。角色政策变化只会把旧演练快照标为过期，不会通知任何人或触发真实披露。
- 先披露操作指南和资料位置，再考虑敏感内容。
- 接收资料不等于取得所有权或合法访问权。
- “删除”区分本产品加密资料的密钥销毁与第三方平台的删除申请。
- 任何外部删除、关闭、纪念化或转移结果都必须标记为平台决定，不能保证。

## Export Lifecycle — LOCKED FOR PLAINTEXT AND CLIENT-ENCRYPTED OWNER RECOVERY

- 当前Start Here预览保存完整安全快照的SHA-256承诺，相关内容变化后明文生成和加密准备都必须重新预览。明文指南经两项明确确认生成，不得称为加密、安全、受保护或可撤销数字包。
- 当前文件排除专用账号提示、价值区间和币种字段；服务端只保留生成元数据与最小审计，不在数据库、对象存储或应用文件系统保存文件内容。
- 服务端“不保留副本”只描述Rillora控制的当前生成路径；浏览器、操作系统、备份、打印机或接收人保存的副本不在Rillora控制范围，不能承诺远程撤销或全部删除。
- Owner已批准客户端AES-256-GCM内容加密、RFC 9180 HPKE逐设备密钥封装和独立离线恢复密钥。两端上传前必须本地恢复自检；服务端只保存密文、公钥和封装后的密钥，不接收明文、未封装内容密钥或恢复私钥。
- 当前没有真实收件人设备登记或投递，密文包仅证明Owner离线恢复。恢复密钥与匹配密文一旦被外部取得即可解密，丢失恢复密钥可能导致恢复型包永久不可读，Rillora不能恢复或远程撤销这些外部副本。
- 明文指南和密文包都不授予法律权限、账号访问、所有权或第三方平台接受；真实收件人接受、密钥生命周期、披露和释放继续保持独立门。
- 共享字段、客户端行为和完整证据边界以`docs/start-here-export.md`为准。

## Authentication And Recovery Baseline

正式版本必须优先考虑抗钓鱼认证、设备级密钥、恢复通知、多通道验证、密钥轮换和独立安全审计。具体密码学方案在完成威胁模型前保持未锁定；不得用“军用级加密”之类营销语言替代可审计设计。

当前后端已在Auth0 EU Free开发租户验证Web Code流程和iOS Code + PKCE／API access-token交换，并签发自己的typed不透明Cookie或Bearer会话；业务库只保存`issuer + subject`映射，不保留提供商access/refresh token。会话值和CSRF值只以哈希形式保存；Cookie不能重放为Bearer绕过CSRF，开发身份适配器在生产环境必须拒绝启动。隔离虚拟WebAuthn认证器已验证Web Passkey；`login.rillora.xyz`已完成DNS、托管TLS、默认域以及Web与iOS Debug新issuer运行时回归。真实Apple设备／原生Passkey、备用因子、恢复通知、Release配置和完整账户接管测试仍未完成。

可信联系人和账户恢复人必须保持分离。可信联系人默认无权重置规划者账户；任何恢复路径都需要可见通知、会话撤销、敏感操作保护和可审计的异常处理，详见`docs/identity-data-region.md`。

## Blockchain Boundary — LOCKED For MVP

- 核心系统使用可更正、可撤销、可删除和可分区部署的PostgreSQL，不使用区块链作为系统记录。
- 个人数据、联系人、意愿、文件、密文、可关联哈希、钱包地址、申请、身份验证和释放逻辑均不得上链。
- 区块链不能替代死亡事实、行为能力、合法角色或平台授权验证，也不能绕过冷静期、申诉和人工复核。
- 未来外部完整性证明只可按`docs/blockchain.md`的批量、不可关联承诺边界研究，并须先完成必要性分析、DPIA、法律与密码学审查。

## Legal Product Boundary

- 不展示“全球合法”“全球有效遗嘱”或等价承诺。
- 法律文件必须按用户常住地、资产所在地、国籍、平台合同和文件形式要求处理。
- 产品可以记录法律文件位置、授权意愿和官方入口；生成或审查正式文件需要适用法域的持牌合作方。
- 用户生前意愿很重要，但不能自动覆盖平台条款、第三方隐私、强制继承规则或法院命令。

## Public Legal Pages — PUBLICATION LIVE; PRODUCTION IDENTITY CLOSED

Web已将Privacy、Terms、Subscription、Refund／Cancellation、Acceptable Use、Cookie和Legal Notice七份正式英文文本公开在`https://legal.rillora.xyz`，页面不依赖私有账户API。Sites version 3、自定义域、TLS、七路由200、根308、非法律／写路由404、安全头和脱敏渲染回读已通过。Google OAuth Branding也已保存并重载回读根域、Privacy与Terms精确链接，同意配置仍为`External / Testing`。

2026-08-24 Owner明确不聘请外部律师并要求尽量压缩个人责任。当前候选已扩展为Privacy、Terms、Subscription、Refund／Cancellation、Acceptable Use、Cookie和Legal Notice七页，并加入最大合法范围内的免责声明、间接／后果损失排除、`max(US$100, 过去12个月已付费用)`总责任上限、用户不当使用赔偿、force majeure、拟议一年索赔期和香港法／非专属香港法院默认。欺诈、故意不当、适用的重大过失、人身伤亡、强制消费者／隐私责任等不可排除项目明确保留；不得为了“免责更强”写一个更容易整体无效的绝对免责。

账户注册／使用同意是技术硬门。Web保留紧凑未勾选Account控件；iOS依据2026-09-06决定直接进入托管认证，在同一事务内完成未预勾选的Terms／Privacy／电子记录确认，不再显示原生Account邮箱页或独立法律页。Rillora不收集Auth0密码；Privacy是acknowledgement，Terms和电子记录为affirmative acceptance，注册同意不授权自动续费。API验证当前精确版本、consent-copy版本、normalized bundle digest及托管凭证，planner、append-only acceptance与session同事务提交。删除账户时只保留合同允许的去关联法律证据，不以举证为由保留私人地图。此处仅校正已批准的确认位置，不改法律正文、版本、digest或既有记录。

2026-08-25进一步澄清：continuity purpose可能持续几十年，active account／private map按账户目的寿命保留；未登录、漏复核、设备沉默、付款失败、取消订阅或降级Free都不是删除、死亡、放弃或披露触发器。只有核验后的主动删除或确认purpose结束才启动30天active-system／90天backup清理；最小合同／付款记录候选保留7年，security logs候选不超过12个月。退款按channel拆分：Rillora只控制direct Web／Stripe决定，Apple及未来其他store由对应provider流程决定；所有强制消费者权利继续保留。

这不把Agent变成持牌律师，也不证明条款在每个州或法域均可执行。Owner拒绝外部法律服务是明确风险选择；当前正文只对已批准的公开事实生效，不自动覆盖未来生产数据流、新subprocessor／跨境机制、代表／DPO、新市场或新收费渠道。任何这些事实变化都必须触发文本、版本／digest和同意证据的独立更新。

当前页面显示`Effective`，不再是`Closed-testing draft`。已确认的最低必要运营者字段仅在发布构建中受控注入，不进入仓库、Markdown、普通日志或截图。Google当前只保存Testing状态的公开法律链接，这不是Google验证、生产发布或真实用户同意证据。完整公开合同、证据边界和后续变更门见[`docs/public-legal-pages.md`](public-legal-pages.md)。

## Provider Policy Registry

每条平台规则至少记录：

- 平台和地区；
- 可执行动作；
- 明确禁止或不提供的能力；
- 所需文件；
- 官方申请入口；
- 来源URL；
- 最后核验日期；
- 规则版本或变更记录。

当前首批Apple、Google、Facebook／Instagram、GitHub、密码管理器、Microsoft、LinkedIn、X、PayPal、Coinbase和Binance官方指导见[`docs/provider-death-account-guides.md`](provider-death-account-guides.md)。产品必须继续区分生前设置、账号恢复、纪念化／关闭、内容申请、资产转移与自托管密钥：其中任何一个入口、checkmark或支持case都不建立合法授权、账号登录权或所有权。Rillora只打开provider官方HTTPS页面，不代填账号、密码、2FA、死亡证明、身份证明或遗产文件，也不把provider要求的材料写成全球通用法律清单。

## Product Event Privacy

当前八个本地进度事件由服务端在业务事务成功后生成，只允许枚举化动作和低基数属性。不得包含事项标题、机构、账号提示、位置、金额、币种、联系人身份、自由文本、邀请能力、密文或身份提供商标识；客户端没有任意埋点入口，公共合成收件人调用也不发送规划者来源头。

事件行的90天`expires_at`只是删除期限标记。当前没有定时清理、第三方收集、运营查询、用户同意界面或生产分析管线，因此不得声称已自动删除、已匿名化、已有用户洞察或市场验证。完整合同见`docs/product-events.md`。

## Product Survival

长期可信产品必须规划：

- 可读、可迁移的导出格式；
- 离线恢复或替代服务路径；
- 公司关闭、被收购或停止服务时的通知和迁移；
- 订阅到期后的合理宽限和资料取回；
- 加密与密钥方案的升级路径；
- 数据删除和账户关闭证明。

一次性终身付费不得在没有长期储备和履约设计时承诺几十年服务。

订阅生命周期继续遵守以下不可收费／不可触发边界：最低安全控制、账户与资料导出、删除、取消和接收人基础访问不得被付费墙锁死；订阅取消、过期、退款或扣款失败均不得作为死亡、失能、失联、申请、验证或披露信号。付费权益到期后的状态必须允许核心资料读取／取回，并对超出Free额度的未来附件提供明确通知和合理下载宽限。完整套餐与状态合同见[`docs/monetization.md`](monetization.md)。

## Commerce And Compliance Gate

全球愿景不授权一次性开放所有国家收费。首笔真实付款之前必须明确商户法律实体、首发国家、Web采用Merchant of Record还是直接支付服务商、App Store适用购买路径，并完成当地税务、消费者订阅／撤回／退款、隐私、数据处理协议、代表义务和保险审查。

- Merchant of Record可承担合同约定的收款和部分间接税运营，但不消除Rillora自身的隐私、安全、消费者保护、公司所得税、会计和产品安全责任；
- 付款页必须在扣款前清楚展示完整金额、账期、自动续费、退款／撤回、取消方式和服务范围；取消至少应与注册／购买同样容易；
- 税款、退款、平台抽成、现金结算、递延收入和确认收入必须分开记录，不得用总流水冒充收入或ARR；
- 支付、退款、取消、拒付和订阅到期事件不得进入任何死亡、失能、失联、证明、申请或披露状态机；
- 任何用户可见的“全球合规”、统一退款权或统一遗嘱效力声明都需要逐市场证据，不得从支付服务商覆盖范围推导。

成本、毛利和尽调数据合同见[`docs/unit-economics.md`](unit-economics.md)。

## Primary Source Anchors

- [US E-SIGN exceptions](https://www.law.cornell.edu/uscode/text/15/7003)
- [RUFADAA](https://www.uniformlaws.org/committees/community-home?CommunityKey=f7237fc4-74c2-4728-81c6-b39a91ecdf22)
- [EU GDPR Recital 27](https://eur-lex.europa.eu/legal-content/EN-FR-ES/TXT/?uri=CELEX%3A32016R0679)
- [UK Law Commission: Modernising Wills](https://lawcom.gov.uk/publication/modernising-wills-final-report/)
- [Singapore Electronic Transactions Act](https://sso.agc.gov.sg/Act/ETA2010?ProvIds=Sc1-)
- [PRC Personal Information Protection Law](https://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [EDPB Privacy by Design and by Default](https://www.edpb.europa.eu/topics/ai-and-technology/privacy-by-design-and-by-default_en)
