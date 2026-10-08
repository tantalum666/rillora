# Rillora Cloudflare 托管迁移交接

更新时间：2026-10-08（Asia/Hong_Kong）
状态：Owner已明确由Agent执行；legal正式域名CNAME已切换，独立DNS/TLS/七页GET及Mac Safari导航验收通过。

仅legal从custom-domains.chatgpt.site改到rillora-legal-pages.pages.dev，GoDaddy配置TTL600、其余33条记录保持。
Cloudflare域名与证书active；复用本页原部署，无新上传。最新完整结果见
[本机整合与切换](dot-integration-20261008.md)和[当前handoff](handoff.md)。
原iPhone Safari、live HEAD/write/未知路径矩阵未取得本轮结果；不与已通过的GET和Mac Safari混为一谈。

## HISTORICAL — 09:24交接正文

以下是切换前的带日期事实和执行设计，其中“待执行／暂缓／未完成”已被上方本轮执行结果取代，
不是活动指令。原始Cloudflare部署和本地Worker验证仍保留其当时证据范围。

本文只接续本次公开托管迁移，不替代原生指南、套餐/Restore 或整个产品的当前交接。此前[外链守卫检查点](qa/external-links-20261008/README.md)中的“尚未部署、预览保留私有”是较早状态；本次部署及 Owner 随后明确批准公开动效预览，以本文时间点为准。旧报告保留为历史证据。

## 1. 当前可用地址与证据

### 法律页面

