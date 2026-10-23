# 下一版本 iPhone Duo 布局适配

Status: SOURCE PREPARED / 3 LAYOUT CHECKS PASS / 2 ROTATION UI CHECKS OPEN / DUO NATIVE VALIDATION DEFERRED
Last updated: 2026-10-23 (Asia/Hong_Kong)

Owner要求适配iPhone Duo，放在下一版本。随后曾允许升级开发环境，又明确“稍等，我还是晚点升级吧”；后一句取代升级授权。本轮继续现有工具可完成的源码和尺寸变化检查，不下载／安装macOS或Xcode、不切换开发工具、不启用收费云端Mac。升级检查仅列出可用版本，没有开始安装。

## 官方依据与工具边界

[Apple准备指南](https://developer.apple.com/iphone-duo/prepare/)区分三种构建：iOS26及以前SDK使用兼容窗口；iOS27支持动态缩放但保留侧边状态区；iOS27.1及以后支持完整显示区域及纵向工具／标签栏。真正的Duo原生体验应使用Xcode27.1的Duo模拟器检查。布局依赖可用空间和安全区，不用设备型号、屏幕像素或方向判断窗口形状。

本机仍为macOS26.5.2／Xcode26.6，已有iOS26.4／26.5模拟器，没有Duo类型。Apple技能导出命令返回“No skills available to export”，没有运行不存在的Apple扫描技能。现有SwiftUI模式与模拟器工具用于本轮工作；通用窗口、旋转、截图不是Duo折叠姿态或新系统纵向栏的通过证明。[Xcode系统要求](https://developer.apple.com/xcode/system-requirements)需在以后真正升级前重新核对。

## 源码范围

- 仅`project.next.yml`开启`RILLORA_DUO_NEXT_VERSION`，沿用[组合原生工程](ios-content-development-20261023.md)与原依赖pins。当前主工程配置、Info.plist、entitlements、Xcode项目以及在审构建／商店资料保持。
- 保留系统TabView和NavigationStack。总览的地图／亲友区按容器实际剩余宽度排列；两列各有至少320点阅读空间，不满足时恢复单列。320是内容的最小列宽，不是Duo尺寸。辅助字号优先单列；AnyLayout保持子视图身份，避免随宽度重建状态。
- 完整原Logo尊重较窄工具栏的尺寸提议，不切换旧图标或裁掉字标。公开页主图在下一版使用fit保留整张图的比例。
- 字段、弹窗、选中事项和会话不以宽度／方向作为身份。内容表单的额外键盘滚动策略在对照后撤回，最终保持本轮前的原实现；不能据此称短窗口保存已验收。HealthKit本机记录的后台清除规则保持，不能为了跨形态留存放松隐私保护。

当前活动源码没有发现`UIScreen.main`或按phone／pad选择布局的逻辑。已有`RILLORA_UI_TEST_LANDSCAPE`只在DEBUG里请求测试几何，不是生产方向锁定。本轮不扩展分栏路由、改领域模型、API、身份、收费、真实资料或FanPass。

## 验证与后续门

通用尺寸的3个用例均有最后相关通过结果，覆盖窄窗口、宽窗口、短窗口、不对称安全区、辅助字号、子视图状态连续性、完整品牌容器和公开／登录后总览渲染；不是最后一个命令重跑3项。8项隔离／语言检查通过，5份当前审核配置及依赖pins逐字保持。初始品牌比例断言误把透明容器当作图形范围，修正为实际容器上限与整图检查；旧失败仍保留。

新增中英文旋转UI两项仍失败：横屏尺寸和已输入标题保持的断言通过，但工具滑动无法到达底部保存；截图出现黑色偏移区域。尝试了可见表单手势、Return收起键盘、另一台已有iOS26.5模拟器，并恢复原ContentForm对照，问题仍在。根因未确定，不能归责Apple、宣称页面已修好或把失败跳过。返回竖屏／放弃修改的后续断言未执行，保持未验证。失败用例保留在下一版测试中，原始日志／结果包和截图一并保存。

最终执行结果见[验证回执](../collaboration/verification/iphone-duo-20261023/README.md)。已经通过的内容／支付／上线验收不重跑。本轮不发TestFlight、不安装到Owner手机、不变更审核，也不自动升级系统。

唯一后续门：Owner以后恢复升级安排后，用支持的Xcode／iOS27.1或更新SDK和实际Duo模拟器，补折叠／展开／姿态变化、纵向系统栏、键盘／文件弹窗、导航与草稿保持，再决定下一版是否可宣称Duo已适配。
