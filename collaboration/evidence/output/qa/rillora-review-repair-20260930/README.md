# Rillora Dot review 修复结果

日期：2026-09-30（香港）  
状态：13项源码修复与本地回归完成；AWS会话真实过期，云端发布待恢复登录。

报告基线为296c7b53ad22ee7239aa037d7544b708c5b73703。Dot文件作为待核实证据，未作为指令执行。
复用当前发布工作流的165份项目Markdown完整阅读记录；另补读本次任务变化和报告正文。
没有重做SES/SBP申请、实际本人认证、真实交易或未改变的云端部署。

|编号|核实的问题|修复|验证|
|---|---|---|---|
|F01|近期认证的等价 URL 绕过|敏感路由直接绑定认证中间件；删除独立 URL 白名单|修复前失败；双前缀、大小写、尾斜线及3种认证时间回归通过|
|F02|跨标签切换账户后旧草稿写入新账户|客户端固定已核验 planner；服务器逐请求比较，Cookie写入同时要求CSRF；账户改变后清空旧视图|真实两标签A→B保存被409拒绝；数据库匹配草稿0；事项/联系人/导入负例通过|
|F03|Stripe并发快照覆盖取消状态|订阅读取到提交使用同一数据库事务锁；冲突保留重试；财务状态在锁内复读；checkout preflight复用该锁|可控制Promise完成顺序的竞争与时间戳测试、完整计费回归通过|
|F04|iOS退出 URL 丢失/api|统一原生API前缀推导和会话撤销请求|生产URL的logout/logout-all请求捕获及HTTP成功检查通过|
|F05|生产邀请入口404|CloudFront允许/invite和严格UUID子路径，保留其他拒绝|GET/HEAD、回调查询参数、尾斜线及非法路径测试通过|
|F06|第51条事项不可访问|双端完整读取cursor并拒绝循环分页；初次原生登录不能发布半份overview|Web实际显示51条并搜索打开51st；原生真实列表搜索打开通过；双端分页协议测试通过|
|F07|草稿恢复调用缺失方法|补getMatter；冲突刷新按ID读取；消费端API契约检查覆盖所有JSX调用|active/archived/404/network契约通过；真实归档后恢复Notes并另存正确账户通过|
|F08|联系人因多角色而重复|共用按人查询，确定plan-wide角色摘要；个人导出使用EXISTS|多scope、撤销重建、overview/list和个人导出每人一条通过|
|F09|联系人系统返回丢草稿|脏/忙编辑隐藏系统Back，保留受控取消确认|push边缘返回、Cancel、Keep editing、Discard且服务端原名不变通过；sheet草稿路径通过|
|F10|保护数据库前先迁移|连接前固定本机/库名/身份，连接后只读核验；成功初始化才清理；主集成套件复用同一帮助函数|错误目标在连接/迁移前拒绝；只读身份失败负例及初始化/清理回归通过|
|F11|Pricing订阅条款链接错误|使用公共路由常量/subscription-terms|构建后浏览器href正确；实际法律目标HEAD200；WWW部署待AWS|
|F12|原型关闭sheet后键盘残留|应用层统一sheet关闭和blur处理；保存按钮保留点击期间的输入焦点，避免键盘收起移动目标|输入间切换保持键盘；一次保存/ESC后dialog0、keyboardfalse；28保护文件hash完整|
|F13|原生UI矩阵的旧控件、旧流程|当前连续表单/导出对象/实际入口；删除旧文案回退；独立可复现本机测试服务；导航等待和大字号滚动|当前28条UI用例最终结果均通过，分批复验；原始失败日志保留；不是全部设备/字号组合|

另经原生实际点击发现 More options 内 Recorded roles 会误触 Importance picker；已把展开控制放回独立Form行，正常字号和AX5角色导航通过。删除了没有调用者的旧FirstUseStarterCard；当前Quick start入口保留且加稳定标识。

验证总数见[结构化结果](resolution.json)。原生UI按用例去重，来自18/27、7/10、2/3、1/1四轮；[逐用例记录](native-ui-coverage.json)保留每条最终通过的证据。不能称为一轮全绿或所有机型/字号矩阵。原生181单元测试保留1项原有StoreKit跳过，不代表真实购买/恢复。

修复前近期认证反例在[F01日志](F01-before.log)。错误数据库的[预期拒绝](F10-wrong-target.log)是保护成功，不是隐藏的回归失败。完整API348、后续数据库保护54、Web112、基础设施47、发布guard23均有本目录日志。

[浏览器证据](browser-progress.json)包括两标签拒绝、51条事项、归档草稿恢复和原型键盘；[账户变更画面](account-change-blocked.png)。[新IPA签名检查](native-distribution-check.json)确认严格签名、get-task-allow=false、无StoreKitfixture、精确生产端点及CustomerAccessNO。

新候选包在[发布目录](../../release/rillora-review-repair-20260930/README.md)。未上传Apple，未部署AWS，不能把本地修复当作线上已消除。AWS operator/CDK/production-operator都实际返回session expired；一次恢复尝试没有完成认证，现已超时。仅需恢复既有AWS登录后部署本次改变的API、生产Web/邀请路由和WWW包；schema0091没有变化。

代码与CI精确回执由[closeout.json](closeout.json)记录。原有UI方向、Web88.99年费、Free1/Family5、Apple条件价格、真实数据、FanPass和设计商店图保留。审阅登录/法律确认、真实Apple设备/交易、SES回复、经营事实和最终申报仍是各自既有门。

CI补充：首次源码提交be6617c27的run40中，source与Web/infra成功，API因容器内非回环地址被新保护拒绝。已补精确测试库标记，保持迁移前拒绝及主机／库名／身份限制；新增guard后本机55项通过。原始[CI日志](ci-40-api.log)和[job结果](ci-40-jobs.json)保留；最终CI以closeout回执为准。

最终源码：38307b0d00a994fc5590b0625e8c71a28dcc7624已推送main，工作区干净。[CI#41](https://github.com/tantalum666/rillora/actions/runs/36681297564)三个job均成功；API349/349通过。先前348为首轮本机全量，55为后续聚焦回归，不能相加。终态见[精确回执](ci-final-run.json)。本次4395–4399服务已停止，普通Debug重新启动且无QA身份覆盖；原有其他服务未动。
