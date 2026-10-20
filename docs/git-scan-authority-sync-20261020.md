# October20 trusted scan-authority synchronization

Status: EXACT REGISTRY SYNC / NO APPLICATION OR SCANNER CHANGE
Last updated: 2026-10-20 (Asia/Shanghai)

PR3 consolidates previously reviewed Rillora history into main. Its first repaired-head PR check used the protected October2 main registry and recognized only6 of32 scanner findings;26 were unmatched because that base lacks later exact spans. This is independent of the26 omitted readable files already repaired in the integration branch.

The temporary base update retains all27 existing registry rows and adds22 exact rows already present in the integrated candidate:20 have identical source-span digests already registered on main at older line positions;2 are the Web/CryptoKit synthetic fixtures explicitly approved by Owner on October11 and present in076bd5a8b. Every added row's actual source-span hash was independently recomputed. No provider credential, new key, broad pattern or rule suppression is added.

The scanner, workflow, source content, publication verifier and approval rules are unchanged. This isolated base update makes the earlier approvals available to protected-base PR validation. PR3 will retain the current28-row registry and remove obsolete old-source positions as the corresponding source is integrated. Application checks, readable publication validation and final merge still run independently.

This commit contains only the registry and this explanation. It does not deploy, change review/billing/data, read credentials or send messages. The detailed review is preserved under the integration task's QA/evidence records.
