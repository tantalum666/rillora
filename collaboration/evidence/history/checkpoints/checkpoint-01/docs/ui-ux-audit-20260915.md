# Rillora 全应用 UI / UX 审计

Status: AUDIT COMPLETE; FUNCTIONAL REPAIRS DEPLOYED; OWNER-RETAINED DESIGN AND REAL-DEVICE LIMITS REMAIN  
Last updated: 2026-09-16 (Asia/Hong_Kong; audit evidence remains September15)  
Scope: 当前 Web、原生 SwiftUI、主要子页面、多级任务及其异常状态。审计建议不是新的视觉定稿，也不是收费、身份认证或法律通过证明。

## September16 repair disposition

The original observations below remain the dated before-state. [Behavior repairs](ux-behavior-repair-20260916.md) now cover navigation, recovery, matter sharing, actual previews, invitation/foreground state, empty/focus feedback, event/term clarity and stale active-spec clauses, with deployed synthetic evidence. UX18's exact review/refresh is covered by the retained P1 implementation and current store regression checks.

Do not close the report as “all22 fully fixed”: broader homepage/navigation/Profile redesign in UX12/13 was not adopted; UX12 receives only row-priority alignment. UX14 retains its visual selector and gets functional explanation/accessibility changes, without a real comprehension study. UX17 has runtime/AX5 evidence but no physical VoiceOver acceptance. UX20 printing is repaired while the on-screen layout is retained. [Current handoff](handoff.md).

## HISTORICAL — September16 Owner scope correction

This report records observed problems and suggested remedies; it does not authorize UI redesign. Owner subsequently stated “我不是叫你重做ui，你怎么把我的ui给改了”. Preserve existing composition/navigation and implement specific defects within that UI. Proposed homepage/navigation/public-page rearrangements were withdrawn. UX07 has partial local navigation acceptance; native UX10/foreground changes still need runtime checks. UX07–22 are not collectively closed. [Current handoff](handoff.md).

## HISTORICAL — P1 repair checkpoint, 2026-09-16

Owner subsequently requested immediate repair. UX01–06 now have local implementation and focused acceptance recorded in the [repair contract](p1-reliability-repair-20260915.md) and [QA](../output/qa/rillora-p1-repair-20260915/README.md). Their original evidence below is retained as the before-state. All six passed coordinated synthetic-staging deployment acceptance, including an import-permission correction; UX07–22 remain open. See [deployment QA](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md). This does not claim a whole-app redesign, real customer acceptance or billing readiness.

## 审计原始结论（September15修复前）

目前最需要改善的是任务闭环和状态可信度。品牌色、灰色输入、原生导航、分类表单、真实邀请二维码和逐项共享可以保留；直接继续增加装饰、动画或说明卡片，会掩盖已有问题。

本次归纳 **22 组问题：6 组 P1、14 组 P2、2 组 P3**。这是修复优先级，不是 22 个安全漏洞，也不是量化用户满意度。P1 应在下一轮公开自助体验或收费验收前处理；P2 是主要操作、理解及可访问性问题；P3 是统一性与维护问题。没有从本次证据确认 P0 级账户越权或真实数据泄漏。

最重要的发现：

- 导出面向整张地图，未继承某一接收人的共享范围；实际 TXT 包含标为 Never disclose 的事项名称和位置。
- Web 保存失败时错误可位于当前视口之外；刷新又会丢失未保存内容。
- Web 冷启动遇到服务故障会显示普通访客首页，没有在首页说明故障或提供重试。
- 已保存事项仍可显示 Not added，准备度与是否保存混在一起。
- 账户删除、完整数据备份／恢复、加密包阅读等自助退出路径不完整。
- 套餐清单混入已移除或尚未提供的能力；Free / Family 人数与到期生命周期仍是已知未完成项。

证据包见 [QA README](../output/qa/rillora-complete-ui-ux-audit-20260915/README.md)，全部截图见 [截图索引](../output/qa/rillora-complete-ui-ux-audit-20260915/screens-index.md)。以下结论以本次运行和代码为依据；9 月 11 日的测试数字没有当作本次重跑。

