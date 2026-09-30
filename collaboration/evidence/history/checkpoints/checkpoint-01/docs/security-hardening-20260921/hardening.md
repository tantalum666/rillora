# Security Hardening Review: Rillora information protection

## Current selection — September23

Owner selected Option2 onSeptember22. [Implementation](implementation/envelope.md) and[operations](implementation/operations.md) now own the engineering contract and rollout state. The comparison and structuredJSON below remain the September21 design/research snapshot; their former open selection question is no longer an active gate. See the[current handoff](../handoff.md) for measured results.

## Historical Evidence Basis

我们希望把信息保护变成可信的产品优势。我检查了当前Matter读写、共享截止副本、浏览器草稿、原生会话、加密导出和基础设施源码，并沿用当天已回读的AWS状态。当前工作树没有可用的不可变Git提交，本次文件哈希见[context](context.md)。这是聚焦设计审查，不是独立渗透测试、全库扫描或认证。

已有基础包括数据库存储加密、数据库连接证书校验、按用户隔离、逐人逐项共享及客户端加密恢复包。重要差别是：普通在线Matter仍可由数据库合法查询和应用读取；一个加密导出路径不使全部产品成为端到端加密。

## Constraints

沿用现有Web/iOS、Free1/Family5、最小信息地图及自助恢复体验，不增加密码／私钥托管，不改变年付88.80。Owner希望个人经营、低固定成本、尽快上线，因此我们优先减少独立服务和恢复复杂度。基线安全必须同时覆盖Free和Family。源证据保持不变；本轮不迁移私有内容或购买服务。

## Opportunity Portfolio

| Opportunity | Evidence | Options | Recommendation | Proposal |
| --- | --- | --- | --- | --- |
| 为在线私有内容建立独立于数据库读取权限的加密边界 | Matter明文字段、共享JSON副本、RDS透明解密、有限范围的加密导出 | 1现有存储加密＋生产补强；2应用层信封加密；3客户端端到端加密 | 首发建议2，同时完成所有选项共同的生产保护；3在独立恢复／接收人密钥设计完成后再决定 | [私有内容与密钥边界](proposals/private-content-boundary.md) |

## Recommendation Summary

我推荐选项2作为首发工程方向：保留现有使用体验，在数据进入数据库前加密敏感内容，由独立密钥服务保护数据密钥。它能让只有业务数据库读取权的人拿不到受保护正文。我们仍必须承认应用运行时可以解密；这不能宣传成“连Rillora也无法读取”。

强认证、敏感操作重新确认、内部TLS、日志脱敏、备份恢复和第三方验证不由AES代替。我们应先用可测试的要求完成这些保护，再发布简洁的安全说明；不能为赶上线先贴一枚“银行级认证”徽章。竞品、技术标准、成本和宣传范围见仓库中的`docs/security-positioning-20260921.md`。

## Next Decisions

本轮给出推荐而未把它写成已实现或Owner已选择的架构。若Owner优先要求“平台也无法解密”，应选择选项3并接受恢复及共享密钥工程；否则先实施选项2和共同生产门。正式SOC2报告需要独立执业机构，AI可以准备证据，不能给自己的系统出具独立鉴证。

[Structured analysis](hardening.json)列出证据、六项工程取舍、验收和剩余风险；该JSON保留原研究日期；后续已选定并建立implementation目录，状态以顶部当前选择为准。
