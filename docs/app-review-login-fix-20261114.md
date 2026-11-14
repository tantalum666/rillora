# 18 再次拒审：登录会话故障与修复

Status: BACKEND FIX DEPLOYED / FRESH PRODUCTION WEB AND NATIVE LOGIN VERIFIED / NOT RESUBMITTED
Last updated: 2026-11-14 (Asia/Shanghai)

Owner指出18再次被拒，要求直接阅读Connect并认真检查。当前实际拒审为November12对1.0(18)的2.1(a)：iPad Air11(M3)、iPadOS27.2.1无法登录。年付和群组回到可供审核；没有新的2.2理由。截图显示身份服务不能建立Rillora会话，不能当作密码错误或资格到期处理。

## 已确认根因与此前漏验

November6长期会话实现为新登录和定期身份复查加入Auth0用户状态查询，但构造了`fields=user_id,blocked,last_password_reset&include_fields=true`。当前真实Get User接口明确返回400／invalid_query_string：`last_password_reset`虽然能出现在响应中，却不在允许的字段筛选列表里。

`SessionSecurity`把服务方查询失败转换为503；原生收到非2xx后显示审核截图中的提示。这个缺陷影响开启该保护后的新会话，以及需要定期复查的长期会话，并不局限于审核账号。审核用户仍存在、未封禁；当前API审核期限仍为December4。没有把该故障归因于Apple、Owner输入密码或账号到期。

原测试直接返回准备好的用户对象，还断言这个错误的查询字符串，因而没有验证真实服务方参数合同。此前提交前只核对了用户存在、未封禁、健康200和旧的登录／购买证据，没有在最终认证后端变更后重新走一次全新登录。那套证据不足，责任在实现及验收方法，不能继续称为登录闭环通过。

AWS有限时间段日志在2026-11-12T18:48:05Z记录了一次POST503／525ms，与截图10:48及审核回复的时间相符。这是时间相关性，不是对某个身份的唯一归因：API刻意不记录请求路径、身份和凭据。按用户检索的Auth0历史日志没有取回相关事件，不能把空结果当作没有登录尝试。

## 修复与安全边界

只调整`Auth0EmailIdentityVerifier`的安全资料投影，使用服务方支持的排除模式，排除邮箱、电话、姓名、IP、关联身份及用户／应用元数据，保留用户ID、封禁状态和密码重置证明。普通邮箱验证继续原来的精确三字段读取。

真实审核账号的旧请求400、新请求200均已捕获；另只读对照一个已有密码重置记录的账号，验证新投影保留相同重置证明和身份／封禁结果，没有重置任何密码或改用户。账户封禁／删除、密码变更撤销、近期认证、30天／7天、CSRF、网络确认、32KB响应上限及只读服务权限都保留。没有临时跳过校验来放行审核员。

新增回归模拟实际观察到的服务方字段限制及投影行为：旧实现先失败，修复后通过，并验证不会带回40KB无关用户元数据。20项相关身份／会话上下文测试、类型检查和编译通过；这些不是完整真实登录结果。

## 已完成部署

仅将`email-verification.js`叠加到已运行的266b79fb镜像，形成`aa5160ad985b765b33629d14ae9e620c8f5533ad63803079ec6aae33647546a3`。先Preview后正式滚动发布，两环境最终各1个HEALTHY实例、0待定任务、确切镜像一致；readiness200和未认证私有请求401。配置、身份权限、价格、数据、迁移、后台worker与来源证明不变；没有分发新的原生版本或TestFlight。

正式最终读回为November14北京时间04:02。旧部署的账号存在／健康检查也曾成功，所以这次同样不把这些运行结果写成实际用户登录已经通过。

## 全新登录验收已完成 — November14 11:21

Owner随后明确同意原合成审核账号本次Web／原生条款提交。受保护助手的非秘密探针返回ready，原密码受保护读取成功；没有重置密码、落地明文文件、改变系统访问保护或要求Owner再次同意。临时系统剪贴板按此前明确授权用于原生密码输入，使用后清空；内存中的凭据在验收后释放。

实际结果见[全新登录回执](../collaboration/verification/review-login-20261114/fresh-login-acceptance.json)：

- 正式Web：从未登录的账号页提交本次条款，经过真实托管邮箱／密码认证并跳过可选通行密钥，返回原Rillora App Review账号；读取原1条事项及详情、当前账号和套餐页，刷新后仍保留原账号和原事项。
- 原生：沿用独立M3 iPad模拟器中已准备的冻结18 Release产物，全部14项Rillora配置与原商店归档一致。真实托管认证、当前条款及回调完成后，正式API建立会话，读到同一账号和原事项详情。停止App进程再重新启动，仍直接进入原事项地图，个人中心重新读回相同账号标识。
- Web套餐页正确禁止该专用审核身份新建Web订阅；原生页面读到目录价格但没有可购买报价，订阅按钮禁用。本轮没有为该模拟器配置独立Apple购买身份，也没有购买或恢复。该页面状态仅作为读取观察，不宣称本次购买可用；原真机购买／恢复／签名到期证据继续按原日期沿用。

输入工具最初出现输入法／剪贴板传递错误，另一次系统登录窗口报告网络连接丢失。停止盲目重复后，改用已授权的系统剪贴板和Device Hub键盘捕获，在新的正常认证事务中完成登录；没有绕过TLS、账号校验或注入会话。错误尝试与后续成功分别保留，不把工具问题当作已证明的产品新故障。

这是连接正式Auth0和正式API的真实新登录，原生运行环境明确为iPadOS27.0模拟器，不是Apple所用27.2.1物理iPad，也不是App Store签名二进制的真机运行。本轮没有重新测试购买或自然经过30天；不宣称Apple必然通过。原手机资料和账号未操作。独立模拟器已关闭并保留安装，Device Hub窗口／键盘捕获／原设备视图和工具默认值已恢复。

**唯一下一步：**用现有18和本轮实际根因／验收材料准备下一次Apple复核；本轮仅保存[回复草稿](../collaboration/verification/review-login-20261114/apple-response-draft.md)，未发消息、重新提审或分发TestFlight。手动发布保持。

今后任何身份／会话相关部署都使此前完整登录证据对受影响路径失效；重新提审必须有最终后端与确切候选对应的全新登录结果。账号未封禁、管理CLI查询、健康200、模拟接口单测及旧会话均不能替代它。本轮已补齐这条登录门，不将它扩大为所有产品功能或未来可用性的保证。

## 官方材料与保存

本次回复6个链接均已打开：完整阅读[Release测试](https://developer.apple.com/documentation/xcode/testing-a-release-build)的官方Markdown和[兼容设备检查](https://developer.apple.com/help/app-review/before-submitting-for-review/test-compatible-devices)，读取[网络概览](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/Introduction/Introduction.html)的相关主文；支持入口和调查页在Web抓取失败后用Chrome打开，未发送消息或调查。没有通过减少iPad支持来掩盖登录问题。[Get User参数说明](https://tus.auth0.com/docs/api/management/v2/users/get-users-by-id)与本租户实际400／200分别保留，实际接口证据优先于假定字段可投影。

QA：`output/qa/rillora-review-login-20261114/`。原始账号、授权、云配置和日志仅在private；[安全回执](../collaboration/verification/review-login-20261114/README.md)保存根因、失败／通过、发布形状和未完成项。已有本机维护任务后来被Owner删除的历史不被用作本轮可用性证明，不重建自动化。没有云CI、子代理、真实购买、数据迁移、改价或FanPass操作。