## 方法与证据范围

开工完整阅读 66 份项目自有 Markdown，18,108 行，98 个完整正文分段；14:24 HK 完成，无缺失段或阅读期间变化。记录见 [完整阅读证明](../output/qa/rillora-complete-ui-ux-audit-20260915/full-read-completion.json)。此前交接的商业下一步已按 Owner 本次审计任务重新排序。

本次使用真实运行界面：公开 staging Web；本地 Web 与独立 PostgreSQL 数据库；Xcode 编译安装的原生 iOS 26.5 Simulator。A、B、C、D 均为合成测试身份，邮箱使用 example.test。A 有 9 个不同用途事项，分别向 B 与 C 授予不同权限；D 从空地图开始，C 后续完成原生新建。测试没有涉及 Owner 私有地图或向真实亲友发消息。

Web 检查 320、390、768、1440 CSS px，键盘焦点、空态、保存失败、冷启动失败和 Reduce Motion。原生检查普通字号、AX5、权限选择、软件键盘、深层返回；横屏只完成场景几何观察，录制了当前交互并解码视频。法律页面另用明确合成运营资料的编译版检查，避免把 Vite / CSP 的开发冲突当作产品问题。

这不是完整 WCAG 合规认证、实体设备 VoiceOver 检测、性能基准或可用性访谈。没有新跑全套单元测试，没有部署；新构建证据仅为本次原生 Debug 和独立本地法律预览构建。

## 按旅程的覆盖与健康状态

“通过”只指列出的合成操作成功；“需改”可能是理解、恢复或信息层级问题；“受限”表示没有足够当前证据。

| 步骤 | 本次实际覆盖 | 状态 | 关联 |
| --- | --- | --- | --- |
| 1. 访客了解产品 | Web / iOS 公开总览、What / Next step / Who、类别与 Profile | 需改：用途反馈过弱，重复控制 | UX14、17 |
| 2. 登录入口与返回 | Sign in / Sign up、Web 添加设备后进入 Account 并返回保留意图；原生托管首屏 | 部分通过；真实 provider 完成与取消受限 | UX03、21；边界表 |
| 3. 空地图与引导 | D 空地图、Quick start、Skip、Save and exit；原生空 Matters | 需改：暂停后无法恢复 | UX08、15 |
| 4. 登录后总览 | A 多事项 / 多人状态，两端第一屏及下一步 | 可操作，信息权重需改 | UX04、12 |
| 5. 新建与分类 | Web 7 类及加密资产两种保管方式；原生账户、Crypto、Document / AX5 | 必填与保存通过；错误恢复需改 | UX02、04 |
| 6. 编辑与取消 | Notes、切换类别、Cancel / Keep editing、软件键盘 | 草稿在应用内取消时保留；浏览器刷新不保留 | UX02、07、16 |
| 7. 归档与数据取回 | 原生归档合成 Unshared document，Web 刷新后同步移除 | 归档成功；Web 缺入口、恢复缺口 | UX05 |
| 8. 发出邀请 | 原生 A→B、Web A→C，Person / Access / Link，真实 QR 解码与 Copy | 主闭环通过 | UX10、11 |
| 9. 接收邀请 | 访客创建账户／登录入口；B Web、C 原生明确接受；无效／撤销链接 | 合成接受通过；真实注册 ceremony 受限 | UX10；边界表 |
| 10. 分层与撤销 | B 银行 Directions，C 钱包 Details + Notes；C 降为 Name；撤销 C 保留 B | 本次合成权限投影通过 | UX01、11 |
| 11. 共同复核 | A 发起→B 建议→A 对比并应用→完成→历史；原生看历史与设置 | 通过；不是付费／通知证明 | UX06、19 |
| 12. 导出 | 原生预览、过期版本拦截、刷新、明文准备、加密准备、离开保护；Web 实际 TXT 下载 | 范围、复核与阅读闭环需改 | UX01、05、18 |
| 13. Profile / More / Settings | 两端根页、联系人、套餐、工具、Safety、About / Copy | 需改：信息结构与自助能力 | UX05、06、13 |
| 14. 官方指引 | Web 11 个 provider 模板及各节；原生 Apple Set up / Later / Details | 内部页面可用；外部办理未验证 | UX21 |
| 15. Safety 多级页面 | 可记录／不可记录、Death / Incapacity / Unreachable、About | 页面可用；运行承诺与 AX 标签需改 | UX17、21 |
| 16. 法律页 | 7 页编译版、60 个目录目标、移动布局及 print CSS | 链接目标通过；阅读密度／打印配色需改 | UX20 |
| 17. 错误与加载 | Web 503 保存／冷启动、原生陈旧导出、无效邀请 | 保护存在，恢复体验不一致 | UX02、03、18 |
| 18. 可访问性与动效 | Web 键盘 / 小屏 / Reduce Motion；原生 AX5 / 软件键盘 / 当前视频 | 局部问题；不宣称全面符合 | UX16、17 |

