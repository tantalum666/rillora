# Rillora 社交横幅 — 资料册与事项地图

Status: DESIGNED / EXPORTS CHECKED / NOT UPLOADED TO A SOCIAL ACCOUNT
Last updated: 2026-10-19 (Asia/Hong_Kong)

当前交付是02版：一本清楚可辨认的打开资料册，纸页上的文件、文件夹、联系人与云端图形表示事项之间的联系。正式Legacy Imprint03图形和字标保持不变。初版抽象纸带因Owner认为不像书／记事本／地图而退出当前交付，保留在studies目录。

## 可直接上传的文件

| 文件 | 用途 |
| --- | --- |
| [rillora-x-banner-en.png](rillora-x-banner-en.png) | 英文，1500×500，RGB，无网址，约1.17MB |
| [rillora-x-banner-zh-CN.png](rillora-x-banner-zh-CN.png) | 简体中文，1500×500，RGB，无网址，约1.17MB |
| [英文SVG排版源稿](rillora-x-banner-en.svg) | 自包含底图＋原Logo路径＋已转曲文字 |
| [中文SVG排版源稿](rillora-x-banner-zh-CN.svg) | 同上；不依赖收件人安装字体 |

[PNG上传包](rillora-social-banners-upload-20261019.zip)只含上述两张当前PNG和简短使用说明，不包含历史纸带版。

SVG包含生成的位图背景，因此不是全矢量插画。文字转曲后可移动／缩放，改文案请修改[导出器](source/export.py)后重新生成；Logo仍来自原品牌母版，不由生成模型重画。

## 文字与网址

英文：Give someone you trust / a clear place to start. 副文案：Your digital life, organized.

中文：让关心你的人，／知道从哪里开始。副文案：整理重要资料，选择与谁共享。

两个版本各自单一语言；Rillora为统一品牌名。没有价格、未确认handle、二维码、App Store上架或自动继承／E2EE承诺。

Owner询问网址是否违反平台规则。X官方支持资料页Website字段，链接规则限制恶意、欺骗及垃圾链接；本次没有发现“横幅出现正规官网即违规”的明确禁令，也没有获得全部平台的通用许可。Agent为跨平台复用选择不把网址烧录进图片；在支持的平台使用独立网站字段。无网址不代表所有平台尺寸及内容审查已经通过。

## 尺寸与安全区

X官方建议1500×500，并说明上下可能各裁切60px。Logo与文字放在中央偏左的安全区域，避开左下头像区域。背景允许裁切；文字不靠边。PNG和安全区已检查，尚未在真实账号完成上传／保存／平台压缩后的读回。

其他平台请从源稿重新排版，不能把1500×500称作通用上传尺寸。当前没有擅自注册或修改账号。

## 素材与复现

- [当前原始底图](source/open-folio-map.png)：built-in ImageGen，保留原始像素；[生成说明](source/prompts.txt)。
- [Logo母版](../rillora/lockup-reversed.svg)：完整03几何，仅等比例放置。
- 英文Source Serif4／Inter来自现有Web依赖；中文Noto Sans SC来自Google Fonts官方仓库。三个OFL文件保留在licenses目录，不捆绑系统专有字体。
- [尺寸、文案位置与文件指纹](manifest.json)。
- [首版历史说明](studies/01-paper-ribbons/README.md)。

复现需要现有Web依赖、fonttools[woff]、uharfbuzz和sharp。Noto Sans SC字体参数指向从官方源下载的本机TTF，不依赖原机器绝对路径。先运行source/export.py --cjk-font FONT.ttf，再运行source/render.cjs；sharp可通过RILLORA_SHARP_MODULE指定。官方字体源：https://github.com/google/fonts/tree/main/ofl/notosanssc 。

本次仅新增营销素材，不替换App、官网或在审商店材料，不改变数据、价格或收费。

## 官方规则来源

- [X头像与横幅尺寸及裁切](https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo.html)
- [X资料页网站字段](https://help.x.com/articles/166743)
- [X链接限制](https://help.x.com/en/safety-and-security/phishing-spam-and-malware-links)

规则核对日期：2026-10-19；不推断其他平台已通过。
