# Rillora Apple 登录恢复与最终复核 — 2026-09-09

Apple 登录连接已经恢复。邮箱与 Continue 保持最上方，通行密钥、Google、Apple 位于下方；已输入文字统一为柔和灰色。精简首屏重复说明，Google 提醒保留在输密码前。原生 Account 中转页继续移除。

![当前真实托管登录页](email-first-apple-390.png)

[320px 小屏](email-first-apple-320.png) · [灰色输入实图](input-gray-390.png) · [密码前 Google 提醒](password-google-guidance-390.png) · [Apple 官方授权页](apple-authorize-390.png)

## 已执行并回读

- Owner 的项目默认授权覆盖此前明确说明的 Apple 轮换方案。Owner 已在官方页面完成管理员 MFA，CLI 会话恢复成功。
- 替换密钥 `YG27HZ92T2` 只启用 Sign in with Apple，关联既有 Rillora primary App。一次性下载移入 Git 忽略的专用目录，目录 0700、文件 0600，Downloads 不留副本。
- 既有 Auth0 Apple 连接更新为替换密钥与 Services ID `com.rillora.auth`。脚本在内存中比较私钥回读，验证原有公开选项及绑定未改变；输出不含私钥。
- 新配置回读成功后，旧登录密钥 `9H3JRBA558` 已在 Apple 撤销。最终密钥清单只显示新密钥。
- 仅恢复既有 Rillora iOS 的 Apple 绑定，其他绑定集合保持一致。StoreKit 使用的独立密钥未涉及。
- 托管主题中已输入文字为 `#DAD8CF`，邮箱优先顺序与源码一致。首屏省略重复说明，Google 提醒保留在密码步骤；分别减少390px布局的24px、320px布局的48px。源码中的单空格是有意值：空字符串会恢复Auth0默认说明，单空格的实际渲染与回读已验证。

证据：[配置执行结果](connection-apply/result.json)、[Apple 密钥清单](apple-keys-after.json)、[绑定结果](binding-result.json)、[最终 Auth0 回读](auth0-final.json)、[输入颜色主题回读](theme-after-input-color.json)。`authorization-and-preflight.json` 保留开始时状态，不能作为完成状态读取。

## 页面与交互复核

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 390px / 320px 布局 | 无横向溢出；邮箱在上，三个替代方法在下；窄屏按钮文字自然换行 | 两张登录截图、`layout-390.json`、`layout-320.json` |
| 触控尺寸 | Continue 44px；三个 provider 按钮均为 52px | 布局读数 |
| 已输入文字 | 实际渲染为柔和灰色；只有合成示例邮箱进入下一步，没有提交密码 | `input-gray-390.png`、`input-colors.json` |
| Google 方法提醒 | 在用户输入密码前显示；Edit 可返回邮箱与方法选择页 | `password-google-guidance-390.png` |
| Apple 路由 | 到达 `appleid.apple.com/auth/authorize` 的 Rillora Account 页面；Services ID 与 callback 精确匹配 | `apple-authorize-route.json`、官方授权截图 |
| 浏览器返回 | Browser Back 回到相同邮箱／方法选择页 | 当前运行 DOM 观察 |
| iOS 新登录事务 | 从 Sign in again 经系统域名提示进入托管页面；取消返回原入口 | 当前 CUA 运行截图与交互观察 |

模拟器先前保留的认证页面已放置两天，刷新后显示通用错误；关闭旧页、重新发起事务后正常加载。系统通行密钥弹窗被取消，没有选择凭据。该取消会在 Auth0 显示 `Please select a passkey`，不代表 Apple 配置故障。

原生浏览器底部工具栏在最后精简前的静止状态下部分覆盖 Apple 行，促使最终再减少首屏高度。最后这项文字修订完成浏览器双尺寸测量，未重跑原生浏览器 chrome 矩阵。本轮没有把隐藏工具栏或浏览器全页截图冒充原生首屏完整可见，也没有把浏览器中的 Apple 路由验证写成已完成 iOS Apple 身份。窗口捕捉出现缩放／动画问题，未据此修改产品字号。

## 与整 App 工作的关系及证据边界

整 App 的事务直达、待复核优先、搜索、持续字段标签、未保存草稿保护、Profile 任务说明、官方入口位置、Start Here 预览／导出和大字号改进保留。详见[整 App 审阅](../rillora-full-app-ux-20260906/README.md)及[直接托管入口](../rillora-single-hosted-entry-20260906/README.md)。这些属于各自先前检查点，未在本次配置修复中重跑整个原生测试矩阵。

当前只证明配置、按钮和 Apple 官方授权页面可达。尚未完成本人 Apple 身份验证、必要协议确认、Apple token/code exchange 与 Rillora 私有地图回调。不创建或合并账户，不改变现有地图／会话期限／法律记录，不产生付费或发布。

下一项身份验证应从实际 iOS 入口完成 Apple 本人认证及托管确认，再核对 Rillora 回调和规划者映射。已有 Google 账户继续使用 Google；账号关联须另有双重身份验证流程，不能仅凭邮箱相同合并。

技术依据：Auth0 区分 provider 配置、浏览器测试与原生身份完成，见[官方 Apple 集成说明](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/apple-native)。
