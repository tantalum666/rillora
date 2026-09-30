import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

process.on("uncaughtException", (error) => {
  process.stderr.write(`UNCAUGHT: ${error?.message ?? String(error)}\n${error?.stack?.split("\n").slice(0, 6).join("\n") ?? ""}\n`);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  process.stderr.write(`UNHANDLED: ${error?.message ?? String(error)}\n${error?.stack?.split("\n").slice(0, 6).join("\n") ?? ""}\n`);
  process.exit(1);
});

const outputDir = fileURLToPath(new URL(".", import.meta.url));
const workbook = Workbook.create();

const COLORS = {
  ink: "#1D2923",
  forest: "#345C46",
  sage: "#DDE8DF",
  cream: "#F6F1E8",
  sand: "#E9DFCF",
  clay: "#C96E45",
  clayLight: "#F4DED3",
  white: "#FFFFFF",
  muted: "#66736C",
  line: "#CCD6CF",
  green: "#2F7D4A",
  red: "#A33B32",
  amber: "#B07917",
};

function title(sheet, endCol, headline, subtitle) {
  sheet.showGridLines = false;
  sheet.getRange(`A1:${endCol}2`).merge();
  sheet.getRange("A1").values = [[headline]];
  sheet.getRange(`A1:${endCol}2`).format = {
    fill: COLORS.forest,
    font: { name: "Aptos Display", size: 24, bold: true, color: COLORS.white },
    verticalAlignment: "center",
    horizontalAlignment: "left",
  };
  sheet.getRange(`A3:${endCol}3`).merge();
  sheet.getRange("A3").values = [[subtitle]];
  sheet.getRange(`A3:${endCol}3`).format = {
    fill: COLORS.cream,
    font: { name: "Aptos", size: 10, color: COLORS.muted, italic: true },
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.getRange("1:3").format.rowHeight = 25;
}

function section(sheet, range, label) {
  sheet.getRange(range).merge();
  const topLeft = range.split(":")[0];
  sheet.getRange(topLeft).values = [[label]];
  sheet.getRange(range).format = {
    fill: COLORS.sage,
    font: { name: "Aptos Display", size: 12, bold: true, color: COLORS.ink },
    verticalAlignment: "center",
  };
}

function header(sheet, range) {
  sheet.getRange(range).format = {
    fill: COLORS.ink,
    font: { name: "Aptos", size: 10, bold: true, color: COLORS.white },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: COLORS.line },
  };
}

function body(sheet, range) {
  sheet.getRange(range).format = {
    font: { name: "Aptos", size: 10, color: COLORS.ink },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: COLORS.line },
  };
}

function setWidths(sheet, entries) {
  for (const [col, width] of entries) sheet.getRange(`${col}:${col}`).format.columnWidth = width;
}

// Create every sheet before cross-sheet formulas.
const summary = workbook.worksheets.add("Executive Summary");
const assumptions = workbook.worksheets.add("Assumptions");
const unit = workbook.worksheets.add("Unit Economics");
const scale = workbook.worksheets.add("Scale Scenarios");
const channel = workbook.worksheets.add("Channel Economics");
const runway = workbook.worksheets.add("18-Month Plan");
const readiness = workbook.worksheets.add("Funding Readiness");
const checks = workbook.worksheets.add("Checks");
const sources = workbook.worksheets.add("Sources");

// Assumptions
title(assumptions, "I", "Rillora unit economics — editable assumptions", "Planning model as of 2026-08-13. Orange cells are hypotheses; external fees and legal requirements must be re-verified before launch.");
section(assumptions, "A5:I5", "Price hypotheses — not payment authorization");
assumptions.getRange("A6:F6").values = [["Offer", "Monthly price", "Annual price", "Status", "Annual saving", "Role in test"]];
header(assumptions, "A6:F6");
assumptions.getRange("A7:D9").values = [
  ["Founder / WTP cell", 6.99, 59, "PROVISIONAL"],
  ["Recommended list", 8.99, 89, "PROVISIONAL"],
  ["Upper sensitivity", 9.99, 99, "PROVISIONAL"],
];
assumptions.getRange("E7:E9").formulas = [["=1-C7/(B7*12)"], ["=1-C8/(B8*12)"], ["=1-C9/(B9*12)"]];
assumptions.getRange("F7:F9").values = [
  ["Time/quantity-bounded willingness-to-pay test; never lifetime grandfathering"],
  ["Primary standard-price hypothesis for product and fundraising planning"],
  ["Tests whether trust + family collaboration supports category-level pricing"],
];
body(assumptions, "A7:F9");
assumptions.getRange("B7:C9").format.numberFormat = "$0.00";
assumptions.getRange("E7:E9").format.numberFormat = "0.0%";
assumptions.getRange("B7:F9").format.fill = COLORS.clayLight;

section(assumptions, "A12:I12", "Operating scenarios");
assumptions.getRange("A13:I13").values = [["Scenario", "Annual mix", "Web share", "Refund rate", "Variable infra / paid HH", "Direct support / paid HH", "Annual renewal", "Target LTV:CAC", "Assumed CAC"]];
header(assumptions, "A13:I13");
assumptions.getRange("A14:I16").values = [
  ["Downside", 0.6, 0.5, 0.07, 6, 20, 0.3, 3, 60],
  ["Base", 0.75, 0.65, 0.035, 3, 8, 0.45, 3, 40],
  ["Upside", 0.85, 0.8, 0.02, 2, 4, 0.6, 3, 25],
];
body(assumptions, "A14:I16");
assumptions.getRange("B14:D16").format.numberFormat = "0.0%";
assumptions.getRange("E14:F16").format.numberFormat = "$0.00";
assumptions.getRange("G14:G16").format.numberFormat = "0.0%";
assumptions.getRange("H14:H16").format.numberFormat = "0.0x";
assumptions.getRange("I14:I16").format.numberFormat = "$0.00";
assumptions.getRange("B14:I16").format.fill = COLORS.clayLight;

