# HISTORICAL — 三项能力完整性复核前的交接

当前任务只看[handoff](handoff.md)。

# Rillora 当前交接

Status: NEXT IOS DUO SOURCE PREPARED / PARTIAL ACCEPTANCE / UPGRADE DEFERRED
Last updated: 2026-10-23 (Asia/Hong_Kong)

## 当前任务

Owner要求下一版适配iPhone Duo，随后明确“稍等，我还是晚点升级吧”，取代刚才允许立即升级的安排。本轮只继续现有工具可做的布局准备；[当前合同](iphone-duo-adaptation-20261023.md)控制后续。[先前原生交接](handoff-history-20261023-before-duo.md)作为HISTORICAL保留；办理包、文件、原声和HealthKit先前完成项不重做。

## 已完成

独立RilloraNext新增Duo编译条件，按容器实际可用宽度排列总览地图与亲友区，辅助字号单列，AnyLayout保持子视图身份；完整Logo尊重窄空间，公开主图fit保留整图。系统标签栏／导航栈沿用。没有设备型号／已知屏幕尺寸分支。

构建及3项布局用例的最后相关结果、8项隔离／语言检查通过；5份原审核工程／权限／依赖配置指纹相同。成功与失败均有原始结果，不将最后命令说成全套重跑。当前macOS26.5.2／Xcode26.6／iOS26.5 SDK保持，没有下载、安装、重启或工具切换；当前审核、TestFlight、线上、数据、报价、收费及FanPass保持。

## 证据边界与阻塞

两项新增中英文旋转UI未完整通过：旋转尺寸和草稿标题保持通过，之后无法用自动滑动到达保存，截图有黑色偏移。换手势、收键盘、另一台已有模拟器、恢复原表单对照仍失败；根因未知。没有跳过断言，后续返回／放弃检查未执行。额外键盘行为改动已撤回。不能称全部修复或Duo原生验收完成。

真正Duo模拟器和iOS27.1新系统栏／姿态验证需要以后升级。原内容模块与真实设备媒体／HealthKit边界沿用[原生合同](ios-content-development-20261023.md)，不由此次布局结果替代。合成API已停止，合成数据库保留。

工作位于codex/ios-content-healthkit-20261023与[next-version PR9](https://github.com/tantalum666/rillora/pull/9)，本轮源码、失败证据、archive51和远端实际状态见[Git回执](../collaboration/verification/iphone-duo-20261023/README.md)。源码8b352f454已推送，Verify source三任务及publication guard通过；archive51独立远端下载／认证的435对象与842路径一致。后续只补回执元数据，最终CI读取PR实际记录。GitHub CI不运行上述原生旋转用例，须与本机失败分别报告。

## 唯一下一步

等Owner以后恢复开发环境升级安排，再以支持的Xcode／iOS27.1或更新SDK和实际Duo模拟器，先关闭当前横屏交互未通过项，再补折叠／展开、系统纵向栏、弹窗及编辑状态保持；通过后才准备下一版Duo分发声明。当前不请求重复授权、不自行升级、不发TestFlight或变更在审版本。
