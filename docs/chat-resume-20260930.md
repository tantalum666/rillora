# Rillora 新聊天接手说明

Role: cross-chat checkpoint and artifact/tool routing, not a second product authority
Status: SAVED FOR CONTINUATION; LAUNCH OBJECTIVE INCOMPLETE
Last updated: 2026-10-02 (Asia/Shanghai)

Owner最新要求的全量Git保存已完成，7个LFS归档已从远端下载、解密并逐对象核验，CI42通过。Dot协作入口是
[完整协作包](../collaboration/README.md)、[保存合同](source-control.md)和[当前交接](handoff.md)。
下方按日期保留旧交接事实，不从历史段落生成第二个活动“下一步”。

## October2 前三项发布工作与注册提示 — 最新恢复入口

修复API／Web／WWW已部署，受限真实身份与Web随后接通；Owner完成Google同意／登录，QQ接受一条明确的合成Directions共享。QQ收件仍未由本人确认；服务器250回执不能替代收件箱结果。Apple真实TEST先失败，OCSP网络／重试分类修复部署后成功；不代表购买恢复。误点注册的重复账号提示已准备，Auth0管理会话实际失效，正在等待本人完成验证后应用。后续唯一下一步见[handoff](handoff.md)，完整记录见[前三项合同](release-123-20261001.md)。

## HISTORICAL — October1 Resend已接通

Owner已明确采用Resend并完成本机CLI认证。域名、DNS、限定域名发信密钥和Auth0原生provider已配置；两项官方模拟收件传输通过，临时身份已清理。旧SES优先及等待批准的发信路线被取代；不重复登录、发信或申请。真实用户验证／重置／邀请仍分开验收。[当前邮件合同](transaction-mail-resend-20261001.md)。AWS三个profile刚实际确认过期，原修复部署仍待会话恢复；唯一下一步见[handoff](handoff.md)。

## September30 Dot review修复 — 保留的源码检查点

Owner后续提供13项Dot代码发现并质疑质量；[修复与验证](code-review-repair-20260930.md)已完成本地验收，源码38307b0d0的CI41通过。修复尚未云端部署，已有AWS会话实际过期。不能把下方旧“仅等待Owner”结论继续当作当前状态。唯一下一步以[当前交接](handoff.md)为准。

## September30后续执行 — 保留的部署检查点

同日后续Owner要求完成所有不需要本人参与／确认、也不依赖AWS回复的发布前工作。
本轮完整阅读为165文件／29,003行，后续工程见[当前发布合同](release-engineering-20260930.md)
和[当前handoff](handoff.md)。生产已到API7／schema0091；保留／恢复对账、近期认证、
独立生产身份服务与提交材料已有各自证据。下面原有事实是交接保存时的历史检查点，
不再把task1／schema0070、旧314测试、缺少截图或已完成的部署当作当前下一步。

实际登录／法律确认、真实交易、SES回复、经营与设备暂缓项、最终价格／申报／
TestFlight仍有独立门。新的source/CI精确记录见本轮QA，禁止重用旧CI35证明新源码。

## 新聊天从哪里开始

