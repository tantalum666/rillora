# Google 401 diagnostic — October26

Current result: expected protected MCP response, not a public marketing-page failure.

- [Google readback](google-readback.json): one affected endpoint, the third-party directory referral and the original report dates/counts.
- [Visible report text](report-visible.txt) and [screenshot](report.png).
- [Stored URL inspection](url-inspection-visible.txt) and [screenshot](url-inspection.png).
- [Current anonymous HTTPS checks](http-readback.json): MCP401 with missing authorization, metadata200, homepage/maps200, all28canonical pages200 with self-canonical and no noindex.
- [Reading continuity](reading.json) and [closeout](closeout.json).
- [Interpretation and limits](../../../docs/marketing/google-indexing-401-20261026.md).

Screenshots exclude the account header. No credentials, cookies, private matters, whole email headers, email tracking URLs or browser state are published. HTTP checks used a normal diagnostic User-Agent with certificate verification; they are not actual Googlebot or authenticated MCP acceptance. No code change, deployment, indexing submission, billing change, App Review action or new cloud CI. No new encrypted archive; original archives remain immutable. Final local publication logs and remote readback remain under output/qa/rillora-google-401-20261026.
