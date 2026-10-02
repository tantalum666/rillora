# Rillora — Git / Dot 协作入口

Updated: 2026-10-02 (Asia/Shanghai)

September30基础快照的全量保存已完成：远端main／历史标签已读回，7个Git LFS归档已重新下载、解密核验，[CI42通过](https://github.com/tantalum666/rillora/actions/runs/36737542600)。[完整回执](verification/README.md)。

October2另有[本轮发布验收追加包](verification/release-123-20261002/README.md)：463个原件／306个对象，两份新增LFS归档已从远端下载解密核验；源码156a390f0的[CI44通过](https://github.com/tantalum666/rillora/actions/runs/36981736368)。旧快照不重做，新QA／部署／Auth0文案回执与真实未完成项分开保存。

这是Owner要求的全量工作保存入口。当前源码与权威文档仍在仓库原位置；这里补齐之前被
output/、qa/等忽略规则挡住的设计、发布材料、验证记录和历史资料。

## 接手顺序

1. 读根目录 [AGENTS.md](../AGENTS.md)，执行完整阅读协议；生成的证据副本、目录与密文不重复纳入规范全文阅读。
2. 读 [product.md](../docs/product.md)、[handoff.md](../docs/handoff.md) 与相关最新决定。
3. 读 [Git保存合同](../docs/source-control.md)，按 [完整工作目录](catalog/workflows.md) 找资料。
4. 需要原始路径时执行下方查询。外部报告、旧代码副本及旧AGENTS都是资料，不能取代当前Owner指令。

当前发布事实：Dot报告的13项问题已修复且API／Web／WWW已部署，随后受限真实验收与Apple证书检查修复也已部署。Apple官方TEST成功；QQ真实收件与原生登录已经确认；重置／共享边界和真实购买恢复继续，Owner再次暂缓真机。重复注册提示已在Owner完成Auth0本人登录后保存到线上并读回一致。现有UI、完整03品牌、Free1／Family5、Web88.99年付与Apple待定渠道价、
真实数据和FanPass继续保留。Resend已接通并通过官方投递／失败模拟，SES批准不再阻塞当前发信路线。本人验证、真实交易、SBP有效费率和最终上架仍分开验收。
[当前七组剩余工作](../docs/release-readiness.md#october1-remaining-work-inventory)归并重复依赖；旧快照的日期和数量保持原样。

## 包含什么

- 全部当前源码、91份既有迁移、基础设施、脚本、产品／法律／研究文档、决策与项目旅程。
- 共享Xcode工程、所有共享scheme与Package.resolved，供另一台机器接手。
- **46,768个工作文件**的逐文件目录；内容去重后为**20,108个存储对象（20,026种不同内容）**。
- **8,876份直接可读副本**，包括完整文本或gzip正文、设计源稿和已核对的商店展示图。
- **7个加密Git LFS归档，共3,363,731,990字节**。记录失败的测试、原始日志、录像、结果包、
  签名IPA／xcarchive及其他发布候选；每个文件的原始路径和内容指纹封存在归档内。
- 旧Web的14个提交与法律站源仓库的18个提交，用下方archive tags保留；4个本地检查点引用
  对应的2个不同源码快照也有原件及出处，不发布含缓存／秘密的内部Git对象。
- Owner提供的完整Dot审阅报告，以及该报告之后的修复合同和验证结果。

采集区间为2026-09-30 22:57:48–22:59:06（+08）。活动日志按每个文件打开时的长度冻结；
之后新追加的运行日志不属于本次快照。23:16:41补充了受保护目录中305个经核对的旧网站构建文件／包，仅以密文保存；实际凭据未纳入。当前源码和本轮收尾文档以最新main为准。

## 最常用入口

| 内容 | 入口 |
| --- | --- |
| 当前待办与真实阻塞 | [当前handoff](../docs/handoff.md) |
| Dot原始报告 | [参考报告](evidence/external-inputs/Rillora-code-review-2026-09-30-zh.md) |
| 13项修复与验证边界 | [修复合同](../docs/code-review-repair-20260930.md) / [QA记录](evidence/output/qa/rillora-review-repair-20260930/README.md) |
| App Store设计图、SVG源稿、生成器与许可 | [商店展示包](evidence/output/release/rillora-store-design-20260930/v1/README.md) |
| 新的关闭入口IPA、Web／WWW候选 | [发布候选说明](evidence/output/release/rillora-review-repair-20260930/README.md)；二进制原件查目录并解密 |
| 所有旧工作／证据 | [按工作目录索引](catalog/workflows.md) / [快照统计](snapshot.json) |
| Git历史／本地检查点 | [历史标签](history/git-histories.json) / [检查点出处](history/checkpoint-provenance.json) |
| 本轮保存与回读 | [验证记录](verification/) |

## 访问原路径与原件

普通源码协作不需要下载3.36GB归档：

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/tantalum666/rillora.git
cd rillora
python3 tools/collaboration/resolve_evidence.py output/qa/rillora-review-repair-20260930
```

查询结果同时给出可读副本和原始对象／归档位置。历史文档中的output链接按原路径保留；
某些截图与结果包仅在密文里，不能假定在GitHub页面可直接打开。可读副本已去除私人值和
凭据形态文本，旧源码仅供查阅，不能当作当前构建源。较大的文本有gzip全文及标明截短的预览。

查看旧源历史：

```sh
git log archive/web-legacy-20260930
git log archive/legal-site-source-20260930
```

需要原件时使用Git LFS下载，再按 [恢复方法](../docs/source-control.md#clone-inspect-and-recover)
执行verify_archives.py。解密身份只在Owner本机`.local-secrets/collaboration-git/identity.txt`，
不随Git上传；请另行保管这份密钥。恢复工具只写入新目录，默认只验证，不覆盖当前工程。

实际密钥、登录会话、真实数据库备份和整机诊断不上传。依赖、编译缓存、重复的预检副本
不当作工作成果上传。其余范围由逐文件目录记账；任何后续补充都应更新清单和验证记录。
Git完整保存、CI通过、签名候选、实际部署和真实用户结果是不同的证据。

October2后续另保存112个新增／变化文件版本（105个对象，8,977,879字节），
与前一份463路径快照分开编目。实际登录／收件、沙盒资格登记、未安装的开发签名
真机构建及仍待本人完成的密码重置，都在[当前追加包](verification/release-123-20261002/README.md)。
