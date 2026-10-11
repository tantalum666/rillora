# Rillora剩余五组修复 QA — 2026-10-11

本轮为同一修复工作流的续接，起点b6f5b8c971196db3f513a7dbb5f6dc36efae8b6a。
Owner要求代码／测试做好后统一推Git，线上保持原状。原A/B报告、前30组证据及archive31不改写。

## 结果与检查顺序

1. 先追踪边界、现有调用与兼容，一名新的只读调查者独立核对。新增0100—0103，旧1—99字节完整匹配起点。
2. 类型／语法通过后，运行低权限真实SQL／HTTP、伪造日志mark／回执、删除签名主体／时效／session绑定、旧schema邀请升级以及凭据失败保留等攻击负例和合法控制。
3. API58文件519/519通过；API类型和构建通过。此后只改运维／IaC兼容问题，API未变，类型／构建再次通过，未无故重跑全量。
4. 一次新的盲候选复核在a96760fa4d9f33c48fede4ae8adfdf23ede78bffd942e81f81a94d6fb689fbb7上提出2项，父代理确认后修复：固定迁移命令共用、恢复停写包含独立删除服务。
5. 最终infra58/58及类型、发布工具73、broker7、凭据工具7、Auth0工具7、journal broker4、collaboration9全部通过。当前Swift源码编译及Secure Enclave合成往返／无人值守拒绝／篡改拒绝／错误账户拒绝通过。
6. 初次源发布扫描32个匹配／0未知；3条既有例外仅移动行号，内容哈希和规则未改。源码及可读协作资料在最终Git前各自重新扫描。

这些检查有重叠，不相加作为漏洞数或独立覆盖总量。Web191／iOS287及1既有跳过来自上轮，不是本轮重跑；本轮没有客户端更改。

## 命令和原始证据

在独立临时副本运行`npm run typecheck && npm run build && npm test`（API）、
`npm run typecheck && npm test`（infra）、各工具目录`python3 -m unittest discover`、
`node --test tools/maintenance-broker/core.test.mjs`以及当前Swift编译／固定非秘密硬件检查。
原始成功／失败日志、候选和最终补丁、兼容处理及读取／测试库保护回执保存在独立安全集合，
并进入本轮新增Git保存包；不混入原扫描的canonical产物或改写其状态。

运行测试的PostgreSQL均为127.0.0.1、已标识的25个专用合成测试库。两次预检拒绝发生在变更前；
最终重置仅为把尚未发布的迁移合并为0100—0103，随后全量通过。没有生产／staging数据库连接。
秘密工具只用合成内容；未安装正式签名助手，未取得本人在场的真实秘密读取，也未迁移旧文件。

## 文档收尾

更新`docs/security-remaining-five-20261011.md`、原35组映射、SECURITY、backend、trusted-sharing、
recovery-control-journal、identity-data-region以及`tools/security/README.md`；产品入口、Git保存合同、
协作入口、handoff及项目旅程同步。Owner追加的五组范围已在decision-log记录；剩余实现选择没有
新定价／市场／发布决定，无需虚构另一项Owner批准。

发布脱敏器删除保护的尝试曾被自动审批拒绝；最终恢复基线原字节，未绕过扫描或请求无关授权。
`reading.json`沿用完整阅读记录并列明本轮补读，Markdown链接／状态检查另有回执。
Git提交／CI／远端新下载解密验证仍须有各自回执，不由本机测试推断。

## 明确未执行

未部署／开售、未改provider、未迁移或轮换真实凭据、未真实付款／退款、未删除保留账号、
未装手机／分发TestFlight、未恢复暂停扫描，也未触碰FanPass。五组源码fixed不等于这些隔离
已经在线上生效。下一步只看当前handoff。
