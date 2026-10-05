# Rillora Web 新用户验收：第一轮检查点

2026-10-04 18:43–18:57 UTC · 云端 Chromium · 桌面 viewport 约 1180×757

> 发布说明：本检查点远端只含截图 01–06；其余编号为已采集且已逐图检查的证据，待后续提交上传。详见 manifest.json 的 publication_status。

## 范围和结论

从官网匿名入口开始，实际新注册隔离测试账号，再操作全虚构 QA 事项与联系人。本轮不是代码扫描，也不是依据文档推测。已确认核心“创建→草稿恢复→保存→编辑→搜索/筛选”可走通；验收仍在继续，不代表整站通过。没有操作真实资料、真实收件人、支付、账号删除或生产设置。

实际站点：https://www.rillora.xyz/；https://app.staging.rillora.xyz/；注册由 https://login.rillora.xyz/ 承接。前台未显示应用版本/commit，本报告不推定部署 SHA。

## 验收矩阵

| ID | 事项 | 状态 | 实际结果/证据 |
|---|---|---|---|
| P01 | 首页/产品/价格/帮助/安全页导航 | 通过 | 01、02、06、07、15；公开页内容正常加载 |
| P02 | 示例收件人切换/展开 | 通过 | Mum 2 条→Alex 1 条；Crypto 详情展开，04–05 |
| P03 | FAQ 展开/切换 | 通过 | 单项展开，其他收起；解释收件人 Web 使用与撤销边界，12 |
| A01 | 协议未同意时入口 | 通过并有 UX 建议 | Create account / Sign in 均禁用，03；这不是故障判定 |
| A02 | 注册空邮箱/非法邮箱 | 通过 | 明确文字错误、焦点回字段，10–11 |
| A03 | 邮箱→安全方式→密码→新账号 | 通过 | 09、13、16；密码步骤由账号所有者完成，未记录凭据 |
| O01 | 首次登录空态 | 通过 | 0 matters、Add a matter、Invite、Quick start guide，16 |
| O02 | 可选引导跳过 | 通过 | Skip this question 进入 2/2，然后创建事项，17–19 |
| M01 | 空/仅空格必填校验 | 通过 | 名称仅空格不可保存；Provider 空显示 Add the provider |
| M02 | 未保存关闭保护 | 通过 | Discard unsaved changes?；Keep editing 保留字段，20 |
| M03 | 刷新草稿恢复 | 通过 | 顶部 Resume draft，恢复全部填写字段，21 |
| M04 | 创建并保存记录 | 通过 | 列表一条 QA 事项，Draft；再次打开各字段一致，23–24 |
| M05 | 编辑并保存说明状态 | 通过 | Preferred outcome、Notes、Directions added 保存一致 |
| M06 | 中文搜索/无结果/清除筛选 | 通过 | 中文匹配；无结果提示；Clear filters 恢复全部，25 |
| M07 | Directions added 筛选 | 通过 | 更新后的记录仍可见，状态与筛选一致 |
| G01 | 计划进度与下一步 | 有问题（UX） | 0/5→1/5；“Continue next step”重开原事项，未解释剩余四项，22 |
| S01 | 单事项管理访问空态 | 通过并有 UX 建议 | 进入 Trusted contacts，保留返回原事项入口，26 |
| S02 | 虚构联系人→访问步骤 | 通过 | Person / Access / Link 三步，未邀请，27–28 |
| S03 | 最小权限默认/预览 | 通过 | 默认 Name；Directions 增加 provider/location/wishes；Details 才有 masked hint/notes，29–31 |
| S04 | 邀请非法邮箱校验 | 有问题（UX） | 无解释文字、只禁用 Create link & QR；外观仍是亮色 CTA，32 |
| S05 | 取消邀请 | 通过并有 UX 建议 | 未共享/未邀请；已经建立的虚构联系人保留，33 |
| S06 | 官网无 token 邀请入口 | 工具受阻 | 公开点击被工具拒绝，带原文授权重试一次仍拒绝；非产品失败 |
| S07 | 真正生成/接受/撤销邀请 | 未测 | 尚未有受控第二账号，未发送真实邀请 |
| X01 | 导出/保存副本/打开副本 | 待测 | 后续轮次 |
| X02 | 归档及恢复 | 待测 | 后续轮次，仅操作虚构记录 |
| R01 | 移动 Web/键盘/回归 | 待测 | 后续轮次；不涵盖原生 iOS |

## 可操作发现

### UX-01 / P1：下一步不说明目标，容易形成编辑循环

步骤：建立事项 → 选择 Request closure → Notes 填写具体说明 → Preparation status 设 Directions added → 保存 → My plan → Continue next step。