## P1 — 应先修复

### UX01 — 导出范围没有与接收人的隐私预期对齐

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**证据。** A 仅把银行定位给 B，钱包详情给 C，Private letter 不共享且意愿为 Never disclose。通过 Web 的 Review → Format → Save 实际下载的 [TXT](../output/qa/rillora-complete-ui-ux-audit-20260915/rillora-start-here-2026-09-15.txt) 却包含全部 9 项的方向、Private letter 的名称及 Private drawer 位置、未共享事项和两位联系人的名字。预览只显示总数和名称，没有选择“给谁”或列明与其权限不同的内容。

**影响。** 用户可能把“最小披露”理解为可以安全发给已选择的家人，从而在手动发送文件时透露原本不想让此人知道的事项。此处确认的是 Owner 自行导出的范围及 UI 风险；没有证据表明 B/C 的在线 API 越权，文件也未发送给真实接收人。

**建议。** 导出入口先区分“留给自己保存”与“给指定的人”；后者由服务端以该人的当前有效权限生成投影并默认排除 Never disclose / 未选事项。本人完整副本须明确为包含整张私有地图，显示准确内容预览。继续保留“外部副本不能撤销”的确认。

**验收。** 同一个 A/B/C 样本，B 导出没有钱包、私人信件、C 身份或它们的存在性提示；C 导出只含授权内容。生成前后权限变化必须重新确认范围；本人备份与供他人阅读的指南名称、内容、目的可区分。

代码入口：[Web 导出](../apps/web/src/StartHerePanel.jsx)、[原生导出](../apps/ios/Rillora/Features/StartHere/StartHerePreviewView.swift)。当前最小导出有意排除 typed details / Notes；这项排除本身没有被本报告改写。

### UX02 — 保存失败看不见，刷新后草稿丢失

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**复现。** Web 新建填写 Name / Provider → 滚到末尾 Save → 用本地拦截返回 503。内容留在表单中，但 alert 的位置为 y=-233、高 59，Save 位于 y=762，当前视口 390×844。见 [失败后的实际屏幕](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/82-web-failed-save.png)。随后浏览器刷新，表单消失且没有 beforeunload 保护。

**影响。** 用户只看到按钮恢复，很容易认为点了没反应；重试／刷新可能让之前的录入白费。服务器没有保存失败数据，与 UI 草稿丢失是两件事。

**建议。** 在提交动作附近显示错误并将焦点移至可见错误摘要；保留填入值，允许明确重试。对同一账号、同一事项建立有期限的本地草稿及刷新／离开保护，避免把敏感草稿暴露给另一账号。

**验收。** 长表单在最底部遇到 400/409/503/offline 时都能发现错误；刷新后可恢复或明确放弃草稿。保持应用内 Cancel → Keep editing 已通过的行为。此次没有逐一注入上述所有状态，400/409/offline 是后续验收条件。

