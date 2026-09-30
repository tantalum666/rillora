# Death Verification, Evidence And Professional Assistance

Role: focused research and architecture boundary  
Authority scope: death-claim evidence, claimant authority, document authenticity, regulated-professional assistance and public-record access  
Superseded by: applicable law, official-source changes, security evidence or a later Owner decision  
Do not use for: personal legal advice, proof that any provider has been contracted, or authorization to release real user data  
Status: RESEARCH REVIEWED; SAFETY BOUNDARIES ACTIVE; PROVIDERS AND RELEASE CORRIDORS NOT SELECTED  
Last reviewed: 2026-08-16

## Executive Conclusion

全球确实存在权威死亡登记、遗嘱认证、公证和法院任命体系，但“权威记录存在”不等于“商业App可以调用统一开放API”。登记主体、可查询范围、身份资格、证明用途、费用和技术通道都按司法辖区分散；有些服务只开放给政府、金融机构、保险机构或经过审批的组织。

因此Rillora不能把全球上线依赖于一条不存在的“全球死亡API”，也不能把一张上传的死亡证明图片、一个律师按钮或一个可信联系人声明当成自动披露的权威来源。更可行的方向是：

1. 全球范围先提供生前规划、地图、导出和官方路径指引；
2. 把死亡事实、申请人身份、合法权限和Rillora内部披露范围拆成四个独立判断；
3. 建立与供应商无关的`Evidence Rail`，支持不同法域逐步接入可验证来源；
4. 只在少数已经完成法律、数据和操作验证的`Verified Release Corridor`中启用真实披露；
5. 其他国家继续停留在资料准备、申请指引和冻结案例状态，不能伪装成自动可执行。

## Four Independent Questions — LOCKED SAFETY BOUNDARY

任何真实死亡申请都必须分别回答：

| Question | Example evidence | What it does **not** prove |
| --- | --- | --- |
| `DeathFactVerification`：规划者是否已经死亡 | 权威登记查询、可验证电子证明、受监管机构签发的结构化证明 | 申请人有权获得资料 |
| `ClaimantIdentityVerification`：申请人是谁 | 政府证件、活体／账户验证、受信任身份提供商 | 与死者的关系或法律权限 |
| `AuthorityVerification`：申请人具有什么法定或有效权限 | 法院签发的Letters／Grant、有效遗嘱执行人证明、公证或其他本地有效文件 | 可以看到Rillora中的所有Matter |
| `RilloraDisclosureScope`：规划者允许Rillora向此人披露什么 | 逐Matter角色、接收人绑定、版本化意愿和现行政策 | 资产所有权、第三方账号登录或平台必须接受 |

四个判断不能折叠成“上传死亡证明后解锁”，也不能让`Trusted Contact`身份自动替代执行人、接收人或法定继承人的证明。

## Evidence Rail — PROVISIONAL ARCHITECTURE

| Tier | Evidence class | Product treatment |
| --- | --- | --- |
| A | Rillora可直接从获准的政府／登记／法院来源取得的结构化结果 | 可作为死亡事实或权限判断的一部分；仍须核验申请人和披露范围 |
| B | 带数字签名、可验证QR／编号或官方在线核验入口的电子文件 | 在验证签名、签发者、状态、绑定对象和时效后进入下一门 |
| C | 合资格法院、公证机构、律师事务所或其他受监管机构签发的结构化证明／attestation | 只证明其明确声明的事实；必须核验签发机构、执业状态、法域和防重放信息 |
| D | 申请人上传的扫描件、照片、截图、讣告或自由文本 | 仅用于建立case和风险分流；不得单独支持披露 |

OCR、图像取证、AI篡改检测和字段一致性检查可以减少录入成本、发现明显异常并决定是否要求更强证据，但不能把Tier D升级为权威事实。即使检测结果看起来“真实”，它也无法独立证明签发机构确实签过、文件未被撤销、申请人是文件中的人或该文件授予所请求的权限。

## Push Before Pull

比起让Rillora长期保存全球登记库凭据并主动拉取每个国家的死亡数据，更现实的首选是`push model`：申请人或合资格机构从本地权威系统取得一份可验证凭证，再把最小必要证明提交给Rillora。这样可以：

