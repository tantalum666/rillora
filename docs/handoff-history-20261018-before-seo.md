# HISTORICAL — October17 hosted candidate handoff

Superseded by the October18 continuation; not the active next step.

# Rillora 当前交接

Status: FREE SYNTHETIC HOSTING / TWO CLIENTS / SOURCE CI / REMOTE ARCHIVE VERIFIED
Last updated: 2026-10-17 (Asia/Hong_Kong)

## 当前任务

Owner要求继续长期托管与其他AI接入，尽量免费，不重复已验项，不影响审核并推GitHub；随后说明没有Claude账号，不要求注册。继续codex/ai-discovery-vnext-20261015。上一交接见[历史](handoff-history-20261017-before-hosting.md)。官网／Google／Bing、旧Codex／Gemini、临时HTTPS及archive44证据保留，CI169／170已成功，不重跑旧矩阵。

## 本轮结果

[长期候选合同](architecture/ai-hosting-20261017.md)和[运行包](../infra/ai-candidate/README.md)记录Cloudflare Workers／Neon Free实际交付。独立空库105迁移、受限角色、Hyperdrive来源verify-full／禁用查询缓存、EU OAuth KV、独立secret和两条加密合成事项均已验证。候选长期保留在rillora-ai-candidate.rillora-candidate.workers.dev；不是临时隧道。原Functions入口403没有冒领成功，两个旧探针已关闭或改为无数据库的关闭处理器。

Auth0原9应用及旧绑定／租户设置保持，新增一个候选上游登录应用填满Free10名额；Cloudflare的Claude、Claude Code、Cursor、Qwen Code有不同clientId。原版Claude Code2.1.302和CursorCLI2026.10.16-e3cb207真实OAuth、实际工具发现、限定读取／刷新及浏览器撤销通过；撤销时有效令牌尚余608／814秒，旧令牌与刷新均拒绝。已退出Claude测试连接并移除Cursor隔离fixture失效令牌，用户全局MCP未覆盖。

[接入材料](../integrations/ai/hosted-candidate/readiness.json)只含公开clientId。Claude官网没有用户账号，未创建或接通。QwenCode0.25.2原版CLI识别配置，但重连缺少令牌，交互端明确要求先配置模型provider；未借用其他项目密钥，未执行模型调用。不能将上述代码客户端结果写成消费平台、模型选工具、目录上架或自动推荐证明。

## 验证与边界

当次API相关回归28项、迁移词法／所有权16项、候选边界2项、接入包4项、API／候选typecheck、Worker干构建及实际公网10项边界检查通过。不同阶段的旧5项探针／新2项候选检查分别记录，不重复合计。当前源码扫描通过，32条原已核对非秘密、0条未审项。archive45已本地认证133路径／117对象／1,528,372密文字节；新增归档与GitHub实证见[本轮保存](../collaboration/verification/ai-hosting-20261017/README.md)，源码与archive45已推8233d8691，独立远端下载认证通过；CI171新增候选检查暴露Web任务缺少共享API依赖，已在da394a1ac补安装步骤，CI172三任务全部通过。最终收尾只追加普通Git回执，不重复部署或原业务验收。

这是仅含合成资料的独立候选。Worker包装密钥不等价于生产KMS／独立强制恢复日志／客户开放。生产API和数据库、Gmail／QQ事项、定价、收费开关、FanPass、App14审核和TestFlight保持；尚未把候选连接到真实客户数据。凭据在既有Secure Enclave封装及提供方秘密存储；.local-secrets、原登录URL、CLI令牌和完整私人回执不入Git。

## 唯一下一步

补齐Qwen Code原版交互授权：当前隔离profile缺少可用模型配置，CLI明确不允许进入交互授权。取得适用于Rillora的配置后，只补这个未验步骤；Claude官网不要求Owner另行注册，当前合成候选与App14发布面继续隔离。
