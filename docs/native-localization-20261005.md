# 原生 iOS 中英双语界面与维护合同

Status: CONSOLIDATED; XCODE BUILDS / UNIT / BILINGUAL UI SMOKE PASS; WIDER MATRIX PENDING; NOT DEPLOYED
Last updated: 2026-10-05 (Asia/Hong_Kong)

## October5 后续验收（进行中）

独立小屏模拟器已通过中英文外壳、中文已登录横屏三主页面；大字号流程实际生成明文指引，系统审计发现多行Label裁切提示，正在修复复测。英文导出入口已明确用途；XcodeGen规格补齐已有的OS-only加密声明元数据以防生成时丢失。原有真实模拟器、Keychain和账号保持。更宽矩阵与新商店候选仍未完成，见[当前结果](release-12-stripe-20261005.md)。

## October5 中文文案复核

Owner要求仔细斟酌中文。已按[中文文案口径](chinese-copy-guidelines-20261005.md)逐条审阅两端资源，统一语气/术语，区分导出与入门、姓名与事项名称，并明确共享、备份、恢复密钥和法律权限边界。Web371条及原生225个中文单元已修订；原生另新增姓名上下文键，英文显示不变。实际编译/界面证据与初版静态检查分开记录，仍未部署。

## October5 Mac follow-up

The consolidated branch has actual Debug/Release builds,215unit passes/1existing skip
and two English/Chinese native UI passes. All21added catalog/formatting cases ran.
Prepared test products need an explicit English xctestrun/test-host language for legacy
English assertions; both initial mismatch and corrected results are retained. No tests
were weakened or system language preference changed. XcodeGen regeneration and the
wider iPad/AX5/orientation/VoiceOver/authenticated matrix remain. Store4is unchanged.
[Current evidence and exact limits](qa/dot-followup-20261005/README.md).
The original Linux-only report below remains the dated source delivery checkpoint.

## 初版源码范围（Dot交付检查点）

Owner明确补充「中文那个页面做完了吗，不只是做web哦，ios也要做」。中文界面覆盖真实 `apps/ios` SwiftUI 应用；不是 WebView 或 `apps/ios-prototype` 演示。独立分支 `codex/chinese-ios-20261005` 从已核实的 `2cc95f77c1279bdad43547b7e58a8faca9da7a93` 开始，不覆盖 Web 中文分支，不合并、部署或上传商店构建。

- `Rillora/Resources/Localizable.xcstrings` 是唯一文案源：1,058 个 English / 简体中文条目，8 个原生复数条目
- 使用系统 SwiftUI / Foundation 本地化；动态标签在应用自有文字的声明处使用 `String(localized:)`，用户姓名、保存的标题、正文、服务器自由文本和文件内容不作为翻译键
- `L10n.format` 只接收应用自有格式键；编号占位符允许中文调换参数顺序，Foundation 按当前地区格式化数字，现有日期继续使用系统格式化 API
- `project.yml` 与已提交的 `Rillora.xcodeproj` 同步资源和源文件；正式 App / Component Preview 都包含词典，四个新增 XCTest 文件仅属于测试目标
- 没有新增运行依赖、权限、数据迁移或重做页面布局；中文字体沿用 iOS 系统回退与 Dynamic Type

## 语言选择

默认使用 iOS 选择的受支持语言。Profile 右上角的语言按钮进入应用自己的说明页，再由用户打开系统 Rillora 设置选择 English / 简体中文。外观按钮仍在最右侧。

这是 Apple 的原生逐应用语言偏好，持久化由 iOS 管理；没有修改 AppleLanguages、替换 Bundle、调用退出或用 `.id(locale)` 重建整个界面。说明页提醒先保存草稿，因为系统切换语言可能重新启动应用。`UIPrefersShowingLanguageSettings` 让受支持的较新 iOS 始终显示语言项；iOS 17 如未显示，可先在系统语言与地区加入第二种语言。取消或返回说明页不会修改表单、调用 API 或切换共享范围。

