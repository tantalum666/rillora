# Web 中英双语界面与维护合同

Status: FOUR WEB SURFACES DEPLOYED; AUTH0 LEGACY DESKTOP SHELL REMAINS BLOCKED
Last updated: 2026-10-16 (Asia/Hong_Kong)

## October15–16 下一版公开语言地址与AI授权

[实施候选](architecture/ai-discovery-implementation-20261015.md)为官网提供 `/en/…` 与 `/zh-CN/…` 固定语言正文、元数据和对应关系。公开规范URL的语言优先于存储；旧无语言路径保留偏好／浏览器兼容跳转。App语言选择逻辑保持，不把公开路由规则套用到私人事项或邀请。两篇公开文章及AI选择授权文案各有完整中英文；真实用户事项名称与品牌名不翻译。默认关闭的AI授权面板已在EN1440／ZH390验证，当前生产未改；Auth0旧外壳仍按Owner指令暂缓。

## October9–10 当前单一语言合同

Owner要求选中文全部使用中文，选英文全部使用英文，取消并排翻译、中文参考及英文优先提示。这取代下方October5/6历史检查点中的英文-only法律/同意/导出限制。现已发布完整法律正文、同意句、Auth0语言、Stripe结账/门户、打印指引和共享预演；保留真实输入、身份名称、不可改写的许可证原文、机器格式及历史收据。

官网、App、法律页链接保持所选语言；Auth0传入固定ui_locales枚举，Stripe映射到en/zh，不改变市场、价格或权限。法律入口使用无存储的URL语言选择，仍不访问账号/API/分析；法律包只带必要common文案，不引入营销目录。新付款尝试把首次语言固定在94迁移列中；模糊重试继续原始请求，历史NULL保持未指定语言。

本轮Web189、法律8、14页SSR及同意/词汇检查通过；原生53、API新增语言场景有独立结果。四站已部署并独立核验：应用/Preview/官网共203公开文件匹配，法律50HTTP/18资源/14实际双语页面通过。手机13已由Owner确认订阅/港币888且没有混排。Auth0两个同意表单及语言配置已发布，桌面旧外壳的3句英文仍受模板API402限制；官方支持入口也实际拒绝创建工单，不能宣称所有第三方页面全部完成。[执行状态与证据](payment-recheck-20261009.md)。

## HISTORICAL — October6 验收与部署

中英文计划进度、准确的下一事项/准备状态焦点、恢复为私有草稿的活动记录均已通过真实浏览器合成数据验收。中文完整地图备份实际保存并重新打开，5 条事项和多行 Notes 原文保持；文件为 3,879 字节。Web 165 项和独立法律构建 7 项通过。

受限 Web 的 86 个文件、官网的 31 个文件已部署并逐文件匹配构建 SHA256。正式官网和 Account 页实际中英文切换通过，没有溢出、损坏图片或控制台警告/错误；账户条款始终未预勾选。官网仍沿用已选 Preview 入口，未开放普通客户或收费。Rillora 当前 USD88.99 年付另已完成真实 Stripe TEST 托管付款、回程保留登录、拒付/取消/恢复/退款与权限回落验收。[当前结果及 TEST 边界](release-12-stripe-20261005.md)。以下 October5 段落保留为历史交付/验收检查点。

## October5 后续验收（进行中）

计划下一步、归档恢复活动和英文导出入口已修复并在真实浏览器操作合成数据验证；完整备份已落盘并核对原文。官网构建清单v4准确声明外观与语言两个本地偏好，部署校验拒绝额外存储、Cookie和追踪。新产物尚未部署；详见[当前结果](release-12-stripe-20261005.md)。

## October5 中文文案复核

Owner要求仔细斟酌中文。已按[中文文案口径](chinese-copy-guidelines-20261005.md)逐条审阅两端资源，统一语气/术语，区分导出与入门、姓名与事项名称，并明确共享、备份、恢复密钥和法律权限边界。Web371条及原生225个中文单元已修订；原生另新增姓名上下文键，英文显示不变。实际编译/界面证据与初版静态检查分开记录，仍未部署。

