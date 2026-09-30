# Rillora Competitor UX Audit

Role: current competitor-UX evidence and product recommendation register  
Authority scope: public acquisition, education, authentication gates, onboarding, organization, sharing, life-event handling, account lifecycle and mobile evidence  
Superseded by: later current-run competitor audit or an explicit Owner product decision  
Do not use for: legal advice, security certification, market validation, logged-in product claims not observed in this run, or permission to copy a competitor's visual identity  
Status: PUBLIC SURFACES, THREE AUTHENTICATED FIRST-RUN PATHS AND PUBLIC ENTRY TIMING RECHECKED; DEEP LIFECYCLE PATHS REMAIN BOUNDED  
Reviewed: 2026-08-15 (Asia/Shanghai)

## Executive Judgment

Rillora不需要把首页改成登录墙。当前最可靠的竞品证据反而支持以下顺序：

1. 先让访客理解“为什么需要整理”；
2. 用一个不收集私密信息的短诊断或样例，让价值变具体；
3. 只有在保存结果、创建第一项事务或邀请联系人时，才要求登录／注册；
4. 注册后直接提供可用产品总览，让用户自行选择一个小闭环、可跳过的引导或合成示例；
5. 在任何分享、身后处理或“准备度”界面中，把“记录、访问、授权、披露和所有权”分开。

本轮最值得参考的不是某一个完整竞品，而是五个不同来源的局部优点：

- `Trust & Will`：登录前用短问答降低陌生用户的决策负担；
- `MyLifeLedger`：用具体类别、样例条目和“地图而不是钥匙”解释产品；
- `GoodTrust`：把资料分区和可信联系人解释得直观；
- `Quicken LifeHub / Prisidio`：用家庭日常价值、角色权限和实际产品画面降低“只在死亡时有用”的心理距离；
- `Everplans`：用持续进度和Deputy协作把一次性整理变成维护行为。

Rillora不能照搬的共同问题也很明确：以未签到为身后披露触发、把密码库和事务地图混成同一产品、用模糊的“发生事情后自动给家人”代替身份与证明流程、把营销性的安全徽章当证明，以及把美国遗嘱表单包装成全球通用流程。

## Evidence Model And Method

本轮以统一旅程检查每个产品：

1. 搜索结果与品牌定位；
2. 首页第一屏和导航；
3. 产品解释、样例与价格；
4. 登录／注册出现的时点；
5. 首次使用和组织模型；
6. 联系人、角色和权限；
7. 死亡、失能或失联的触发与披露；
8. 删除、导出、订阅和公司存续；
9. Web、iOS和接收人入口；
10. 当前可见的无障碍与响应式风险。

证据分为三类，不能互相冒充：

- `DIRECT / CURRENT RUN`：2026-08-11在当前浏览器直接看到的网页、表单、错误或重定向，并保存本地截图；
- `OFFICIAL DOCUMENTATION`：竞品自己的帮助中心、服务条款或平台商店页面；可以补充登录墙后的流程，但不能替代实际产品操作；
- `BLOCKED`：必须创建测试账户、付款、填写真实身份或连接外部服务才能确认的状态。本轮没有擅自创建账号、付款或提交身份资料。

截图保存在`output/competitor-ux-audit-20260811/`。该目录是当前本机审计证据，可能被Git忽略，不是跨机器发布证明。

## Coverage And Account Wall

| Product | Role in audit | Public website | Signup wall | Product after login | Current evidence |
| --- | --- | --- | --- | --- | --- |
| Everplans | direct | checked | reached; SPA capture unstable | dashboard, Digital, one micro-form and Deputy paywall checked | direct authenticated screenshots + official help + App Store |
| GoodTrust | direct | checked | checked | blocked | direct screenshots + official help |
| MyLifeLedger | closest positioning | checked | checked; upgrade overlay conflicts with form | blocked by non-dismissible first Quick Win before dashboard use | direct authenticated screenshots + public product tour |
| DGLegacy | direct | checked | checked | dashboard, asset/contact forms, heartbeat and score checked | direct authenticated screenshots + official FAQ/privacy/App Store |
| Quicken LifeHub | adjacent direct | checked | purchase/account required | blocked | direct screenshot + official product/help |
| Prisidio | adjacent direct | checked | plan selection required | deferred by Owner | direct public screenshot + official product/security/App Store |
| SecureSafe | adjacent vault | checked | not entered | blocked | direct screenshots + official help |
| Clocr | direct historical | checked | product endpoint failed | unavailable | direct screenshot + connection failure |
| CAKE | survival case | current domain redirects | no current account route | unavailable | official acquisition + current redirect |
| Trust & Will | adjacent conversion | checked | recommendation precedes signup | recommendation observed | direct screenshots |
| Apple Legacy Contact | platform substitute | official support | Apple account/device setup | not applicable | official support |
| Google Inactive Account Manager | platform substitute | official support | Google account required | not entered | official support |
| Bitwarden / Meta | permission substitutes | official help | service accounts required | not entered | official help |

