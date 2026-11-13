# 18 再次拒审：登录会话故障与修复

Status: BACKEND FIX DEPLOYED / REAL PROVIDER CONTRACT VERIFIED / FRESH LOGIN ACCEPTANCE STILL OPEN
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

## 尚未完成的真实流程

已创建独立全新M3 iPad模拟器，使用冻结18源与Release配置。最初发现本机编译缺少归档命令中的版本号／客户入口覆盖值，在安装前按原归档补齐；安装后的版本为1.0(18)，全部Rillora配置字段与原商店归档一致，没有混入下一版功能或合成API。真实托管登录页已打开；在等待Owner步骤期间已停止这个新模拟器，保留安装产物以便续接，并恢复原设备窗口。

该环境是iPadOS27.0，不能冒称27.2.1真机。原iPhone16ProMax当前连接不可用，未卸载或清除其资料。隔离正式Web停在未勾选条款页；受保护审核密码读取需要macOS本人验证，等待超时后已停止孤立助手，没有取得或输出明文密码。两个本人步骤的异步请求已发出；没有把未回答视为同意。

**唯一下一步：**Owner方便时完成受保护读取和本次同一合成账号的条款确认，再走完Web与原生全新登录、返回原账号／事项、私有读取、会话保存和再次进入，绑定这次真实结果到当前API镜像和18候选。现有购买／恢复不重做。该步骤未闭合前不再次提审，不称“彻底验收通过”。

今后任何身份／会话相关部署都使此前完整登录证据对受影响路径失效；重新提审必须有最终后端与确切候选对应的全新登录结果。账号未封禁、管理CLI查询、健康200、模拟接口单测及旧会话均不能替代它。

## 官方材料与保存

本次回复6个链接均已打开：完整阅读[Release测试](https://developer.apple.com/documentation/xcode/testing-a-release-build)的官方Markdown和[兼容设备检查](https://developer.apple.com/help/app-review/before-submitting-for-review/test-compatible-devices)，读取[网络概览](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/NetworkingOverview/Introduction/Introduction.html)的相关主文；支持入口和调查页在Web抓取失败后用Chrome打开，未发送消息或调查。没有通过减少iPad支持来掩盖登录问题。[Get User参数说明](https://tus.auth0.com/docs/api/management/v2/users/get-users-by-id)与本租户实际400／200分别保留，实际接口证据优先于假定字段可投影。

QA：`output/qa/rillora-review-login-20261114/`。原始账号、授权、云配置和日志仅在private；[安全回执](../collaboration/verification/review-login-20261114/README.md)保存根因、失败／通过、发布形状和未完成项。已有本机维护任务后来被Owner删除的历史不被用作本轮可用性证明，不重建自动化。没有云CI、子代理、真实购买、数据迁移、改价或FanPass操作。
