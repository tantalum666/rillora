# 原生与跨端剩余验收 — 2026-10-12

Status: INDEPENDENT WEB ACCEPTANCE AND FIXES DEPLOYED / PHYSICAL PHONE OWNER-DEFERRED / REMOTE PRESERVATION VERIFIED
Last updated: 2026-10-12 (Asia/Hong_Kong)

Owner要求继续完成剩余原生和跨端验收，已验证的不重复，能自主完成的直接做，不发TestFlight。镜像实际停在Mac本人验证后，Owner选择本轮暂不方便、先检查其他部分；正式Web由Owner重新登录原Google账号。此选择不撤回已完成的手机14登录／原事项确认，也不是永久取消真机验收。

## 复用的证据

- October4/5真实共享范围、撤销、原生导出／Web读取导入、近期认证及安全取消删除沿用[核心验收](real-core-acceptance-20261004.md)。保留账号，不重新删除。
- Apple实际HKG/HKD888购买、已验签续订／回传、Owner恢复结果、手机13订阅／币种／中文结果沿用[付款复核](payment-recheck-20261009.md)。没有重新购买、恢复或退款。
- Stripe TEST的部分／全额、pending／成功／失败逆转、重复事件及清理沿用同一付款证据；October10隔离恢复沿用[已完成合同](recovery-financial-acceptance-20261010.md)。
- October12两库103、五栈、手机14及HTTPS登录沿用[安全部署](security-rollout-20261012.md)，不重跑迁移／全库回归／原生构建。

## 当前观察与范围

正式Web确为原Gmail账号，原1事项可读。套餐及账单请求均200：GLOBAL_US、当前Free、无生效validationOnly、正式销售关闭、USD88.99年价且无新购按钮。原Sandbox验收资格截止October11，与当前不生效相符；单靠这个响应不能确定Apple订阅本身是否已到期，也不能拿October10手机旧截图证明今天的跨端一致。

当前Free分支的中文／英文文本、明确币种、免费权益和到期保留说明均实际可见；原生折叠控件用Enter完成收起／展开，中文偏好恢复。Playwright按button角色定位summary失败属于工具语义差异，系统AX与实际键盘操作成功，不冒称产品无键盘支持。日志警告来自MetaMask扩展，未见Rillora页面错误。

真实页面重复显示两条“暂不开放新订阅”。最小修正只在外层已显示关闭提示时省略内嵌账单面板的重复句；独立面板及市场开放但报价不可用时的说明保持。该修正通过5项聚焦Web测试；新版已部署到正式Web和Preview，各86文件匹配；真实正式页面的中英文各只有一条关闭提示，金额与刷新入口保持。

另在真实已登录账户上复现法律页返回问题：新标签从隐私页点返回时落到访客首页，手动刷新即恢复原事项，排除会话真的失效。公共只读页在组件内跳转时没有重新进入应用的会话检查。修正只在离开只读页进入首页／账号时做正常文档导航，保留语言；法律页互跳仍不读取私有地图。新增5项隔离浏览器回归由4失败／1通过变为全5通过，相关7项测试通过；已有会话不重新登录，访客不伪造同意。最初本机缺少Playwright专用浏览器，改用已安装Chrome的独立临时测试配置，没有控制真实Chrome会话或安装新浏览器。

## 最终自主结果

源码d9825b616的[CI131](https://github.com/tantalum666/rillora/actions/runs/38263890831)三任务通过。两份实际变更集各仅修改一个Web上传资源的SourceObjectKeys，99／13个原资源和全部参数保留；两个栈均UPDATE_COMPLETE且模板逐字匹配。总172个当前静态文件通过SHA256读回。没有API／数据库迁移、原生重建／安装、官网重部署、资金或TestFlight操作。

正式站实际从隐私页返回已直接恢复同一个Google账号和原1事项，不经登录或手动刷新；语言仍中文。新的5项浏览器测试与12项相关Node检查有独立日志，不把旧金融全生命周期、模拟器或手机结果称作当次重跑。只读补充报价探针被浏览器客户端拦截、未取得服务器响应，未把该结果当作API权限证明。

Git保存采用本次新增archive34，沿用旧1—33；在5a42e7f8c从独立空LFS缓存新下载并认证解密全部172对象／262路径；最终回执直接入Git，不递归封存。证据入口在`collaboration/verification/native-cross-platform-20261012`。

## 仍不能替代的证据

- 原机未订阅分支、VoiceOver朗读／焦点、从原生打开法律页需要实际手机操作。Owner本轮已暂后，不用模拟器冒充真机。
- 当前有效Apple权益在两端的对应，需要原Sandbox资格及同一次真实订阅状态；不放宽受限RunTask、不修改已付记录来制造通过结果。
- Apple退款／撤销／到期的源码、既有本地测试和真实签名事件分别记账。不能用Stripe结果或本地合成回调声称已取得新的Apple实际退款。

QA：`output/qa/rillora-native-cross-platform-20261012`；含账号／系统验证的截图及原始provider资料仅留`.local-secrets/native-cross-platform-20261012`，不入可读Git。沿用同一发布工作流的完整Markdown阅读记录，只补新增／变化文件和聚焦正文。