## October5 Mac follow-up

Dot source is consolidated with the latest release fixes on `codex/dot-integration-20261005`.
Actual local Chrome acceptance now covers public320px bilingual pages,desktop Home,
390px workspace drafts/confirmation/Back and the four reproduced repairs. Two new
email guidance messages bring the App catalog to1,276pairs. Full hidden/authenticated
and accessibility matrix remains; production is unchanged. [Current exact evidence](qa/dot-followup-20261005/README.md).
The initial blocked-browser report below is retained as its dated branch checkpoint.

## 初版授权与范围（Dot交付检查点）

Owner要求「还有rillora要做一个中文的语言界面，你直接做吧，做完推到git上，记得要构建可维护代码」。本轮在活动工程基线 `2cc95f77c1279bdad43547b7e58a8faca9da7a93` 上，为 Web 应用与官网加入简体中文，保留 English。代码交付分支为 `codex/chinese-web-20261005`；没有合并、部署、修改 Auth0/邮件/provider、原生 iOS 或开放市场/收费。

不是在页面上匹配英文后替换 DOM，也没有调用翻译服务。应用自己编写的文案通过稳定语义键、集中双语词典与 React context 渲染；输入/已保存内容按原样显示。

## 已实现的界面覆盖

- 官网：Home/Product/Security/Pricing/Support、FAQ、示例交互、法律信息外壳、独立中文示例下载、导航/页标题/ARIA
- 公共应用：介绍、账户入口、必要存储提示、只读副本入口、收到邀请后的登录/接受/返回及错误状态
- 工作区：桌面/移动导航、总览、搜索/筛选、事项编辑、分类字段/验证、联系人、可跳过的首次引导、草稿恢复、确认框、通知、活动与设置
- 共享/数据：逐人逐事项范围、接收人只读内容外壳、Name/Directions/Details、共享复核、导出/恢复/完整备份/归档恢复/删除、近期认证、角色和非操作性演练控件
- 计费：套餐/权限说明、真实报价格式与关闭状态；不翻译或改写版本化英文购买同意原文

当前五个词典共 **1,274 对消息**：common 38、public 274、workspace 257、forms 232、sharing 473。官网只载入 common/public，共312条；不打包私有指南正文、App、API客户端或私有词典。

## HISTORICAL — October5语言边界（被上方当前合同取代的限制不再执行）

- Name＝名称；Directions＝查找指引；Details＝详细资料；Matter＝事项；Asset Map＝事项地图；Trusted Contact＝可信联系人；Recipient＝接收人
- 正式法律正文、法律版本/digest与英文同意句原样保留。中文同意辅助说明明确是参考；英文正文通过外层 `lang="en"` 标记，未改受摘要约束的模块
- Auth0托管登录、事务邮件、第三方平台页面、官方平台指南正文仍为原语言。指南控件可中文，但指南正文/来源/复核日期不被伪装成已翻译或重新审核
- 服务端生成的 Start Here 明文文件及诊断正文仍可为英文，界面明确标注；已保存的外部文件、恢复密钥、导出格式和真实用户内容不翻译
- 此轮没有繁体中文词典或 iOS 本地化。中文浏览器先使用简体中文；界面明确显示「简体中文」
- 语言不会改变 storefront、市场/数据地区、币种、定价、共享权限或同意事实。当前新购 Web 报价仍是 USD88.99/年、Free1/Family5；旧权利/收据不变

## 代码结构

入口：`apps/web/src/i18n/`。