“登录后首轮路径已审计”也不等于“产品所有细节已过完”。本轮没有付款、发送邀请、创建真实资产或联系人，也没有验证接收人端、删除／导出、订阅取消、移动App或长期提醒。Prisidio按Owner指令暂不继续。

## Authenticated First-Run Audit — 2026-08-11

Evidence level: `DIRECT / CURRENT RUN`. Owner已在Chrome登录Everplans、DGLegacy和MyLifeLedger；Agent只读检查当前页面，并在表单最终保存、外部邀请、付费和状态修改前停止。截图保存在`output/competitor-auth-audit-20260811/`，不包含外部发送或真实产品数据证明。

### Everplans — usable dashboard first, guidance in context

Observed steps and health:

1. **Dashboard entry — healthy with a modal caveat.** 登录后可直接进入Dashboard，没有强制问卷；首屏出现可关闭的移动App推广弹窗。可见关闭按钮没有可靠的可访问名称，是键盘／屏幕阅读器风险。
2. **Recommendations and categories — useful but dense.** Dashboard用Score、推荐卡和分类导航给出下一步，用户仍可自由进入Digital、Financial、Legal等区域。优点是没有夺走导航，问题是建议和分类同时出现，首次认知负荷偏高。
3. **Password-management task — strong local pattern.** 单项表单只问“密码存在哪里”，提供Password manager、电脑文件或Other，不要求提交密码本身；Cancel和Save边界清楚。这种任务内即时小问题优于注册后整套问卷。
4. **Deputy explanation — healthy before action.** 空状态先解释Deputy、适合人选和立即／身后可见差异，再给添加入口。
5. **Deputy action — blocked by paywall.** 免费账户点击添加即出现Premium年付墙，所以本轮不能把公开文案当成已操作的邀请与权限证据。

Evidence:

- [Dashboard](../output/competitor-auth-audit-20260811/everplans/02-dashboard.png)
- [Digital category](../output/competitor-auth-audit-20260811/everplans/03-digital-category.png)
- [Password-location micro-question](../output/competitor-auth-audit-20260811/everplans/04-password-section-empty.png)
- [Deputy explanation](../output/competitor-auth-audit-20260811/everplans/05-deputies-empty.png)
- [Deputy paywall](../output/competitor-auth-audit-20260811/everplans/06-deputy-invite-form.png)

### DGLegacy — action-oriented, but scope and status claims are unsafe

Observed steps and health:

1. **Dashboard entry — action-oriented.** 登录后直接看到`Protect Your First Asset`、分类导航和Protection Strength，没有问卷阻塞。
2. **Asset type choice — concrete and scannable.** 手动添加先选择Bank account、Insurance、Real estate、Cryptocurrency等类型，降低空白页压力。
3. **Bank-account form — critical scope failure.** 表单明确提供Email、Password和Website，并提示从密码管理器复制密码。它把事务地图变成秘密仓库，是Rillora必须拒绝的默认范围。
4. **Beneficiary form — misleading default status.** 尚未填写联系人或分配资产，界面已经显示`Your Digital Inheritance is Active`。`Notify beneficiary now`开关能显式控制副作用，但“Active”把资料记录、通知、授权和继承状态混为一谈。
5. **Heartbeat — explicit controls, unsafe framing.** 页面公开30／45／60／90天邮件检查间隔，并把登录、公开社交活动和电话验证作为存活信号；这些可以用于提醒和人工升级，不能成为死亡事实或自动披露证明。
6. **Protection Strength — transparent inputs, overstated outcome.** 零资产、零受益人时仍显示20%，清单可解释分数来源，但`Protection Strength`会把注册行为误读成已受保护。Rillora应使用分维度的`Not assessed / Needs attention / Ready for rehearsal`，只奖励真实的连续性动作。

Evidence:

- [Dashboard](../output/competitor-auth-audit-20260811/dglegacy/01-entry.png)
- [Asset types](../output/competitor-auth-audit-20260811/dglegacy/03-asset-form.png)
- [Bank form containing a password field](../output/competitor-auth-audit-20260811/dglegacy/04-bank-account-form.png)
- [Beneficiary form and premature active status](../output/competitor-auth-audit-20260811/dglegacy/06-beneficiary-form.png)
- [Heartbeat explanation](../output/competitor-auth-audit-20260811/dglegacy/07-heartbeat.png)
- [Heartbeat controls](../output/competitor-auth-audit-20260811/dglegacy/08-heartbeat-controls.png)
- [Protection Strength inputs](../output/competitor-auth-audit-20260811/dglegacy/09-protection-strength.png)

