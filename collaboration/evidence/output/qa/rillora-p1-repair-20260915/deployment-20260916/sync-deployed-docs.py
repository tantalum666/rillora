from pathlib import Path
import json,re,datetime
ROOT=Path(__file__).resolve().parents[4];Q=Path(__file__).resolve().parent
link='[September16 deployment acceptance](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md)'
def section(name,title,body):
 p=ROOT/name;s=p.read_text();at=s.find('\n## ')
 if title not in s:s=s[:at]+'\n'+title+'\n\n'+body.strip()+'\n'+s[at:]
 s=re.sub(r'Last updated: [^\n]+','Last updated: 2026-09-16 (deployed P1 acceptance; earlier checkpoints retain their dates)',s,count=1);p.write_text(s)
common='''P1 is now deployed to the existing synthetic staging environment: API23, migration17, checksums0043–0047, completed1/1 rollout; Web and the current native Debug build use the matching contract. Sites legal version4 and the Auth0 form/action are published and read back.36 HTTPS and25 legal checks pass. Authenticated cloud fixtures verify invitation scope, scoped plaintext/encrypted export, full backup/import, private archive restoration and provider-backed account deletion. These are deliberately synthetic sessions, not real signup/email/consent ceremonies. Sales remain closed. '''+link+'.'
section('docs/account-matter-ux.md','## September16 deployed P1 checkpoint',common)
section('docs/start-here-export.md','## September16 deployed scope/reader acceptance',common)
section('docs/platform-contract.md','## September16 two-platform deployment acceptance',common)
section('docs/monetization.md','## September16 deployed Free data-exit checkpoint',common+' Current/planned capability presentation is live; numerical Free1/Family5 and paid cutoff/cancel/restore are still unfinished commercial work.')
section('docs/solo-operations-and-portability.md','## September16 deployed deletion worker and recovery',common+''' The cloud test exposed missing provider-check INSERT rights in the import upsert.0047 adds only imported columns/sequence usage with tenant RLS intact; timestamps are normalized and existing non-default preparation settings preserved. Final API148 tests pass. All eight temporary identity mappings are removed and no deletion job remains pending. The earlier expired-authentication blocker is resolved.

When a CLI process no longer exists after a turn boundary, a confirmation code cannot be moved into an unrelated new PKCE flow. Reuse the fresh browser session and verify STS after the current CLI completes. The raw OAuth code in the confirmation URL is not the full remote verification-code format. A local callback successfully connected this workflow without another Owner password/MFA or permanent credential.''')
section('docs/quality-gates.md','## September16 deployed P1 gate result',common+''' The import500 was a real least-privilege gap, fixed and retested; earlier fixture assertion/hash mistakes are separately retained in QA. Final API148 passes supplement the earlier native138/0/1, Web68 and infra16 checkpoints. A fresh native build/install/run succeeded. Real customer provider-return, Apple upstream revocation, physical-device VoiceOver and paid-market gates remain open.''')
section('docs/public-legal-pages.md','## September16 version4 published', '''The prepared necessary-storage/self-service update is now public at the existing legal.rillora.xyz domain as Sites version4. Privacy is privacy-2026-09-15-1, Cookie Notice is cookies-2026-09-15-1; Terms/electronic-consent wording stays unchanged. Published source digest is `3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602` and matches API, native/Web and the read-back hosted action.25 route/header/asset/version checks and rendered Privacy/Cookie/mobile checks pass.

Cloudflare injects a challenge bootstrap that the existing strict script-src self policy blocks; the application modules and document navigation work. This provider console behavior is recorded without weakening CSP or claiming a zero-console-error result. Exact operator values remain out of Markdown and QA captures; compiled publication artifacts are in protected local storage. The earlier version3 checkpoint is historical. '''+link+'.')
section('docs/legal-candidate-zh.md','## 2026-09-16 补充内容已发布','前述必要草稿／删除凭据存储与自助退出事实已随英文Sites第4版发布，Privacy/Cookie版本为2026-09-15-1；Terms与电子记录同意文本不变。三端、API及托管证明已同步。旧“待发布”段落仅保留为当时检查点；英文正式文本仍优先。'+link+'。')
section('docs/p1-reliability-repair-20260915.md','## Deployed continuation — September16', common+''' Runtime acceptance found and fixed the provider-check import permission gap.0047 grants only imported columns and sequence usage, retains tenant RLS, and preserves existing non-default target preparation settings. Database Date values are serialized before backup validation. Final API148 tests and the cloud import/archive/delete flow pass. Previous local-only/pending-deployment passages below describe the earlier checkpoint.''')
section('SECURITY.md','## September16 deployed import/deletion verification', '''The synthetic-staging authenticated acceptance found a missing INSERT grant on official_setup_checks. Migration0047 permits only the imported columns plus sequence usage, retaining forced tenant RLS. Cross-owner inserts remain denied, the runtime cannot assume continuity_account_service, and setting arbitrary provider-check public IDs is not granted. Recorded provider dates are normalized and existing target settings preserved. API148 and cloud acceptance pass; all temporary identity mappings and pending jobs are cleared. This is focused deployment evidence, not a new whole-repository security audit. [Deployment QA](output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).''')
section('infra/aws/README.md','## September16 deployment result', '''The dedicated deletion secret is now installed and accountDeletionEnabled is active in the exact staging stack. API revision23 runs1/1; migration revision17 applied0047 after0043–0046. The update preserves Stripe test=true, Family maintenance preview=true, Apple Sandbox=false and development auth=false. Readback verifies migration hashes and restricted database permissions;36 HTTPS and authenticated functional checks pass. The source helper resolves the secret through actual CloudFormation resource membership, not an assumed generated name. [Deployment QA](../../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).''')
p=ROOT/'docs/product.md';s=p.read_text();start=s.index('Owner在完整审计后要求');end=s.index('\n\n## ',start);s=s[:start]+'''Owner在完整审计后要求“直接开始修复”。UX01–06现已完成本地修复和现有合成staging部署验收：按接收人导出、保存失败与草稿恢复、加载故障态、保存状态、备份／读取／导入／归档恢复／删除及权益真实性。API23运行1/1，0043–0047校验和匹配；Web、普通iOS Debug、法律站第4版及Auth0证明一致。云端发现的导入权限缺口已修正；148项API、36项HTTPS、25项法律站及受控完整功能链通过。见[修复合同](p1-reliability-repair-20260915.md)和[部署QA](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md)。这是合成验收，不是真实注册／送达／法律接受或收费证明；UX07–22和商业生命周期仍开放。'''+s[end:];p.write_text(s)
p=ROOT/'README.md';s=p.read_text();start=s.index('当前工作：');end=s.index('\n\nSeptember11历史',start);s=s[:start]+'''当前工作：**审计中的UX01–06已修复并部署到现有合成staging，普通iOS Debug也已更新。** 导出范围、草稿／错误恢复、加载状态、保存术语、自助数据退出和权益展示已同步。API23为1/1；0043–0047、法律站第4版及托管证明已核对。云端导入权限缺口已修正，最新148项API测试、36项HTTPS、25项法律站及完整合成功能链通过；临时测试身份已清理。收费仍关闭，真实provider注册／返回、真机VoiceOver及UX07–22仍需后续验收。[修复合同](docs/p1-reliability-repair-20260915.md)、[部署QA](output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md)、[交接](docs/handoff.md)。'''+s[end:];p.write_text(s)
p=ROOT/'docs/ui-ux-audit-20260915.md';s=p.read_text().replace('UX01–06 LOCALLY REPAIRED/VALIDATED, DEPLOYMENT PENDING','UX01–06 REPAIRED AND SYNTHETIC-STAGING VALIDATED');s=s.replace('All six remain pending coordinated remote deployment; UX07–22 remain open.','All six passed coordinated synthetic-staging deployment acceptance, including an import-permission correction; UX07–22 remain open. See [deployment QA](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md).');s=s.replace('Locally repaired and validated; see the linked P1 contract/QA. Remote deployment pending.','Repaired and validated locally and in synthetic staging; see the P1 contract and September16 deployment QA.');p.write_text(s)
for name,new in [('docs/account-matter-ux.md','Status: P1 REPAIRED AND SYNTHETIC-STAGING VALIDATED; LATER UI/UX GROUPS OPEN.'),('docs/start-here-export.md','Status: AUDIENCE-BOUND GUIDES AND BACKUP READERS DEPLOYED/VALIDATED IN SYNTHETIC STAGING; REAL DELIVERY CLOSED'),('docs/p1-reliability-repair-20260915.md','Status: IMPLEMENTED AND SYNTHETIC-STAGING VALIDATED; REAL-MARKET AND LATER UX GATES OPEN')]:
 p=ROOT/name;s=re.sub(r'Status: [^\n]+',new,p.read_text(),count=1);p.write_text(s)