- `core.js`：纯函数消息查找、English回退、命名插值、`Intl.PluralRules`、日期/数量/金额、词典完整性与合并去重。回退到英文复数消息时使用英文复数规则
- `localeStore.js`：可注入浏览器适配层。默认跟随浏览器，显式选择才写 `rillora.locale.v1`；存储失败仍可在当前页使用。订阅跨标签变化，不重新挂载工作区
- `I18nProvider.jsx`：context与格式化/错误消息API。`useI18n()`供组件使用，表单等纯函数可显式接收 `t`，默认英文合同保持兼容
- `LanguageControl.jsx`：原生可聚焦select，English/简体中文自称；控件放在外观控制之前，保留外观按钮最右规则
- `messages/{common,public,workspace,forms,sharing}.js`：各自导出 `en` / `zhCN`，使用稳定前缀与语义键，不把英文句子、序号或内容哈希作为键
- `appCatalogs.js` / `publicCatalogs.js`：按入口隔离词典。法律专用入口不启用locale store，仍是独立英文静态站
- `errors.js`：只按已知机器错误码本地化；未知错误使用任务上下文回退，不把服务端自由文本当翻译键

`html.lang`随显示语言更新。CJK使用系统中文字体回退、适当行高和换行；不新增网络字体、第三方脚本或依赖。

## 偏好与导航合同

1. 优先级：有效的显式`lang`链接选择 → 本站已保存选择 → 浏览器语言 → English
2. 自动浏览器判断不写存储，也不伪装成显式偏好传给另一站
3. 仅已有两个App origin允许附带`lang=en`或`lang=zh-CN`；不把它加到Auth0、法律站或任意外部地址
4. App消费有效`lang`时，只去掉该参数，保留其他查询参数、邀请fragment和history state。未知值不执行导航或产生权限
5. 官网旧`/guides`的edge302只额外透传上述两个显式枚举；未带语言的旧书签仍遵循目标站已有偏好/浏览器语言。不会从edge读取localStorage
6. 修改语言不自动提交表单、丢弃草稿、保存共享、接受同意或重试敏感操作。消息/确认框保存语义描述符，渲染时再取当前语言

## 增加或修改文案

```js
// messages/forms.js：两种语言同时添加，插值参数名称保持一致。
export const en = { "forms.example.count": { one: "{count} item", other: "{count} items" } };
export const zhCN = { "forms.example.count": { other: "{count} 项" } };
// 组件内：const { t } = useI18n();
// t("forms.example.count", { count: actualCount })
```

不要把用户输入传给 `t` 作为键；只能作为命名参数/普通React文本。API枚举、路径、授权条件、DOM id、存储键与文件格式保持稳定。日期用 `formatDate`；金额用 `formatMoney(amountMinor, currencyCode, minorUnitExponent)`，保留实际币种，不换汇。React负责转义，不使用HTML翻译字符串或`dangerouslySetInnerHTML`。

新增语言时扩展受支持枚举、catalog合并、语言控件、浏览器解析及链接白名单测试，补齐所有键/占位符/复数。另行审阅第三方/正式法律文本范围，不能把内部法律参考稿直接公开。

## 初版验证与交付边界（HISTORICAL）

详见[本轮QA](qa/chinese-web-20261005/README.md)、[源码审阅](qa/chinese-web-20261005/source-review.json)、[完整阅读范围](qa/chinese-web-20261005/reading-coverage.json)及[远端回读](qa/chinese-web-20261005/remote-verification.json)。

当前可执行的Node/SSR、catalog检查和实际构建已经覆盖语言与原有Web回归；没有仓库独立lint/typecheck脚本，不把JS构建称为TypeScript全库通过。API/基础设施的完整远端结果以此分支的GitHub CI为准，不借用旧CI48。

真实浏览器被运行环境阻止：Chromium在导航前socket EPERM；官方云预览被ERR_BLOCKED_BY_CLIENT拦截。没有截图或真实320/390px、键盘、焦点/遮挡/草稿交互通过的证据。保留[受阻记录与可复现脚本](qa/chinese-web-20261005/BROWSER-QA.md)；不能把SSR当视觉验收，也不能把当前生产英文站当作此分支已部署。

下一步：在具备浏览器能力的环境完成窄屏、键盘、草稿/确认框切换、真实文件读取与返回历史验收，再单独决定合并/部署。原来的可丢弃身份真实核心验收仍保留在[历史交接](handoff-history-20261005-before-chinese-web.md)，没有被本轮本地化关闭或重做。
