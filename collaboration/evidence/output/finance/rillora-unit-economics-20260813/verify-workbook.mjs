import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load("Rillora_Unit_Economics.xlsx"));
const sheets = workbook.worksheets.items.map((sheet) => sheet.name);
const statuses = workbook.worksheets.getItem("Checks").getRange("D6:D14").values.flat();
const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 5000,
});

if (sheets.length !== 9) throw new Error(`Expected 9 sheets, found ${sheets.length}`);
if (statuses.some((status) => status !== "PASS")) throw new Error(`Workbook checks failed: ${statuses.join(", ")}`);
if (errors.ndjson.includes('"kind":"match"')) throw new Error(`Formula errors found: ${errors.ndjson}`);

process.stdout.write(`Sheets: ${sheets.join(" | ")}\nChecks: ${statuses.join(" | ")}\nFormula errors: none\n`);