### MyLifeLedger — good task size, wrong control model

Observed steps and health:

1. **First entry — blocked.** 登录后立即出现不可关闭的`YOUR FIRST QUICK WIN`，要求在Emergency Contact、Bank Account和Locate Key Document中选择；无Skip、关闭或直接进入产品入口，Escape也不能退出。底层Dashboard存在但不可操作。这正是注册后强制问卷／任务接管的反模式。
2. **Bank quick win — minimal and privacy-aware.** 选择Bank Account后只问机构名称和账户类型，明确不索取账户号码、登录信息或余额。数据最小化和“60秒内完成”很好，但Back是唯一退出方向，用户仍不能暂存、跳过或浏览产品。
3. **Accessibility risk — modal confinement without user escape.** 强制模态把自由探索变成完成义务；即使焦点约束技术上正确，没有可发现的退出仍是认知与可访问性问题。

Evidence:

- [Non-dismissible Quick Win](../output/competitor-auth-audit-20260811/mylifeledger/01-setup-entry.png)
- [Minimal bank task](../output/competitor-auth-audit-20260811/mylifeledger/02-bank-quick-win.png)

### Cross-product judgment

最强组合不是复制任一产品，而是：Everplans的可用Dashboard与任务内小问题 + MyLifeLedger的数据最小化和具体第一项 + DGLegacy的明确类别选择，同时删除强制模态、密码字段、死亡检测承诺和虚假的保护／继承激活状态。

## Direct Competitor Findings

### 1. Everplans

Observed path:

1. 首页先讲“把生活中的所有部分放到一个地方”，导航同时提供`Log in / Sign up`；
2. Product Tour按`Organize / Guidance / Share`解释价值；
3. 注册进入独立应用墙；
4. 官方帮助显示入门评估、进度条、Dashboard和`Invite Now`；
5. Premium用户可逐项或分区授权Deputy；
6. Everplans Score把添加资料、邀请Deputy、更新内容和阅读建议转换成持续进度；
7. 身后流程允许Deputy报告死亡，系统等待规划者设定的3小时至30天，无回应后解锁指定内容；
8. 账户可删除；取消付费也可能转成受限／只读状态，Deputy仍可访问部分资料；
9. 当前iOS产品是iPhone-only，App Store反馈包含iPad体验不足。

What works:

- 首页没有先要求身份，适合低认知品类；
- 三个动词解释产品比功能清单更容易理解；
- Score把“整理完成”转成持续维护，而不是一次性上传；
- Deputy按项目／分区授权比“全部给一个人”更可信；
- 删除前提示下载、取消后说明资料状态，账户生命周期比只写“Cancel anytime”具体。

What not to copy:

- “Deputy报告 + 等待倒计时 + 无回应自动解锁”不满足Rillora的死亡、身份、证明和申诉要求；
- Score如果只奖励阅读文章或上传数量，会制造虚假的准备度；
- iPhone-only和未声明无障碍支持不符合Rillora双端与可访问性目标。

Current-run screenshots:

- [Everplans home](../output/competitor-ux-audit-20260811/everplans/01-home.png)
- [Everplans product tour](../output/competitor-ux-audit-20260811/everplans/03-product-tour.png)

Official evidence:

- [Deputy sharing](https://help.everplans.com/hc/en-us/articles/215665558-How-does-sharing-work-on-Everplans-What-is-a-deputy)
- [Everplans Score](https://help.everplans.com/hc/en-us/articles/29885072447636-What-is-the-Everplans-Score-and-how-does-it-work)
- [After-death visibility](https://help.everplans.com/hc/en-us/articles/360000708546-What-if-there-s-certain-information-I-only-want-my-deputies-to-see-after-I-m-gone)
- [Cancellation and deletion](https://help.everplans.com/hc/en-us/articles/216305957-How-do-I-cancel-my-subscription)
- [iOS App Store](https://apps.apple.com/us/app/everplans/id1590237847)

### 2. GoodTrust

Observed path:

1. 首页把Will、Trust、Directives和Digital Vault放在同一购买叙事；
2. Digital Vault以四块卡片解释`Online Accounts / Passcodes & Devices / Documents & Notes / Trusted Contacts`；
3. 注册页采用左侧价值与信任证明、右侧表单的双栏布局；
4. CTA使用`Create my Will`，即使用户可能是从Vault入口进入；
5. Trusted Contact可按文档设置现在访问、死后访问或永不访问；
6. Dead Man Switch允许每月或每年签到，三次忽略后自动执行分享和Future Messages；
7. 死者账户关闭要求关系证明、身份证明、死亡证明，非英文材料需公证翻译。

What works:

- 四类卡片让抽象的Vault立刻可见；
- 注册页没有把用户丢在纯表单里，旁边继续解释价值；
- 权限用“现在／死后／永不”表达，比技术角色名直观；
- 死者账户关闭帮助明确列出申请人和材料要求，降低家属猜测。

What not to copy:

- 将Will、Vault和Future Messages混在同一漏斗，会模糊用户此刻要完成的任务；
- 从Vault入口仍写`Create my Will`，属于上下文不匹配；
- Dead Man Switch把未签到直接升级成披露，违反Rillora硬约束；
- 储存passcode/device secret会把Rillora从“地图”推向高风险密码库；
- 通用安全徽章和“银行级”表达不能替代具体控制与审计证据。

Current-run screenshots:

- [GoodTrust home](../output/competitor-ux-audit-20260811/goodtrust/01-home.png)
- [GoodTrust signup](../output/competitor-ux-audit-20260811/goodtrust/02-signup.png)
- [GoodTrust digital vault](../output/competitor-ux-audit-20260811/goodtrust/03-digital-vault.png)

Official evidence:

- [Digital Vault](https://mygoodtrust.com/digital-vault)
- [Trusted-contact access](https://support.mygoodtrust.com/support/solutions/articles/66000503694-who-can-access-my-digital-vault-and-when-)
- [Dead Man Switch](https://support.mygoodtrust.com/support/solutions/articles/66000503696-what-is-the-dead-man-switch-and-how-does-it-work-)
- [Request to close a deceased person's account](https://support.mygoodtrust.com/support/solutions/articles/66000529337-how-to-request-to-close-a-deceased-person-s-goodtrust-account)

### 3. MyLifeLedger

Observed path:

1. Product Tour用实体文件柜类比数字事务整理；
2. 公开展示7个section、40多个subsection、样例条目和0–100 Health Score；
3. 明确说不保存密码、账号号码或PIN，定位与Rillora最接近；
4. 用户可邀请最多5人并按section控制权限、随时撤销；
5. 注册页当前同时出现“重大升级等待名单”遮罩和现有注册表单，两个产品状态叠加；
6. 公共文案对联系人何时得到访问使用`when something happens / instantly`等不同说法，触发边界不够精确。

What works:

- “地图而不是钥匙”被具体样例支持，不只是口号；
- 公开展示信息架构，用户在注册前就知道要整理什么；
- section级权限和联系人上限容易理解；
- Health Score把“缺什么”视觉化，但应只计算真正影响连续性的动作。

What not to copy:

- 等待名单与当前注册表单同屏会让用户不知道产品现在是否可用；
- “发生事情时立即访问”没有区分死亡、失能、失联、身份和证据；
- 文件柜隐喻如果过度使用，会把动态任务关系降级成静态文件存储。

Current-run screenshots:

- [MyLifeLedger product tour](../output/competitor-ux-audit-20260811/mylifeledger/01-product-tour.png)
- [MyLifeLedger registration state](../output/competitor-ux-audit-20260811/mylifeledger/02-register.png)

Official evidence:

- [What is MyLifeLedger](https://www.mylifeledger.com/what-is-mylifeledger)
- [Pricing](https://www.mylifeledger.com/pricing)

### 4. DGLegacy

Observed path:

1. How It Works用三个阶段讲`heartbeat -> beneficiaries/trustees -> assets`；
2. Heartbeat可由社交活动、邮件检查、生物识别登录或电话确认；
3. 没有alive event时，系统启动数字继承并通知受益人；
4. 用户可按受益人设置不可见、可见或可见并通知；
5. 注册页非常短，但在用户未输入时就可见`Empty`验证字样；
6. 免费层只支持3项资产，移动端当前只有很少评分样本。

What works:

- 三步图使复杂流程容易扫描；
- 受益人逐项可见性比单一总开关好；
- 隐私政策明确要求客户获得被通知人的事先书面同意，这是很多竞品遗漏的关系数据边界。

What not to copy:

- Heartbeat把“未活动”变成启动数字继承的核心逻辑，风险不可接受；
- `beneficiary / trustee`与实际法律角色容易被营销流程混用；
- 表单在空状态显示错误文本属于完成度问题；
- 信任徽章与“数字继承”大词没有展示对应验证机制。

Current-run screenshots:

- [DGLegacy how it works](../output/competitor-ux-audit-20260811/dglegacy/01-how-it-works.png)
- [DGLegacy signup](../output/competitor-ux-audit-20260811/dglegacy/02-signup.png)

Official evidence:

- [How it works](https://www.dglegacy.com/how-it-works/)
- [FAQ](https://www.dglegacy.com/questions-and-answers/)
- [Privacy policy](https://www.dglegacy.com/privacy-policy/)
- [iOS App Store](https://apps.apple.com/bg/app/dglegacy-digital-inheritance/id6443605121)

### 5. Quicken LifeHub

Observed path:

1. 第一屏使用`Your family's readiness system`，而不是死亡或遗嘱作为唯一入口；
2. 同时展示真实产品界面、家庭照片和`Get started / See LifeHub`；
3. 推荐从钱包中的ID、常用登录或一份保险资料开始；
4. 使用预置类别、自定义folder、移动拍照录入和Quicken数据同步；
5. 角色分为Owner、Co-owner、Editor和Viewer，Viewer按folder授权；
6. Co-owner可在紧急情况下接管，但订阅与Quicken连接仍由Owner控制；
7. 页面同时覆盖日常、旅行、健康、紧急情况和身后准备。

What works:

- 把产品定义成“家庭准备系统”明显降低死亡焦虑和低频感；
- 首屏真实产品预览比抽象插画更能建立可信度；
- “先添加钱包里的一项”是优秀的first-run任务，成本低、价值可见；
- 角色名称和权限差异公开可查；
- Web产品允许家庭成员无需安装App访问。

What not to copy:

- 产品允许保存密码、完整文件和财务同步，安全范围远宽于Rillora MVP；
- 大量日常家庭资料会稀释Rillora的连续性主任务；
- `Co-owner can assume control`仍需要更精确的身份、条件、审计和申诉解释；
- 价格、折扣和cookie横幅在当前第一屏占据较大注意力。

Current-run screenshot:

- [Quicken LifeHub home](../output/competitor-ux-audit-20260811/quicken-lifehub/01-home.png)

Official evidence:

- [LifeHub product page](https://www.quicken.com/products/lifehub/)
- [Household member permissions](https://support.lifehub.quicken.com/en/articles/10135422-what-do-each-of-the-household-members-have-access-to-in-quicken-lifehub)
- [Getting started](https://support.lifehub.quicken.com/en/articles/10136006-how-to-get-started-with-quicken-lifehub)

### 6. Prisidio

Observed path:

1. How It Works用“collected, safe, and accessible”解释家庭资料中心；
2. 第一屏直接露出产品界面，但cookie层遮住了关键部分；
3. 支持文档、照片、联系人导入和移动端拍摄；
4. 支持Co-owner、invited user和Keyholder角色，并公开强调activity log；
5. 官方安全页列出MFA、passkey、权限、审计、SOC 2 Type II/SOC 3和年度渗透测试；
6. Starter计划允许3个受邀人、Co-owner和Keyholder；Unlimited解除项目和受邀人限制；
7. iOS当前持续更新，但产品商店页仍显示iPhone-only。

What works:

- 在营销页公开角色、活动记录和具体安全控制，比放一排无来源徽章更可信；
- Keyholder概念把“未来可访问”与普通协作者区分；
- Collections把人、资料和项目组合成某个实际场景，比纯目录更接近任务；
- 移动导入、视频说明和产品内短教学降低录入成本。

What not to copy:

- “exact moment everyone needs it”仍未在公开页解释触发和证明；
- Vault与完整文档存储会扩张Rillora的数据责任；
- 高价计划和功能限制可能在用户理解价值前制造付款墙；
- 当前cookie弹层遮住产品预览，影响第一屏信息层级。

Current-run screenshot:

- [Prisidio how it works](../output/competitor-ux-audit-20260811/prisidio/01-how-it-works.png)

Official evidence:

- [How it works](https://www.prisidio.com/how-it-works)
- [Vault](https://www.prisidio.com/vault)
- [Security](https://www.prisidio.com/security)
- [Plans](https://www.prisidio.com/plans)
- [iOS App Store](https://apps.apple.com/us/app/prisidio-digital-vault/id1571962466)

### 7. SecureSafe

Observed path:

1. 当前个人产品突出Swiss托管、zero-knowledge、password和file storage；
2. Data Inheritance帮助文档被放在`SecureSafe Classic`下；
3. 继承机制使用activation code、activator和beneficiary，并可手动或自动分配文件／密码；
4. 官方同时说明产品正在迁移到新的Pass和File独立产品。

What works:

- 安全模型和数据托管位置直接出现在产品叙事中；
- activator与beneficiary分开，至少没有把报告者与接收人默认视为同一人；
- 帮助文档说明产品代际和迁移，而不是悄悄改变。

What not to copy:

- 密码库／文件库与身后事务是不同风险产品；
- “Classic inheritance”与新产品迁移并存，用户会怀疑长期可用性；
- activation code一旦成为单点能力，需要更强的遗失、盗用和撤销设计。

Current-run screenshots:

- [SecureSafe individual](../output/competitor-ux-audit-20260811/securesafe/01-individual.png)
- [SecureSafe inheritance help](../output/competitor-ux-audit-20260811/securesafe/02-inheritance-help.png)

Official evidence:

- [Data Inheritance](https://help.securesafe.com/data-inheritance)
- [Future of SecureSafe](https://help.securesafe.com/understanding-the-future-of-securesafe)

### 8. Clocr

Observed path:

1. 公共页面功能密度高，强调数字遗产规划、RUFADAA和家属接管；
2. 页面信息层级和视觉更新感弱于当前竞品；
3. 本轮访问`https://app.clocr.com/signup`返回`ERR_CONNECTION_CLOSED`，无法进入注册或产品；
4. 公开页面使用“legally take control”等宽承诺，但没有在同一位置解释平台条款、法域和证明限制。

What works:

- 覆盖数字资产类别和法律问题的教育素材较广；
- 明确把家庭执行场景放在营销信息中。

What not to copy:

- 不要用法案名称制造“自动合法”的印象；
- 不要让公共站与实际产品入口出现可用性断裂；
- 不要以功能堆叠替代可执行的第一步。

Current-run screenshot:

- [Clocr digital estate page](../output/competitor-ux-audit-20260811/clocr/01-digital-estate.png)

### 9. CAKE As A Product-Survival Case

Foundation Partners Group在2024年宣布收购CAKE；本轮访问`joincake.com`已重定向到Altogether Funeral，原独立产品旅程不再可见。这不能单独证明每个历史账户怎样处理，但足以说明：数字遗产产品不能让用户对一家公司的长期存续形成单点依赖。

Rillora应把可读导出、迁移、公司关闭通知、订阅终止后的取回期和离线恢复放进核心UX，而不是藏在服务条款。

Official evidence:

- [Foundation Partners Group acquisition announcement](https://foundationpartners.com/fpgnews/foundation-partners-group-acquires-cake-to-meet-growing-demand-for-end-of-life-planning-tools-and-resources/)

## Adjacent UX And Platform Substitutes

### Trust & Will: the strongest pre-auth pattern

Current-run path:

1. 首页先用`Find your plan in 1 minute`降低承诺成本；
2. 进入8步问答，不需要账号；
3. 每步只问一件事并显示进度；
4. `Why are we asking this?`解释问题目的；
5. 完成建议后才进入账户和购买。

The pattern to borrow:

- Rillora可以提供不保存私密答案的`60-second readiness check`；
- 每个问题说明为什么问；
- 结果不是法律方案或死亡判定，而是“最值得先整理的一类事务”；
- 只有保存结果或创建第一项事务时才进Account。

Do not borrow:

- Trust & Will问卷深度绑定美国州、家庭和资产条件；Rillora必须保持全球中立，并把法域建议作为后续分支。

Current-run screenshots:

- [Trust & Will home](../output/competitor-ux-audit-20260811/trustandwill/01-home.png)
- [Trust & Will plan quiz](../output/competitor-ux-audit-20260811/trustandwill/02-plan-quiz.png)

Official evidence:

- [Get started](https://trustandwill.com/get-started)

### Apple Legacy Contact: verification and exclusions

Apple要求Legacy Contact拥有access key，并在申请时提交死亡证明；联系人不一定要有Apple设备或Apple Account。Keychain密码、passkey、付款信息和购买项目被排除。这是Rillora官方设置检查应采用的表达方式：明确“能做什么、不能做什么、需要什么”。

- [Apple Legacy Contact support](https://support.apple.com/en-gb/102631)

### Google Inactive Account Manager: granular provider setup

Google允许用户选择等待期、最多10名联系人和按数据类型分享，并使用多种活动信号判断账号是否长期不活跃。它是平台自己的账号机制，不应被Rillora复制为通用死亡判定器；Rillora只记录用户是否完成官方设置、最后核验日期和官方入口。

- [Google Inactive Account Manager](https://support.google.com/accounts/answer/3036546?hl=en)

### Bitwarden Emergency Access: request, wait, approve or reject

Bitwarden的Emergency Access包含邀请、请求、等待期、grantor通知以及批准／拒绝；紧急联系人必须是Bitwarden用户。其可逆请求与等待期值得参考，但“查看／接管密码库”属于密码管理器能力，不属于Rillora MVP。

- [Bitwarden Emergency Access](https://bitwarden.com/help/emergency-access/)

### Meta Legacy Contact: narrow delegated actions

Meta的Legacy Contact只能管理纪念化后的有限动作，不能登录账户、阅读消息或改写旧帖；删除账户也是独立选择。值得参考的是把每一项能力写成精确白名单，而不是使用“管理我的账号”这种宽词。

- [Meta Legacy Contact](https://www.facebook.com/help/991335594313139?locale=en_GB)

## Cross-Product UX Patterns

### Patterns worth adopting

1. **Teach before authentication.** 用户需要先判断这是不是遗嘱、密码库、保险或资料柜。
2. **Show the product, not only the promise.** 类别、样例Matter、角色权限和Start Here预览比抽象安心文案更可信。
3. **One low-cost first task.** 从“选择为什么现在开始”或“添加一项最重要事务”开始，不要求用户一次完成全部家庭档案。
4. **Explain why each question exists.** 对敏感问题尤其需要目的、用途、是否保存和可跳过说明。
5. **Progress must represent protection, not activity.** 添加关键事务、指定真实角色、完成官方设置、邀请接受和演练才可计入准备度；阅读文章不应伪装成准备完成。
6. **Permission previews beat role labels.** 在邀请前直接展示“这个人现在／未来／某事件后能看见哪些字段”。
7. **Keep daily value without becoming a general vault.** 年度复核、官方设置更新和事务到期可以提高复访，不必储存所有家庭文件和密码。
8. **Make service exit visible.** 导出、取消、删除、恢复和公司停止服务路径应在Account中可发现。
9. **Use precise trust claims.** 具体写MFA、加密边界、服务器是否能解密、审计范围和未完成项；不要用徽章墙代替证明。
10. **Let recipients use the Web.** 联系人、执行人和接收人不能被强迫安装iOS App。

### Anti-patterns Rillora must reject

1. 未签到、未登录、邮件退信或订阅停止后自动披露；
2. 用`beneficiary / executor / trustee`的选择框假装法律角色已经成立；
3. 把密码、PIN、恢复码和助记词与事务地图放进同一默认模型；
4. 用“when something happens”掩盖死亡、失能和失联的不同流程；
5. 未解释可见范围、身份验证和撤销前就邀请联系人；
6. 注册入口文案与用户进入上下文不一致；
7. 等待名单、旧产品和新产品同时出现却不说明当前状态；
8. 用`bank-level / military-grade / globally legal`等词代替范围证据；
9. 把只读帮助文档或App Store文案当作真实产品验收；
10. 只为iPhone优化而忽略Web接收人、iPad、Dynamic Type和辅助技术。

## Rillora Current-State Comparison

Current-run screenshots:

- [Rillora public home](../output/competitor-ux-audit-20260811/rillora/03-home-viewport.png)
- [Rillora Account](../output/competitor-ux-audit-20260811/rillora/02-account.png)

What is already right:

- 公开首页先解释产品，再进入Account；
- Calm Continuity比大部分竞品更安静、成熟，也没有死亡恐吓或保险漏斗感；
- `Directions, not passwords`和三类人生事件分离形成真正差异；
- Account同时提供登录和创建账户，不再把Owner-facing localhost变成开发身份直达；
- 私有计划不在公开页读取或伪造。

What is currently missing:

- 首页仍主要靠文字解释，缺少一张可信的真实产品预览或安全的样例Matter；
- `Start your private map`从陌生访客直接跳到Account，缺少一个更低承诺的可操作步骤；
- Account页永远把Sign in做成视觉主动作，没有继承访客从哪个CTA进入；
- 注册后的首次使用已用合成规划者完成Web与iOS本地旅程验收，但尚无真实新用户或外部可用性证据；
- 公开站缺少集中、可扫描的Trust/Privacy/How release works说明；
- 删除、导出、订阅终止和公司停止服务时的用户路径没有成为公共信任叙事的一部分；
- 当前截图只覆盖桌面可见状态；移动浏览器、键盘、屏幕阅读器和动态字体仍需独立验收。

## Recommended Rillora UX Boundary

以下为基于本轮证据的`PROVISIONAL`建议，不是Owner已批准的最终信息架构，也不自动授权实现、发布、付费或外部通信。

### P0 — before more surface polish

1. **Offer an optional no-account readiness check.** 4至6个非私密问题，只判断用户最应先整理的事项类别；它不能挡住公开内容或开始计划，每题解释原因，答案默认只保存在当前浏览器内存，结果页才邀请用户创建账户保存。
2. **Add one concrete safe product preview.** 首页展示合成数据的Matter卡、5段准备度和角色可见范围；明确标`Example`，不展示密码、真实金额或虚构的已接受邀请。
3. **Make Account context-sensitive.** 从`Start your private map`进入时主动作是`Create account`；从导航`Account`或session失效进入时主动作是`Sign in`。两条路仍同时可见。
4. **Make first-run a choice, not a gate.** 该项已在本地实现：注册后直接进入可用总览，同时提供`Add your first matter`、`Use the 2-minute guide`和`Explore a safe example`；`Why now`只存在于可跳过／退出／恢复的引导，任务内使用即时小问题，邀请联系人放在用户已经理解可见范围之后。本地通过不等于外部可用性或市场验证。
5. **Create a precise public trust center.** 说明保存什么／不保存什么、服务器能否解密、死亡／失能／失联怎样区分、Rillora不能授予什么、如何导出／删除，以及当前哪些能力尚未上线。

### P1 — after the first-run skeleton

1. 在邀请前展示角色权限和字段级预览；
2. 将`recorded / invited / accepted / identity checked / authority checked / eligible for disclosure`拆成可见状态；
3. 准备度只奖励影响连续性的动作，并显示为什么某项算完成；
4. 把Apple、Google、Meta、GitHub和密码管理器官方设置做成有来源、地区、最后核验日的检查表；
5. 在Account中提供导出、取消、删除、会话、恢复和产品停止服务计划；
6. 对接收人Web入口单独做免安装、低认知和高压力场景验收。

### P2 — product maturity

1. 用iOS快速拍摄／录入辅助“位置提示”，但不默认上传完整敏感文件；
2. 年度复核和事务到期提供日常价值，不用未签到触发披露；
3. 为iPad、Dynamic Type、VoiceOver、键盘和低带宽接收人建立独立质量门；
4. 在有真实行为数据后再决定价格和首个付费人群。

## Remaining Authenticated Boundaries

Everplans、DGLegacy和MyLifeLedger的登录后首轮路径已在本轮直接观察。仍未完成的部分是：Everplans付费后的Deputy权限／邀请、三个产品的接收人端、真实错误恢复、导出／删除／取消订阅、移动App和辅助技术验收。Prisidio按Owner决定暂不检查；GoodTrust和Quicken LifeHub继续不为本轮付费。

任何后续邀请都停在最终发送前，除非Owner另行授权专用测试邮箱、外部发送范围与可能费用。任何后续账户内测试仍不得录入Owner真实资产、密码、联系人、证件或死亡信息。

## Research Boundary

- 本轮使用Owner已登录的三个免费测试账户完成只读和未保存表单检查；没有创建或删除外部账户，没有付款，没有保存资产／联系人／密码，没有切换heartbeat或通知设置，也没有发送邀请或消息；
- 公开帮助中心可以解释产品声称的流程，不能证明登录后实现与文案一致；
- App Store评分样本量、地区和时间不同，只作为可见产品信号，不作为市场份额或质量结论；
- 安全、SOC、加密和零知识描述均为竞品自述，除非另有独立报告，本轮不把它们当作独立安全验证；
- 对Rillora的建议必须继续服从`docs/product.md`、`docs/trust-safety-legal.md`和`docs/platform-contract.md`的更高权威约束。

## 2026-08-15 Public Entry Timing Recheck

Evidence level: `DIRECT / CURRENT RUN`. 本轮只读查看公开页和已可见入口；Everplans与DGLegacy的旧会话已退回登录页，因此未宣称新的登录后证据，也没有要求Owner重新登录。当前轮截图保存于`output/qa/rillora-first-action-deferral-20260815/research/`。

### Direct-category products: useful contrast, not the target

- [Everplans](https://www.everplans.com/) puts `Start now` in the hero and repeats it through the page, then introduces Free/Premium before the visitor has handled a concrete object.
- [DGLegacy](https://www.dglegacy.com/) puts `Set up for free` beside a fear-led inheritance promise, then expands into a very long problem, process, security and guarantee page.
- [Life Ledger](https://lifeledger.com/) makes account creation the first step of its operational death-notification workflow. That is coherent for an already-bereaved user, but is too abrupt for Rillora's broader preparation context.
- [Trustworthy](https://www.trustworthy.com/) also uses `Get started free` immediately, but its later `Experience Trustworthy` sample is the strongest same-category pattern: the visitor can manipulate a passport or insurance example and see a product response before supplying private data.

The category norm is therefore immediate conversion, not proof that immediate conversion is best for Rillora. Copying it would reproduce the exact pressure the Owner rejected.

### Polished adjacent products: product before account

- [Airbnb](https://www.airbnb.com/) opens on the real search and inventory surface. Account is available through utility navigation, while browsing and forming intent happen first.
- [Notion Marketplace](https://www.notion.com/templates) opens on searchable, inspectable templates and creators. The user can understand possible outcomes before importing or opening Notion.
- [1Password Password Generator](https://1password.com/password-generator/) gives the complete generator interaction before the later trial prompt. The utility itself earns the conversion request.
- [Apple iPhone](https://www.apple.com/iphone/) uses an `Explore the lineup` object-first hierarchy and keeps `Learn more` distinct from `Buy`; it does not turn the whole first screen into one purchase gate.

### Rillora implication

The reusable pattern is **product sampling before commitment**, not simply replacing one CTA label with another:

1. Keep the first viewport for brand, practical job and one operable product object.
2. Let the `What exists / What should happen / Who can help` index be that object; its safe example is public and synthetic.
3. Keep `Account` visible as a utility, not the visual destination of the page.
4. Remove `Free`, price and private-plan creation from the first viewport.
5. Ask to create only after the visitor has explored the structure, opened/adapted the example, or reached the bottom of the explanation.

This recheck supports the approved public-before-account direction while correcting its remaining conversion pressure. It does not prove market comprehension or conversion improvement; those require external observation later.