section(assumptions, "A19:I19", "Commerce fees — official public list prices, modeled conservatively");
assumptions.getRange("A20:D20").values = [["Provider / component", "Variable fee", "Fixed fee", "Modeling note"]];
header(assumptions, "A20:D20");
assumptions.getRange("A21:D25").values = [
  ["Paddle Checkout (MoR)", 0.05, 0.5, "Includes tax/compliance and payment-related buyer support; legal/privacy/corporate-tax duties remain"],
  ["Apple App Store", 0.15, 0, "Only if eligible and accepted into Small Business Program; storefront-specific terms may differ"],
  ["Stripe Payments — domestic card", 0.029, 0.3, "International cards +1.5%; FX +1%; refund treatment may retain fees"],
  ["Stripe Billing — pay as you go", 0.007, 0, "Percentage of Billing volume"],
  ["Stripe Tax Basic — calculation", 0.005, 0, "Where registered; filing/registration and other plans add cost"],
];
body(assumptions, "A21:D25");
assumptions.getRange("B21:B25").format.numberFormat = "0.0%";
assumptions.getRange("C21:C25").format.numberFormat = "$0.00";
assumptions.getRange("B21:C25").format.fill = COLORS.clayLight;

section(assumptions, "A28:I28", "Fixed direct production COGS by scale — planning assumptions, not vendor quotes");
assumptions.getRange("A29:C29").values = [["Paid households", "Fixed direct production COGS / year", "Includes"]];
header(assumptions, "A29:C29");
assumptions.getRange("A30:C33").values = [
  [100, 12000, "Production hosting minimums, monitoring, security tooling, directly attributable support"],
  [1000, 24000, "Higher observability, storage, recovery and support capacity"],
  [10000, 72000, "Scaled infra, direct support operations and security tooling"],
  [50000, 180000, "Larger capacity and direct customer operations; must be replaced by actual contracts"],
];
body(assumptions, "A30:C33");
assumptions.getRange("A30:A33").format.numberFormat = "#,##0";
assumptions.getRange("B30:B33").format.numberFormat = "$#,##0";
assumptions.getRange("A30:B33").format.fill = COLORS.clayLight;

section(assumptions, "A36:I36", "Annual company fixed-cost reference — operating break-even sensitivity");
assumptions.getRange("A37:C37").values = [["Operating model", "Annual fixed cost", "Boundary"]];
header(assumptions, "A37:C37");
assumptions.getRange("A38:C40").values = [
  ["Lean founder-led", 150000, "Does not assume free founder labor; jurisdiction and salary mix pending"],
  ["Small product team", 500000, "R&D, G&A, legal/security and go-to-market planning placeholder"],
  ["Scale team", 1000000, "Sensitivity only; not a hiring plan or financing ask"],
];
body(assumptions, "A38:C40");
assumptions.getRange("B38:B40").format.numberFormat = "$#,##0";
assumptions.getRange("B38:B40").format.fill = COLORS.clayLight;
setWidths(assumptions, [["A", 24], ["B", 16], ["C", 42], ["D", 46], ["E", 17], ["F", 48], ["G", 15], ["H", 15], ["I", 14]]);
assumptions.freezePanes.freezeRows(3);

// Unit economics
title(unit, "T", "Rillora unit economics — price × scenario", "Per paid household per year. Taxes are excluded from revenue. Model assumes commerce fees are not recovered when a customer is refunded.");
unit.getRange("A5:T5").values = [["Offer", "Scenario", "Monthly", "Annual", "Annual mix", "Web share", "Gross billings", "Refunds", "Net revenue", "Web fees", "Apple fees", "Variable infra", "Direct support", "Contribution profit", "Contribution margin", "Renewal", "Simple contribution LTV", "CAC ceiling @ target", "Assumed CAC", "CAC payback months"]];
header(unit, "A5:T5");
const unitRows = [];
for (let p = 0; p < 3; p += 1) {
  for (let s = 0; s < 3; s += 1) unitRows.push({ row: 6 + p * 3 + s, priceRow: 7 + p, scenarioRow: 14 + s });
}
for (const { row, priceRow, scenarioRow } of unitRows) {
  unit.getRange(`A${row}:F${row}`).formulas = [[
    `=Assumptions!A${priceRow}`,
    `=Assumptions!A${scenarioRow}`,
    `=Assumptions!B${priceRow}`,
    `=Assumptions!C${priceRow}`,
    `=Assumptions!B${scenarioRow}`,
    `=Assumptions!C${scenarioRow}`,
  ]];
  unit.getRange(`G${row}:T${row}`).formulas = [[
    `=E${row}*D${row}+(1-E${row})*C${row}*12`,
    `=G${row}*Assumptions!D${scenarioRow}`,
    `=G${row}-H${row}`,
    `=F${row}*(E${row}*(D${row}*Assumptions!B21+Assumptions!C21)+(1-E${row})*12*(C${row}*Assumptions!B21+Assumptions!C21))`,
    `=(1-F${row})*Assumptions!B22*G${row}`,
    `=Assumptions!E${scenarioRow}`,
    `=Assumptions!F${scenarioRow}`,
    `=I${row}-J${row}-K${row}-L${row}-M${row}`,
    `=N${row}/I${row}`,
    `=Assumptions!G${scenarioRow}`,
    `=N${row}/(1-P${row})`,
    `=Q${row}/Assumptions!H${scenarioRow}`,
    `=Assumptions!I${scenarioRow}`,
    `=S${row}/N${row}*12`,
  ]];
}
body(unit, "A6:T14");
unit.getRange("C6:D14").format.numberFormat = "$0.00";
unit.getRange("E6:F14").format.numberFormat = "0.0%";
unit.getRange("G6:N14").format.numberFormat = "$0.00";
unit.getRange("O6:P14").format.numberFormat = "0.0%";
unit.getRange("Q6:S14").format.numberFormat = "$0.00";
unit.getRange("T6:T14").format.numberFormat = "0.0";
unit.getRange("A9:T11").format.fill = COLORS.sage;
unit.getRange("A10:T10").format.font = { name: "Aptos", size: 10, bold: true, color: COLORS.ink };
unit.getRange("O6:O14").conditionalFormats.add("colorScale", { colors: ["#F2C6BD", "#FFF2CC", "#C6E0B4"] });
unit.freezePanes.freezeRows(5);
unit.freezePanes.freezeColumns(2);
setWidths(unit, [["A", 22], ["B", 12], ["C", 11], ["D", 11], ["E", 11], ["F", 11], ["G", 13], ["H", 11], ["I", 12], ["J", 11], ["K", 11], ["L", 12], ["M", 12], ["N", 15], ["O", 15], ["P", 10], ["Q", 16], ["R", 15], ["S", 12], ["T", 15]]);

