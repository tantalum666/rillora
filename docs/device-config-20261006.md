# Rillora 真机验收与发布配置

Status: IN PROGRESS — Owner 已恢复真机与配置工作
Last updated: 2026-10-07 (Asia/Hong_Kong)

## 本轮范围与保留边界

Owner 明确要求“现在开始真机和各项配置的工作”，随后连接并解锁原配对的 iPhone 16 Pro Max，并选择直接在手机上操作。此前真机暂缓已被这次指令取代；其后Owner明确允许Agent通过iPhone镜像操作，本人密码/系统验证仍由Owner完成。

继续现有发布工作流及已完成的 Markdown 阅读记录，不重新扫描全库或重做已通过的实现、测试、部署、上传、申请。沿用 API14 / schema0093、已部署双语 Web/WWW、已处理的 1.0(5)、Stripe USD88.99 TEST 闭环和 archive19 远端核验。

配置工作覆盖 TestFlight 内部测试、实际 StoreKit Sandbox 流程、审核访问、Apple 提交资料/价格/市场以及 Stripe 正式商户与生产配置。未知经营、税务、银行及个人事实必须由 Owner 提供；最终本人声明、必要安全授权及真实支付遵循各自工具规则。不得把开始配置当作这些事实已经成立，也不直接开放普通客户。

Owner 保留独立删除验收账号的决定仍有效；本次真机/配置请求没有恢复不可撤销删除。UI、03品牌、Web88.99年付、Free1/Family5、真实数据及 FanPass 保留。

## HISTORICAL — 本轮启动时观察

- 本机起初返回手机连接断开；Owner 连接后，设备工具确认已解锁，iOS26.6.2。TestFlight4.2.1(628.1)已安装，Rillora尚未安装。精确设备标识留在受保护本地记录。
- iPhone镜像要求手机锁屏；Owner选择直接操作手机，因此不接管镜像。
- Apple Apps列表展示缓存信息；打开Rillora实际TestFlight详情返回`authResult=FAILED`，现有Apple账号已停在密码页。已请求Owner完成实际过期的登录，不重复注册或上传构建。
- Stripe插件本轮恢复，返回仅Rillora账户`acct_1U6B2RCxTlowhyiG`、`livemode=false`。Rillora Dashboard会话有效。
- Rillora点击“退出沙盒”显示“获取真实账号以退出沙盒”，明确需要验证本人和企业资料。已打开同一账户的激活资料表，尚未提交商户声明或启用Live收款。

## 执行顺序与已完成步骤

1. 配置仅供Owner使用的TestFlight内部测试，使用已上传构建5。关闭自动分发，避免将未来构建自动发给测试员；具体邀请收件人与发送动作在准备好后取得明确指示。
2. Owner在手机安装并核对1.0(5)，完成真实登录/返回、核心资料与共享/导出以及VoiceOver操作。既有真实结果继续保留，不重复无变化的Web测试。
3. 核对当前审核账号资格、真实商品/金额/storefront及Sandbox环境，完成购买/恢复和服务端Apple验签/权益/通知结果。TestFlight购买是Sandbox，不等于真钱收入。
4. 并行准备其余发布配置；对实际缺少的个人/经营事实和最终声明给出具体字段，完成可独立准备的部分后再交回。

## 证据

本轮QA：`output/qa/rillora-device-config-20261006/`。完整设备清单、认证会话及潜在个人资料只保存在`.local-secrets/device-config-20261006/`，不得加入Git归档。

[Apple内部测试说明](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/)确认选择内部测试员并分配构建会发送邀请邮件；[Sandbox说明](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox)区分TestFlight的Sandbox交易与使用专用Sandbox账号的额外测试控制。

以上是启动检查点；后续已安装及商户结果见下方。任何检查点都不代表未发生的购买、恢复或提审。

## 后续实际进展与价格纠正

- Owner明确授权三个邮箱的TestFlight邀请，并澄清第三个是现有Apple开发者邮箱。本人内部
  邀请已发送，组为Rillora Owner QA，仅构建5且自动分发关闭。Owner已从TestFlight安装、
  打开并用既有Google账号看到原有事项；设备工具独立确认com.rillora.ios/1.0(5)。
- 另两个邮箱需要首次外部Beta审核，联系信息步骤尚缺电话；Owner明确选择先不管。
  保留空的外部组Rillora Release Acceptance，已取消未提交的构建5审核草稿，未发送外部邀请。
