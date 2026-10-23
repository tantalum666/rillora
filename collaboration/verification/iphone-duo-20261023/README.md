# 下一版本 Duo 布局准备 — October23

Status: SOURCE PREPARED / PARTIAL ACCEPTANCE / NO UPGRADE OR DISTRIBUTION
Updated: 2026-10-23 (Asia/Hong_Kong)

本回执区分源码、当前SDK代理检查和真正Duo验证。[当前合同](../../../docs/iphone-duo-adaptation-20261023.md)与[handoff](../../../docs/handoff.md)控制后续；Owner最新决定是晚点升级，未下载／安装macOS或Xcode，没有新的云端Mac任务。

## 已完成

下一版编译条件隔离总览自适应双列／单列、完整Logo的窄容器约束和公开主图fit。系统TabView／NavigationStack及状态身份保持；不用设备型号或已知屏幕尺寸推断窗口。当前审核的5份工程／权限／依赖配置指纹一致，现有报价、数据、收费、线上和FanPass保持，没有TestFlight、归档上传或手机安装。

3项新布局用例的最后相关结果通过：容器／安全区／辅助字号变化与子状态身份，窄Logo尺寸，通用宽／窄／短窗口的实际SwiftUI总览渲染。8项原生隔离与双语资源检查通过。初始Logo测试把透明留白容器的比例当作图形比例，其失败和修正保留；这不是产品图形变形被修复的证明。

## 必须保留的未通过项

两项新增中英文旋转UI均未完整通过。尺寸已旋转、输入标题仍在；之后滑动不到保存按钮，截图有大块黑色偏移。可见表单区域手势、收起键盘、第二台已有iOS26.5模拟器、恢复原ContentForm对照都未关闭问题；根因未知。额外键盘策略已撤回，没有继续扩大产品变更。失败用例保留，未删断言或跳过；返回竖屏／放弃修改的后续检查尚未执行。

旧SDK通用窗口检查不证明Duo原生折叠姿态、纵向栏、弹窗、安全区和输入已通过。现有环境Xcode26.6／iOS26.5 SDK不支持这项结论；以后升级再补真正Duo验收。先前内容模块14项／原生15项保留其独立旧回执，没有被本轮新失败替换，也没有重复重跑。

## 保存范围

- [实际验收／失败与限制](receipts/acceptance.json)
- [当前环境与审核隔离指纹](receipts/environment-and-isolation.json)
- [阅读延续及补读](receipts/reading.json)
- [文档收尾](receipts/closeout.json)
- `images/`保存通用窗口、完整Logo和未通过横屏的合成截图；不是Duo店面宣传图。

新增archive51只保存本轮QA原始日志、完整成功／失败结果包、截图／视频、读取与本地辅助文件。旧archives1–50不重封／重下；DerivedData、依赖缓存、个人凭据不进入归档。停止本机合成API，合成数据库保留；不称已删除。

继续同一[next-version PR9](https://github.com/tantalum666/rillora/pull/9)。提交、独立远端保存核验和GitHub CI按实际回执记录；CI不包含这两项本机旋转UI，绿色CI不能代替Duo验收。

本轮archive51已完成本地认证解密：842路径／435对象／204,567,245密文字节。独立远端验证在push后记录；此后收尾／Git回执为普通可读元数据，不递归重封原件。