# Preserve the intermediate handoff as history, then publish one current next step.
p=ROOT/'docs/handoff.md';history=ROOT/'docs/handoff-history-20260916-p1-deployment.md'
if not history.exists():history.write_text('# HISTORICAL — P1 deployment/import-hotfix continuation\n\n'+p.read_text())
p.write_text('''# Rillora Current Handoff

Status: UX01–06 REPAIRED AND SYNTHETIC-STAGING VALIDATED; WEB/NATIVE/LEGAL/HOSTED CONTRACTS ALIGNED; SALES CLOSED  
Last updated: 2026-09-16 (Asia/Hong_Kong)

## Completed current task

Owner requested immediate repair after the complete UI/UX audit, then completed AWS login. [The six P1 fixes](p1-reliability-repair-20260915.md) are implemented and deployed to the existing synthetic environment. Web uses https://app.staging.rillora.xyz ; legal.rillora.xyz is Sites version4. The ordinary native Debug build is installed against the updated cloud, with no QA actor/font/motion override. The earlier pre-repair Simulator fallback is no longer installed.

## Evidence

- API23 healthy1/1 with completed rollout. Migration17 exit0; source checksums0043–0047 match. Dedicated Auth0 deletion M2M secret installed; hosted form/action and the new Privacy/Cookie digest read back consistently.
-148 API tests pass after a real cloud import500 exposed missing provider-check INSERT rights.0047 grants only imported columns/sequence usage under existing RLS; recorded dates and target settings are preserved. Earlier native138/0/1 skip, Web68 and infra16 checkpoints remain their original runs; this continuation adds a successful native build/install/run.
-36/36 HTTPS and25/25 legal checks pass. Authenticated synthetic cloud acceptance covers creation, account-bound invitations, scoped TXT/encryption, full backup/import, private archive restoration and both-account deletion. Independent Auth0 absence and final DB cleanup/isolation checks pass; all eight temporary identity mappings are gone and no deletion job remains pending.
- [Deployment acceptance and caveats](../output/qa/rillora-p1-repair-20260915/deployment-20260916/README.md). Initial fixture mistakes, the real permission bug and the corrected final run remain separately recorded.

## Evidence limits

Synthetic sessions were deliberately provisioned for backend acceptance; they are not actual customer provider login, email delivery or legal-consent ceremonies. Fresh real signup-return, Apple upstream revocation and physical-device VoiceOver remain unproved. The legal site's Cloudflare challenge bootstrap is blocked by the retained strict CSP, while the app document modules/navigation work; this is recorded, not reported as zero console errors.

Prices remainUS$68/year andUS$7.99/month. Numerical Free1/Family5 allowances, paid cutoff/cancel/restore and market opening remain unfinished. UX07–22 are still open; partial overlapping improvements do not close their complete acceptance criteria. No repeated administrator authentication is currently needed.

## Unique next step

Continue UX07–22 with task architecture first: persistent Web navigation/back state, paused-guide recovery, direct matter-to-person visibility management and consistent invitation completion states; then refine populated overview, hierarchy and accessibility while keeping billing closed.

## Recovery

Reuse the same workflow's [reading continuity](../output/qa/rillora-p1-repair-20260915/reading-continuity.json); do not restart a full scan after compaction. Read AGENTS/product/handoff/latest decision plus changed focal files. Preserve the deployment and test evidence; do not repeat completed personal authentication or unchanged full suites. [Deployment work state](../output/qa/rillora-p1-repair-20260915/deployment-20260916/publication-state.json). [Intermediate handoff](handoff-history-20260916-p1-deployment.md) is HISTORICAL.
''')
print('Deployed checkpoints and current handoff updated.')
