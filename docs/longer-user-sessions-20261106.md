# Rillora 用户登录保持与网络确认

Status: DEPLOYED / NOVEMBER14 PROFILE CONTRACT FIX / FRESH LOGIN ACCEPTANCE OPEN
Last updated: 2026-11-14 (Asia/Shanghai)

Owner明确延长的是Rillora App／Web用户登录，要求同时设置网络／IP变化等安全条件。AWS、Auth0、Stripe管理登录不在范围。此前18购买修复和同单恢复已完成，价格、数据、收费设置及审核资格保留；不重做购买、不发TestFlight、不重新提审。

November14纠正：[实际拒审诊断](app-review-login-fix-20261114.md)证明原资料字段投影不被Auth0接受，之前合成测试与健康检查不能证明新的真实登录可用。该请求现已修复并部署两环境，原会话合同保持；完整全新登录仍待实际验收。下方November6测试和部署保留其当时的证据范围。

## 会话合同

- 已验证的普通新会话最长30天、连续7天未使用后失效；服务端同时执行两项限制。没有无限期会话、自动复活已撤销凭据或悄悄延长绝对期限。
- 旧会话与不能核验客户端／边缘来源的新会话继续8小时绝对／30分钟闲置。30天策略只在新登录具备近期可信身份、当前同意和可信网络上下文时发放；不批量延长旧token。
- 网络上下文采用可信边缘提供的国家／地区和网络运营商ASN组合，不绑定每一个IP。客户端按浏览器家族及系统分类，忽略版本更新；原生Rillora请求使用其既有系统User-Agent。该分类是风险信号，不是设备证明或抵御已完全控制设备的承诺。
- 每个会话最多记住五个经过同账号近期身份确认的网络。陌生网络返回身份确认挑战，保留会话与草稿；客户端家族变化需重新登录。退出当前／全部会话仍可进行。原有CSRF、账号绑定、哈希凭据、TLS、Keychain和敏感操作10分钟近期认证保持。
- 新会话及随后每四小时按精确Auth0用户ID读取账户状态。封禁／删除会撤销相关会话；Auth0可见的密码重置会撤销早于重置时间的会话，不伤及同时发生的重置后新登录。服务方不可用时503拒绝访问并保留会话供重试，不冒充验证成功。这个检查窗口不是零延迟保证，也不声称能即时获知Google／Apple上游账号改密；用户仍可在Rillora退出全部设备。

## 来源与存储

CloudFront在viewer函数之后添加真实网络元数据和本环境独立随机来源证明；viewer函数删除来访者伪造的同名头。来源证明仅在CloudFront的NoEcho参数中配置，API只持有SHA256验证值。直连API或其他分发域名不能凭自行填写国家／ASN取得可信上下文。

会话保存以本次随机token为键、用途分离的HMAC；不新增原始IP、国家、ASN或完整User-Agent存储。每会话值不同，不建立跨设备广告画像。日志不记录请求头、证明、token或用户内容。沿用原Auth0只读服务和CloudFront，无新付费Auth0功能、凭据存储服务或新常驻计算。

依据：[AWS来源自定义头](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html)、[CloudFront网络元数据](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html)、[边缘函数限制](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html)、[OWASP会话管理](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。IP与User-Agent只能作为辅助风险信号，不能代替凭据与近期身份验证。

## 客户端与说明

原生18已支持同账号近期认证和ThisDeviceOnly Keychain，不为本次服务端策略单独分发版本。Web身份确认组件移到所有入口共用的外层，因此首次加载在陌生网络被拦截时仍能完成确认；完成后仅重新读取地图，绝不自动重放付款、导出或修改。

浏览器存储声明单独更新为cookies-2026-11-06-1。当前条款、隐私政策和购买同意不变；原c983dc26源包与历史接受记录保持不可改写。新的信息性存储声明独立于该接受包发布，所有当前Cookie路由使用新组件，不能把旧包摘要标为新声明摘要。两语言保留同样的七节内容、必要用途和拒绝广告追踪的事实；不加重复顶部提示。

## 验证与发布顺序

本机真实PG隔离库覆盖长短会话、过夜保持、陌生网络、错误账号、撤销／绝对到期／闲置到期、Auth0异常／密码重置／并发检查和Cookie／Bearer／CSRF边界。首次执行发现SQL参数类型和列级权限遗漏，修正后通过；保留失败日志，不把初版写成通过。

51项API／原有近期认证／法律合同检查通过；最后增量35项通过。基础设施38项及后续聚焦检查、Web合同34项通过。实际独立Chrome中英9项通过，包含首次私有读取被挑战、确认后返回、法律页返回和移动布局。最初Playwright自带浏览器缺失，改用已安装Chrome，无下载或云CI；合成浏览器结果不冒充真实Auth0或30天自然经过。

先更新Preview维护镜像并运行110，再发布上下文感知API及可信边缘，初始不发放长期会话；核对新API全部接管后启用。正式环境执行相同顺序。110仅增加会话字段／形状约束和限定列权限，旧迁移不修改。恢复到不理解新会话的旧API之前，必须先撤销context_version=1会话；仅关闭发放开关仍保留已发放会话的安全检查。

当前QA：`output/qa/rillora-long-sessions-20261105/`；维护任务能力仅保存在`.local-secrets/user-sessions-20261106/`。两环境110迁移、权限探针、API与边缘部署、发放开关启用均已独立回读。API各1个HEALTHY实例、无待定任务，readiness200、未登录私有请求401；正式最终回读为November6香港02:40。原生18无需重建或分发，下一次正常登录才获取新策略；没有新的真实用户登录或自然经过30天的观察。

Web先发布变化资源再切换HTML，两套完整清单对齐；未变化的106／104文件沿用相同摘要，不重新上传语音模型。法律站部署0514114a已生效，18资源和中英390px／1440px实际浏览器通过。无新常驻服务或付费身份套餐。

[安全回执和新增归档](../collaboration/verification/user-sessions-20261106/README.md)保存失败／通过及线上结果。Owner随后要求再次复核App Store拒审；本轮会话部署不代表Apple批准或商店14已替换。