// Channel economics
title(channel, "L", "Channel economics — commerce architecture", "Web uses Paddle MoR as the launch-planning baseline. Stripe direct is a sensitivity, not a launch decision. Apple assumes Small Business Program eligibility.");
channel.getRange("A5:L5").values = [["Offer", "Monthly", "Annual", "Paddle annual fee", "Paddle effective", "Paddle monthly annualized", "Stripe annual fee", "Stripe effective", "Stripe monthly annualized", "Apple annual fee", "Apple monthly annualized", "Base blended fees"]];
header(channel, "A5:L5");
for (let i = 0; i < 3; i += 1) {
  const row = 6 + i;
  const priceRow = 7 + i;
  const baseUnitRow = 7 + i * 3;
  channel.getRange(`A${row}:C${row}`).formulas = [[`=Assumptions!A${priceRow}`, `=Assumptions!B${priceRow}`, `=Assumptions!C${priceRow}`]];
  channel.getRange(`D${row}:L${row}`).formulas = [[
    `=C${row}*Assumptions!B21+Assumptions!C21`,
    `=D${row}/C${row}`,
    `=12*(B${row}*Assumptions!B21+Assumptions!C21)`,
    `=C${row}*(Assumptions!B23+Assumptions!B24+Assumptions!B25)+Assumptions!C23`,
    `=G${row}/C${row}`,
    `=12*(B${row}*(Assumptions!B23+Assumptions!B24+Assumptions!B25)+Assumptions!C23)`,
    `=C${row}*Assumptions!B22`,
    `=B${row}*12*Assumptions!B22`,
    `='Unit Economics'!J${baseUnitRow}+'Unit Economics'!K${baseUnitRow}`,
  ]];
}
body(channel, "A6:L8");
channel.getRange("B6:D8").format.numberFormat = "$0.00";
channel.getRange("E6:E8").format.numberFormat = "0.0%";
channel.getRange("F6:G8").format.numberFormat = "$0.00";
channel.getRange("H6:H8").format.numberFormat = "0.0%";
channel.getRange("I6:L8").format.numberFormat = "$0.00";
channel.getRange("A7:L7").format.fill = COLORS.sage;
section(channel, "A11:L11", "Interpretation");
channel.getRange("A12:L16").merge(true);
channel.getRange("A12:A16").values = [
  ["Paddle MoR costs more than a domestic Stripe-only stack at the recommended annual price, but the gap is small before registrations, filings, international-card and FX costs. It can reduce operational complexity during global validation."],
  ["Merchant of Record does not remove Rillora's privacy, consumer-protection, product-safety, corporate-income-tax or accounting obligations."],
  ["Apple is the largest modeled channel cost. The 15% assumption must not be used unless Rillora is accepted into the Small Business Program; storefront-specific contracts remain a separate control."],
  ["Keep a provider-neutral product catalog, entitlement ledger, invoice identity and exportable transaction journal so a future buyer can migrate providers."],
  ["Do not change customer-facing prices by channel without a deliberate trust, conversion and App Store policy review."],
];
body(channel, "A12:L16");
setWidths(channel, [["A", 23], ["B", 11], ["C", 11], ["D", 15], ["E", 13], ["F", 18], ["G", 15], ["H", 13], ["I", 18], ["J", 15], ["K", 18], ["L", 16]]);
channel.freezePanes.freezeRows(5);

