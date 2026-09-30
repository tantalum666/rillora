from pathlib import Path
import datetime, hashlib, json, re
from urllib.parse import unquote

q = Path(__file__).resolve().parent
root = q.parents[2]
now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat()
reading = json.loads((q/'reading-inventory.json').read_text())
docs = ['docs/ui-ux-audit-20260915.md','docs/product.md','DESIGN.md',
        'docs/account-matter-ux.md','docs/invitation-motion-ux.md','docs/start-here-export.md',
        'docs/quality-gates.md','docs/decision-log.md','docs/handoff.md',
        'docs/handoff-history-20260915.md','docs/journey/PROJECT_JOURNEY.md']
excluded = {
 '20-web-plan-access.png':'IAB full-page scale/canvas artifact; replaced by23/25/compiled accurate captures.',
 '37-ios-invite-person.jpg':'Stale reference left Profile visible;38 is the actual form.',
 '39-web-populated-overview.png':'IAB miniature/scaled capture;41 is accurate.',
 '49-web-b-directions.png':'Captured list before detail fetch settled;52 is actual detail.',
 '60-ios-recovery-leave-guard.jpg':'Format stage, not leave warning;62 is actual warning.',
 '61-ios-recovery-leave-warning.jpg':'Review stage, not leave warning;62 is actual warning.',
 '69-ios-revoked-foreground-detail.jpg':'MCP launch restarted process to public;not foreground-revalidation evidence.',
 '84-ios-ax5-category-picker.jpg':'Category picker not opened;85 is actual picker.',
 '94-ios-review-history.jpg':'Wrong underlying tab after obscured target tap;96 correct.',
 '95-ios-review-settings.jpg':'Wrong tab;98 correct settings.',
 '97-web-form-320.png':'Opening animation unfinished;114 is settled form.',
}
partial = {
 '11-ios-hosted-bottom.jpg':'Initial hosted view only;no verified scroll.',
 '14-ios-hosted-scrolled.jpg':'Initial hosted view only;no verified scroll.',
 '70-ios-c-revoked-inbox.jpg':'Actually C empty own Overview;71 is the revoked inbox.',
 '105-ios-landscape-overview.jpg':'Landscape scene in portrait-oriented raw capture;not full landscape pass.',
}
screens=[]
for p in sorted((q/'screens').iterdir()):
 if not p.is_file(): continue
 status='retained capture'
 reason=''
 if p.name in excluded:status='EXCLUDED FROM GRADING';reason=excluded[p.name]
 elif p.name.startswith('legal-'):status='EXCLUDED FROM GRADING';reason='Development entry/unsettled animation or Vite CSP style conflict;use compiled-legal captures.'
 elif p.name in partial:status='LIMITED / RELABELLED';reason=partial[p.name]
 b=p.read_bytes()
 screens.append({'file':'screens/'+p.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'status':status,'note':reason})
(q/'capture-manifest.json').write_text(json.dumps({'generatedAt':now,'pixelsRetouched':False,'captures':screens},ensure_ascii=False,indent=2))
index=['# Current audit screenshots','',
       'Captured from running Web/SwiftUI; synthetic data only. Retained capture does not imply every platform or state passed. Findings use named, inspected evidence in the report. No image was AI-redrawn or annotated to prove a bug.','',
       '[Audit report](../../../docs/ui-ux-audit-20260915.md) · [QA scope](README.md)','',
       '| Capture | Status / evidence limit |','| --- | --- |']
for s in screens:
 name=Path(s['file']).name
 index.append(f"| [{name}]({s['file']}) | {s['status']}. {s['note']} |")
