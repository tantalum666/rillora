# Dot 整合与法律域名续接 — October8

Status: MERGED; LEGAL DNS CUTOVER VERIFIED; COMPLETE WORK PUBLISHED / REMOTE VERIFIED
Updated: 2026-10-09 (Asia/Hong_Kong; October8 work closeout)

Owner要求审查、直接修复并合并Dot新增工作，并明确由本机会话执行原GoDaddy续接。
基线为06da36071，保留手机上35f37e1b2的分类栏与原套餐/恢复修正。

## 整合范围

- external-link-hygiene的1ec30b7a3已被cloudflare-hosting-handoff的3ae1abf6d包含，不重复应用。
- guide-layout-locale的0fb73e434：双端18份中文指南正文、原生搜索/详情导航布局、去除自报完成标记。
- web-plan-layout的a3cd0dfac：集中导航CSS、设置/身份状态、Family权益与当前Web报价。
- 候选分支codex/dot-integration-20261008已通过PR2合入当前操作分支codex/matter-category-bar-20261008，
  不用旧main覆盖近期原生修正。浏览器工作流冲突已合并两侧触发分支和回归覆盖。

## 本机发现与处理

实际运行新增原生导航测试发现：整个页面的accessibilityIdentifier覆盖了安全区搜索框的独立标识。
搜索框本身可见，不能误报为整块UI缺失。已将页面标识约束到列表，使输入框保持独立标识。
实际点击检验还发现文字外的留白不能激活键盘；用本地FocusState让44pt搜索区域整体可点，
离开页面时结束焦点。没有加入延时、固定顶端偏移或隐藏内容来掩盖导航问题。

检查期间曾因不完整代码片段误判限制说明未被渲染，并临时添加重复卡片；完整差异已纠正，
重复卡片在合并前删除。原有限制说明继续只显示一次，新增UI断言核对其语言和唯一性。
该误判不算Dot缺陷，也没有部署到用户手机。

## 法律域名执行结果

仅legal CNAME在本机11:15改到rillora-legal-pages.pages.dev，保持TTL600；独立回读34条记录，
其他33条完全一致。两台权威NS目标及两个公共解析器返回新目标。Cloudflare域名、验证、证书均active。
既有法律和动效部署ID保持，不重新发布同一包，不改其他DNS/邮件/账号/FanPass。

Chromium实际访问七条法律路由均200/TLS1.3，CSP、HSTS、nosniff、frame-deny、referrer与缓存头保持；
根308到Terms，Privacy→Terms可点击，新旧Privacy渲染正文一致。Mac Safari也能打开两页并导航。
Python匿名请求仍被403/error1010客户端规则拦截；浏览器检查器阻止/account负面探测，未绕过，
没有将live HEAD/write/未知路径矩阵或原iPhone Safari写成通过。原不变Worker的分方法验证保留原日期。

## 验证与边界

18份中英文逐项读过，剥离translations后全部英文/URL/权限/匹配字段与操作基线一致。
8项真实原生目录测试、186项Web非法律检查、7项法律fixture、24项原生guards及internal/public构建通过。
最终中文深色3项UI通过；英文浅色的大字sheet、Apple来源/限制说明及录屏冷暖导航3项分别通过。
一次英文查询在模拟器严重迟滞时超时；只重启任务自己的模拟器并重跑该失败项后通过，原失败保留。
unsigned Release构建成功。整合产品源码68d707d的CI96和43项浏览器检查通过，下载ZIP指纹匹配。

最终锁文件补丁为8cdaf2eaa：四处source-map-js1.2.1→1.2.2，API proxy-addr2.0.7→2.0.8。
只更新兼容依赖，无npm全量升级；额外libc元数据变动已撤回。Web/API/原型npm审计0告警。
CDK内嵌brace-expansion仍是既有开发工具上游限制，不宣称全仓库零告警。Rillora代理配置只接受数字跳数，
没有采用proxy-addr通告里的IPv4-mapped网段配置；没有把版本命中夸大为线上利用已证实。
补丁后的[CI100](https://github.com/tantalum666/rillora/actions/runs/37802621140)三任务通过，
[浏览器11](https://github.com/tantalum666/rillora/actions/runs/37802621178)43项通过，原型重新安装/构建通过。
[PR2](https://github.com/tantalum666/rillora/pull/2)已于2026-10-08合并为392f0e81db802c71228315877b8ad4f80dec778f，
实际合并tree与已验8cdaf2eaa完全一致。本机操作分支只做fast-forward，旧main/其他项目保持。
最终浏览器ZIP11562011289已从GitHub下载，13,125,782bytes、SHA25693a9a907470dd10fc22fb7938fb5c8314801bfea4b824bc1f66e586177562f90一致。
[源映射通告](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)、
[代理地址通告](https://github.com/advisories/GHSA-jqcg-44mw-7w3h)。

QA：[本轮证据](../output/qa/rillora-dot-integration-20261008/)。DNS全区/法律原文/个人字段仅保护保存。
这轮DNS执行不等于应用Web/API部署、TestFlight、真实新购或普通客户开放；既有价格、数据和暂缓项保持。


## October9保存收尾

[Archive25及回执](../collaboration/verification/dot-integration-20261008/README.md)新增9,810路径/1,049对象，
632,132,864加密字节，包含失败原件、测试产品、录屏及两份完整CI浏览器ZIP。
保存提交758e6dc5f已在GitHub；新独立LFS下载、解密与目录核验全部通过，旧1–24不重新下载。
可读材料扫描0未审核发现；本轮临时合成fixture和Safari验证标签已清理。最终文档元数据提交不重跑产品测试。