- 真实手机报告“恢复购买暂不可用”。只读生产诊断确认Owner原生会话及测试资格有效，
  当时仍存在美国68美元旧Sandbox报价。客户端也缺少初次AppTransaction不可用后的手动
  刷新路径：新增只在明确Restore时调用Apple的refresh，拒绝未验证环境并防并发/账户切换。
  先有1条红测/4断言复现，修复后17条Coordinator用例全通过。构建6已归档、导出及13项检查。
  这些是代码/模拟测试/产物证据，真机恢复仍需更新后实际验证。
- Owner再次明确68已被否决，随后最终选定Apple美国年费US$119.99；Web保持US$88.99。
  已只停用旧Sandbox价格绑定的新购状态，云端读回retired、新报价0，历史金额/记录不变。
  Apple商店价格与新服务端绑定正在同步；不得继续进行68价的验收购买。
- Apple会员/付费协议页面可访问且付费协议有效，但未给出本账户SBP15%批准/生效证据。
  September29申请回执保留，没有重复申请；119.99为Owner的明确金额，不再依赖候选建议。
- Owner确认复用Stripe X的身份和收款资料。复用带入的FANPASS TICKETS账单描述符已在
  Rillora独立账户改为RILLORA，产品说明改为Rillora实际用途，保留Radar Lite，关闭可选
  捐款及未核验的自动计税，隐藏收据上可选公开电话。共享法律实体网站提示影响所有关联
  账户，因此取消该编辑并保持原样。未修改FanPass账户/共享主体资料。
- Owner亲自点击Stripe最终同意提交，后台已显示进入真实账户模式。MCP仍仅列出TEST授权；
  正式接口权限、商品/价格、回调、处理器资格、应用Live配置和真实交易仍要分别核验。
- AWS CLI令牌实际过期，但复用了有效浏览器会话成功刷新，STS已核对，无需再要求Owner MFA。