// 18-month operating plan
title(runway, "G", "18-month operating plan — cash runway sensitivity", "Cash-planning placeholders, not a hiring plan or financing ask. Replace with entity, payroll, vendor and launch-market quotes before fundraising materials are used externally.");
runway.getRange("A5:G5").values = [["Cash category", "Validation / founder-led", "Core small team", "Accelerated", "Accounting treatment", "Evidence status", "Primary replacement input"]];
header(runway, "A5:G5");
runway.getRange("A6:G13").values = [
  ["Founder/team cash compensation", 90000, 360000, 720000, "R&D / G&A / S&M by role and time", "Placeholder", "Payroll plan, employer taxes, benefits, jurisdiction"],
  ["Engineering/design contractors", 45000, 120000, 240000, "Usually R&D; capitalization policy requires CPA", "Placeholder", "Signed SOWs and IP assignment"],
  ["Cloud, identity, monitoring, security tools", 18000, 45000, 90000, "Direct COGS vs R&D/G&A allocation by usage", "Architecture-informed placeholder", "AWS/Auth0/tool bills and allocation policy"],
  ["Legal, privacy, tax and accounting", 30000, 75000, 150000, "G&A; some transaction work separated", "Budget reserve", "Entity + country-specific counsel/accountant quotes"],
  ["Security review, pentest and assurance", 15000, 40000, 80000, "R&D or G&A; direct customer assurance separated", "Budget reserve", "Scoped vendor quote after production architecture"],
  ["Insurance, administration and developer/vendor fees", 9000, 24000, 45000, "G&A; direct service insurance separated", "Budget reserve", "Broker, filings, Apple and vendor contracts"],
  ["Customer research, support and operations", 12000, 45000, 90000, "Direct support in COGS; research/ops outside GM", "Placeholder", "Support minutes, rates, research plan"],
  ["Marketing and partnership tests", 15000, 75000, 225000, "Sales & marketing", "Placeholder", "Approved channel tests and attributed CAC"],
];
body(runway, "A6:G13");
runway.getRange("B6:D13").format.numberFormat = "$#,##0";
runway.getRange("B6:D13").format.fill = COLORS.clayLight;
runway.getRange("A15:A19").values = [["Subtotal"], ["Contingency"], ["18-month cash need"], ["Average monthly burn"], ["24-month equivalent planning target"]];
runway.getRange("B15:D15").formulas = [["=SUM(B6:B13)", "=SUM(C6:C13)", "=SUM(D6:D13)"]];
runway.getRange("B16:D16").values = [[0.15, 0.15, 0.15]];
runway.getRange("B17:D17").formulas = [["=B15*(1+B16)", "=C15*(1+C16)", "=D15*(1+D16)"]];
runway.getRange("B18:D18").formulas = [["=B17/18", "=C17/18", "=D17/18"]];
runway.getRange("B19:D19").formulas = [["=B18*24", "=C18*24", "=D18*24"]];
header(runway, "A15:D15");
body(runway, "A16:D19");
runway.getRange("B16:D16").format.numberFormat = "0%";
runway.getRange("B15:D15").format.numberFormat = "$#,##0";
runway.getRange("B17:D19").format.numberFormat = "$#,##0";
runway.getRange("A17:D17").format = { fill: COLORS.sage, font: { name: "Aptos", size: 11, bold: true, color: COLORS.ink }, borders: { preset: "all", style: "thin", color: COLORS.line } };
section(runway, "A22:G22", "Interpretation and controls");
runway.getRange("A23:G27").merge(true);
runway.getRange("A23:A27").values = [
  ["The Validation scenario is about $269k including 15% contingency; it assumes constrained founder cash compensation and selective contractors, not free labor."],
  ["The Core small-team scenario is about $902k including contingency. It is a planning envelope, not an instruction to raise that amount or hire immediately."],
  ["Do not subtract annual subscription cash collected from recognized revenue mechanically. Maintain separate cash, billings, tax, deferred revenue and P&L schedules."],
  ["Do not classify all cloud or support cost as R&D to inflate gross margin. Define and apply a consistent direct-COGS allocation policy before investor reporting."],
  ["A financing plan should add fundraising transaction costs, closing timing, minimum cash balance and downside runway; this worksheet intentionally stops before a real financing decision."],
];
body(runway, "A23:G27");
setWidths(runway, [["A", 35], ["B", 19], ["C", 18], ["D", 18], ["E", 35], ["F", 27], ["G", 42]]);
runway.getRange("6:13").format.rowHeight = 44;
runway.getRange("23:27").format.rowHeight = 34;
runway.freezePanes.freezeRows(5);

// Scale scenarios
title(scale, "H", "Scale scenarios — reported gross margin and break-even", "Recommended list price with Base operating assumptions. Reported gross margin includes fixed direct production COGS; company break-even additionally includes R&D, G&A and go-to-market fixed cost.");
scale.getRange("A5:H5").values = [["Paid households", "Gross billings", "Net revenue", "Contribution before fixed direct COGS", "Fixed direct production COGS", "Reported gross profit", "Reported gross margin", "Evidence status"]];
header(scale, "A5:H5");
for (let i = 0; i < 4; i += 1) {
  const row = 6 + i;
  const assumptionRow = 30 + i;
  scale.getRange(`A${row}`).formulas = [[`=Assumptions!A${assumptionRow}`]];
  scale.getRange(`B${row}:G${row}`).formulas = [[
    `=A${row}*'Unit Economics'!G10`,
    `=A${row}*'Unit Economics'!I10`,
    `=A${row}*'Unit Economics'!N10`,
    `=Assumptions!B${assumptionRow}`,
    `=D${row}-E${row}`,
    `=F${row}/C${row}`,
  ]];
  scale.getRange(`H${row}`).values = [["Planning sensitivity; replace with invoices, payroll allocation and support time"]];
}
body(scale, "A6:H9");
scale.getRange("A6:A9").format.numberFormat = "#,##0";
scale.getRange("B6:F9").format.numberFormat = "$#,##0";
scale.getRange("G6:G9").format.numberFormat = "0.0%";
scale.getRange("G6:G9").conditionalFormats.add("colorScale", { colors: ["#F2C6BD", "#FFF2CC", "#C6E0B4"] });

