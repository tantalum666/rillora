# 第三方账号图标：实际产品做法与 Rillora 的采用路径

Role: primary-source research and implementation recommendation  
Authority scope: evidence supporting the purpose-specific mark policy  
Do not use for: a vendor license, legal opinion, App Review acceptance or deployment evidence  
Status: RESEARCH CHECKPOINT COMPLETE; SUBSEQUENT COINBASE ROLLOUT RECORDED IN THE CURRENT MARK CONTRACT  
Last updated: 2026-09-19

## 这轮纠正了什么

Owner 继续要求深入调查其他 App／网站为什么可以展示公司 Logo。只查询品牌方的营销／联名手册不足以回答这个问题。实际产品中存在成熟的“网站或账号身份识别”用法，不能一开始就把它当成广告、品牌合作或转售 Logo。

Rillora 可以把功能性识别作为独立的采用依据来评估，不再把取得逐家单独书面许可作为所有图标的唯一前提。公开许可、适用法律中的合理／诚实指示性使用、具体合同约束和分发平台规则仍是不同依据；竞品使用事实不能替代它们。本研究没有取得任何竞品的私下许可合同，也没有把 favicon 文件格式视为自动授权。

当前可执行规则由 [品牌用途合同](provider-mark-usage.md) 管理。本研究检查点保留当时五个已采用的第三方图形标，没有换图、引入图标 CDN 或发布新构建；Owner随后的落地指令已新增Coinbase，六个标志的当前状态见该合同与[后续QA](../output/qa/rillora-provider-icons-rollout-20260919/README.md)。下文完成／未完成项仅描述本研究检查点。

## 实际产品证据

