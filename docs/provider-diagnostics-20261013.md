# Auth0 登录页稳定性与 Apple 发布前 API — 2026-10-13

Status: AUTH0 LIVE SHELL STILL OPEN / CONFIGURATION GUARD FIXED / APPLE PRERELEASE EXPLANATION FOUND / CASE CLOSURE REQUEST RECEIVED
Last updated: 2026-10-13 (Asia/Hong_Kong)

本轮继续同一上线工作流，回答Owner关于当前登录页、后续稳定性和Apple401原因的问题。保留全部既有验证、用户数据、价格、收费开关及TestFlight暂停；不重新进行支付、部署或全库审计。

## Auth0 当前实际问题

本轮从正式Web客户端的公开授权入口只读打开中文页面，未填写凭据、创建账号或完成回调。登录框、恢复／注册入口和Google／Apple按钮已经中文；桌面外层仍显示三句英文：Private continuity、A clear plan for what comes next.、Your account opens the private map you chose to create or continue.，辅助技术区域名称仍为Account access。正文存在“登录Rillora以继续使用Rillora”的重复默认提示，也需要在最后提示语校对中处理。

本地page-template.liquid有双语候选，不能据此声称线上已修复。现有Free租户的模板管理GET已在此前实际返回402；本轮沿用此证据，没有重复请求、试探DELETE或宣称DELETE已经失败。免费基础品牌／主题／提示文本与自定义整页HTML属于不同配置面，不能把402解释为必须付费才能登录，也不能把已有Google／密码登录、恢复成功推导为所有入口永久正常。

[Auth0 Community Engineer的同类答复](https://community.auth0.com/t/cannot-disable-custom-login/203157/3)提供了由官方support群组代开支持工单的渠道。该员工的Auth0_Employees／moderator标记和support成员关系已经在实际页面核对。答复解释旧模板可能继续渲染，但Free不能管理它；没有证明Rillora的具体模板一定源自试用期，也没有保证恢复时限。

当前自己的公开问题仍是1篇pending；官方support群组和员工页面未向本账号显示Message入口，因此尚未发送私信或取得正式处理单号。不能把公开发帖的收件当作后台清除已开始。不重复发帖、注册账号、购买临时套餐或迁移用户。

## 免费方案的维护合同

- 目标是由受支持的方式清除旧自定义外壳，恢复标准New Universal Login；保留既有品牌配色／Logo、中文和英文、连接、客户ID／回调、账号、密码恢复、同意Form／Action和API同意记录。只处理HTML外壳，不进行整租户重置。
- 不再把付费页模板候选列为当前Free租户的部署入口。仅使用当前套餐确实可管理的主题和提示文本；基本品牌可用不代表任意高级模板／部分模板／自定义字段免费。
- 版本化配置是预期值；线上实际回读及中英文、桌面／移动入口才是完成证据。外壳恢复后只补受影响的显示、取消／回调和登录／恢复检查，既有无关支付、部署和数据验收不重跑。没有接受模板源文件或本地预览来替代线上检查。
- 发布配置前须取得该配置面的现值并保存备份；失败就停止。普通主题／文案维护不得调用旧整页模板更新工具，不改签名、认证、连接或同意规则。没有可用备份／可管理接口时，先通过官方支持处理被锁住的配置面。
- 不承诺第三方服务永不故障。既有云端健康探测不能等同完整Auth0登录监测；持续登录成功率／失败类型告警仍需另有实际部署证据，本轮没有冒称已新增这种监控。支持回复本身也不代替修复后的线上验收。

本轮发现并修复旧apply-universal-login.sh的局部应用风险：模板读取失败时原来继续更新主题，再尝试更新模板。现在在任何远程写入前退出；404也停止，以免支持清除后被旧脚本重新装回自定义外壳。7项工具测试通过，其中新增矩阵覆盖已有／缺少主题与模板402／403／404／503的8种组合，全部provider操作由替身拦截，远程写入为0。没有运行该脚本修改真实租户。

## Apple 401 的解释与正确顺序

[Apple App Store Commerce Engineer的官方答复](https://developer.apple.com/forums/thread/806452)明确说明：App有正式发布前，Production API访问不开放，正式发布后才解锁。Rillora尚无正式发布；既有同一JWT的Sandbox200／Production401、后续Production-only401、有效ES256本地验签／issuer／audience／bundle／短TTL及近零时差，与这一限制一致。这个解释比未经证实的密钥损坏或Apple故障更符合现有证据。

边界：官方示例接口是交易查询，本项目探针是通知历史；这是有强依据的原因分类，并非Apple针对本账号返回的专属诊断。员工答复没有精确澄清“审核批准”和“实际公开”之间的解锁时刻；后续普通用户关于时刻及401自动回退Sandbox的评论不是Apple确认。不要实现无条件401回退或放宽签名环境。

以前把Production401成功排在送审前，会形成发布顺序循环，现纠正为：

1. 完成既定审核账号实际登录和剩余原生验收后，App14／年订阅／群组使用独立、到期的Sandbox审核通道送审；不等待Production200作为提审条件。
2. 获批后处理Apple要求的简化购买关闭；现有14已有PurchaseIntent，不重复实现或分发TestFlight。保留手动发布。
3. 手动发布后，先验证Production授权、通知和对账；验证前USA/HKG两条Apple普通新购继续独立关闭。通过后才按既有准入与价格开放Apple新购。

这不证明已获批、已发布、已实际Production收款，也不免除专用审核账号／原生剩余验收。Web的既有旧身份令牌窗口仍是另一项条件。

## 原工单结束跟进

Owner询问找到解决办法后是否可关闭Apple工单，并在真实会话过期后完成Developer登录。Agent已在原案例102995248851的续接表单发送上述官方来源、发布后继续验证的说明及关闭请求。Apple页面确认收到信息，仍显示同一个案例号；该页面没有直接Close按钮或Closed状态，因此当前记录是“关闭请求已收件”，不能冒称Apple后台已经关闭。没有新建第二个工单。

QA与本轮原件：output/qa/rillora-provider-diagnostics-20261013；[可读回执](../collaboration/verification/provider-diagnostics-20261013/README.md)。认证后的支持页面截图只保存在.local-secrets/provider-diagnostics-20261013，不进入Git。当前运行配置、App／API部署及价格开关均保持原状。