section(scale, "A12:H12", "Company fixed-cost break-even sensitivity");
scale.getRange("A13:D13").values = [["Operating model", "Annual fixed cost", "Paid HH break-even — recommended list", "Paid HH break-even — founder cell"]];
header(scale, "A13:D13");
for (let i = 0; i < 3; i += 1) {
  const row = 14 + i;
  const assumptionRow = 38 + i;
  scale.getRange(`A${row}:D${row}`).formulas = [[
    `=Assumptions!A${assumptionRow}`,
    `=Assumptions!B${assumptionRow}`,
    `=B${row}/'Unit Economics'!N10`,
    `=B${row}/'Unit Economics'!N7`,
  ]];
}
body(scale, "A14:D16");
scale.getRange("B14:B16").format.numberFormat = "$#,##0";
scale.getRange("C14:D16").format.numberFormat = "#,##0";

scale.getRange("J5:K5").values = [["Scale", "Reported GM"]];
scale.getRange("J6:J9").formulas = [["=A6"], ["=A7"], ["=A8"], ["=A9"]];
scale.getRange("K6:K9").formulas = [["=G6"], ["=G7"], ["=G8"], ["=G9"]];
header(scale, "J5:K5");
body(scale, "J6:K9");
scale.getRange("J6:J9").format.numberFormat = "#,##0";
scale.getRange("K6:K9").format.numberFormat = "0.0%";
const gmChart = scale.charts.add("ColumnClustered", scale.getRange("J5:K9"), "Auto");
gmChart.title.text = "Reported gross margin improves with scale";
gmChart.hasLegend = false;
gmChart.setPosition("F13", "K27");
gmChart.width = 500;
gmChart.height = 290;
gmChart.axes.valueAxis.numberFormatCode = "0%";
setWidths(scale, [["A", 17], ["B", 15], ["C", 15], ["D", 21], ["E", 20], ["F", 16], ["G", 16], ["H", 34], ["J", 12], ["K", 14]]);
scale.freezePanes.freezeRows(5);

// Funding readiness
title(readiness, "F", "Fundraising and acquisition readiness — metric contract", "These are planning gates, not claims of traction. Rillora must store numerator, denominator, cohort, channel and source record for every reported metric.");
section(readiness, "A5:F5", "Commercial scorecard");
readiness.getRange("A6:F6").values = [["Metric", "Planning gate", "Why buyers/investors care", "Required source fields", "Current evidence", "Owner / cadence"]];
header(readiness, "A6:F6");
readiness.getRange("A7:F16").values = [
  ["Full-price paid households", "50–100 before scaling acquisition", "Separates curiosity from willingness to pay", "customer_id, price_version, channel, paid_at, refund_at", "None — payments closed", "Founder / weekly"],
  ["Annual plan mix", "Measure; Base model 75%", "Cash collection and churn exposure", "billing_period, gross_billings, tax, fees", "None", "Finance / monthly"],
  ["90-day plan-maintenance rate", "Define cohort before launch; no fake renewal proxy", "Early ongoing value before annual renewal exists", "cohort_start, review_event, material_update, active_days", "None", "Product / monthly"],
  ["Annual renewal", "Base hypothesis 45%; replace after first eligible cohort", "Primary LTV and durability driver", "renewal_due, renewed_at, cancellation_reason", "None", "Finance / cohort"],
  ["Refund rate", "Planning target <5%", "Trust, price fit and support signal", "refund_reason, amount, channel, days_since_purchase", "None", "Support / monthly"],
  ["Software gross margin", "Observed path >75%; show variable and fully allocated", "Quality of revenue and operating leverage", "recognized_revenue, commerce_fees, hosting, direct_support", "Model only", "Finance / monthly"],
  ["CAC payback", "Planning target <18 months", "Capital efficiency", "spend, attributed_paid_households, contribution_profit", "None", "Growth / cohort"],
  ["LTV:CAC", "Planning target ≥3.0x", "Growth can create rather than destroy value", "cohort contribution, renewal, CAC", "Model only", "Finance / quarterly"],
  ["Support minutes / paid HH", "Measure median + P90", "Hidden labor can erase SaaS margin", "ticket_id, minutes, category, tier, resolved_at", "None", "Support / monthly"],
  ["Channel / partner concentration", "No untracked dependency; disclose top channel", "Buyer risk and negotiating leverage", "source_channel, partner_id, revenue, cancellations", "None", "Finance / quarterly"],
];
body(readiness, "A7:F16");
readiness.getRange("B7:B16").format.fill = COLORS.sage;

section(readiness, "A19:F19", "Diligence-ready data room — build before it is requested");
readiness.getRange("A20:F20").values = [["Area", "Minimum artifact", "Risk if absent", "System of record", "Status", "Release gate"]];
header(readiness, "A20:F20");
readiness.getRange("A21:F29").values = [
  ["Corporate / ownership", "Entity docs, cap table, board/consent trail", "Ownership and authority uncertainty", "Controlled company drive", "OPEN", "Before financing / sale"],
  ["IP", "Founder/contractor assignment, trademark/domain ownership, OSS inventory", "Buyer cannot confirm it acquires the product", "Legal register + SBOM", "PARTIAL", "Before external contractors"],
  ["Revenue", "Billings-to-cash-to-recognized-revenue reconciliation", "ARR and margin cannot be trusted", "Ledger + payment exports", "NOT STARTED", "Before payment"],
  ["Subscriptions", "Entitlement/version history, refunds, cancellations, deferred revenue", "Customer liability and cohort metrics are opaque", "Provider-neutral entitlement ledger", "DESIGNED", "Before payment"],
  ["Privacy", "RoPA, DPA/SCC, DPIA where required, subprocessor register, DSAR evidence", "Regulatory and successor liability", "Privacy compliance register", "PARTIAL", "Before market launch"],
  ["Security", "Threat model, access reviews, incidents, backup/restore and deletion proof", "Sensitive-data risk becomes buyer discount", "Security evidence repository", "PARTIAL", "Before real sensitive data"],
  ["Product safety", "Disclosure decision history, audit events, no-password boundary", "Core claim cannot be defended", "Append-only audit and policy versions", "DESIGNED", "Before disclosure workflows"],
  ["Vendors", "Contracts, subprocessors, pricing, renewal/termination, export plan", "Lock-in and change-of-control friction", "Vendor register", "PARTIAL", "Before production"],
  ["Services", "Separate labor, revenue, insurance/QA and margin", "Low-margin labor hides in software GM", "Services P&L", "DORMANT", "Before Care add-on"],
];
body(readiness, "A21:F29");
setWidths(readiness, [["A", 24], ["B", 27], ["C", 28], ["D", 31], ["E", 16], ["F", 22]]);
readiness.freezePanes.freezeRows(6);