代码入口：[表单](../apps/web/src/MatterForm.jsx)、[App 保存与 Drawer](../apps/web/src/App.jsx)。

### UX03 — 服务故障被表现成访客首页

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**复现。** 对合成 A 的冷启动 `/v1/overview` 返回 503；首页显示普通公开产品，alert 数量为 0，没有故障或重试文案。[故障状态截图](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/88-web-load-error.png)。恢复请求时也会短暂渲染相同公开页。[恢复中截图](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/87-web-restoring-flash.png)。

**影响。** 已有用户会误以为退出登录或资料不见，重复走认证。本次控制延时不能用来声称真实登录耗时为某个秒数。

**建议。** 区分未知会话、已确认未登录、服务暂不可用、已认证刷新失败。会话恢复使用稳定的应用壳和简洁加载状态；服务故障就近说明并重试，只有确认未登录才进入普通访客态。

**验收。** 冷启动 401 与 503 呈现不同，503 不暗示账号不存在；恢复过程中不让用户先操作错误的访客入口；已加载地图的刷新失败保留原内容并标示状态。

代码入口：[App 的 loading / loadError 分支](../apps/web/src/App.jsx)。

### UX04 — “已保存”和“已准备好”被混成 Added / Not added

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**证据。** D 完成合法 Crypto 保存，得到 Matter saved；列表可见并能重开，但 Web 可访问名称仍为 `Open Audit matter, not added`。A 中已有的草稿亦如此。[保存结果](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/35-web-first-save.png)。原生称其 needs review 较准确，但筛选仍使用 Added。[原生首次保存](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/77-ios-native-first-save.jpg)。

**建议。** 保存状态、信息完整程度、复核状态分开命名。列表默认“所有事项 / 待完善 / 待复核”，用“已保存”“资料待完善”“已复核”等准确反馈；不要用 Not added 描述已经存在的记录。不要把 Draft 单独等同于不存在或失败。

**验收。** 创建、编辑、重开、刷新及读屏名称对同一对象一致；筛选分母可解释。无需靠用户进入 More options 更改状态，才能证明保存成功。

代码入口：[MatterRow / 映射](../apps/web/src/App.jsx)、[原生列表](../apps/ios/Rillora/Features/Matters/MattersView.swift)。

### UX05 — 自助退出、完整备份及恢复路径不完整

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**证据。** Free 页面承诺 Account deletion / Data export；两端实际 Profile / Settings 未找到账户删除入口，当前路由代码亦没有用户账户删除流程。导出只提供最小方向 TXT 和加密包创建，没有消费者使用已存包＋恢复文件打开／导入的界面。最小导出排除 Notes、钱包网络／地址等，不能称完整数据备份。Web 编辑页无归档入口；原生 [Archive](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/107-ios-matter-actions.jpg) 能归档，Web 随后同步移除，但没有发现普通用户的归档恢复界面。

**建议。** 将账户身份、当前登录方式、数据导出、备份恢复、账户删除集中在真实账户管理中。优先补全可验证的删除申请与状态、完整本人备份／读取路径；先明确已实现范围，再展示权益。归档需明确能否恢复，两端提供等价能力。不要把“联系支持”包装成已完成的无人值守自助流程。

