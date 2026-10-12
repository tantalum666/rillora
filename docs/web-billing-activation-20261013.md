# Web正式订阅收尾：关闭自动计税，完成身份隔离窗口

Status: BILLING RUNTIME DEPLOYED / TAX AUTOMATION DISABLED / CUSTOMER SALES HELD FOR OLD TOKEN EXPIRY / NO TESTFLIGHT
Last updated: 2026-10-13 (Asia/Hong_Kong)

Owner在询问Stripe已配置为何不能订阅后明确“忽略掉计税策略”。本轮不再等待Stripe Tax设置、登记或计税策略；不虚构免税评估、登记号或reviewed_no_collection。Web继续USD88.99／年，Free1／Family5和Apple既定价格不变。

## 当前实际状态

- 原Rillora Live账户可收款／提现，原Family商品和8899USD年价active。运行秘密只把tax.mode改为disabled，自动计税false；其余密钥、商品、价格、门户及返回URL逐字段保持。SDK正式就绪核对通过，未创建Checkout或付款。
- 兼容源码53aa24484／CI135先发布review；474702c06／CI136再切live，CloudFormation完成且模板匹配，API25运行1/1。保留原数据库103、网络、KMS、恢复日志与所有用户／财务数据，没有再次迁移。
- 固定目录工具以只读指纹和事务启用原GLOBAL_US Web路线、Family-v2／年价v4和正式权益。随后因发现旧身份服务权限尚未退役，执行close-new-sales只关闭该路线／市场的新购；不撤销历史权益、不改金额、不改用户或订单。引擎已就绪不能写成普通客户已经能购买。
- 正式App静态产物已按明确live模式交付，官网入口及指南已指向app.rillora.xyz；117个实际HTTPS文件与当次产物匹配。官网和App随后单独使用customerAccess=review表达受限状态，preview仍为false，避免误称真实生产是示例数据测试应用；最终两栈各只更换一个静态包且参数保持，117HTTPS文件逐一匹配，真实官网中英文价格及帮助说明回读通过。
- Stripe Live回调实际active，18事件配置与URL／版本正确；Dashboard可见窗口为1次旧配置事件、0失败。这不是新金融事件或真实客户付款证明。线上health200、未签名回调400、未认证quote401。

## 身份切换顺序的纠正

本轮曾先部署正式同意Action并移除旧审核身份限制；最后核对才发现旧Preview的读取／删除身份服务仍有Management API授权。这不符合原有[身份切换合同](production-identity-mail-20260924.md)，因此恢复原3身份、原期限的审核Action并停止新购，没有把计税指令解释成放宽身份安全。

已把精确4个旧Preview客户端的grant_types清空，包括两项M2M服务。实际使用旧两项凭据请求令牌均返回403 unauthorized_client且未签发令牌；生产客户端、生产M2M授权和连接成员保持。历史grant及连接记录保留为不可签发令牌的元数据；未增加CLI权限来删除这些记录，也没有删除账号、地图或历史订单。旧API的enabled_clients字段已不受支持，失败读操作没有修改连接。

Auth0当前Management API令牌寿命只读确认86400秒。已签发access token不能靠禁用客户端或轮换secret提前撤销；因此从实际停发核对时点2026-10-12T20:15:46Z起保留86400秒加300秒容差，**最早香港2026-10-14 04:20:47**再做拒绝复核和最后开放。近期日志查询没有成功旧M2M签发事件；19:26–20:12的生产登录／交换查询也是0，但日志有索引延迟和保留限制，不能用空查询代替这段有效期。

此窗口不需要Owner重新批准、购买Auth0套餐、启用Stripe Tax或制造真实付款。普通客户尚未开放；网站／源码中的live产物标记只说明候选能力和当前API模式，不能覆盖这个真实身份／新购门。Owner测试账号含历史Sandbox／TEST记录，继续阻止误做Live自付；不删除或改写这些记录来让按钮通过。

依据：[Auth0管理令牌生命周期](https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens)、[日志保留与延迟](https://auth0.com/docs/deploy-monitor/logs/log-data-retention)。

## 实现、验证与保留

显式disabled模式保持未配置默认失败关闭，允许原Stripe价格unspecified税行为；商户／正式模式／币种金额年期／条款接受／幂等／签名／订单归属及单续费渠道校验不变。固定目录操作只接受inspect、activate、close-new-sales，受既有broker、现有生产库、当前目录指纹及事务约束，不接受任意SQL或主机。

本轮19项Stripe、16项生产账本路线、4项目录、11项生产IaC、9项broker、8项原生同意模板以及API／infra类型检查通过。CI134／135／136／138／139／140／141三任务均通过；CI137发现官网边缘指南仍跳Preview，修正后通过。最终f87ac62c9把实际生产目的地与公开访问状态分开；19项相关Web／语言检查通过。原source-preparer误复制worktree的.git指针也经红／绿测试修正；保留原空锁调查和失败过程，不修改安全扫描例外。

发布过程中首次变更集因子网表达式漂移被拒绝且未执行；显式保留旧可用区表达式后通过。官网动态规则引用只允许指向未替换Function ARN且分发模板其余字节一致。失败的CLI stdin秘密提交、元数据删除与旧连接字段读取均不冒领成功；实际替代操作和读回分别保存。没有重做旧支付／退款／恢复／手机验收，没有TestFlight。

本轮QA为output/qa/rillora-web-billing-activation-20261013；源码／规范普通入Git，实际凭据、Auth0主体和完整供应商响应保留在受保护目录。新增archive36保存540路径／486对象／36,394,455密文字节，并在e29d417b6完成本地及GitHub独立新下载认证；最终元数据不递归封存。归档与实际远端认证回执见[本轮保存记录](../collaboration/verification/web-billing-activation-20261013/README.md)。完整Markdown阅读沿用同一工作流账本，只补当前变更和恢复所需正文。

## 唯一执行门

香港2026-10-14 04:21之后，确认4旧客户端仍不能签发、原生产客户端正常、旧令牌有效期已过；恢复已准备的正式同意Action并通过新指纹启用原Web销售路线，再核对正式页面。直接复用已部署API25、现有商品／价格及既有支付证明，不重复后台部署、本人认证或交易。官网文案切到实际开放状态，原机和App Store／TestFlight继续独立。

Git补充：空index.lock在.git指针已排除后再次出现，不能把指针修正声称为彻底解决锁根因。只在确认空文件、超过120秒、无git进程／无打开句柄且inode未变后移除该旧锁；索引、工作文件和历史未删改，复发根因未确认。该记录属于本机保存过程，不是线上产品缺陷或重新审批门。
