# Selected03 brand adoption and font licensing QA

Status: COMPLETE WITH SCOPED BUILD/PUBLICATION EVIDENCE; PRODUCT RELEASE STILL CLOSED  
Work: September19; document closeout September20,2026,Asia/Shanghai

## Request and reading

Owner selected the original03 Legacy Imprint board and asked whether its font is free for commercial use. Preserve current UI and earlier source packages. No new design direction, consumer feature, authentication ceremony or paid font purchase was requested.

This continues the release/Logo workstream. Reuse the [full body-read completion](../rillora-release-readiness-20260919/full-read-completion.json):92 owned Markdown files,20,554 lines,206 chunks, with truncated portions supplemented. Exclusions remain dependencies, caches, build output, third-party packages and generated output evidence; project-owned specs, historical Markdown and nestedAGENTS were included. Logo iterations and this adoption use incremental reads. After compaction, reread AGENTS,product current authority,handoff,latestdecision entries and the relevant Logo/design/license/legal/release/source files; do not claim a second full read. [Recovery/closeout record](read-recovery.json).

## Changes and provenance

- [Canonical brand folder](../../../assets/brand/rillora/README.md), [brand configuration](../../../config/brand.json), [approved ZIP](../../../assets/brand/rillora-approved-brand-20260919.zip).37 original03 files remain byte-identical to [before hashes](selected-source-before.json). Reverse changes colour only; compact uses03's existing optical symbol. Figma geometry was not changed.
- Web sharedRilloraBrand component, existing brand positions and同源SVG/PNG/touch icons. No card palette, layout, navigation or account/permission changes. Main iOSAppIcon plusOverview/About existing brand titles use the exact selected assets.
- [Font research](../../../docs/brand-font-license-20260919.md) uses Adobe/GoogleFonts/Inter and officialOFL FAQ. ActualSourceSerifWOFF metadata records4.004 andAdobe2014–2021/ReservedFontNameSource; Fontsource package5.3.0 is a different version identifier. ExactFigma font minor version was not separately established.
- Complete font copyright/OFL text is bundled in canonical assets, rootnotices, identicalWeb/nativecredits and a same-origin app/legal font-licenses resource. Source Serif4/Inter permit commercial Logo/Web/paid-App use; font permission does not claim trademark clearance.

## New verification

| Evidence | Actual result | Limit |
| --- | --- | --- |
| Nativebuild/run | XcodeBuildMCP39.4s,0warnings/0errors; installed onMatrix17Pro | DebugSimulator,notproductionRelease |
| Nativevisual | ExistingOverview heading andSpringBoard icon visibly correct | No new signed-in flow or device test |
| Webreleasebuild | Passed; [log](web-build.log) | Sourcebuild,notpublicproductlaunch |
| Applicationtests | 80pass within the initial87-test command | 3wrong-mode legal artifact failures retained below |
| Legalbuild/tests | Buildpass,7/7dedicatedartifactchecks pass | [acceptedlog](legal-tests-accepted.log) |
| Browser | 1280/390/320 widths; Home→Guides→brand link→Home; nohorizontaloverflow,localwarn/error list empty | CUAactualDOM/screenshots,notseparatePlaywright; no personal login |
| Nativeassets | Approvedicon bytes equal; logoSVGs outlined; Webconsumersmatch; credits equal; original03preserved | [consistency](asset-consistency.json) |
| Stagingpublish | Web-onlyCloudFormation change,exit0;31/31HTTP/exact-build checks | [diff](aws-diff.log),[HTTP](aws-http-verification.json) |
| Legalpublish | ExistingpublicSites version6,succeeded;31/31anonymousroutes/headers/assets/versionchecks;320pxrendercorrect | [receipt](sites-publication.json),[HTTP](legal-http-verification.json) |
| Releasepreflight | mainAppIconConfigured=true; releasegates correctlyremainblocked | [report](release-preflight.json); Debugtestendpoint/StoreKitfixture expected |