**验收。** 新注册用户能在 App 内发起账户删除并看清影响、确认与完成状态；退出订阅不妨碍本人资料取回。已导出包能由目标用户在支持的工具中真正打开。Apple 对支持创建账户的 App 有账户删除入口要求，需在发行前独立验证。[Apple 官方说明](https://developer.apple.com/support/offering-account-deletion-in-your-app/)。

证据：[Free 权益](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/47-ios-free-features.jpg)、[设置页](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/web-desktop-Settings.png)、[加密副本已准备](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/59-ios-encrypted-ready.jpg)。

### UX06 — 套餐清单与当前能力状态不一致

**Repair status (September16):** Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.

**证据。** Free 仍列 Basic rehearsal 与 Account deletion；消费者演练已被 Owner 移除，删除路径见 UX05。Family 列 co-planner、encrypted attachments、adaptive reminders 等未来能力，和已实现的复核／建议审批并排。页面确实标了 Planned / Not available yet / Billing is not open，因此不能说当前已向用户收取这些功能的费用。

**影响。** 用户仍很难理解 $68 的当前价值、未来范围及取消后的实际行为。Free1 / Family5 数量、付费截止版本与取消恢复是已知未完成，不是本次新增后端回归。此次 A 能创建 B/C 两条关系也不能被当作 Free 已执行一人额度。

**建议。** 保留 US$68/年、US$7.99/月及收费关闭。权益页只把真实可用能力放进当前套餐，未来能力单独说明；以“共同检查与批准修正”的真实结果解释价值。推出付费前补全额度与生命周期，而非先放一个无法完成的购买墙。

**验收。** 每条权益能到达对应操作或明确为尚不可用；移除已被取代的演练表述。本人退出、接收人既有副本、额外接收人的后续更新和撤销分开解释；前后端同一 entitlement 状态。

证据：[原生 Family](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/48-ios-family-features.jpg)、[Web Family](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/23-web-family-expanded.png)；合同：[当前定价](pricing-68-20260911.md)。

## P2 — 主要体验与可访问性

### UX07 — Web 页面状态没有成为可返回的导航

Settings、Matters 等切换只改变内存状态；实际刷新回到 Overview，URL 仍为 `/`。主要页面不支持可靠的历史返回和深链接，来源事项／筛选也容易丢失。**改法：** 统一路由到可恢复的页面和任务上下文，处理返回、前进、刷新；脏表单交给 UX02 保护。**验收：** 从 Matters 搜索→详情→人员→返回，恢复原筛选和滚动；刷新 Settings 留在 Settings；分享链接可独立打开。代码：[App](../apps/web/src/App.jsx)。

### UX08 — 暂停的新手引导找不到恢复入口

实际 D 的 Quick start → Skip → Save and exit 保留 `guide_paused`，但 Overview / More / Settings 不再有 Resume。Web `shouldShowFirstUsePanel` 与原生 `showsStarter` 排除了 paused，Profile 旧恢复入口又已清理。**改法：** 用一条可忽略的“继续设置”入口恢复已暂停步骤，或明确结束引导；不重新加阻塞式问卷。**验收：** 跳过、退出、再次打开都不丢进度，手动添加仍能立即使用。证据：[Step2](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/13-web-guide-step2.png)、[暂停后](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/15-web-empty-mobile.png)；代码：[firstUse](../apps/web/src/firstUse.js)。

### UX09 — 从“这项资料给谁看”到实际权限，路径断开

新建 People 区仅说 Private until you choose to share；已保存详情说 Access is managed in Trusted contacts，没有直接进入该事项共享设置的操作。Recorded roles 藏在 More options 后，空态要求先“Add an active person record”，又没有就地入口。**改法：** 在事项详情显示真实“谁能看、能看多少”摘要和管理入口；角色记录单独解释职责，不与已连接的共享权限混淆。**验收：** 从事项可直接核对并调整它对 B/C 的可见性；无联系人时可继续邀请并返回同一事项。证据：[事项底部](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/107-ios-matter-actions.jpg)、[角色空态](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/78-ios-recorded-roles.jpg)。

### UX10 — 邀请完成与中间状态反馈不一致

原生 Next 已保存 Person，Access 顶部却可 Done，此时可能仍没有链接；应说明这是“联系人已记录、尚未邀请”。更直接的复现是 C 接受并查看资料后连续返回，旧接收页仍显示 Accept invitation 和等待图形，[截图](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/66-ios-back-accepted-invite-stale.jpg)。Web 同状态使用 Open shared items。**改法：** 接受成功替换旧页状态／导航栈；发送流程区分已记录、链接就绪、已接受。**验收：** 成功后后退和再次进入均显示 Connected / Open shared items，不让用户重复猜测是否接受成功。代码：[邀请接收](../apps/ios/Rillora/Features/Contacts/InvitationAcceptView.swift)。

### UX11 — 权限层级可选，但缺少最终可见内容预览

Name / Directions / Details 有简短字段说明，但生成 QR 前没有“对方最终看见什么”的实际投影。Name-only 接收详情大面积为空，未说明是授权范围所致；钱包地址又是多行纯文本，缺明确复制动作。**改法：** 在授权完成前提供只读的接收人视图；Name-only 用一句准确状态说明；公开地址等可复制字段提供有反馈的复制。**验收：** 预览与服务端实际投影一致，未选事项不泄露名称或数量。证据：[C 详情](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/64-ios-c-notes.jpg)、[降级为 Name](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/68-ios-c-scope-reduced.jpg)。

### UX12 — 已有内容后的总览，仍把过多空间给装饰

空地图的 folio 有识别度；有 9 项资料后，桌面仍用约半个内容区放同一插图和大按钮，真实事项只有下方 3 行。Web 优先 Add、按原顺序列事项，原生优先 Review next，两端对“下一步”的排序不一致。**改法：** 保留缩小的 folio 作为状态入口，把首屏重心给待处理事项、待接受邀请和最近变更；同一用户状态采用共同任务优先级。**验收：** 有数据的首屏能直接找到最需要处理的任务，图像不再与内容争夺主视觉。[桌面](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/web-overview-1440.png)、[移动](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/web-overview-320.png)、[原生](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/34-ios-populated-overview.jpg)。

### UX13 — 导航按实现模块分组，Profile / Settings 缺少账户任务中心

Web 同级有 Overview、My plan、Matters、Trusted contacts、Shared with me、Shared reviews、Guides、Plan & access、Activity，外加 Settings。My plan 仅进度和两按钮；Settings 在开发身份下只剩套餐入口，真实 session 分支才增加退出操作，仍没有声明中的 Preferences / setup。不能把开发身份隐藏的 Sign out 误报成真实用户没有退出。**改法：** 主路径围绕地图、人与共享、账户；次级能力就近进入。Profile 明确当前账号与登录方式，再放数据、订阅、安全和支持任务。**验收：** 每个根页有独立用户目的，没有仅作另一个已存在入口中转的页面。[My plan](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/web-desktop-My-plan.png)、[More](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/16-web-more.png)。

### UX14 — 公开页减少了文字，但还没有充分解释产品

“Your important things, connected”及三个抽象状态字不足以表达自己整理、分别给家人／朋友、对方账号接受后查看的核心用途。Who 的反馈只重复 Choose who can help；图形上三按钮与下方三个选择又各占一次操作。**改法：** 保留公开可探索和不强制登录，用一个交互区演示“事项→选择的人→允许看到的范围”，反馈表达结果而非复述选项；真实保存才登录。不要恢复文章墙或创建假的公开账户／联系人。**验收：** 新用户无需登录能说出产品用途、共享可分人以及下一步操作；具体理解效果须以后用真实用户任务测试证明。[公开 Who](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/05-ios-public-who.jpg)。

### UX15 — Web 空态与无搜索结果缺少明确解释

0 项时仍摆出完整搜索／筛选和一条空边框；查不到记录时只有 Clear filters，没有“没有匹配项”或条件说明。[无结果](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/92-web-no-results.png)。原生空 Matters 已提供合理解释和 Add。**改法：** 区分初次为空、筛选为空、接收人暂无授权、加载失败。**验收：** 每种空态都有一句准确说明和一个适合的操作，不靠空容器让用户判断。

### UX16 — 通用键盘焦点太弱，嵌套确认后焦点没有回到原控件

实测 Add a matter 的键盘 outline 为 `rgba(85,119,90,.35)`，外侧背景 `rgb(23,28,28)`；合成后对比度约 **1.48:1**。一般非文字焦点状态需要足够对比，不能以正文颜色通过替代。正文和 muted 在当前深色背景分别约 12.06 / 8.78:1，所以“灰字整体不可读”不是本次结论。[W3C 非文字对比](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)。

另实测 Keep editing 关闭嵌套确认后焦点是 BODY，下一次 Tab 才进入外层 DIALOG。**改法：** 统一清晰 focus-visible，包括 textarea / links；保存触发控件并恢复焦点。**验收：** 只用键盘可以识别当前位置并完成取消／继续，不跳到页面起点；满足有逻辑的焦点顺序。[W3C Focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)。

### UX17 — 原生可访问名称和 AX5 细节还需修整

公开图形按钮在运行快照中被命名为 Plain Text Document、Divide、person.2.fill；Safety / About / DisclosureGroup 又有重复无名按钮。AX5 共享页的 Connected 被拆成 Connected 的主体加单独末尾字母，[截图](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/90-ios-ax5-sharing.jpg)。权限三选项已能竖排、表单能滚动、软件键盘下顶部操作可见，这是应保留的部分。

**改法：** 图形仅保留一套可操作语义，明确选中／展开状态；大字号人名与连接状态改为全宽垂直布局。**验收：** VoiceOver 实机读出用户任务，不读 SF Symbol 名称；每控件只有一个逻辑焦点；AX5 不拆状态词。运行 AX 快照只证明命名风险，本次未完成实体 VoiceOver 全流程。

### UX18 — 导出“复核”没有展示最终内容，陈旧版本恢复入口深

Review 只显示事项名称／意愿；生成确认却要求已复核 guide。修改计划后原生正确阻止陈旧导出，[报错](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/55-ios-export-stale.jpg)，但恢复需回 Review → Preview details → 滚动 → Refresh。**改法：** 复核显示准确导出投影；陈旧状态直接提供刷新复核按钮，说明哪些内容变了。保留已通过的未保存 recovery key 离开保护。**验收：** 用户不必猜折叠入口就能完成新预览；没有把普通 TXT 的准备成功写成已发送／打印或可读取的完整备份。

### UX19 — Activity 对用户几乎不提供可用历史

实际邀请、更新及复核后出现多条相同 Plan activity recorded，日期相同，没有动作对象或可展开细节。[截图](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/web-desktop-Activity.png)。**改法：** 将允许展示的事件映射为“邀请已接受／共享范围已更改／建议已批准”，给出适当时间与相关任务入口；保留隐私过滤，不能直接暴露内部 payload。**验收：** 用户可以区分发生了什么，审计记录也不冒充资料已送达或资产已转移。

### UX20 — 法律页面的移动阅读入口过深，打印配色未收尾

编译版手机首屏多数只容纳大标题、版本、状态、日期和打印按钮，正文前还有最长 20 条目录。完整法律正文需要保留，但没必要让头部占去几乎一屏。print CSS 已切白底，summary 仍是很浅的灰色，[打印样式](../output/qa/rillora-complete-ui-ux-audit-20260915/screens/106-legal-print-css.png)。**改法：** 压缩页头，移动端目录折叠可跳转，保持清晰返回；print 统一黑／深灰并另做分页 QA。**验收：** 7 页目录与返回目标正确、正文不被 Cookie 提示永久挡住、打印摘要可读。本次 60 个目录目标存在且可跳到末项；没有提交法律意见或实际打印／PDF 分页通过声明。

## P3 — 统一性与文档

### UX21 — 同一任务有多套词，部分文案超出当前运行事实

Provider instructions → Official checks，与 Web Official guides 是同一任务；Export directions → Start Here 也需用户重新识别。中文系统下 Web 日期为中文、原生日期英文；单数可出现 1 matters。Safety 文案中的报告启动 evidence checks / silence 启动 welfare check，需要结合当前真实服务状态表述，不能让关闭的运行流程看起来已经自动化。**改法：** 建立精简用户术语映射和共享格式化规则；运行承诺只使用真实可用范围。不要将内部 schema／状态名当用户说明。

### UX22 — 旧规范仍会把下一轮带回被移除的方向

完整阅读发现 DESIGN、MVP／平台与质量门的较早段落仍包含旧圆环／动机／消费者 Simulation 验收，而顶部较新决定已经移除；商业及运营文件也混有旧价和旧认证“下一步”。**改法：** 对活动条款标注已由哪个新合同取代，历史事实保留日期和 HISTORICAL 身份。不能因为历史门存在而重新要求 Owner 登录／确认。此次只同步当前审计入口、焦点合同备注、决策、交接与旅程；没有把历史研究全文改造成当前规范。

## 保留的优点与动效方向

- 访客可浏览；原生直接进入托管登录；访客邀请入口只承担接收。输入文字已是灰色，不应重新变为默认链接蓝。
- 七类表单有真正不同的定位字段，Crypto 区分交易所与公开链上地址，必填不全不能保存，每类保留 Notes。
- 当前邀请是真实 QR / URL，复制有反馈；接受需要明确动作；未选与 Never disclose 在线投影不外泄；撤销 C 没有影响 B。
- 共同复核确实可以显示前后差异，B 不能直接改 A 的地图；A 批准后两端读到新定位。
- 原生系统导航、表单、选择器、明确取消，及加密 recovery key 离开保护值得保留。
- 当前不是完全没有动效：Web 页面进入约 0.28 秒，Reduce Motion 下为 none；原生有步骤／选中／页面反馈，实际视频已记录。后续动效应服务“选中→可见范围改变”“保存→状态确认”“邀请→连接成功”“建议→已应用”，不要让整张地图持续漂浮或对数据状态作虚假暗示。

## 建议的修复顺序与验收方式

1. **先处理 UX01–06**：范围、保存可靠性、恢复状态、数据退出与权益真实性。逐项保留同一 A/B/C 夹具对比修复前后；不打开收费。
2. **再收敛任务架构**：总览以真实下一步为主，事项能直接管理可见人，Profile 能解决账户问题，Web URL 能返回；移除 My plan / Settings 等重复中转。
3. **最后进行视觉与动效统一**：选一套当前状态明确的参考图，再落到 Web / SwiftUI 的具体组件；统一间距、状态、图标、字号、焦点与断行，不重新堆解释文字。

验收以任务能否完成、失败后是否保留工作、对方是否只见授权内容为主。功能验收之后再用少量真实新用户观察“了解产品→添加→邀请→接收→找到信息”，不要以截图更漂亮代替理解和完成率。这里没有虚构用户样本、转化率或付费意愿。

## 当前不能证明的部分

| 项目 | 本次边界 |
| --- | --- |
| 真正 Google / Apple / 邮箱注册、密码恢复、MFA、重登耗时 | 只取得托管初始页；不复用历史登录成功作新证明。Apple 按钮首屏部分被系统工具栏覆盖，但没有足够操作证据判断是否不可滚达。 |
| 实际用户 B 注册后返回邀请 | 合成身份接受已验证；真实 provider ceremony 与平台本人步骤没有执行。 |
| 正在打开的原生详情被远程撤销后的前台恢复 | 新打开 / 新加载已验证；MCP launch 会重启进程，原尝试被排除。子详情仅 task 获取的代码值得后续专测，不能冒充当前已复现漏洞。 |
| StoreKit / Stripe / 取消订阅 / 付费截止 | 收费关闭，额度／截止版本仍未完成；没有购买测试或市场验证。 |
| 所有设备、横屏、VoiceOver、TalkBack、真实 Safari / Chrome 密码管理 | 仅所列 Simulator / Chromium / viewport 证据；横屏场景观察不足以称全部布局通过，实体设备与完整辅助技术检查待补。 |
| 真实打印／加密文件第三方打开／完整恢复 | 本次下载 TXT、生成加密包和保护提示；未声称文件已送达、实际打印、导入／恢复成功。 |
| 法律／官方办理／未来释放 | 法律页面布局和链接目标检查，不是专业法律复核；未提交任何身后办理或运行释放流程。 |

所有截图失真、过早捕获、错层点击、开发 CSP 和工具延时错误均单独列入 QA 排除记录；不会把这些当作产品问题。最终清理及文档检查见 QA README。
