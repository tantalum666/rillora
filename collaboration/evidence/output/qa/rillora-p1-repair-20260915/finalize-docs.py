from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
repair='[P1 repair contract](p1-reliability-repair-20260915.md)'

def add_section(file,heading,body,date=True):
 p=root/file;s=p.read_text()
 if heading in s:return
 at=s.find('\n## ')
 if at<0:at=len(s)
 s=s[:at]+'\n'+heading+'\n\n'+body.strip()+'\n'+s[at:]
 if date:s=re.sub(r'Last updated: [^\n]+','Last updated: 2026-09-16 (P1 local repair; earlier evidence keeps its original date)',s,count=1)
 p.write_text(s)

p=root/'docs/ui-ux-audit-20260915.md';s=p.read_text().replace('Status: AUDIT COMPLETE — FINDINGS OPEN; NO PRODUCT FIX OR DEPLOYMENT CLAIM','Status: AUDIT COMPLETE; UX01–06 LOCALLY REPAIRED/VALIDATED, DEPLOYMENT PENDING; UX07–22 OPEN').replace('Last updated: 2026-09-15 (Asia/Hong_Kong)','Last updated: 2026-09-16 (Asia/Hong_Kong; audit evidence remains September15)')
intro='''## P1 repair checkpoint — 2026-09-16

Owner subsequently requested immediate repair. UX01–06 now have local implementation and focused acceptance recorded in the [repair contract](p1-reliability-repair-20260915.md) and [QA](../output/qa/rillora-p1-repair-20260915/README.md). Their original evidence below is retained as the before-state. All six remain pending coordinated remote deployment; UX07–22 remain open. This does not claim a whole-app redesign, real customer acceptance or billing readiness.

'''
if '## P1 repair checkpoint' not in s:s=s.replace('## ',intro+'## ',1)
for num in range(1,7):
 pattern=rf'(### UX{num:02d}[^\n]+\n)'
 s=re.sub(pattern,rf'\1\n**Repair status (September16):** Locally repaired and validated; see the linked P1 contract/QA. Remote deployment pending.\n',s,count=1)
p.write_text(s)

p=root/'docs/product.md';s=p.read_text();start=s.index('## 2026-09-15 全应用');end=s.index('## 2026-09-11 邀请',start)
s=s[:start]+'''## 2026-09-16 P1修复 — 当前任务

Owner在完整审计后要求“直接开始修复”。UX01–06已经实现并通过本地／合成验证：按接收人导出、保存失败与草稿恢复、独立加载故障态、保存状态术语、完整备份／本机读取／导入／归档恢复／账户删除，以及当前和未来权益的区分。见[修复合同](p1-reliability-repair-20260915.md)、[审计状态](ui-ux-audit-20260915.md)和[当次QA](../output/qa/rillora-p1-repair-20260915/README.md)。Auth0最小删除服务已创建并用新建测试身份验证；P1代码、新Privacy/Cookie及托管证明仍未部署，AWS本人登录为当前必要外部门。UX07–22、收费和商业额度生命周期仍开放。

'''+s[end:];s=re.sub(r'Last updated: [^\n]+','Last updated: 2026-09-16 (P1 local repairs and deployment boundary)',s,count=1);s=s.replace('| 全应用UI/UX审计、体验缺口及下一轮修复优先级 |','| P1可靠性／导出范围／草稿／自助退出修复 | `docs/p1-reliability-repair-20260915.md` | 本地实现与验收；部署仍待本人AWS登录 |\n| 全应用UI/UX审计、体验缺口及下一轮修复优先级 |');p.write_text(s)