Public native images: [Overview](ios-overview-brand.jpg),[actual installed icon](ios-installed-app-icon.jpg). Browser viewport was reset and the published legal view retained; panel-opening call returnedqueued. [Browser record](browser-routing.json). LocalVite created for this task was stopped; the pre-existingAPI service was left alone.

## Publication evidence

AWS source key is `ff23f63968422d104675da6a62df52e82272791a19be340590fb5358ce6765fa.zip`. The diff changes onlyWebDeploymentSourceObjectKey. API/DB/IAM were not changed; the published health endpoints and signed-outprivate-route guards passed. Sourceartifact inapps/web/dist is restored to the app build after legalpackaging.

Legal uses the sameSite`appgprj_6a98e258d72c81919ee18e46d37cfdbf`, with owner/public audience read back before publishing. Nestedapps/web source snapshot includes earlier authorized work sinceSites5,notonlythisLogo. It was pushed before fullHEAD`551b20f5468d03d301b3858fa3a8f14a38d43351` was read. Version6 saved from thatsource plusvalidatedlegal-onlyarchive,deployment`appgdep_6aaeb02678488191a3c0e27479ff593b`succeeded. ProviderURL is [publishedSite](https://rillora-legal-pages.y-uanfangda666.chatgpt.site); existing [customdomain](https://legal.rillora.xyz/terms) also passes exactasset checks. No newSite,audience change,secret inGit,root initialcommit or thumbnail replacement.

Legalbody/consentversions/digest stayunchanged. Compiledlegal/operatorfactartifacts remaininprotected`.local-secrets/brand-adoption/`; QAdoesnotcopyoperatorname/addressorcredentialvalues.

## Failures corrected without hiding evidence

1. An early relativefont-step ranfromapps/ios rather thanroot; xcodegencompleted butthefontreadfailed. Rerunfromrootbeforebuilds.
2. Initial`node --test tests/*.test.mjs` againstappdistreturned84/87:80applicationtests plus4legalguards passed;3legal-modeartifactchecks failed becausea legalbuildhadnotreplacedappdist. Do not report87/87.
3. Correctlegalbuildleftonefailure:old12-assetcapversus18actualassets. Addthe sixboundedbrand/icon/licencefiles,retain1JS/1CSSandgzip100KB/20KBguards plusforbidden-app-codechecks,assertfullfontnoticepresence. Dedicatedlegal7/7thenpassed.
4. A latehashcheck usedthe wrongnativeassetdirectory,recordingnullratherthanpass. ResolveactualResources/Assets.xcassets path; finaliconcomparisontrue.
5. FirstlegalbrowserreadoccurredbeforeSVGloadingfinished; subsequentactualscreenshot/DOMconfirmedbothlogosloaded. No arbitrary sleep or source-onlyrenderclaim.

## Documentation closeout

Updated actualcontracts:product,DESIGN,logo-design,logo-discovery,asset-licenses,release-readiness,public-legal-pages,READMEandWebAGENTS. Addedfocusedfontverificationandcanonicalusageguide. AppendedOwnerselection/OFLdecisions; archivedprevioushandoffbeforewritingonecurrentnextstep; appendedjourneygoal→attempt→judgment→result→remainingwork.

- [Currenthandoff](../../../docs/handoff.md)
- [Priorhandoff—HISTORICAL](../../../docs/handoff-history-20260919-before-approved-brand.md)
- [Decisionlog](../../../docs/decision-log.md)
- [Journey](../../../docs/journey/PROJECT_JOURNEY.md)
- [Linkvalidation](markdown-link-check.json)

No newfullnative/APItest suite, real-userA/Borproviderlogin,hostedAuth0Logochange,trademarkclearance,productionproductdeploymentorAppStore submission. Owner-deferred registration/device and pendingAppleannualpricechoice retain their own status. Unique next work resumesisolatedproduction/restorepreparation ratherthanadditionalLogoexploration.
