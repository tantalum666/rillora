# Rillora 当前交接

Status: PUBLIC GEO LIVE / GOOGLE AND BING SUBMITTED / CI166 AND REMOTE ARCHIVE PASSED / HOSTED MCP TEAMS VERIFICATION PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)

## 当前任务

Owner要求先完成官网GEO／SEO，再推进MCP和各平台接入，新功能留给下一版并推GitHub，保留App1.0(14)审核。当前目录 /Users/tantalum/Documents/电子遗嘱app，分支 codex/ai-discovery-vnext-20261015；发布工作树仍为fec1ad3b。此前交接移入[历史记录](handoff-history-20261016-before-public-discovery-closeout.md)，不恢复旧授权／部署门。

## 已完成

- [官网独立发布](architecture/public-discovery-rollout-20261016.md)已完成两阶段切换。第一阶段51资源到位，原首页和LIVE路由不变；第二阶段最终模板、53公开HTTP文件及根index／marker均匹配，20双语页面的正文／语言／canonical／hreflang／结构化数据通过。Chrome实际英文到中文文章切换通过。
- Google新增rillora.xyz域资源并完成所有权验证；站点地图提交一次、持久保存。实际Google即时提取测试于页面显示October16 20:13:07成功；常规站点地图报告仍无法抓取／0已发现，不能记为索引完成。
- Owner明确同意原Google姓名／头像／邮箱用于bing.com登录；新的同范围回调成功。Bing手动DNS验证通过，站点后台可用，地图提交一次并保存为Processing、0错误／警告、0已发现。无Google站点数据导入或DNS账号委托。
- DNS只新增Google TXT及Bing独立CNAME，34→35→36；每次所有旧记录完整保留，两权威和两公共DNS确认。验证记录需保留，邮箱／www／FanPass保持。
- [真实OAuth与撤销](architecture/ai-oauth-validation-20261016.md)已通过并清理：Codex实际app-server及Gemini原版OAuth函数＋实际CLI连接；签名／issuer／audience／client／scope、仅选定事项读取、同一未过期token撤销拒绝均通过。原9普通应用／3API／3连接和完整租户设置一致。
- 重复resource参数已修正，源码653093e62／CI165三任务成功，archive42的38对象／44路径已从GitHub独立下载认证。既有560等本地检查不重跑。

## 证据与边界

官网当轮原件 output/qa/rillora-public-discovery-rollout-20261016；[新增可读材料与archive43](../collaboration/verification/public-discovery-rollout-20261016/README.md)保存226路径／118对象／1,646,127密文字节，本地及f91a4ba61的GitHub独立新下载认证全部通过，CI166三任务成功，旧archive1—42保持。凭据、认证URL、原始DNS／提供方对象和账号页面排除；公开内容、去掉账号区域的结果图和无凭据日志可复核。最终回执普通Git补交，不重封或部署。

Google常规地图处理与Bing抓取／索引尚未完成，暂不认定错误原因；实际AI提及、模型选工具、消费端／目录也未验。两家OAuth是本机服务与实际提供方／客户端的协议证据，不是公网托管产品闭环。MCP runtime和UI默认仍关。

只有独立www公开栈更新；生产API／数据库、真实数据、WebUSD88.99及AppleUSD119.99／HKD888、收费开关、FanPass和在审App14未变。无TestFlight；Owner取消真机及暂缓Auth0外壳继续保持。AWS已复用原控制台自动续期，Auth0追加授权已实际完成，不重复要求登录。

[托管前置核对](architecture/ai-hosted-preflight-20261016.md)：原Auth0管理API／Dashboard仍有效；9普通应用，Free上限10，独立Web＋AI至少需要2个登记。正在核对独立开发租户，未删除／重用旧客户端或升级。新进入的Auth0 Teams单独安全验证尚未完成，已保留页面交Owner本人处理；这不是原管理会话过期。

## 唯一下一步

Owner完成已打开的Auth0 Teams安全验证后，读回独立EU开发租户的免费条件，推进隔离HTTPS候选中的Web选择授权→MCP读取／撤销闭环。接续时读回Google常规地图与Bing处理结果；不反复提交，不重做已过的OAuth、本地矩阵、官网部署或当前审核。