add_section('docs/public-legal-pages.md','## September16 prepared privacy/storage update — not published', '''The P1 data-exit/draft work adds necessary tab-local matter recovery and deletion-reference storage plus self-service account export/deletion. The prepared source changes Privacy to privacy-2026-09-15-1 and Cookie Notice to cookies-2026-09-15-1; Terms/electronic-consent text is unchanged. Current local source digest: `3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602`. Web/API/native and the hosted-consent action agree; app tests and a synthetic-fact legal-only build plus7 artifact tests pass.

The existing published August27 contract/Sites checkpoint below has not been replaced remotely. Do not publish the new Auth0 proof alone: legal publication and API/Web/native rollout must be coordinated. The new factual necessary-storage description is an Agent implementation decision under the Owner's standing project authorization, not a fresh real-user acceptance or legal opinion. [Repair contract](p1-reliability-repair-20260915.md).''')
add_section('docs/legal-candidate-zh.md','## 2026-09-16 待发布的自助与必要存储补充', '''本轮英文Privacy/Cookie增加了与实际功能对应的事实：同一已核验账户的单个事项草稿在当前标签页保留最多24小时，保存／放弃／登出后清除；删除请求的随机凭据只能查进度，不能登录或查看地图；My data提供本人备份和账户删除入口。已保存到外部的副本无法远程撤销，法定记录和备份保留仍遵循原政策。

待发布版本为privacy-2026-09-15-1和cookies-2026-09-15-1，Terms与电子记录同意文字不变。当前在线站点尚未更新；下文August27合同仍是旧线上检查点，不能把本地改动写成已发布或用户已接受。新的三端／托管摘要及发布依赖见[修复合同](p1-reliability-repair-20260915.md)。''')
add_section('docs/monetization.md','## September16 capability presentation and free exit checkpoint', '''The P1 repair separates available current tasks from planned Family core/later features in both clients and the API availability marker. Removed rehearsal is absent. My data provides free complete map backup/read/import/archive restore and deletion initiation/status. US$68/year andUS$7.99/month are unchanged; no purchase gate opens. Numerical Free1/Family5 allowances and paid cutoff/cancel/restore are still separate unfinished commercial work. Local preview availability is not paid entitlement. [Repair contract](p1-reliability-repair-20260915.md).''')
add_section('docs/solo-operations-and-portability.md','## September16 self-service deletion and portable-file checkpoint', '''Complete private map backup, local JSON/TXT/encrypted readers, empty-map import and private archive restoration are implemented on Web/native/API. Deletion uses durable leased jobs and a dedicated Auth0 delete:users service. A fresh disposable provider identity and its local map were deleted and independently checked; routine active-system versus backup/legal retention stays explicit. This is local acceptance, not a continuously running cloud job or actual customer result.

AWS STS confirmed expiry. A cached active-session choice returned400 in both remote and local callback attempts; Sign into new session reached the intended IAM form. Owner password/MFA was still pending when the final CLI authorization timed out. Do not reuse that expired authorization URL; create one fresh attempt when the Owner resumes. Do not repeat Auth0 login while its authorized CLI session is still valid. [Current repair/QA](p1-reliability-repair-20260915.md).''')
add_section('docs/platform-contract.md','## September16 P1 data and reliability checkpoint', '''Web and actual native now share recipient-scoped export, complete map backups, local saved-copy reading, safe empty-map import, archive restoration and account deletion status receipts. Native uses Files/ShareLink and a separate device-only Keychain receipt; Web uses file inputs/downloads and bounded tab storage. The API owns projection, optimistic versions, create/import deduplication and deletion jobs. Billing and future capabilities remain closed. These additions are locally validated; the September11 staging state has not yet been replaced. [Contract and evidence](p1-reliability-repair-20260915.md).''')
add_section('docs/quality-gates.md','## September16 P1 acceptance and remaining gate', '''Local P1 acceptance is complete: API147 tests, native138 pass/0 fail/1 pre-existing StoreKit skip, Web68 app tests plus7 legal artifact tests, hosted action7 tests, and infra16 tests/synthesis. Actual file downloads, native Files save/read, two-client backup reading, recipient projection, empty-map import, native/Web deletion status, create-lost-response recovery and400/409/503/offline errors are recorded. Auth0's exact new disposable identity deletion is verified.

Remote publication remains closed pending fresh AWS personal authentication and coordinated migrations0043–0046, dedicated secret injection, API/Web/native and updated legal/hosted-consent rollout. The prior normal-cloud native source is separately rebuilt/restored so the Simulator is not left pointing at QA identities or an undeployed legal contract. UX07–22, fresh real-provider signup-return, Apple upstream revocation ceremony, device VoiceOver and paid lifecycle/real sales remain unproved. [Repair QA](../output/qa/rillora-p1-repair-20260915/README.md).''')
add_section('infra/aws/README.md','## September16 account deletion service (prepared, not deployed)', '''The stack adds one independent AccountDeletionClientSecret resource and write-only operator replacement permission. `accountDeletionEnabled` defaults false; the API receives its Auth0 client/domain/secret only after explicit activation. `Auth0DeletionClientId` is a dedicated M2M client with only delete:users, not the existing Web client. Its protected local value is never a CDK parameter or browser artifact.

Provision/update with the feature disabled, populate the exact secret ARN from stack outputs using the scoped operator, run checksum migrations0043–0046, then enable the service. Preserve existing masked parameters and the closed billing settings. Coordinate the new Privacy/Cookie/source digest and hosted-consent action with API/client rollout; do not deploy an app build containing a legal-only artifact. The current local16 tests and synth pass; AWS personal login expired and no P1 stack update occurred.''',False)
print('Focal documents updated.')
