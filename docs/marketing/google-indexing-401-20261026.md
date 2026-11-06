# Google 401索引邮件核查

Status: DIAGNOSIS COMPLETE / EXPECTED PROTECTED MCP RESPONSE / NO PUBLIC-PAGE 401 FOUND
Observed: 2026-10-26 (Asia/Hong_Kong)
Last updated: 2026-10-26 (Asia/Hong_Kong)

Owner提供Google“被屏蔽了，因为会返回未授权的请求(401)”邮件，要求查明原因。本轮复用已有Search Console会话，读取Gmail原信与实际索引报告，并对当前公开地址执行无凭据HTTPS GET。没有修改网站、认证、搜索配置、审核或收费。

## 确切原因

报告只有1个401示例：`https://app.rillora.xyz/api/mcp`。这是受用户授权保护的AI接口，不是官网文章。Google记录的上次抓取为2026年10月20日13:52:00，Googlebot智能手机版，允许抓取但因401失败。

网址检查明确列出引荐来源：

https://www.claudemcp.org/mcp/registry/xyz-rillora-rillora-a7a38d410974.html

这是Google保存的引荐记录，本轮没有另外验收该第三方页面当前内容，也不把目录链接解释为AI推荐或客户使用。Google未检测到该接口的引荐地图；当前官网两份子地图也实际不含该接口。

当前无凭据请求返回HTTP401，JSON错误为`invalid_token`，具体说明`Missing Authorization header`；响应保留`Cache-Control: no-store`及指向正确资源发现地址的`WWW-Authenticate`。公开的`/api/mcp/resource-metadata`返回200，声明正式授权服务器与两个受限scope。当前源码在Host／Origin校验后执行`requireBearerAuth`，符合[正式MCP合同](../architecture/customer-mcp-20261018.md)。

因此，这次告警是Google发现了一个预期不供匿名索引的受保护接口，不是公开官网宕机、证书故障或现有Auth0管理会话失效的证据。[Google官方说明](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#use-meaningful-http-status-codes)也明确用401表示登录保护的页面。保留401，不为消除搜索报告而开放匿名访问、伪造200或移除OAuth；没有提交“验证修正”或请求索引。

## 当前公开页面核对

- 官网根首页200，原canonical为`https://www.rillora.xyz/en/`。
- robots、地图索引及两个语言子地图均200；robots允许抓取并指向当前地图索引。
- 两个子地图共28个唯一语言规范网址，全部无重定向200、canonical指向自身、未发现noindex。
- 这证明本次普通HTTPS请求没有发现公开页的401或上述索引阻断；不是新的Google实时抓取、全站所有路径或已经收录的证明。

## 独立的实际收录状态

本次打开的总表仍是有延迟的提供方数据，上次更新标2026/10/19：2页已索引、31页未索引；后者分为3条重定向、1条401和27条“已发现—尚未编入索引”。401详情另标首次检测October20，保留这两个原始日期，不自行校正为同一日期。

27条发现待索引与本次受保护接口的401是不同原因，不能因401已解释就宣称SEO收录全部完成。原[October25初始表现](google-search-baseline-20261025.md)仍是历史检查点，未重跑其效果数据、中文实时抓取或重新提交地图。

[安全证据](../../collaboration/verification/google-401-20261026/README.md)保存报告、抓取明细和当次HTTP结果。没有新产品决定或应用测试；现有审核、数据、价格、收费与TestFlight保持。下一轮SEO仍需评估关键内容实际收录和非品牌点击，本次不新增投放、目录提交或自动监控。