工作目录：`/Users/tantalum/Documents/电子遗嘱app`。源码私有仓库：
[tantalum666/rillora](https://github.com/tantalum666/rillora)，当前分支`main`。

先读根目录[AGENTS.md](../AGENTS.md)，按其中新工作流开工协议盘点并完整阅读项目
自有Markdown：先[product.md](product.md)，按Authority Map路由，排除依赖／缓存／
构建／第三方和生成的output证据。旧147文件／25,917行完整阅读记录是之前工作流的
证据，不能冒充新聊天已读正文。不要因为换聊天而重跑已经通过且源码未变的测试、
重做已部署的工作或重复申请；历史记录按其日期理解。

重点接手：

- [当前handoff](handoff.md)：当前成果、边界、一个下一步。
- [Apple审核实现](apple-review-validation-20260929.md)：最新工程与后台记录。
- [发布工作表](release-readiness.md)、[发布门登记](../config/release-gates.json)：所有剩余工作。
- [身份／邮件](production-identity-mail-20260924.md)、[生产客户端](production-clients-20260925.md)、
  [生产API](production-runtime-20260924.md)：实际测试环境与正式环境的区别。
- [渠道定价](channel-pricing-20260921.md)、[决策](decision-log.md)、
  [项目旅程](journey/PROJECT_JOURNEY.md)：批准范围、被取代方案、工作沿革。

## 必须保留的决定与边界

保持现有UI、Legacy Imprint03完整Logo、Free1位／Family5位、基础导出权益，
WebUS$88.99年付，新月付已经取消。Apple较高渠道价仍需最终决定；99.99／119.99
是条件候选，后台实际USA68／CAD99为旧测试配置，不能描述为正式已改价。

继续应用层信封加密＋独立密钥管理；完整在线E2EE尚未采纳实施。不得自动推断死亡
并披露、不得保存完整助记词／银行卡密码、不得把资料共享等同所有权转移。
经营／商业登记事实和实体设备仍是Owner明确暂缓项，不能标成完成或反复索取。
FanPass、现有`apps/web/.git`历史、真实用户数据和原有授权均须保留。

项目范围内默认授权持续有效；只有真实缺失信息、平台本人认证或更高优先级工具
要求才交回对应步骤。先验证现有会话再询问登录，不把旧MFA问题重新当作当前阻塞。

## HISTORICAL — 原交接保存时的关键事实

- 最终Apple工程提交`79cea6429b8a6b0d0712a4af4aeea3096e7e35d5`；
  [CI35](https://github.com/tantalum666/rillora/actions/runs/36596303754)成功。
  上一证据文档提交`9b9968674f9d95c13b763ea02a43052dcd8d4fc0`已推送；
  此交接保存会增加一个文档提交。以本机HEAD与远端main读回为准。
- API314／35文件通过；原生全量175通过、1既有StoreKitTest跳过，后续13购买＋
  1传输检查通过。均有各自结果；本次保存没有重跑产品测试。
- 已签名Release归档和AppStore IPA存在且校验通过；账号入口仍NO，未上传TestFlight、
  未提审，也没有真实Apple购买／恢复／通知完成证明。
- Small Business Program申请已获Owner明确事实与最终声明确认，且Apple回执已保存。
  等待批准与15%生效日期，勿重复提交。Apple反馈发往开发者账号登记邮箱；现有Gmail
  连接未必是同一邮箱，不能由某个邮箱无搜索结果推定未申请／未获批。
- Streamlined Purchasing仍开启，Apple实际要求先有已审核的PurchaseIntent构建才能关闭。
  相关代码已加入，后台变更未成功。官网／支持链接已保存并重新载入确认。
- 最新云端检查点：staging API38/schema0075；production API task1/schema0070。
  本地0076–0086仍待云端发布，不能因CI成功假定已部署。
- SES原工单`179022088800001`已在September29 22:31:40+08提交澄清并回读，
  最新已记录状态Reopened／production=false／DENIED／账户HEALTHY。后续回复尚未
  在本次保存中查询；勿重复发信或擅自改用Resend。保持SES／Auth0优先方向。

## 文件与工具交接

本次Apple证据目录：
`output/qa/rillora-apple-release-20260929/`，入口[README](../output/qa/rillora-apple-release-20260929/README.md)。
最终分发包：`distribution-final/Rillora.ipa`；归档：`Rillora-Final.xcarchive`；
对应[签名及SHA256记录](../output/qa/rillora-apple-release-20260929/distribution-verification-final.json)。
上述旧保存策略已被Owner的全量Git要求取代。现在原始产物在Git LFS加密归档中；
脱敏文本与已审设计素材可直接查看。旧 `output/...` 路径通过
`python3 tools/collaboration/resolve_evidence.py '<原路径>'` 查询，解密恢复需Owner本机的归档密钥。

凭据仍保存在原钥匙串、`.local-secrets/`及既有云端受保护配置中。本次未移动、复制
或输出密钥。Apple登录密钥、IAP服务器密钥和分发签名是不同用途，不得互相替代。
IAP现有本机受保护位置为`.local-secrets/storekit/`；正式／review vault尚未完成配置。
签名由Xcode现有团队及自动描述文件管理；不要撤销FanPass的证书或创建替代租户。

模拟器：Rillora-Matrix-17-Pro，iOS26.5，
`EA356940-5220-4AA8-89CF-499C6D5D14E4`。普通Debug/com.rillora.ios已安装，
原Preview API、无新增测试覆盖变量，最后观察到浅色公开首页。无需重新安装来证明
本次保存成功。XcodeBuildMCP默认值／CUA变量不会被当作可跨聊天继承的事实；新聊天
先发现工具和设备状态。Apple申请回执和TestFlight页保留为可查看的后台入口。

没有待接手的子Agent（本次列表只有root）、没有本轮新建的QA服务器或云资源。
已有服务、数据库、日志和模拟器保留；不清理未知进程／旧测试数据。工具`get_goal`
本次返回null：文档中的最终上线目标仍未完成，但没有可假定在后台继续运行的托管
长任务。新聊天按交接继续执行，不能把聊天状态写成已上线。

## HISTORICAL — 原交接时的推进方向（已由当前handoff取代）

接通生产审核测试账号／API／目录和通知配置，以真实Apple Sandbox购买／恢复
验收作为下一里程碑，再生成并上传可用TestFlight候选。后台审核等待期间，其余
发布工作仍由发布门登记管理。不要只翻开原生账号开关或把已签名但关闭入口的IPA
冒充可用发行版。

[本次保存与完整性核对](../output/qa/rillora-chat-handoff-20260930/checkpoint.json)。