- 把法律资格和原始记录访问留在当地权威系统；
- 降低Rillora持续批量监控死亡登记的隐私风险；
- 允许按法域逐条增加验证适配器，而不是等待全球统一接口；
- 只保存判断结果、凭证摘要、签发者和审计所需最小数据；
- 在供应商变化时替换适配器，不改变核心状态机。

如果某个法域只提供受限查询而没有可验证电子凭证，Rillora可以与获准的机构建立受控查询通道，但该通道必须先完成合法目的、资格、费用、数据处理、撤销、审计和灾备审查。

## What The Meituan Prescription Analogy Actually Teaches

线上处方药路径对Rillora有参考价值，但可借鉴的是分层治理结构，不是“平台用AI自动开处方”。中国国家卫生健康委明确禁止使用人工智能自动生成处方；处方应由接诊医师本人开具，线上药品销售还要经过药师审核和处方药合规门。

可迁移的结构是：

`用户提出需求 -> 持牌机构承接 -> 合资格专业人士形成受监管判断 -> 第二道规则／审核门 -> 履约主体只按获准范围执行 -> 全程留痕`

对应到Rillora可以是：

`申请人开启case -> 身份与法域分流 -> 申请人／专业人士从权威来源取得证明 -> Rillora验证结构化结果 -> 通知与冷静期 -> 最小范围分阶段披露`

不能迁移的部分是：让一个与本案没有正式委托关系的律师凭经验“确认死亡”，或由Rillora把律师意见包装成全球通用司法证明。

## Lawyers, Notaries And Probate Professionals

专业人士可以显著减少用户迷路、材料缺失和跨机构往返，尤其适合：

- 判断本案适用的法域和所需文件；
- 帮助申请官方死亡证明、Grant of Probate、Letters或本地等效文件；
- 在其执业范围内核验身份、见证签署或出具明确限定的attestation；
- 解释争议、冲突和未成年人等复杂情况；
- 把结构化结果提交给Rillora。

但专业人士通常不是死亡登记、法院任命或资产所有权的最终权威。英国的probate practitioner可以代表申请，但Grant由HM Courts & Tribunals Service处理；美国加州的Letters由法院签发；中国律师事务所承接法律业务，而公证机构对法定事实和文书提供不同类型的证明。Rillora必须记录“谁签发了什么”，不能统一显示成“律师已批准”。

这种合作可作为未来独立的`Assisted Case`服务，而不是MVP默认流程。它可以减少Rillora自建审核团队，但不能消灭所有人工判断：专业人士本身仍是人，只是责任、资质、保密、保险和监督边界更清楚。

在建立专业服务市场前至少要逐法域解决：客户到底委托谁、冲突检查、保密／特权、职业责任保险、转介费与费用分成、广告与引流、投诉、数据控制者／处理者角色、跨境执业和服务失败后的责任。美国律师职业规则与英国SRA规则都要求对独立性、转介、客户关系和服务监管进行专门设计。

## Authority-Source Reality Check

### United States

美国死亡记录由州和地方生命事件登记机构管理；CDC明确说明联邦政府不分发个人出生、死亡、婚姻或离婚证明。NAPHSIS的EVVE/FOD提供电子核验能力，但服务对象、用途、覆盖和准入受限制，不是任何商业App即开即用的全国开放API。

### United Kingdom

General Register Office保存英格兰和威尔士民事登记记录。`Disclosure of Death Registration Information`可向符合条件的组织提供登记死亡数据，但申请资格、许可目的、评估和费用都很高；当前官方材料列出年费£57,000和£5,000评估费。它证明受控数据通道存在，也说明它不适合作为早期MVP的默认依赖。

### European Union

Once-Only Technical System让成员国公共机关在公民请求下交换行政证据。其定位是跨境公共行政基础设施，不是面向商业App的通用死亡查询API。Rillora可以关注未来电子身份与可验证凭证接口，但不能把OOTS当作现成的商业发布通道。

### Product implication

首发架构不得要求所有市场都拥有相同数据源。每个市场应维护一个`Jurisdiction Capability Record`：

