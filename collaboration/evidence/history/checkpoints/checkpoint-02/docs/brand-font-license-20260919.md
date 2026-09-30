# Rillora 字体商业使用核验

Role: font-source verification and distribution obligations  
Status: SOURCE SERIF 4 AND INTER COMMERCIAL USE VERIFIED; NOT A TRADEMARK CLEARANCE  
Checked: 2026-09-19 (Asia/Shanghai)

## 结论与实际使用

Owner选定03 Legacy Imprint后询问字体是否可以免费商用。结论：本版字标使用的 **Source Serif 4 SemiBold**、Web正文使用的 **Inter** 均采用 **SIL Open Font License 1.1（OFL1.1）**。可用于商业Logo、网站、宣传材料和收费App，无须另购字体商业许可证。Figma会员不是这项权利的来源。

| 实际资源 | 本次证据 | 使用范围 |
| --- | --- | --- |
| Rillora字标 | 03继承01的Source Serif 4 SemiBold字标；Figma导出为轮廓，tracking为−1.4% | 正式Logo／锁定组合；SVG不依赖终端安装字体 |
| Web display字体 | `@fontsource/source-serif-4` 5.3.0；实际WOFF元数据为Source Serif 4 SemiBold、Version4.004 | 既有标题；没有更换页面字体或版式 |
| Web正文 | `@fontsource/inter` 5.3.0；Inter官方发布许可 | 既有UI／正文 |
| 原生Logo | 同一轮廓SVG，以template方式着色 | 现有品牌标题位置；原生正文仍使用平台字体 |

Fontsource包版本不等于字体内部版本。本次WOFF的Copyright字段为Adobe2014–2021、Reserved Font Name `Source`。Figma中用于既有轮廓的具体小版本未独立取证，不用Web字体元数据冒充它。

## 官方依据

1. [Adobe Source Serif源许可](https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md)：OFL1.1，列明Adobe版权及Reserved Font Name `Source`。
2. [Google Fonts的Source Serif 4许可](https://github.com/google/fonts/blob/main/ofl/sourceserif4/OFL.txt)：该发行渠道的OFL及版权信息。
3. [Inter官方网站](https://rsms.me/inter/)与[Inter v4.1许可原文](https://github.com/rsms/inter/blob/v4.1/LICENSE.txt)：OFL1.1。
4. [OFL官方FAQ](https://openfontlicense.org/ofl-faq/)1.1、1.1.1、1.1.2：Logo及图形作品可使用，作品本身不因此受OFL约束，也不要求把字体署名放进Logo图案。
5. [OFL使用说明](https://openfontlicense.org/how-to-use-the-ofl/)：网页和软件捆绑使用、版权与许可保留方式。

原文副本、来源和SHA-256保存在[正式资产目录](../assets/brand/rillora/README.md)及[来源记录](../assets/brand/rillora/font-license-sources.json)。不是仅根据第三方下载站或字体外观判断。

## 已落实的许可义务

- 分发WOFF／TTF／OTF等字体软件时，保留版权信息与完整OFL。Fontsource的Source Serif包许可头只列Google版权，本次补充实际字体中的Adobe版权及官方完整原文。
- [项目第三方声明](../THIRD_PARTY_NOTICES.md)、[Web credits](../apps/web/src/assets/design-credits.txt)与[原生credits](../apps/ios/Rillora/Resources/DesignCredits.txt)均已包含字体声明；两端credits字节一致。
- Web／法律站构建随包提供同源`font-licenses-*.txt`，品牌元素保留该资源地址。正式素材包也含完整原文。无需在每个页面、按钮或Logo旁增加大段署名。
- 可以出售使用这些字体的App、设计成果和服务；不得把字体软件单独出售。修改后再分发字体软件要遵循OFL及适用Reserved Font Name条款；本项目只调字距并导出图形轮廓，没有重新命名字体或修改后分发字体二进制。
- Logo轮廓与Rillora应用代码不需要因使用OFL字体而改为开源。

字体许可核验不证明图形商标独占、注册成功或第三方商标清查。当前采用及构建／部署证据见[Logo合同](logo-design-20260919.md)与[本轮QA](../output/qa/rillora-brand-adoption-20260919/README.md)。