(q/'screens-index.md').write_text('\n'.join(index)+'\n')
summary = {
 'completedAt':now,'auditGroups':22,'P1':6,'P2':14,'P3':2,
 'readingFiles':66,'readingLines':18108,'readingChunks':98,
 'screensCaptured':len(screens),'excludedFromGrading':sum(s['status']=='EXCLUDED FROM GRADING' for s in screens),
 'limitedCaptures':sum(s['status']=='LIMITED / RELABELLED' for s in screens),
 'newFullUnitSuites':0,'nativeDebugBuild':'succeeded','compiledLocalLegalBuild':'succeeded;synthetic operator only;not release validation',
 'legalPages':7,'legalAnchorTargets':60,'webWidths':[320,390,768,1440],
 'softwareKeyboardObserved':True,'nativeAX5Observed':True,'voiceOverPhysicalTested':False,
 'video':json.loads((q/'video-metadata.json').read_text()),
 'activeTestConnectionsAfterCleanup':0,'productSourceEditedByAudit':False,'deploymentPerformed':False,
 'nativeNormalCloudRestored':True,'nativeQAEnvironment':{},'nativeOrientationRestored':'portrait',
 'ownedPortsStopped':[4250,4251,4252,4253,4254,4256],
 'unrelatedPortsPreserved':[4180,4181,4190],
 'browserCleanup':'IAB viewport reset and3 audit-created tabs closed;isolated Playwright browser closed',
 'docsUpdated':docs,
 'decisionReason':'Owner explicitly requested whole-app audit;record scope supersession and repair recommendation,not new visual/product implementation approval',
 'handoff':'docs/handoff.md','journey':'docs/journey/PROJECT_JOURNEY.md',
}
(q/'closeout-checks.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
readme=f'''# Rillora complete UI/UX audit — September15

Status: AUDIT COMPLETE /22 FINDING GROUPS OPEN /NO PRODUCT IMPLEMENTATION CHANGE OR DEPLOYMENT  
Completed: {now}

## Read the result

- [Full Chinese report with22 prioritized groups, evidence and acceptance criteria](../../../docs/ui-ux-audit-20260915.md)
- [All screenshots and capture exclusions](screens-index.md)
- [Current handoff](../../../docs/handoff.md)
- [Machine-readable closeout](closeout-checks.json)

## Evidence collected this workflow

66 owned Markdown files /18,108 lines /98 full-body chunks read before implementation work;complete14:24:02 HK. [Reading completion](full-read-completion.json),[inventory and exclusions](reading-inventory.json),[chunks](read-chunks.json). No re-scan after compaction;focused recovery only. Fingerprints complement,not replace,body reading.

Actual Web/public staging,isolated synthetic API/PostgreSQL,installed native SwiftUI Debug. A/B/C/D synthetic identities and example.test mail only. Both QR payloads decoded;B accepted nativeA invitation inWeb,C acceptedWebA in native;Directions versusDetails/Notes kept separate. C reduction/revocation preservedB. Web/native save/Notes and application cancel worked;native archive removed only the synthetic unshared record. Shared review suggestion→approval→history worked. [Current downloadedTXT](rillora-start-here-2026-09-15.txt) proves the export-scope finding.

7 compiled local legal pages /60 valid directory targets,320/390/768/1440 Web,ordinary/AX5 native,software keyboard and reduced-motion checks. [Legal runtime](legal-runtime.txt),[guide runtime](guides-runtime.txt),[category snapshots](category-audit.json). A failed-save503 and cold-start503 were controlled local fault injections,not outages ofstaging. Precise timing is not a provider-login benchmark.

{len(screens)} captured image files;{summary['excludedFromGrading']} excluded from grading and{summary['limitedCaptures']} explicitly limited/relabelled. The originalIAB scaling errors,wrong intermediate states and unfinished animations remain listed. Development legalCSP blockedVite inline styles,so compiled local legal pages replace those captures. Backend/data were not fabricated for a screenshot;all actor data were deliberately synthetic.

[Actual native interaction video](native-interaction-audit.mp4) is45.16seconds with a decoded frame([metadata](video-metadata.json)). Recording includes idle time after an initially missing stop-output parameter;it is evidence of current interactions,not a promotional video orFPS/performance claim. No ImageGen redesign or Figma write occurred because this request was an audit.

## Limits

No new full unit-suite run;September11 test totals are historical. Current nativeDebug and standalone legal preview builds succeeded. No actual Google/Apple/password/MFA completion,new real recipient signup,production/private user permissions,paid purchase,cancellation,automatic notification,physical VoiceOver,full-device/landscape matrix,legal opinion orreal print/decrypt/import success is claimed. Native detail foreground revocation attempt was invalid because the tool restarted the app;fresh/opened projection checks succeeded. App can make an encrypted package;that doesnot mean a consumer reader/restore flow exists.

## Cleanup and documentation

All audit-created connections revoked;[cleanup readback](sharing-cleanup.txt) shows0 active. Test database remains isolated for reproducibility. Normal cloudDebug restored,QA env empty,standard text/motion,portrait orientation;[restored screen](screens/113-ios-normal-restored.jpg). Software keyboard was observed then closed,hardware-keyboard preference unchanged. IAB viewport reset and3 audit tabs closed;isolated Playwright browser cleared/closed. Audit ports4250–4254/4256 stopped;unrelated4180/4181/4190 preserved. No Auth0/AWS/Apple admin mutation,no external message,no deploy,no pricing orbilling change.

Updated report,product gateway,DESIGN audit annotation,account/matter andinvitation/export focal notes,quality-gate routing,append-onlydecision/journey andcompacthandoff. Oldhandoff archived[HISTORICAL](../../../docs/handoff-history-20260915.md). The only next step is the UX01–06 reliability/trust repair batch. [Documentation/link validation](markdown-validation.json) is produced by the final check;findings are not marked fixed by documentation edits.
'''
(q/'README.md').write_text(readme)
state=json.loads((q/'work-state.json').read_text())
state.update(phase='audit-complete',completedAt=now,lastScreen=114,normalSimulatorRestoreRequired=False,
             servers={},nativeActor='ordinary cloud configuration;no QA environment',browserTabs={},
             findings=22,report='docs/ui-ux-audit-20260915.md',uniqueNextStep='Repair UX01–06 using same synthetic fixtures;keep billing closed')
(q/'work-state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2))

# Verify local targets across all original owned Markdown plus current authored records.
owned={root/x['file'] for x in reading['files']}
owned.update(root/x for x in docs)
owned.update([q/'README.md',q/'screens-index.md'])
broken=[];checked=0
for file in sorted(owned):
 text=file.read_text()
 text=re.sub(r'```.*?```','',text,flags=re.S)
 for match in re.finditer(r'!?\[[^\]\n]*\]\((<[^>]+>|[^)\n]+)\)',text):
  target=match.group(1).strip().split(' "',1)[0].strip('<>')
  if re.match(r'^[a-zA-Z][\w+.-]*:',target) or target.startswith('#'):continue
  dest=unquote(target.split('#',1)[0].split('?',1)[0])
  if not dest:continue
  checked+=1
  resolved=Path(dest) if dest.startswith('/') else file.parent/dest
  if not resolved.exists():broken.append({'file':str(file.relative_to(root)),'target':target})
validation={'checkedAt':now,'markdownFiles':len(owned),'localTargetsChecked':checked,'broken':broken,
            'headingCount':len(re.findall(r'^### UX\d{2} ',(root/docs[0]).read_text(),re.M)),
            'datesSynced':all('2026-09-15' in (root/x).read_text()[:1600] for x in docs),
            'currentHandoffUniqueNextStepHeadings':(root/'docs/handoff.md').read_text().count('## Unique next step')}
(q/'markdown-validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2))
print(json.dumps({'summary':summary,'validation':validation},ensure_ascii=False,indent=2))