[Apple要求仅在明确用户动作后刷新应用凭证](https://developer.apple.com/documentation/storekit/apptransaction/refresh)。


## 21时后实际配置与待本人步骤

- Apple USA119.99已保存并重新打开详情读回；加拿大149.99、香港888等为Apple自动计算的
本币价格。年付销售范围仍8个；价格矩阵175个国家不是可售范围或市场批准。
- 新`family_apple_review_usd_11999_20261006`及`apple_review_usa_11999_20261006`仅供USA
Sandbox。真实数据库返回唯一11999报价；旧68/SKU/Web8899完全未改写，历史金额解析保留。
首个预检因UNION排序不受支持而失败、回滚，无新绑定；v2任务退出0并提交。两次证据都保留。
- API14价格目录在进程启动时读取，因此沿用既有部署身份滚动相同任务定义/镜像/配置；
原维护角色不含服务更新权限，没有扩权。最终1running/0pending、COMPLETED、ready200及
匿名session401。没有新迁移、身份延期或普通销售开放。
- 1.0(6)上传成功，Apple显示Ready to Submit；准确测试说明已保存，原Rillora Owner QA组
已分配，1名内部测试员。Owner已被请在手机更新并Restore一次，回报价格/币种/提示。
- Owner已当场批准Rillora Live插件权限；实际GET账户确认charges/payouts/details_submitted
均true、card_payments active、当前/逾期/待验证requirements为空。未将此等同经营/税务结论。
- Live Family商品及8899年价已创建但inactive；tax_behavior为unspecified、没有活动税务登记。
将inactive Price设为默认的请求被Stripe拒绝，无需为通过设置而提前启用。实际税务评估仍待Owner。
- Live门户支持账单记录、付款方式/联系地址管理和周期结束取消，无换套餐或公开登录链接。
18事件回调已创建并禁用；真实签名密钥通过UI读取后保护保存并再次隐藏。MCP返回的占位符
不是可用秘密，不得误装进运行配置。
- 服务器RAK的3写/9读权限已准备，待Owner当场确认创建及保护保存；该凭据独立于插件授权。
AWS精确命名的stripe-billing保险库目前不存在，尚未创建/安装完整配置。税务/经营信息也已询问。

当前不是正式发布完成：实际Apple购买/恢复、Live运行接入及真实支付、本人经营/税务字段、
最终商店申报/审核和客户开放仍未完成。外部两名测试员与独立账号删除继续按Owner要求暂缓。

## 本人验证及后续地区配置

Owner已当场批准独立服务器RAK，并完成Stripe要求的邮件验证。一把同名3写/9读受限密钥
已创建；SDK实际读取本账户、Live商品和8899年价通过，本机与AWS精确命名secret读回一致。
AWS首个版本自动附加AWSCURRENT，移除该标签的请求未成功；内容明确为preparationOnly，
正式解析器实际拒绝，API仍无Stripe生产ARN/读权限/付款开关。不能宣称正式计费已接通。
秘密已隐藏，实际值和设备原始日志均不进入Git。

Owner最新改为允许Agent通过iPhone镜像查看和操作。设备确认build6，本人完成Apple密码
验证后出现“Apple测试购买·不会扣款”；后续AppStore.sync仍报“无法完成请求”并跳App Store
设置。相关进程日志显示店面143463；另有sandbox.itunes.apple.com HTTP410观察，根因未确定。

云端只读检查确认只有USA测试路由，HKG报价0。现已追加Apple实际保存的HKD888年付
Sandbox价格/绑定与HKG受限测试路由；USA119.99、Web88.99、原SKU、经营主体和普通市场
开关均未改。GBP/CHN负向查询仍无报价。Apple审核秘密仅将验签店面从USA扩展到USA/HKG，
保留同一密钥及身份期限；同镜像API14正在滚动加载。新的本机价格/实际交易仍待读回。

Owner询问税号是否身份证。已核对IRD、InvestHK及Stripe官方说明，区分个人TIN、商业登记
和销售税/VAT登记；未登记不自动证明必须登记或可以全球不代收。没有输入虚构号码，
没有批准reviewed_no_collection；实际经营及首发市场税务方案仍待核实。

## 首笔Sandbox购买及Owner要求的币种修复

后续Apple SDK错误明确含AUS，而原8个商品地区不含澳大利亚。为当前TestFlight验收追加AUS，
商品草稿现9地区，澳元199.99为Apple按美国119.99自动计算；普通服务市场/销售开关未打开。
AUS版本化Sandbox价格、测试路由及验签店面已同步，同镜像API14已健康。商店1.0草稿也已
保存并重新读回构建6，保留手动发布，未提交审核。

Owner当场批准测试订阅并亲自完成。实际界面显示Family测试权限和Apple购买状态已更新。
只读云端核对得到2026-10-06T14:25:09Z的Sandbox/HKG/HKD888.00签名收据、active订阅，
以及已applied的SUBSCRIBED:INITIAL_BUY和CLIENT_SIGNED_TRANSACTION。原AUD199.99预备
订单已closed/canceled，实际收据与权益按Apple签名事实保留；不将报价当作实际付款金额。

Owner指出原价格未明确币种，且AUD199.99与Apple页HK888不同，要求修复。源码已新增价格/
同意文案的ISO币种前缀；正在补购买前重新取商品、核对可见报价金额/币种/店面，以及拒绝
交易期间任何店面变化的流程。现有onStorefrontChange原已存在，其保护未覆盖SDK调用前的
缓存/异步间隙，不能把已有机制重复计作新实现。新回归/布局/构建7仍进行中，不提前宣称通过。

## October7 Owner要求简化购买页

Owner明确拒绝额外勾选和Large text控件。后者原本只属于隔离预览，但不应混进展示给Owner
的购买页。现移除预览控件、订阅勾选和购买入口前的重复/未来套餐说明；直接展示Family实际
增量权益、明确ISO币种的完整年费及一个主购买按钮，续订/取消说明和条款链接紧邻按钮。
恢复购买保留为次要操作，已有订阅显示管理入口。按钮点击接受捕获的可见报价，进入页面不
生成订阅同意；报价变化须先展示再重按。注册法律clickwrap及后端语义同意字段版本不变。

币种修复构建7已上传并处理，但尚未分发；Owner新要求落实到构建8。先前币种回归38通过/
1既有跳过、三个币种预览保留为构建7检查点，不能冒充构建8验证。新的聚焦回归/渲染及分发
结果另行记录；不重复原成功的HKD888 Sandbox购买。

最终简化版检查点：39聚焦回归通过/0失败/1既有平台跳过，11静态检查；最终中英文自然换行
渲染已核对，13签名包检查通过。源码08afb3821/CI63成功；构建8于00:30香港时间上传，
Apple处理完成，准确说明及原内部组1名测试员保存后重新打开核对。App Store1.0草稿已选8，
重新载入仍为8并保留手动发布；未提交审核。手机镜像显示使用中，已请求恢复连接；实际8安装
及购后恢复尚未完成。本轮追加归档20正在收尾，原19份不变。
