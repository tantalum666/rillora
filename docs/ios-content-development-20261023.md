# 下一版本 iOS：办理包、文件、原声与 HealthKit

Status: SOURCE AND SYNTHETIC NATIVE ACCEPTANCE COMPLETE / NOT DISTRIBUTED
Last updated: 2026-10-23 (Asia/Hong_Kong)

Owner明确继续补齐原生三项内容功能并接好HealthKit，先开发和测试、不影响当前审核、暂不发TestFlight，完成推GitHub。该指令取代上一交接中“先核实审核结果再开始原生集成”的开发等待门；分发仍保持关闭。

## 实施范围

沿用[已部署的Web内容合同](web-content-development-20261022.md)和同一API，不修改线上、价格、订阅、真实数据或FanPass。下一版独立XcodeGen工程继承当前App，加入本地内容模块、心率模块及明确的编译条件；当前主工程、Info.plist、entitlements和在审版本材料保持。只做开发构建／模拟器、纯合成协议与交互测试，不上传、归档分发或安装到Owner真机。

- 办理包：创建、编辑、步骤依赖、事项／官方指南／文件版本关联、导出、删除、明确现在共享／撤销，以及接收方读取、文件取得和进度记录。默认私有；身后意向不发布，已下载副本不能召回。
- 文件：系统文件选择器、有界读取、允许的PDF／图片格式、私有上传、版本化名称／说明编辑、下载与系统导出、删除。取消、失败、重试、权限到期和账号切换均保持明确状态。
- 原声：主动请求麦克风、最长三分钟、与现有API相同的16kHz单声道PCM WAV；播放、删除、文字草稿、本人确认。可选Apple本机语音识别只在支持且获准时使用，强制本机、不回退服务器；不支持仍可手工填写。后台／中断停止，临时文件受保护且清理。
- HealthKit：沿用[只读心率合同](healthkit-preparation-20261020.md)，用户主动请求、最近24小时／最多200条、仅内存、关闭／后台清除，不进入文件、录音、网络、导出、MCP或披露。

## 验证合同

检查共享协议和UUID／版本／文件类型／大小边界、循环依赖、过期权益取回、失败后保留草稿、取消及迟到响应、账号隔离和撤销后关闭内容。模拟器验证中文／英文、原生入口、编辑／文件／原声路径和HealthKit可选入口，合成数据与实际个人授权严格分开。只读检查下一版权限配置和当前审核源指纹，Git提交后读取实际CI。

已有Web626项API、72项基础设施及正式合成验收不重复冒充本轮结果。原生测试、真实HealthKit授权／手机采样和后续发布分别记录；本轮不宣称后两项已发生。

## 官方接口依据

- [HealthKit授权](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data)：读取拒绝不能被推断为生理异常。
- [Apple本机识别支持](https://developer.apple.com/documentation/speech/sfspeechrecognizer/supportsondevicerecognition)：本机识别必须检查支持并强制本机请求。
- [麦克风请求](https://developer.apple.com/documentation/avfaudio/avaudioapplication/requestrecordpermission(completionhandler:))：仅用户主动录音时请求。

## 当前证据

已完成独立`RilloraNext`工程、`RilloraContentKit`模块、当前API的账号绑定适配以及只读HealthKit入口。默认原工程不链接新模块或请求新权限。生成工具复制原Package.resolved并验证当前审核源不变，构建使用锁定依赖；最初自动解析到较新Auth0／传递依赖的开发构建是历史检查点，最终原生验收使用与当前工程完全一致的远端pins，没有升级现有认证栈。

14项纯模块测试通过。当前15项原生用例按变更定向复验均有通过回执：9项原生适配／文件／录音边界、1项真实本地API与数据库的跨客户端闭环、5项中英文／接收人UI。另有8项发布隔离／双语资源检查及API夹具TypeScript检查通过。不是宣称15项在最后一个命令中全部重跑；每项最后相关结果、失败原件与源码边界见[本轮回执](../collaboration/verification/ios-content-20261023/README.md)。

两种语言均完成原生办理包与步骤保存、HealthKit入口、文件说明修改、系统文件导出、重新选取同一文件导入，并从API下载核对逐字相同；原声页面可见但没有录取环境声音。Apple音频文件编码器的合成PCM输出已实际规范化并通过API格式核验；权限拒绝、授权等待期间退出、临时文件备份排除／清理、导入取消、账号退出后的迟到响应等通过。实际本机语音授权／识别质量仍待设备验证，未用人工草稿冒充识别结果。

本地真实API验证文件与原声上传重试不重建、冻结文件版本、未确认文字不交付、步骤前置条件、接收人记录进度、换披露安排撤销、明确重新共享／撤销，以及权益到期后的读取／删除。数据库本来就会在更换亲友或披露安排时撤销旧共享；早期测试误读了源码注释，已按实际约束改正断言与文案，没有放松数据库规则。普通步骤／文件编辑仍不自动更新已发布副本。

修正的实际原生问题包括：独立工程误复制原Info.plist导致重复产物、权限资源目录覆盖中文字符串、进度折叠区域标识遮蔽子控件，以及撤销后SwiftUI表单仍短暂保留旧辅助功能节点。当前中文／英文资源都保留，进度已从真实UI写入API，撤销后内容和辅助功能节点都移除。网络临时失败隐藏接收内容但保留内存草稿，明确失效才清除。

模拟器不提供真机数据保护类；因此原错误的硬件保护断言单独标为HISTORICAL，当前用例只证明备份排除和清理，源码仍请求complete保护。个人HealthKit授权、真实手机／手表读数、麦克风和本机识别、硬件保护及后续分发均不在本轮通过声明中。原HealthKit库的6项合成测试沿用October22检查点；本轮只补组合工程和入口／隔离验证。

当前主project.yml／Info.plist／entitlements／Xcode项目的字节指纹一致；无Apple后台、线上API/Web、数据、价格、收费或FanPass修改，无新TestFlight／归档上传。专用本机夹具已停止，合成数据库和模拟器文件保留为QA资料，不称已删除。GitHub结果以本轮回执和实际PR记录为准。

源码及原始证据已推至b17d76f32／[PR9](https://github.com/tantalum666/rillora/pull/9)。新增archive50的425对象／792路径已从独立空LFS目录远端下载、解密并逐字核验；旧1–49不重做。最后元数据提交的实际CI仍以PR原生检查为准，不预写自引用提交号。