// Checks
title(checks, "E", "Model checks", "All checks should return PASS. These checks validate arithmetic and internal consistency, not market demand or legal compliance.");
checks.getRange("A5:E5").values = [["Check", "Formula result", "Expected", "Status", "Interpretation"]];
header(checks, "A5:E5");
checks.getRange("A6:A14").values = [
  ["Recommended annual saving is 17.5%"],
  ["All price/scenario contribution profit is positive"],
  ["All contribution margins are between 0% and 100%"],
  ["Recommended Base price is $8.99 / $89"],
  ["Reported gross profit reconciliation at 1,000 paid HH"],
  ["Scale paid-household rows are increasing"],
  ["Founder price contribution is below recommended list"],
  ["Recommended Base CAC ceiling exceeds $40 assumed CAC"],
  ["No payment authorization embedded in model status"],
];
checks.getRange("B6:B14").formulas = [
  ["=ABS(Assumptions!E8-0.175010196)<0.0001"],
  ["=MIN('Unit Economics'!N6:N14)>0"],
  ["=AND(MIN('Unit Economics'!O6:O14)>0,MAX('Unit Economics'!O6:O14)<1)"],
  ["=AND(Assumptions!B8=8.99,Assumptions!C8=89)"],
  ["=ABS('Scale Scenarios'!F7-('Scale Scenarios'!D7-'Scale Scenarios'!E7))<0.01"],
  ["=AND('Scale Scenarios'!A6<'Scale Scenarios'!A7,'Scale Scenarios'!A7<'Scale Scenarios'!A8,'Scale Scenarios'!A8<'Scale Scenarios'!A9)"],
  ["='Unit Economics'!N7<'Unit Economics'!N10"],
  ["='Unit Economics'!R10>'Unit Economics'!S10"],
  ["=COUNTIF(Assumptions!D7:D9,\"PROVISIONAL\")=3"],
];
checks.getRange("C6:C14").values = [[true], [true], [true], [true], [true], [true], [true], [true], [true]];
checks.getRange("D6:D14").formulas = [["=IF(B6=C6,\"PASS\",\"FAIL\")"], ["=IF(B7=C7,\"PASS\",\"FAIL\")"], ["=IF(B8=C8,\"PASS\",\"FAIL\")"], ["=IF(B9=C9,\"PASS\",\"FAIL\")"], ["=IF(B10=C10,\"PASS\",\"FAIL\")"], ["=IF(B11=C11,\"PASS\",\"FAIL\")"], ["=IF(B12=C12,\"PASS\",\"FAIL\")"], ["=IF(B13=C13,\"PASS\",\"FAIL\")"], ["=IF(B14=C14,\"PASS\",\"FAIL\")"]];
checks.getRange("E6:E14").values = [
  ["Confirms monthly/annual price relationship"],
  ["Model has no structurally loss-making unit before fixed production COGS"],
  ["Catches sign and denominator errors"],
  ["Prevents silent price drift"],
  ["Contribution less fixed direct COGS equals reported gross profit"],
  ["Scale table references correct paid-household assumptions"],
  ["Higher list price creates additional acquisition capacity"],
  ["Base model supports but does not prove $40 CAC"],
  ["A model cannot activate external payments"],
];
body(checks, "A6:E14");
checks.getRange("D6:D14").conditionalFormats.add("containsText", { text: "PASS", format: { fill: "#D9EAD3", font: { color: COLORS.green, bold: true } } });
checks.getRange("D6:D14").conditionalFormats.add("containsText", { text: "FAIL", format: { fill: "#F4CCCC", font: { color: COLORS.red, bold: true } } });
setWidths(checks, [["A", 45], ["B", 16], ["C", 12], ["D", 12], ["E", 49]]);

