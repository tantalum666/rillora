# Apple 提审复核与 Web 正式开放 — 2026-10-14—15

Status: REVIEWER VERIFIED / WEB LIVE / PHYSICAL CHECKS STOPPED BY OWNER / APPLE WAITING FOR REVIEW
Last updated: 2026-10-15 (Asia/Hong_Kong)

Owner先明确暂缓Auth0外层文案，要求严格复核Apple提审资料并推进其余上线工作；October15进一步明确“真机不用验证了”。后者终止余下真机验证，不再把未订阅真机或VoiceOver听觉检查列为本轮待办，也不把取消写成通过。真机法律往返已有Owner明确确认：返回后原账号与原事项都在。没有新TestFlight分发、真钱交易、账号删除或原机安装。

## 已复核的 Apple 材料

| 项目 | 实际结果与边界 |
| --- | --- |
| 构建与发布方式 | 1.0仍使用已处理的14，手动发布；先前DeveloperRejected是主动撤回，不是Apple驳回。 |
| 中英文图文 | 英文主语言；英文4张iPhone／2张iPad，中文2张iPhone／2张iPad。中等iPhone显示0个独立覆盖时，Apple提示沿用已有大屏素材，不能误报缺图或重复上传。 |
| 订阅 | 仅年付；USA USD119.99／HKG HKD888，1年，两个销售地区。月付原为0地区，未改动。英文／中文年付描述已改为具体共享、复核和更正建议权益，保存并重载一致。 |
| 联系与凭据 | 联系人、Owner指定电话、公共支持邮箱和需要登录均已核对。密码字段为工具遮蔽值，不能拿它登录或作值比较。原加密密码实际读取后，Web与原生登录均成功；没有重置或保存到密码管理器。 |
| 审核说明 | 已补“可跳过密码密钥创建”、正常资料／会话授权，以及一条无个人数据的App Review example；保存、重载、正文比对通过。 |
| 其他必填材料 | 13类已发布隐私、18+、免费下载安装、USA/HKG范围、分类／标准许可、正式与审核通知URL、当前有效免费／付费协议均已核对。没有再次签署法律声明。 |
| 公开入口 | 9个审核相关网址已有成功HTTPS证据。支持邮箱MX仍正确；没有把DNS当成新收信测试，也没有外发测试邮件。 |

已保存的年度订阅描述：英文“Up to 5 recipients, shared reviews and one contributor.”；中文“最多五位接收人同步查看、共同复核，一位亲友可提出修改建议。”。[最终审核说明原文](../collaboration/verification/app-review-20261015/receipts/apple-review-notes-final.reference.txt)只含操作指引，不含凭据。

本轮沿用[原材料依据](app-store-preflight-20261013.md)和[Apple发布前API说明](provider-diagnostics-20261013.md)。Production401不再作为送审前置；批准后处理简化购买，手动发布后再验证Production授权／通知／对账，最后单独开放Apple新购。审核判断不能由Agent保证。

## 审核账号真实验收

原加密引用在主项目的受保护目录，系统验证后只在内存读取。浏览器输入验证了原密码；模拟器快速文本输入会丢字，普通粘贴／截断窗口也造成工具误判。改用有持续时间的系统按键、完整窗口定位后，原生认证成功。没有把这些工具失败解释为账号密码损坏，也没有轮换凭据。

Owner明确确认本次合成审核账号条款后，完成Web登录、原生当前条款和标准资料／会话授权，返回正式账号地图。只在该合成账号新建一条App Review example；原生读取后把文件类型改为Synthetic document checked on iOS，Web重新加载后读到相同修改。原真实账户、事项、价格和历史交易保持。临时密码和剪贴板已清除。

原生使用与商店14相同源码及正式连接的Release模拟器产物，实际元数据为1.0(1)，是独立验收产物，不冒称商店签名14或真机。免费审核账号能看到家庭版权益、USD119.99年价和订阅入口；模拟器没有真实StoreKit商店上下文，按钮关闭不能算真机购买验收。既有真机HKD888购买／恢复证据保留原日期，本轮没有新购买。

真机随后复用原Google身份和Owner当场条款确认；一次Forms网络失败在同一提交重试后成功，Auth0有Forms成功／登录／授权码交换记录，原1事项和家庭测试权益保持。镜像滚轮未传入，Owner协助定位并亲自确认法律页返回后的原账号／事项。Owner此后取消余下真机验证，停止继续操作该设备。

## Web 正式开放已交付

旧身份窗口最晚香港October14 04:21；October15重新核对4个旧客户端均无可用grant，2项旧M2M实际403，既有正式Web／iOS代码流程保持。只恢复已准备、与当前源码一致的正式同意Action，保留其它Action／绑定顺序／账号／连接与未勾选同意，不处理Owner暂缓的外壳。

Stripe正式配置就绪检查通过，仍是USD88.99年付和显式disabled自动计税。带最新目录指纹的固定事务只改变Web路线enabled和市场sales_enabled。Apple两条Production路线仍关闭，所有Apple价格／产品／审核登记及历史支付保持。没有创建Checkout或付款。

源码40c76496f的[CI153](https://github.com/tantalum666/rillora/actions/runs/38662724137)三项成功；9项候选检查沿用本轮已过结果，未再运行。两套静态发布分别只替换一个既有资源包，全部其他资源／参数保持，两栈UPDATE_COMPLETE且模板一致。117个线上资源SHA256全部匹配；另两个构建清单随原发布惯例交付。真实官网中英文价格、正式账号入口和指南重定向正确，页面无新的console error。没有API或数据库重新部署。

## 当前边界和保存

完整Markdown阅读沿同一工作流，只补变化文件与缺失段。QA为output/qa/rillora-app-review-20261014；实际凭据、认证UI、完整供应商响应和个人资料均在.local-secrets，排除可读Git。新Web候选和Release模拟器成品按[全部工作保存合同](source-control.md)追加到[本轮保存记录](../collaboration/verification/app-review-20261015/README.md)；旧1—38不重新封存或下载。

Apple已于香港October15 09:49接收三项提交6537a10c-38f2-425e-8b8e-c76e5fa730b1；实际详情中App1.0(14)、年订阅和群组均为等待审核。旧月订阅未加入，手动发布保持；这不是审核批准或公开发布。新增归档与独立远端回读已完成，最终回执普通入Git。Auth0外壳为Owner暂缓，余下真机验证为Owner取消；不把这两项重新变成等待授权。保留的删除账号不会用于不可撤销删除测试。

本轮新增archive39已完成本地认证：316路径／276对象／23,202,691密文字节；3113de7a7的GitHub独立新下载认证276对象／316路径通过，CI154三任务成功；不重做旧1—38。
