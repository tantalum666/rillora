import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const dir=fileURLToPath(new URL('.',import.meta.url));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(`${dir}Rillora_Pricing_Reset.xlsx`));
const expected=JSON.parse(await fs.readFile(`${dir}results.json`,'utf8'));
const cells=JSON.parse(await fs.readFile(`${dir}cell-map.json`,'utf8'));
const s=Object.fromEntries(['Decision','Inputs','Unit economics','Operations','99 option'].map(n=>[n,wb.worksheets.getItem(n)]));
let checks=0;
const value=(sheet,cell)=>s[sheet].getRange(cell).values[0][0];
const near=(a,b,label)=>{checks++;if(typeof a!=='number'||Math.abs(a-b)>0.0000001)throw Error(`${label}: ${a} != ${b}`);};
const set=(sheet,cell,x)=>{s[sheet].getRange(cell).values=[[x]];wb.recalculate();};
for(let c=1;c<=3;c++){
  set('Inputs','D4',c);const e=expected[c-1];
  for(let i=0;i<4;i++){const col='DEFG'[i];near(value('Unit economics',`${col}27`),e.annual[i].contribution,'annual CP');near(value('Unit economics',`${col}29`),e.annual[i].renewalContribution,'renewal CP');}
  for(let i=0;i<5;i++){const col='DEFGH'[i];near(value('Unit economics',`${col}61`),e.monthly[i].contribution,'monthly CP');near(value('Operations',`${col}29`),e.scales[i].steadyAfterReplacementCAC,'steady ops');near(value('Operations',`${col}30`),e.scales[i].fullTimeAfterReplacementCAC,'full-time ops');}
  near(value('Unit economics','D79'),e.blended.contribution,'blended annual/monthly');
  near(value('99 option','D18'),e.premium.contribution,'expanded99');
  const keys=['beforeAcquisition','allNewAfterCAC','steadyAfterReplacementCAC','fullTimeAfterReplacementCAC'];
  keys.forEach((key,i)=>{const actual=value('Operations',`D${39+i}`);if(e.breakeven[key]===null){checks++;if(actual!=='n.a.')throw Error('False break-even');}else near(actual,e.breakeven[key],'break-even');});
}
set('Inputs','D4',2);
const freeBase=`D${Number(cells.freeRatio.slice(1))+2}`;
set('Inputs',freeBase,11);near(value('Unit economics','E27'),expected[1].annual[1].contribution-0.32,'extra Free user');set('Inputs',freeBase,10);
const onboardBase=`D${Number(cells.onboardingMinutes.slice(1))+2}`;
set('Inputs',onboardBase,0);near(value('Unit economics','E27'),expected[1].annual[1].contribution+4,'valid zero support');set('Inputs',onboardBase,10);
set('Inputs',cells.webTaxRate,.1);set('Inputs',cells.appleTaxRate,.1);near(value('Unit economics','E12'),49*.97/1.1,'tax excluded from revenue');set('Inputs',cells.webTaxRate,0);set('Inputs',cells.appleTaxRate,0);
set('Operations','F6',1923);near(value('Operations','F13'),0,'at Free MAU capacity');set('Operations','F6',1924);near(value('Operations','F13'),6000,'above Free MAU capacity');set('Operations','F6',1000);
checks++;if(value('Operations','F32')!=='n.a.')throw Error('Unknown tax appears as net income');
set('Inputs',cells.profitTaxRate,0);near(value('Operations','F32'),expected[1].scales[2].steadyAfterReplacementCAC,'zero tax distinct from missing');set('Inputs',cells.profitTaxRate,null);
near(value('Decision','D24'),expected[1].scales[2].steadyAfterReplacementCAC,'linked summary restored');
const charts=s.Decision.charts.items;
checks++;if(charts.length!==1||!charts[0].series.items[0].formula)throw Error('Chart lost source binding');
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20}});
await fs.writeFile(`${dir}reopened-verification.json`,JSON.stringify({checks,passed:true,engine:'Artifact Tool imported XLSX recalculation',nativeExcelOrWPSRecalculation:false,scenario:2,formulaScan:errors.ndjson,chartBindings:charts[0].series.items.map(x=>({formula:x.formula,categories:x.categoryFormula}))},null,2));
console.log(JSON.stringify({checks,passed:true,formulaScan:errors.ndjson}));