预期：说明 5 项 essentials 分别是什么、已完成哪一项、下一步目标以及缺少的字段/动作。

实际：My plan 只显示 1 of 5 essentials；Continue next step 再开同一事项的 Edit matter，焦点停 Category，没有新任务解释。0/5 时也只有进度条和通用按钮。不是声称进度计算错误，而是用户无法判断下一步。

影响：用户已经保存一条事项，却仍不确定“完成”的含义，可能重复编辑或离开。

建议：展开可核查的 5 项清单；具体按钮如“添加可信联系人”“填写下一步说明”；进入编辑页时定位并提示缺项。验收标准：从每个进度阶段均能说出且一步到达下一项。

### UX-02 / P2：非法邀请邮箱没有可理解的错误反馈

步骤：Trusted contacts → Invite someone → 虚构名称 → Continue → 选中事项 → Recipient's sign-in email 输入 not-an-email。

预期：字段旁出现格式错误；禁用 CTA 的视觉状态清楚，并有可执行修正说明。

实际：Create link & QR 在可访问树中是 disabled，但画面仍是高亮橙色，邮箱也没有错误文案。截图 32；空邮箱状态同样高亮，28。

影响：用户可能反复点看似可用的按钮，以为卡住。与登录页面清晰错误提示（10–11）不一致。

建议：失焦/提交时给字段错误、错误关联描述；按钮样式表达不可用状态，但不可只靠颜色。

### UX-03 / P2：快速引导和正式表单术语不一致

步骤：Quick start guide 的 Category 选项为 Account / Asset / Crypto；进入 New matter 后分别是 Online account / Financial asset / Crypto asset（17–19）。

预期：新用户无需重新猜测同一类别是否变了。

建议：统一类别标签与说明，尤其 Account 与 Financial asset 的区分。

### UX-04 / P2：分享范围安全默认很好，但“Directions”容易与 Notes 混淆

实际：分享 Directions 只显示 Provider / Location / Wishes；用户写在 Notes 中的具体处理步骤仅在 Details 档出现（30–31）。UI 用 Directions / Details 两个含义相近的词，不够直观。

影响：用户可能以为已把文字操作说明分享给家人，实际只共享意图枚举；或为分享 Notes 被迫共享所有其他保存细节。

建议：显示逐字段勾选或列出“包含/不包含”，将 Notes 是否被共享放在显眼位置；把预览默认展开或与最终确认绑定。当前预览本身字段正确，未发现越权泄露。

### UX-05 / P2：注册跨域的外观和退出路径断裂

浅色官网/App 到深色 Auth0 注册、logo 简化；邮箱首步无返回 Rillora 入口；输入邮箱后先介绍 passkey，点 Continue without passkeys 才出现新密码。见 03、09、13。

建议：同步外观与 logo；提供取消/返回；提前说明邮箱注册步骤；用“使用密码”明确替代路径。不是建议移除 passkey。

### UX-06 / P2：同意条件位于被禁用按钮之后

Account 页两个入口均禁用，checkbox 在下方；建议调整顺序或解释如何启用。见 03。这是可用性建议，未认定为登录业务逻辑 bug。

### UX-07 / P3：取消邀请后仍留下联系人，反馈应更明确

Person 步骤已经保存联系人；Access 步骤点 Discard changes 后保留 Not shared · Not invited 联系人（33）。当前状态标签正确，但“Discard changes”容易被理解为取消整个新建操作。

建议：按钮/提示明确“放弃分享设置，保留联系人”；或提供可撤回的“取消整个邀请草稿”。

### UX-08 / P3：价格区别术语需解释

Planned Web pricing 和未开放支付的边界已明确，但 Shared reviews 无就地解释（06）。建议一句说明谁 review、review 什么及与分享的区别。

## 无障碍与限制

正面：Skip to content，表单标签、折叠 expanded/collapsed、错误文字、焦点回到错误字段、事项保护弹窗默认焦点 Keep editing。

待测：完整键盘、真实屏幕阅读器、对比度量测、200% 缩放、移动 Web。AX 将互斥示例/筛选/分享档位呈现为 checkbox，建议核对是否应使用 radio/tab；目前不据此单独宣称 WCAG 不合格。

## 证据与隐私

证据在同级 screens/ 下。允许发布：01–13、15–33；这些为公开内容或明确虚构 QA 数据。排除 14-signup-password-gate.png 及所有 inspection-* contact sheet，不发布账号邮箱、认证 state URL、token、邀请码、凭据。08 只表示短暂 Loading，不能当故障截图。需保持截图原始内容，不用图像推断后端权限或数据持久化范围。