| 产品 | 官方资料能证明的做法 | 与 Rillora 的关系及证据边界 |
| --- | --- | --- |
| Bitwarden | 保存网站 URI 的账号可展示该网站的 Logo／品牌图；按域名从图标服务取得并缓存，用户可关闭。 | 最接近 Matter 中识别某个平台的用途。公开文档和代码证明机制，不能证明其是否另外持有某品牌合同。[官方说明](https://bitwarden.com/help/website-icons/) |
| 1Password | Rich icons 自动为登录项和软件许可证显示相应图标，使用其缓存服务。 | 说明这种用途同时存在于成熟商业产品，而不仅是开源项目。官方文档未公开每一个品牌的许可关系。[官方说明](https://support.1password.com/rich-icons-privacy/) |
| KeePassXC | 用户明确要求时，可为条目下载网站 favicon。 | 提供另一种由用户触发的网站身份图标机制；本地保存并不自动解决图像的权利问题。[官方隐私说明](https://keepassxc.org/privacy/) |
| Home Assistant | 官方品牌仓库集中提供集成的图标／Logo；另有无对应集成、仅用于识别 Thread border router 品牌的类别。 | 不应把所有出现 Logo 的软件都推断为品牌合作伙伴。该仓库证明实际组织方式，不给 Rillora 转授这些品牌的权利。[官方仓库](https://github.com/home-assistant/brands) |

这些证据支持的是“功能性账号／服务识别是一种常见产品模式”。不能进一步断言这些公司逐家申请过、绝对没申请过，或任何新 App 都会获得同样的审查结果。

## 不只看截图：核对 Bitwarden 实现

本次读取官方 `bitwarden/server` 的固定版本 `ebf2a4e3033f8a92db07731c77f07ff3ee3ebabc`，将所查源码和来源保存在 [QA 清单](../output/qa/rillora-icon-practice-20260919/bitwarden-source-manifest.json)。没有将它的实现复制进 Rillora。

- [IconFetchingService](https://github.com/bitwarden/server/blob/ebf2a4e3033f8a92db07731c77f07ff3ee3ebabc/src/Icons/Services/IconFetchingService.cs)：支持按配置尝试 Google favicon 服务，然后寻找网站图标，最后有网站 `/favicon.ico` 回退。Google 路径受配置控制，不能说所有实例始终启用。
- [DomainIcons](https://github.com/bitwarden/server/blob/ebf2a4e3033f8a92db07731c77f07ff3ee3ebabc/src/Icons/Models/DomainIcons.cs)：尝试访问域名并提取图标，包含协议／基础域名的回退路径。
- [IconsController](https://github.com/bitwarden/server/blob/ebf2a4e3033f8a92db07731c77f07ff3ee3ebabc/src/Icons/Controllers/IconsController.cs)：校验域名、缓存并返回图像，获取不到时使用默认图。

因此，可以排除“这些图标必定全是预先建立官方合作后手工放入列表”的技术假设。但代码中没看到合同检查，不等于能证明其没有另行许可。

[HTML 标准的 `rel=icon`](https://html.spec.whatwg.org/multipage/links.html#rel-icon) 本身把该资源定义为在界面中代表网页／网站的图标；[Google Search 的官方说明](https://developers.google.com/search/docs/appearance/favicon-in-search) 也将它用于结果中的网站识别。这解释了 favicon 为什么常见于书签、账号和网站目录；技术标准不是对所有复制／打包／商业分发行为的法律许可。

## Microsoft：比“所有图标不能用”更具体的结果

微软并非对所有图形素材只有一种规则。[Microsoft 365 官方图标页](https://learn.microsoft.com/en-us/previous-versions/microsoft-365/solutions/architecture-icons-templates?view=o365-worldwide) 和 [Azure 官方图标页](https://learn.microsoft.com/en-us/azure/architecture/icons/) 明确允许各自所供图标用于架构图、培训材料或文档。前者当前位于 previous-versions，标注 2024-04-30；后者本次读取标注 2026-07-09。不得把旧素材包的存在写成所有图标已经是最新版本。

但至少存在三种不同对象：Microsoft 公司商标、Outlook／OneDrive 等具体产品图标、架构／功能符号。用于某产品操作说明的图标不能自动代表整个 Microsoft 账号，更不能当作 Rillora 自身的功能标志。该许可也不能从文档插图扩大为整个 App 的导航／品牌装饰。

[微软一般内容许可页](https://www.microsoft.com/en-us/legal/intellectualproperty/copyright/permissions) 对产品图标的文档用途还要求与具体功能对应、保持原样，并列出适用声明。应优先核对实际下载包的具体条款；不能只引用一般禁止段，也不能只摘出“documentation”就忽略用途限制。

这不是纯理论区别。Simple Icons 维护者在 [2024 年移除记录](https://github.com/simple-icons/simple-icons/issues/11236) 中称，微软法务通知其只能采用指定官方集合中未经修改的素材；由于既有图标大多被编辑或来源不符，项目随后 [实际合并移除](https://github.com/simple-icons/simple-icons/pull/10019)。这是维护者关于所收通知的直接记录，不是法院判决，也不等于微软禁止所有原始图标用途。

对 Rillora 的具体结论：**允许继续评估 Microsoft 官方产品图标作为相关指导内的说明素材；不把此许可写成公司 Logo／指南目录识别图已经获准。** 当前公司级目录图不在本轮更换。

## 商标规则与“免费商用”应如何理解

香港《商标条例》第 21 条明确处理诚实识别商标权人商品／服务的使用，并考虑是否不当利用声誉、损害区别性／声誉或欺骗公众。当前 2025 合并文本的正文和 PDF 第 21 条已在上一检查点读取并检查，见 [WIPO 正式文本记录](https://www.wipo.int/wipolex/en/legislation/details/23733) 与 [当时 QA](../output/qa/rillora-provider-marks-20260919/README.md)。这说明商业产品中的第三方识别不应一律归为必须先取得广泛品牌许可；它不同时清除作品版权、已接受合同、其他法域或商店规则。

欧盟 2017/1001 原公布文本 [第 14 条](https://eur-lex.europa.eu/eli/reg/2017/1001/oj/eng) 也有识别／指称权利人商品服务的诚实使用条款。本次页面列出 2025-12-01 合并版本，但该版本正文遇到浏览器检查，未取得完整现行文本。因此这里只作为比较研究，不作为欧盟发布通过证据。美国第九巡回法院可检索到的 2024 指引还讨论必要使用量及不得暗示背书；2026 链接实际返回迁移／空内容，未取得完整现行指引，不能包装为全国统一或本次当前法律认证。

“免费商用组件库”“网站图标”“官方 Logo”分别回答不同问题：

| 问题 | 正确判断方式 |
| --- | --- |
| 是否需要付费买这份文件？ | 看素材包／资源许可。免费取得不等于任何用途获准。 |
| 是否可以在我们的界面引用这个品牌？ | 看实际表达、适用法律、公开授权和合同条件。独立账号识别与营销联名分开判断。 |
| 可以改成 Rillora 的绿色、裁切或加效果吗？ | 看该标志的原样／配色／留白规则；图标库的统一风格不能替代品牌规则。 |
| 是否可以通过 App Store？ | [App Review 5.2](https://developer.apple.com/app-store/review/guidelines/#intellectual-property) 是单独的分发要求，可能要求使用权证明。竞品已上架不是 Rillora 的预先批准。 |
| 写一行免责声明就全部解决吗？ | 声明能帮助区分来源，不能创造许可，也不能修复本身误导的页面。 |

Google 当前 [视觉品牌说明](https://partnermarketinghub.withgoogle.com/brands/google/branding-guidelines/how-to-show-googles-brand/) 区分公司 Logo、G 和产品图标，并有具体的商业／申请条件。旧 Brand Resource Center 搜索片段或论坛转述不能直接代替当前正文。Binance 服务条款中的商标保留也不宜脱离适用范围写成普遍法律禁令。两者可进入功能性引用的逐项评估，但本次未找到足以宣称“官方已普遍许可 Rillora 的具体摆放”的新依据。

## Rillora 采用方案

### 以用户任务决定图标位置

1. **Matter 中识别账号／平台**：作为小型次要标识，和清楚的平台名称同时出现。它帮助 A／B 看出记录的是哪项服务，不表示 Rillora 能登录、访问、转移该账号或已接入官方 API。
2. **独立账号身后指南**：图标识别这份指导讨论的对象，步骤仍由 Rillora 编写，原始链接明确指向平台。品牌许可只覆盖正文说明时，不扩大到整个目录／导航。
3. **营销、合作、认证、登录或支付按钮**：需要对应真实关系和场景规则，不能套用账号识别的依据。

### 维护一个有来源的本地图标表

18 份固定指南没有必要接入按私有账号实时查询的外部 Logo 服务。对采用的原始图标记录：平台／准确产品、官方素材 URL、校验值、取得和复核日期、具体摆放、依据类型、条件、当前采用状态。清单是内部维护记录，不能把声明全文堆进用户页面。

依据类型区分 `published-permission`、`functional-reference-assessment`、`specific-agreement`、`unresolved`，不能把合理引用评估伪装成品牌官方授权。未知状态回退到现有中性图标，同时保留平台名称和完整指导。更换单个素材不应要求重做页面。

使用原文件和准确配色／比例／留白；具体产品图标只代表该产品。Binance 与 Binance.US 分开；1Password／Bitwarden 合并指南不能拿其中一家 Logo 代表两家。图标与相邻同义文本同时出现时，不让辅助技术重复读两次；品牌自身不做呼吸、粒子、变形或重绘，反馈动效放在 Rillora 的行／容器。

### 防止取图标破坏隐私

Bitwarden 和 1Password 的官方说明都指出图标请求会向图标服务／缓存端暴露域名等信息；这对“地图而不是密码”的 Rillora 仍然是有意义的私有事实。因此当前方案采用随原生 App 打包、Web 从自己的静态资源提供的固定集合，**不从 Matter 自动发送域名给第三方图标 API**。即使换成自建实时代理，也仍会留下账号与请求关联，不把“自建”写成天然匿名。

B 的图标和推荐继续只根据 API 已披露的字段决定；不能因为 A 的隐藏字段写了 Binance，就让 B 通过图标猜出平台。撤销后不保留带私有 Matter 上下文的图标行；已经打开的公共指南仍是公共内容。这沿用已有权限合同，不引入新的共享字段或推断能力。

## 本次完成与未完成

- 完成：核对实际产品官方文档、固定版源代码、技术标准、微软具体图标例外和维护者移除记录；修正 Rillora 的采用方法及证据类别。
- 当前图形资产：Facebook／Dropbox／Instagram／GitHub／X 沿用上一轮安装版本；原生 Apple 系统符号仍与可任意分发的公司素材分开。新功能性引用候选未在本轮自动加入包。
- 未取得：竞品私下合同、各品牌逐个书面批准、跨市场法律通过或 Rillora App Review 通过。
- 本轮只做研究和项目文档；没有新 App 测试、构建、模拟器安装、Web／API 部署或真实用户操作。上一轮运行状态见 [交接](handoff.md)。

[本轮 QA](../output/qa/rillora-icon-practice-20260919/README.md) 保存阅读连续性、源码来源、修改范围及文档检查。
