# 官网 GEO／SEO 独立发布

Status: LIVE WEBSITE VERIFIED / GOOGLE AND BING OWNERSHIP AND SITEMAP SUBMISSION COMPLETE / INDEXING PENDING
Last updated: 2026-10-16 (Asia/Hong_Kong)
Source commit: 653093e6264e585fe1f377e6412a3b8f8da21a59

接续Owner既有官网GEO／SEO实施及连续推进任务。两家真实OAuth验收结束后，先把已通过检查的官网候选发布到独立www栈；这是Agent在既有范围内的发布安排，不是新的App／MCP功能开放或Owner逐项新增批准。当前App14审核、生产API／数据库、价格／收费及FanPass保持。

## 复用与前置核对

- 沿用已验收的54文件／20双语页面产物，不重复构建或本地浏览器矩阵。CDK的完整文件／页面／私有路由拒绝校验重新读取原产物通过。
- 源码CI165全部成功；archive42独立GitHub新下载认证38对象／44路径通过。
- AWSCLI确实过期后，已复用原控制台会话恢复，无需Owner再次MFA。原账户、www证书及独立栈UPDATE_COMPLETE均读回。
- 合成的直接资源差异为静态上传与公开路由函数。真实ChangeSet另列出由函数ARN引用引起的分发属性联动；分发模板本身相同，Function／Distribution均不替换。
- 上传CustomResource被CloudFormation标为Conditional。已核对当前相同CDK处理器的Update保留原PhysicalResourceId，目的bucket与ServiceToken未变，Prune=false、RetainOnDelete默认true；不把该标记伪称False，也不据此放宽状态资源替换检查。
- 原回滚源ZIP和新候选ZIP都通过既有文件发布角色的HeadObject确认可用；临时STS凭据只留内存。现行LIVE函数已读取并与原模板代码一致。

## 两阶段顺序

1. 新函数只更新DEVELOPMENT、AutoPublish=false；上传器只Include assets/*和pages/*，Exclude其余。原根index、robots及sitemap继续保持，原LIVE函数继续服务。
2. 第一阶段UPDATE_COMPLETE后，核对原首页字节及LIVE函数未变、新页面资源全部到位，再应用原始完整候选模板：AutoPublish=true、移除临时过滤，发布新路由与其余公开文件。
3. 独立核对云端最终模板、实际公开字节、20个语言路径、语言元数据、robots／sitemap、私有入口边界和真实浏览器。CloudFormation成功不替代这些线上结果。

该切换采用[AWS官方AutoPublish／DEVELOPMENT与LIVE规则](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-function.html)及已安装CDK的上传过滤合同；不修改源栈长期模板或放宽CSP。第一阶段是有限的临时部署模板，最终必须回到完整源码模板；发生失败则保留当前可用站点，并使用已确认可读的原模板／ZIP回滚。

最初用已承担CloudFormation部署角色的profile执行整个CDK，不能再次承担文件发布角色，上传被权限拒绝；改用原operator让CDK分别承担既有发布／部署角色后准备成功。没有扩大IAM或复用bootstrap-admin权限。

## 当前证据边界

当次材料位于 output/qa/rillora-public-discovery-rollout-20261016。第一阶段UPDATE_COMPLETE，原首页与LIVE函数逐字节一致，51个assets／pages从S3实际读取并匹配。第二阶段也已UPDATE_COMPLETE：最终模板与源码合成完全相同，分发／bucket／网址未变，LIVE函数匹配；53个公开HTTP文件（含20语言页面）字节、CSP与无Cookie检查通过，非公开路由的根index及构建marker另经S3逐字节确认。根网址匹配英文首页，私有入口404和指南／语言跳转符合原边界。

Chrome实际打开英文文章，语言控件切换至中文路径及完整中文正文，截图检查通过；未重跑旧本地矩阵。日志没有Rillora页面／CSP错误；MetaMask扩展警告仅归为外部扩展，不改用户扩展。

## 搜索平台接续

原Google账号没有Rillora Search Console资源，已新增rillora.xyz域资源。改用手动TXT，避免把GoDaddy DNS账号管理权交给Google。既有gddy keyring成功刷新并读记录；只增加一条Google验证TXT，34变35，所有原记录（含其他根TXT）完全保留。两权威与Google／Cloudflare公共DNS均读到新记录。Google随后明确显示所有权已验证，进入的资源精确为sc-domain:rillora.xyz。

已收到站点地图成功提交回执，并在报告中读回唯一https://www.rillora.xyz/sitemap.xml记录；报告最后重新加载仍显示无法抓取／无法读取、0已发现。普通HTTP与模拟Googlebot User-Agent均返回200和有效text/xml、20唯一规范网址；robots允许抓取。按[Google官方诊断步骤](https://support.google.com/webmasters/answer/7451001?hl=en)完成该XML的实际网址测试：页面显示2026-10-16 20:13:07，Google Inspection Tool smartphone，允许抓取、网页提取成功、允许编入索引。实际即时提取成功与常规报告仍未读取是两种证据，不能合并成索引通过，也尚不足以断言错误原因。没有反复重提或请求把XML本身编入索引。

Bing首次基本资料授权已由Owner当场明确确认：仅原Google账号的姓名、头像和邮箱，用于bing.com站长登录。前一回调返回oauth_failure；从官方入口建立新流程、保持同一账号和范围后登录成功，没有据此再次要求Owner授权，也没有确定该错误的根因。

手动添加https://www.rillora.xyz/，沿用既有GoDaddy CLI只新增Bing指定的一个独立CNAME。记录35变36，所有旧记录完整保留，两权威及两公共DNS均确认。Bing验证后进入该站点专用后台；关闭验证面板时其前端removeEventListener异常造成空白，重新加载原站点后台后恢复。没有修改用户浏览器扩展或站点代码来掩盖提供方错误。

Bing站点地图只提交一次，页面实际保存1条、状态Processing，0报告错误／警告、0已发现，尚非抓取或索引完成。没有导入Google Search Console数据、委托GoDaddy账号管理、启用Microsoft Clarity、广告或付费功能。两条搜索验证DNS记录是持续所有权证明，应保留，不按临时测试记录删除。

新官网公开不代表MCP已开放、搜索引擎已收录、AI已推荐、目录获批或App审核通过；原生构建、用户账户和收费配置均不在本次发布范围。

## 保存与后续

本轮[新增保存包](../../collaboration/verification/public-discovery-rollout-20261016/README.md)的archive43保存226路径／118对象／1,646,127密文字节，本地认证通过，旧archive1—42不重封、不重下。认证URL、原始DNS管理对象、账号页面、私密标识及凭据不发布；公开页面、裁去账号区域的结果图、无凭据部署日志和精确产物单独记录。最终Git、CI和新增归档的独立远端认证结果在收尾回执中记录。

接续独立HTTPS候选中的Web选择授权到MCP闭环，消费端／目录和模型实际选工具仍逐平台验收；Google常规站点地图报告与Bing处理结果在下一次工作时读回，不以反复提交代替等待处理。
