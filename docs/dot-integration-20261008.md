# Dot 整合与法律域名续接 — October8

Status: REVIEW CANDIDATE; FINAL NATIVE/CI VALIDATION IN PROGRESS
Updated: 2026-10-08 (Asia/Hong_Kong)

Owner要求审查、直接修复并合并Dot新增工作，并明确由本机会话执行原GoDaddy续接。
基线为06da36071，保留手机上35f37e1b2的分类栏与原套餐/恢复修正。

## 整合范围

- external-link-hygiene的1ec30b7a3已被cloudflare-hosting-handoff的3ae1abf6d包含，不重复应用。
- guide-layout-locale的0fb73e434：双端18份中文指南正文、原生搜索/详情导航布局、去除自报完成标记。
- web-plan-layout的a3cd0dfac：集中导航CSS、设置/身份状态、Family权益与当前Web报价。
- 候选分支codex/dot-integration-20261008，拟合回当前操作分支codex/matter-category-bar-20261008，
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
8项真实原生目录测试、186项Web非法律检查及internal/public构建通过。首次原生UI失败、诊断和
实际修正均保留；最终双语/尺寸/来源路径、Release及合并后浏览器/CI结果随后补充。

QA：[本轮证据](../output/qa/rillora-dot-integration-20261008/)。DNS全区/法律原文/个人字段仅保护保存。
这轮DNS执行不等于应用Web/API部署、TestFlight、真实新购或普通客户开放；既有价格、数据和暂缓项保持。