// Sources
title(sources, "E", "Source register", "Official fee and compliance sources are preferred. Benchmark reports are directional and must never be presented as Rillora's observed performance.");
sources.getRange("A5:E5").values = [["Topic", "Source", "URL", "Used for", "Evidence boundary"]];
header(sources, "A5:E5");
sources.getRange("A6:E24").values = [
  ["Payments", "Stripe pricing", "https://stripe.com/pricing", "2.9% + $0.30 domestic online cards; international/FX increments; Tax Basic", "Public list price; account and country may differ"],
  ["Billing", "Stripe Billing pricing", "https://stripe.com/billing/pricing", "0.7% pay-as-you-go Billing fee", "Public list price"],
  ["MoR", "Paddle pricing", "https://www.paddle.com/pricing", "5% + $0.50 and included commerce functions", "Provider claims; contract controls"],
  ["MoR contract", "Paddle terms", "https://www.paddle.com/legal/terms", "Supplier payout, fees and MoR pricing authority", "Legal review required before signature"],
  ["App Store", "Apple Small Business Program", "https://developer.apple.com/app-store/small-business-program/", "15% eligible commission assumption", "Eligibility and acceptance required"],
  ["Subscriptions", "Apple auto-renewable subscriptions", "https://developer.apple.com/app-store/subscriptions/", "85% SBP proceeds; standard subscription progression", "Storefront contracts may differ"],
  ["Developer fee", "Apple membership", "https://developer.apple.com/support/compare-memberships/", "$99 annual membership", "Local currency may differ"],
  ["Identity", "Auth0 pricing", "https://auth0.com/pricing", "Free/Essentials/Professional step costs", "Feature and MAU needs determine plan"],
  ["Compute", "AWS Fargate pricing", "https://aws.amazon.com/fargate/pricing/", "Per-resource compute and Spot sensitivity", "Architecture and region specific"],
  ["API", "AWS API Gateway pricing", "https://aws.amazon.com/api-gateway/pricing/", "Request-volume sensitivity", "Credits/free tier are temporary"],
  ["Database", "AWS RDS PostgreSQL pricing", "https://aws.amazon.com/rds/postgresql/pricing/", "Instance/storage/backup transfer cost structure", "Use AWS calculator before production"],
  ["EU VAT", "EU VAT One Stop Shop", "https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en", "Destination VAT and OSS operational gate", "Tax counsel and merchant structure required"],
  ["EU consumer", "Directive (EU) 2023/2673 summary", "https://eur-lex.europa.eu/legal-content/en/LSU/?uri=CELEX%3A32023L2673", "Withdrawal/cancellation design context", "Implementation dates and local law vary"],
  ["US subscriptions", "FTC Negative Option Rule", "https://www.ftc.gov/legal-library/browse/rules/negative-option-rule", "Clear terms, consent and simple cancellation baseline", "Rule status and state law require launch review"],
  ["GDPR", "GDPR consolidated text", "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679", "Representative, DPIA and breach obligations", "Applicability and exceptions require counsel"],
  ["UK privacy", "ICO data protection fee", "https://ico.org.uk/for-organisations/data-protection-fee/data-protection-fee/", "UK fee tier awareness", "Registration status depends on entity and processing"],
  ["Subscription benchmark", "RevenueCat State of Subscription Apps 2026 — Utilities", "https://www.revenuecat.com/state-of-subscription-apps-2026-utilities", "Directional price, trial, refund and retention ranges", "Mobile cohort benchmark; not Rillora evidence"],
  ["SaaS benchmark", "High Alpha SaaS Benchmarks 2025", "https://online.flippingbook.com/view/1018476450", "Directional gross margin and CAC payback ranges", "B2B SaaS; use only as a sanity check"],
  ["SaaS benchmark", "Benchmarkit / Baker Tilly 2025", "https://www.bakertilly.com/insights/b2b-saas-benchmark-report", "Metric discipline and benchmark context", "B2B SaaS; not consumer-category proof"],
];
body(sources, "A6:E24");
sources.getRange("C6:C24").format.font = { name: "Aptos", size: 9, color: "#1A5FB4", underline: true };
setWidths(sources, [["A", 22], ["B", 31], ["C", 54], ["D", 39], ["E", 35]]);
sources.freezePanes.freezeRows(5);

// Executive summary, linked to the model rather than hardcoded outputs.
title(summary, "N", "Rillora pricing and fundability model", "Decision-support model — 2026-08-13. All prices, retention, cost and acquisition figures remain hypotheses until real cohorts exist.");
summary.getRange("A5:C5").merge();
summary.getRange("D5:F5").merge();
summary.getRange("G5:I5").merge();
summary.getRange("J5:N5").merge();
summary.getRange("A5").values = [["Founder / WTP cell"]];
summary.getRange("D5").values = [["Recommended list"]];
summary.getRange("G5").values = [["Upper sensitivity"]];
summary.getRange("J5").values = [["Commercial judgment"]];
summary.getRange("A5:N5").format = { fill: COLORS.ink, font: { name: "Aptos", size: 11, bold: true, color: COLORS.white }, horizontalAlignment: "center", verticalAlignment: "center" };
summary.getRange("A6:C7").merge();
summary.getRange("D6:F7").merge();
summary.getRange("G6:I7").merge();
summary.getRange("J6:N7").merge();
summary.getRange("A6").formulas = [["=TEXT(Assumptions!B7,\"$0.00\")&\" / month  ·  \"&TEXT(Assumptions!C7,\"$0\")&\" / year\""]];
summary.getRange("D6").formulas = [["=TEXT(Assumptions!B8,\"$0.00\")&\" / month  ·  \"&TEXT(Assumptions!C8,\"$0\")&\" / year\""]];
summary.getRange("G6").formulas = [["=TEXT(Assumptions!B9,\"$0.00\")&\" / month  ·  \"&TEXT(Assumptions!C9,\"$0\")&\" / year\""]];
summary.getRange("J6").values = [["Use $59 only as a bounded founder / willingness-to-pay cell. Build the product, metrics and fundraising plan around $89 standard list until real cohort evidence replaces it."]];
summary.getRange("A6:N7").format = { fill: COLORS.cream, font: { name: "Aptos Display", size: 14, bold: true, color: COLORS.ink }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: COLORS.line } };
summary.getRange("D6:F7").format.fill = COLORS.sage;
summary.getRange("J6:N7").format.font = { name: "Aptos", size: 11, bold: true, color: COLORS.ink };

section(summary, "A10:F10", "Recommended list — Base case per paid household / year");
summary.getRange("A11:B16").values = [["Metric", "Model output"], ["Gross annualized billings", null], ["Net revenue after refunds", null], ["Contribution profit", null], ["Contribution margin", null], ["CAC ceiling @ 3.0x", null]];
header(summary, "A11:B11");
summary.getRange("B12:B16").formulas = [["='Unit Economics'!G10"], ["='Unit Economics'!I10"], ["='Unit Economics'!N10"], ["='Unit Economics'!O10"], ["='Unit Economics'!R10"]];
body(summary, "A12:B16");
summary.getRange("B12:B14").format.numberFormat = "$0.00";
summary.getRange("B15:B15").format.numberFormat = "0.0%";
summary.getRange("B16:B16").format.numberFormat = "$0.00";