Apple 依据：[逐应用语言与系统入口](https://developer.apple.com/videos/play/wwdc2024/10185/)、[String Catalog](https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog)、[Foundation 本地化复数](https://developer.apple.com/documentation/xcode/localizing-strings-that-contain-plurals)、[地区偏好](https://developer.apple.com/documentation/foundation/nslocale/autoupdatingcurrent)。

## 覆盖

- 原生三标签、公开首页和互动示例、首次引导、空态、加载/失败/重试、事项搜索与分类、编辑/验证/草稿保护
- 可信联系人、邀请/接受、逐项共享和撤销、接收人只读视图、共同复核、更正/历史、角色和非操作性演练控件
- Start Here 预览、明文/加密导出控件、文件保存/读取/恢复、地图导入、归档恢复、删除状态、重新认证提醒
- 个人中心、外观、语言、安全/关于页面、套餐/权益和购买恢复/失败状态、VoiceOver 标签与动态数值
- API 已知机器错误码的中文解释；未知服务器文字在中文下使用安全、可读的任务错误，不把外部消息当作翻译键。英文继续保留原有服务器说明

共享术语：Matter＝事项，Asset Map＝事项地图，Name＝名称，Directions＝查找指引，Details＝详细资料，Trusted Contact＝可信联系人，Recipient＝接收人。这里的共享与披露不表示外部账号访问、法定权限或所有权转移。

## 保留边界

- Auth0 托管登录、事务邮件及外部页面保持其服务自身的语言配置；此分支不修改 provider
- 官方指南正文与复核日期未重译/重审，界面显示英文正文边界；官方外链使用站点自己的语言
- 正式法律正文、同意版本/digest、订阅同意英文句保持不变，并明确其英文原文地位
- 服务器生成的指南、内部演练诊断和恢复文件警告可仍为英文，任务页明确提示；已有备份、密钥和导出格式不翻译
- `DELETE` 确认标记、API / Codable / 存储枚举、路径、ID、权限判定、加密实现、用户原文均保留
- StoreKit 价格使用实际商品提供的本地价格；语言不改变币种、商店地区、服务地区、Web88.99价格或 Free1/Family5 权益
- 此实现没有繁体中文资源，不宣称繁体中文、商店元数据或系统权限文案已完成；现有 Info.plist 没有应用自编的使用权限说明待译

## 维护方式

静态 SwiftUI 文案可以直接写可提取的字面量；需要 String 的组件/模型使用 `String(localized: "Readable English source")`。有参数时使用 `L10n.format("Shared with %1$@", personName)` 等受检模板，并同时更新词典。变量只作为参数，不作为键。原生 String Catalog 使用可读英文来源键，避免重复维护另一层自动生成编号字典。

修改词典时同时维护 `en` 与 `zh-Hans`，不只补中文。按需要添加 English `one` / `other` 和中文对应形式，保持参数类型与编号一致。新增 `%lld` 使用 Int / Int64，`%@` 使用 String。正式同意文案和文件协议不进入自动翻译。

本地快速校验：`python3 -m unittest discover -s tools/release -p 'test_native_localization.py' -v`。它也由原有源码 CI 的 `test_*.py` 自动运行。新增资源/测试文件应通过 `xcodegen generate` 重新生成后检查目标归属；本轮 Linux 无 XcodeGen，已直接同步并解析核对提交工程的组、路径和 build phase，不宣称已运行 XcodeGen。

## 初版验证与当时下一步（HISTORICAL）

[QA 与未执行矩阵](qa/chinese-ios-20261005/README.md)区分静态测试、语法辅助检查、Xcode 编译、原生 UI 和远端 CI。静态覆盖不能替代 SDK 类型检查或真实排版；旧英文构建4不能证明此次中文代码可运行。

下一步是在 Mac 可用后，先编译 Debug/Release、以 English 运行既有原生套件（原断言含英文），再运行新增双语资源测试与中英原生 UI smoke 测试，再用简体中文/English分别验证 iPhone/iPad、常规/最大辅助字号、横竖屏、未登录/已登录、表单退出与重新认证、文件读写和共享撤销。保持已有账号、Keychain与真实数据，不为了语言验证重新注册、购买、清空设备或上传商店。合并、部署和发布另行决定。