- 是否存在直接权威查询；
- 谁可以查询、允许什么目的；
- 是否存在可验证电子证明；
- 哪类法院／公证／专业机构可以出具结构化结果；
- 真实披露是否开放、仅能人工协助，还是完全冻结；
- 数据最小化、保存期、通知、申诉和审计要求。

## Release Corridor Gate

任何一个国家／地区从“规划与指引”升级为真实自动或半自动披露前，必须同时证明：

1. 死亡事实来源和申请人资格已获适用法律确认；
2. 申请人身份、法定权限和Rillora披露范围独立验证；
3. 文件或凭证的签名、撤销、重放和机构状态可以验证；
4. 关联方收到通知并有合理申诉／冷静期；
5. 存在最小权限、分阶段披露和全程审计；
6. 失败、争议、未成年人、欺诈和来源不可用时有明确冻结路径；
7. 完成DPIA／隐私、数据驻留、安全、供应商和本地法律审查；
8. 真实端到端演练证明系统没有把“事实”“权限”“访问”和“所有权”混为一谈。

当前Rillora没有任何已开放的`Verified Release Corridor`。现有披露状态机仍是非操作性演练，不验证文件、不通知真实联系人、不释放资料。

## Primary Sources

### Online medical and professional-service analogy

- [National Health Commission: Detailed Rules for Internet Diagnosis and Treatment Supervision](https://www.nhc.gov.cn/yzygj/c100068/202203/2072f0e8988249e59d942e1b2a933916.shtml)
- [National Health Commission: Explanation of the detailed rules](https://www.nhc.gov.cn/yzygj/c100067/202203/61bb44c669144ad1a4266fc4d63dd7a4.shtml)
- [State Administration for Market Regulation: Online Drug Sales Rules](https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_27f2fba302ab48239dfde1a5b5095156.html)
- [Meituan Doctor](https://health.meituan.com/doctor)

### Legal and probate roles

- [PRC Lawyers Law](https://www.npc.gov.cn/npc/c2/c183/c198/201905/t20190522_27500.html)
- [PRC Notarization Law](https://xzfy.moj.gov.cn/c/2021-01-06/487828.shtml)
- [Ministry of Justice: Notarization practice explanation](https://www.moj.gov.cn/pub/sfbgwapp/zwgk/jdhyApp/202204/t20220420_453358.html)
- [GOV.UK: Apply for probate](https://www.gov.uk/applying-for-probate/apply-for-probate)
- [GOV.UK: Apply for probate by post when there is a will](https://www.gov.uk/government/publications/form-pa1p-apply-for-probate-the-deceased-had-a-will/how-to-apply-for-probate-by-post-if-there-is-a-will)
- [California Courts: Letters, form DE-150](https://selfhelp.courts.ca.gov/jcc-form/DE-150)

### Death records and source access

- [CDC: Where to Write for Vital Records](https://www.cdc.gov/nchs/w2w/index.htm)
- [NAPHSIS EVVE and Fact of Death](https://www.naphsis.org/evve/)
- [GOV.UK: General Register Office](https://www.gov.uk/general-register-office)
- [GOV.UK: UK registered deaths data service](https://www.gov.uk/uk-registered-deaths)
- [Home Office: Notification of Death registration information](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1128943/sd16-notification-of-death-Jan_2023.pdf)
- [EU Implementing Regulation 2022/1463](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32022R1463)
- [Once-Only Technical System](https://interoperable-europe.ec.europa.eu/collection/digital-building-blocks/solution/once-only-technical-system-oots)

### Professional marketplace boundaries

- [ABA Model Rule 5.4: Professional independence](https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_5_4_professional_independence_of_a_lawyer/)
- [ABA Model Rule 7.2: Communications concerning services](https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_7_2_advertising/)
- [SRA: Common innovation queries](https://www.sra.org.uk/solicitors/resources/innovate/common-queries-answered/)
- [SRA Code of Conduct for solicitors](https://www.sra.org.uk/solicitors/standards-regulations/code-conduct-solicitors/)

All sources last checked 2026-08-16. Public-source review does not replace local counsel, provider due diligence or a production authorization decision.