summary.getRange("D11:F16").merge(true);
summary.getRange("D11:D16").values = [
  ["What $89 buys"],
  ["About $25 more contribution profit per paid household per year than the $59 founder cell in the Base case."],
  ["About $15 more sustainable CAC capacity at a 3.0x LTV:CAC target."],
  ["A 17.5% annual discount: meaningful without training customers to wait for a deep discount."],
  ["Enough headroom to absorb high-trust support and security costs while measuring real usage."],
  ["Still a hypothesis. Do not call it validated until a full-price cohort pays, remains active and reaches renewal."],
];
body(summary, "D11:F16");
summary.getRange("D11:F11").format = { fill: COLORS.sage, font: { name: "Aptos", size: 10, bold: true, color: COLORS.ink }, verticalAlignment: "center" };

summary.getRange("H10:N10").merge();
summary.getRange("H10").values = [["Acquisition capacity by price hypothesis — Base case"]];
summary.getRange("H10:N10").format = { fill: COLORS.sage, font: { name: "Aptos Display", size: 12, bold: true, color: COLORS.ink }, verticalAlignment: "center" };
summary.getRange("A20:B20").values = [["Offer", "CAC ceiling"]];
summary.getRange("A21:A23").formulas = [["='Unit Economics'!A7"], ["='Unit Economics'!A10"], ["='Unit Economics'!A13"]];
summary.getRange("B21:B23").formulas = [["='Unit Economics'!R7"], ["='Unit Economics'!R10"], ["='Unit Economics'!R13"]];
header(summary, "A20:B20");
body(summary, "A21:B23");
summary.getRange("B21:B23").format.numberFormat = "$0.00";
const cacChart = summary.charts.add("BarClustered", summary.getRange("A20:B23"), "Auto");
cacChart.title.text = "Higher list price creates acquisition headroom";
cacChart.hasLegend = false;
cacChart.setPosition("H11", "N23");
cacChart.width = 570;
cacChart.height = 285;

section(summary, "A26:N26", "Decision gates before the first real payment");
summary.getRange("A27:N30").merge(true);
summary.getRange("A27:A30").values = [
  ["1. Entity + markets: select the merchant legal entity and initial launch countries; global vision does not mean opening every storefront on day one."],
  ["2. Commerce: compare Paddle MoR against Stripe direct using the actual entity, countries, currency, refund and filing requirements; preserve a provider-neutral entitlement and ledger model."],
  ["3. Consumer/privacy: approve recurring-billing disclosures, cancellation/refund wording, tax treatment, DPA/subprocessor register, DPIA need and regional representative obligations."],
  ["4. Measurement: instrument recognized revenue, billings, tax, refunds, fees, support time, cohort maintenance, renewals, CAC and channel attribution before marketing spend."],
];
body(summary, "A27:N30");
summary.getRange("A32:N33").merge();
summary.getRange("A32").values = [["Not included: valuation, financing amount, universal legal-compliance claim, lifetime plan, real claim handling, legal advice, payment activation or a promise that the model will achieve the forecast."]];
summary.getRange("A32:N33").format = { fill: COLORS.clayLight, font: { name: "Aptos", size: 10, bold: true, color: COLORS.red }, wrapText: true, verticalAlignment: "center" };
setWidths(summary, [["A", 18], ["B", 15], ["C", 4], ["D", 18], ["E", 18], ["F", 18], ["G", 4], ["H", 13], ["I", 13], ["J", 15], ["K", 15], ["L", 15], ["M", 15], ["N", 15]]);
summary.freezePanes.freezeRows(3);

// Common finishing.
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (used) used.format.rowHeight = 22;
}
summary.getRange("6:7").format.rowHeight = 34;
summary.getRange("27:30").format.rowHeight = 34;
assumptions.getRange("7:9").format.rowHeight = 46;
assumptions.getRange("21:25").format.rowHeight = 54;
assumptions.getRange("30:33").format.rowHeight = 52;
assumptions.getRange("38:40").format.rowHeight = 46;
readiness.getRange("7:29").format.rowHeight = 38;
sources.getRange("6:24").format.rowHeight = 36;

// QA: inspect the model, render every sheet, then export.
const inspection = await workbook.inspect({ kind: "sheet,formula,drawing", maxChars: 9000, options: { maxResults: 250 } });
process.stdout.write(`${inspection.ndjson}\n`);
const errorInspection = await workbook.inspect({ kind: "match", search: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", maxChars: 4000, options: { maxResults: 100 } });
process.stdout.write(`FORMULA_ERRORS\n${errorInspection.ndjson}\n`);
const checkInspection = await workbook.inspect({ kind: "region", sheetId: "Checks", range: "A5:E14", maxChars: 6000 });
process.stdout.write(`CHECKS\n${checkInspection.ndjson}\n`);
const summaryInspection = await workbook.inspect({ kind: "region", sheetId: "Executive Summary", range: "A10:F16", maxChars: 4000 });
process.stdout.write(`SUMMARY\n${summaryInspection.ndjson}\n`);

for (const sheet of workbook.worksheets.items) {
  const rendered = await workbook.render({ sheetName: sheet.name, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheet.name.toLowerCase().replaceAll(" ", "-");
  await fs.writeFile(`${outputDir}preview-${safeName}.png`, new Uint8Array(await rendered.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}Rillora_Unit_Economics.xlsx`);