- Pages 项目：`rillora-legal-pages`
- 已在普通云端 Chrome 验证的稳定地址：[Privacy](https://rillora-legal-pages.pages.dev/privacy)
- 本次 deployment：`b39769d9-d5dc-4b19-84b1-f4b9dbefca80`
- 七条路径：`/privacy`、`/terms`、`/subscription-terms`、`/refund-policy`、`/acceptable-use`、`/cookies`、`/legal`
- 七页均实际渲染，标题正确、图片加载完成，页面锚点没有 GPT 托管链接；根路径实际转到同站 `/terms`
- 新旧 Legal Notice、Privacy 的完整渲染正文逐字相同；其余五页采用相同已发布源码，但未取得旧站本轮完整正文作逐字比较
- Cloudflare API 已回读确认终态成功，deploy 完成时间为 2026-10-08 01:06:21 UTC；该回执在 01:22 UTC 通过只读检查取得。此前两次读取返回取消错误，Owner 明确表示未暂停，不能把该错误归因为 Owner，也不能据恢复成功断言平台根因已修复

法律源是原 Sites v10 的精确提交 `8a884b58882c721f536afe0c82f013f786f7e656`。六项正式发布字段从现有公开 Legal Notice 恢复，并由 Privacy 独立核对。实际姓名、地址、环境文件和含这些内容的构建包不进入本次明文 Git 文档。原云端 CI fixture 没有用于上线。

保留的法律合同标识：

- Terms：`terms-2026-08-27-1`
- Privacy：`privacy-2026-09-15-1`
- Clickwrap：`registration-clickwrap-2026-08-24-1`
- Bundle SHA-256：`3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602`

### 动效设计预览

- Pages 项目：`rillora-motion-review`
- 已实际验证的地址：[Rillora motion review](https://rillora-motion-review.pages.dev/)
- 本次 deployment：`7daf00d2-e8ce-47b8-806b-3800e5035680`
- API 回读确认 latest/canonical production 均为该成功部署
- 精确采用原 Sites v2 源提交 `5f39ba695dae0683fd65151f97c8e5c6a6e66922`，27 个静态资产保持原字节
- 发布前检查源码、图片及视频采样：品牌素材和明确的合成 Mum/Alex 示例，没有发现真实私人记录或凭据
- 普通云端 Chrome 验证首页、字体/图片、Original/Animated/3D-still 三种模式、Mum/Alex 过滤、示例详情展开、两段视频播放/重播/全局暂停
- 移动端和 reduced-motion 没有在本轮另做浏览器验收

Owner 明确同意迁移后的动效预览公开。旧 Sites 预览的访问设置没有修改；原发布仍保留用于回退。

## 2. 唯一托管续接步骤：GoDaddy 的 legal CNAME

**本轮没有修改 GoDaddy DNS，也没有批准或执行新的 Mac 工作。不要把 Cloudflare 临时地址可用写成正式法律域名迁移已完成。**

Cloudflare 中已关联 `legal.rillora.xyz`，domain ID 为 `95c7c7fe-f44e-4db1-9ace-1a59c7fee9da`。创建回执显示 `initializing`、HTTP validation 初始化、verification pending，证书机构为 Google。DNS 切换前仍需回读该关联当前状态，避免重复创建。

待执行的唯一 DNS 修改：

| 字段 | 当前值/要求 | 目标 |
| --- | --- | --- |
| Zone | `rillora.xyz` | 不变 |
| Type | `CNAME` | 不变 |
| Name | `legal` | 不变 |
| Value | `custom-domains.chatgpt.site` | `rillora-legal-pages.pages.dev` |
| TTL | 先读取 GoDaddy 当前配置并原样保留 | 不擅自修改 |

2026-10-08 01:14 UTC 的 Google Public DNS CNAME 回答仍为旧目标，返回 TTL 600 秒。该数字是递归解析回答，不替代 GoDaddy 配置回读。回退必须使用变更前快照中的准确旧值和 TTL。

### 已有 CLI 在哪里

[GoDaddy CLI 合同](../tools/godaddy/README.md)记录：

- Owner 的 Apple Silicon Mac 已安装官方 `gddy` 0.2.20，路径 `~/.local/bin/gddy`
- `~/.local/bin/rillora-dns` 指向项目 `tools/godaddy/rillora_dns.py`，固定 `rillora.xyz` / `prod`，只暴露 list/add/set
- 已有可刷新的 OAuth 保存在 macOS keyring；October 1 实际读取曾自动刷新成功
- 当前云端没有该 CLI/Keychain 会话；不要导出 Keychain、把令牌写进参数/环境文件/Git，或为了迁移另建 PAT
- 该历史状态不能代替执行时的认证和 DNS 回读；只有实际需要新登录/授权时才交给 Owner

恢复该步骤时，在经确认的 Mac 执行环境中先读取当前 wrapper/help，再使用已有命令：

```sh
gddy auth status --env prod --credential-store keyring
rillora-dns list --type CNAME --name legal
```

`set` 的精确参数以该机当前 wrapper/help 为准，不照抄未经核验的猜测命令。先 preview，保存 owner-only 全区快照，再按其 `--apply` 流程执行。

### 操作与验收顺序

1. 重新确认 Cloudflare 两个 Pages 站点与法律域名关联状态；复用当前部署，不重新上传同一版本
2. 从 GoDaddy 读取当前全区记录、准确的 legal CNAME/TTL，保存受保护快照；如果当前值已变或有并发修改，停止重评
3. 仅把 `legal` CNAME 改为上表目标；保留 TTL、其他所有记录、注册商和 nameservers
4. 使用现有 wrapper 的单条 CNAME guard。它可能先删除旧值再添加新值，存在短暂解析空窗，并会在失败时尝试恢复；不得称为原子事务。失败后先读当前状态，不盲目重写
5. GoDaddy API 回读准确新值/TTL并验证其他记录未变；再查两个权威 DNS 和公共解析器
6. 等 Cloudflare 自定义域名/证书 active，验证 `https://legal.rillora.xyz` 的 TLS、七条 GET/HEAD 路由、根跳转、未知/account/API/write 拒绝、安全头、缓存及实际 Privacy→Terms 导航
7. 对原报错的 Safari/设备实际验收，不能用云端 Chrome 成功代替。完成后再更新全局交接的托管状态

严禁改动 MX/SPF/DKIM/DMARC、`www`、`app`、`app.staging`、`login`、FanPass、账号安全或付费计划。现有 WWW 记录曾有 CLI 特例失败，不可据此推断 legal 必然失败或重复重新认证。

## 3. 发布方式、免费额度与回退

官方 Pages API 接受 multipart `_worker.js` 部署。普通 asset-store 检查曾返回授权错误，未绕过或重复该路径；最终使用独立的官方部署入口，将已验证的公开资产嵌入 Worker module。没有创建 Cloudflare API key、Access 配置、付费计划或新 DNS zone。

法律站保留严格 Worker 合同：仅 GET/HEAD、七条白名单、根 308、未知/账户/API/write 404，CSP 禁止连接和表单提交、frame deny、nosniff、no-referrer、HSTS 和原缓存策略。内嵌资产也经过相同处理。动效预览另保留正确 MIME、HEAD、ETag/304 和 MP4 Range/416。

所有请求都会调用 Functions。Workers Free 账户共享每日 100,000 次动态请求和每请求 10 ms CPU 限额；不能宣传成无限静态请求。未升级付费。两个项目使用 2026-10-08 compatibility date，fail-open 关闭；额度耗尽可能中断访问，需要按真实用量评估。

回退原则：

- 旧法律 Sites v10、旧域名绑定和旧动效预览未删除
- DNS 尚未切换时，不需要回退 DNS；如未来切换后失败，仅按变更前快照恢复 legal CNAME 的旧目标和 TTL
- 保留新旧部署及回执到正式域名与设备验收接受，之后再决定退役旧托管；本轮不删除历史版本
- 此迁移不改变 AWS API、数据库、CloudFront 前端、Auth0、用户会话、支付或原生发布

## 4. 本轮验证与未验证项

- 原法律构建成功，7/7 法律 Worker/打包测试通过
- 扩展法律检查：14 个 GET/HEAD、35 个 write 拒绝、6 个未知路径拒绝、根 308、版本/摘要/安全头通过
- 内嵌法律 Worker：77 个路由/方法差分、34 个资产 GET/HEAD 检查通过，17 个资产解码后与构建字节一致，资产 POST 拒绝保留
- 动效：10 个源测试及 104 个服务检查通过，包含27资产字节、MIME、HEAD、ETag、304、视频范围及未知路径
- 新旧法律站 live JS/CSS 指纹文件名匹配；原站 raw response/all-binary 哈希没有取得，不宣称完成线上全资产逐字节回读
- Python 普通 HTTPS 请求遇到 Cloudflare 403/error 1010；普通云端 Chrome 能实际访问两个站点。没有伪造客户端或绕过防护
- 正式 `legal.rillora.xyz` 的 DNS/TLS/HTTP头验收、原报错设备和 GoDaddy 切换均未完成
- 全仓库/原生完整测试不是本次托管检查的结果；已有外链 guard CI 继续作为其原检查点，不重复冒认

发布对象指纹（不包含发布凭据）：

| 对象 | SHA-256 |
| --- | --- |
| 法律内嵌 Worker，808402 bytes | `e8a24150fa2d149c5321696ff35ddb34864c66d69204e9f5b577370d4511bda6` |
| 动效内嵌 Worker，2892522 bytes | `4697b42233ede8e1fa82657289745e0143f7a717663c2872b13f1ac9dcd6e88d` |

## 5. 本轮决定与过程

目标：移除已知 Rillora 的 GPT 底层公开托管，同时保留法律原文和正式 URL。尝试：读取现有账户、恢复精确发布源、核对真实公开字段、验证包，使用官方 Pages 部署 API。变化：Owner 明确同意动效预览公开；验证 Cloudflare 邮箱后项目创建成功；GoDaddy 的既有认证仅在 Mac keyring。结果：两个独立 Pages 站点已发布并实际渲染，法律域名已关联待验证。未完成：Owner 最新要求暂缓 GoDaddy 操作并先写交接，故仅保留上述唯一 DNS 续接步骤。

本次 Git 变更仅新增这份聚焦交接，不覆盖并行指南/原生工作或共享历史文档，不上传旧被拒的详细日志、真实发布字段、Keychain、token、环境文件或构建二进制。后续整合者应将实际 DNS 验收结果同步到当前 `docs/handoff.md`、相关规范、decision log 和项目旅程，不能提前标记完成。

官方参考：[Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)、[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)、[Functions 计费](https://developers.cloudflare.com/pages/functions/pricing/)、[GoDaddy CLI](https://developer.godaddy.com/en/docs/api-users/cli/set-up)。
