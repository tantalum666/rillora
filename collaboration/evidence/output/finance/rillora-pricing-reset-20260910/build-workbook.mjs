import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const dir=fileURLToPath(new URL('.',import.meta.url));
const data=JSON.parse(await fs.readFile(`${dir}inputs.json`,'utf8'));
const independent=JSON.parse(await fs.readFile(`${dir}results.json`,'utf8'));
const wb=Workbook.create();
const summary=wb.worksheets.add('Decision');
const inputs=wb.worksheets.add('Inputs');
const unit=wb.worksheets.add('Unit economics');
const ops=wb.worksheets.add('Operations');
const premium=wb.worksheets.add('99 option');
const sheets=[summary,inputs,unit,ops,premium];
const ink='#263C35', green='#347450',blue='#1457B8',cream='#F7F8F4',sage='#E2EAE3',clay='#B66D4C';
const usd='"$"#,##0.00;("$"#,##0.00);"–"';
const money='"$"#,##0;("$"#,##0);"–"';
const num='#,##0.00;(#,##0.00);"–"';
const pct='0.0%;(0.0%);"–"';
function v(s,c,x){s.getRange(c).values=[[x]];}
function f(s,c,x){s.getRange(c).formulas=[[x]];s.getRange(c).format.font.color=x.includes("'!")||x.includes("'!")?green:(/!/.test(x)?green:'#202020');}
function row(s,n,label,forms){v(s,`C${n}`,label);if(forms)s.getRange(`D${n}:${String.fromCharCode(67+forms.length)}${n}`).formulas=[forms];}
function section(s,n,title,end='H'){v(s,`C${n}`,title);s.getRange(`C${n}:${end}${n}`).format={fill:sage,font:{bold:true,color:ink},rowHeight:29};}
function title(s,t){v(s,'C2',t);s.getRange('C2:H2').format.font={size:16,bold:true,color:ink};s.getRange('C2:H2').format.rowHeight=30;s.getRange('C3:H3').format.borders={bottom:{style:'thin',color:'#BDC9C1'}};v(s,'C4','Scenario');f(s,'D4',"='Inputs'!E4");s.getRange('D4:E4').format.font.color=green;}
function total(s,n,end='H'){s.getRange(`C${n}:${end}${n}`).format={font:{bold:true},borders:{top:{style:'thin',color:'#B8C8BE'}}};}
function warn(s,r){s.getRange(r).conditionalFormats.add('cellIs',{operator:'lessThan',formula:0,format:{fill:'#FCE7DF',font:{color:'#A52921',bold:true}}});}
function inputCell(c,value,fmt){v(inputs,c,value);inputs.getRange(c).format={fill:'#FFF2D8',font:{color:blue}};if(fmt)inputs.getRange(c).setNumberFormat(fmt);}
for(const s of sheets){s.showGridLines=false;s.getRange('A1:K250').format.font={name:'Arial',size:11,color:ink};s.getRange('A1:K250').format.verticalAlignment='center';s.getRange('A1:B250').format.columnWidth=2.5;s.getRange('C1:C250').format.columnWidth=48;s.getRange('D1:H250').format.columnWidth=18;s.getRange('I1:I250').format.columnWidth=3;s.getRange('J1:K250').format.columnWidth=22;s.getRange('C1:H250').format.rowHeight=23;s.getRange('D6:H250').setNumberFormat(usd);}
summary.tabColor=ink;inputs.tabColor='#789A83';
title(summary,'Rillora 定价重算');title(inputs,'成本与费率假设（USD）');title(unit,'每户经济与月付队列');title(ops,'规模、固定成本与税前盈余');title(premium,'US$99 功能方案的新增投入');
v(inputs,'C4','Scenario selector');inputCell('D4',data.case,'0');f(inputs,'E4','=CHOOSE(D4,"Low service cost","Planning base","High service cost")');inputs.getRange('D4').dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:3}};
v(inputs,'C6','Annual candidate');inputCell('D6',data.annualCandidate,usd);v(inputs,'C7','Monthly candidate');inputCell('D7',data.monthlyCandidate,usd);
v(inputs,'C5','1 Low service cost / 2 Planning base / 3 High service cost');
inputs.getRange('C8:F8').values=[['Driver','Active value','Basis','Source']];inputs.getRange('C8:F8').format={fill:ink,font:{color:'#FFFFFF',bold:true}};
inputs.getRange('E9:E230').format.columnWidth=66;inputs.getRange('F9:F230').format.columnWidth=78;
inputs.getRange('E9:F230').format.font.size=10;
let r=9;const cells={};
for(const d of data.drivers){cells[d.id]=`D${r}`;v(inputs,`C${r}`,d.label);f(inputs,`D${r}`,`=IF(ISNUMBER(CHOOSE($D$4,D${r+1},D${r+2},D${r+3})),CHOOSE($D$4,D${r+1},D${r+2},D${r+3}),"n.a.")`);inputs.getRange(`C${r}:D${r}`).format.fill=sage;v(inputs,`E${r}`,d.basis);v(inputs,`F${r}`,d.source||'Planning assumption, 2026-09-10');const fmt=d.format==='percent'?pct:(d.format==='usd'?usd:num);inputs.getRange(`D${r}:D${r+3}`).setNumberFormat(fmt);for(let k=0;k<3;k++){v(inputs,`C${r+k+1}`,data.cases[k]);inputs.getRange(`C${r+k+1}`).format.font={color:'#68736D',size:10};inputCell(`D${r+k+1}`,d.values[k],fmt);}r+=4;}
const ref=id=>`'Inputs'!$${cells[id].replace(/(\D+)(\d+)/,'$1$$$2')}`;
section(inputs,r++,'Official fees and settlement assumptions','F');
const feeLabels={stripeCard:'Stripe card rate',internationalIncrement:'International-card increment',internationalShare:'International share of Web charges',stripeFixed:'Fixed USD fee per transaction',billingRate:'Stripe Billing rate',taxToolRate:'Tax Basic rate',taxToolShare:'Web charges using Tax Basic',webTaxRate:'Tax included in displayed Web price',appleTaxRate:'Tax included in displayed Apple price',webFxRate:'Currency-conversion rate',webFxShare:'Web settlements requiring conversion',usdPayoutRate:'USD payout rate',usdPayoutMinimum:'Minimum USD payout fee',payoutsPerYear:'USD payouts per year',disputeIncidence:'Disputed Web transactions fraction',disputeCostUSD:'Extra dispute-fee reserve',appleRefundFeeRetention:'Commission retained on Apple refunds'};
feeLabels.appleRenewalRate='Apple commission after one full paid year';
for(const [id,label]of Object.entries(feeLabels)){cells[id]=`D${r}`;v(inputs,`C${r}`,label);inputCell(`D${r}`,data.fees[id],['stripeFixed','usdPayoutMinimum','disputeCostUSD'].includes(id)?usd:id==='payoutsPerYear'?'0':pct);v(inputs,`E${r}`,['webTaxRate','appleTaxRate','internationalShare','taxToolShare','webFxShare','payoutsPerYear','disputeIncidence','disputeCostUSD','appleRefundFeeRetention'].includes(id)?'Editable assumption; no actual merchant statement':'Official list component; conditional application');v(inputs,`F${r}`,id==='appleRefundFeeRetention'?'Conservative reserve, not verified refund treatment':id==='appleRenewalRate'?'https://developer.apple.com/app-store/subscriptions/':data.fees.source);r++;}
section(inputs,r++,'Annual fixed operating costs','F');const opexStart=r;
for(const item of data.fixedOpex){v(inputs,`C${r}`,item.label);inputCell(`D${r}`,item.amount,money);v(inputs,`E${r}`,item.basis);v(inputs,`F${r}`,item.source||'Planning budget, not an invoice');r++;}cells.fixedOpex=`D${r}`;v(inputs,`C${r}`,'Fixed OPEX total');f(inputs,`D${r}`,`=SUM(D${opexStart}:D${r-1})`);total(inputs,r++,'F');
const params=[['maintenanceHoursMonthly','Product maintenance hours monthly'],['developerRate','Loaded development hourly rate'],['adminHoursMonthly','General administration hours monthly'],['fullTimeCompAnnual','Alternative full-time founder compensation'],['launchCashReserve','One-time launch cash reserve'],['auth0FreeMAU','Auth0 Free MAU allowance'],['auth0IncrementMonthly','Unquoted Auth0 step reserve monthly'],['hostingStepPaid','Paid households per hosting capacity step'],['hostingStepMonthly','Additional capacity cost per step monthly'],['extra99SupportMinutes','Additional 99 support minutes yearly'],['premiumTargetCM','99 software target contribution margin']];
params.push(['annualAcquisitionShare','Annual share of newly acquired payers']);
for(const[id,label]of params){cells[id]=`D${r}`;v(inputs,`C${r}`,label);inputCell(`D${r}`,data[id],['premiumTargetCM','annualAcquisitionShare'].includes(id)?pct:(/Rate|Comp|Reserve|Cost|StepMonthly|Increment/.test(id)?money:num));v(inputs,`E${r}`,id==='auth0IncrementMonthly'?data.auth0IncrementBasis:id==='auth0FreeMAU'?'Official Free capacity; includes active recipient identities':'Planning assumption, not spending commitment');v(inputs,`F${r}`,id==='auth0FreeMAU'?'https://auth0.com/pricing':'Planning assumption, 2026-09-10');r++;}
cells.profitTaxRate=`D${r}`;v(inputs,`C${r}`,'Effective income-tax rate');v(inputs,`D${r}`,null);inputs.getRange(`D${r}`).format.fill='#FFF2D8';v(inputs,`E${r}`,'Unknown. After-tax profit remains n.a. until a valid rate is entered.');r++;
section(inputs,r++,'Candidate prices for identical current scope','F');
for(const[id,value]of [['price39',39],['price59',59],['price99',99]]){cells[id]=`D${r}`;v(inputs,`C${r}`,`Comparison annual price ${value}`);inputCell(`D${r}`,value,usd);r++;}
section(inputs,r++,'External price references checked 2026-09-10','F');
for(const c of data.competitors){v(inputs,`C${r}`,c.name);inputCell(`D${r}`,c.annual,usd);v(inputs,`E${r}`,c.basis);v(inputs,`F${r}`,c.source);r++;}
v(inputs,`C${r+1}`,'AWS actual bill: unavailable; operator session expired. All operating costs are budgets.');v(inputs,`C${r+2}`,'USD payout and FX are separate settlement routes. Avoid charging both by default.');v(inputs,`C${r+3}`,'Blue = editable. Green = sheet links. Missing source values are not zero.');
inputs.freezePanes.freezeRows(8);

const cols=['D','E','F','G'];
row(unit,6,'Annual displayed price',[`=${ref('price39')}`,"='Inputs'!$D$6",`=${ref('price59')}`,`=${ref('price99')}`]);
section(unit,7,'Annual subscription, first paid year');
const webRate=`(${ref('stripeCard')}+${ref('internationalIncrement')}*${ref('internationalShare')}+${ref('billingRate')}+${ref('taxToolRate')}*${ref('taxToolShare')}+${ref('webFxRate')}*${ref('webFxShare')})`;
const transactionFixed=`(${ref('stripeFixed')}+${ref('disputeIncidence')}*${ref('disputeCostUSD')})`;
const labels={8:'Web revenue before refunds, ex tax',9:'Apple revenue before refunds, ex tax',10:'Blended revenue before refunds',11:'Refund / reversal reserve',12:'Net subscription revenue',14:'Weighted Web processing and billing',15:'Weighted Apple commission',16:'Weighted variable USD payout fee',17:'Total variable channel fees',19:'Paid household cloud / email',20:'Initial paid-user support',21:'Recurring paid-user support',22:'All-in cost per active Free planner',23:'Active Free population subsidy',24:'Inactive retained-plan subsidy',25:'Total variable service costs',27:'Contribution per new annual payer',28:'Contribution margin',29:'Contribution per annual renewal',30:'First-year contribution less CAC',31:'Three-year contribution sensitivity',32:'Three-year contribution / 3',33:'Cautious CAC budget ceiling',34:'Three-year contribution less CAC'};
for(const[n,l]of Object.entries(labels))v(unit,`C${n}`,l);
for(const c of cols){const x=n=>`${c}${n}`;const F={8:`${x(6)}/(1+${ref('webTaxRate')})`,9:`${x(6)}/(1+${ref('appleTaxRate')})`,10:`${x(8)}*${ref('webShare')}+${x(9)}*(1-${ref('webShare')})`,11:`${x(10)}*${ref('refundRate')}`,12:`${x(10)}-${x(11)}`,14:`(${x(6)}*${webRate}+${transactionFixed})*${ref('webShare')}`,15:`${x(9)}*${ref('appleRate')}*(1-${ref('webShare')})*(1-${ref('refundRate')}*(1-${ref('appleRefundFeeRetention')}))`,16:`MAX(0,${x(6)}*(1-${ref('refundRate')})-${x(6)}*${webRate}-${transactionFixed})*${ref('usdPayoutRate')}*${ref('webShare')}`,17:`SUM(${x(14)}:${x(16)})`,19:ref('paidInfra'),20:`${ref('onboardingMinutes')}*${ref('laborRate')}/60`,21:`${ref('ongoingMinutes')}*${ref('laborRate')}/60`,22:`${ref('freeInfra')}+${ref('freeSupportMinutes')}*${ref('laborRate')}/60`,23:`${x(22)}*${ref('freeRatio')}`,24:`${ref('retainedRatio')}*${ref('retainedCost')}`,25:`SUM(${x(19)}:${x(21)})+SUM(${x(23)}:${x(24)})`,27:`${x(12)}-${x(17)}-${x(25)}`,28:`${x(27)}/${x(12)}`,29:`${x(27)}+${x(20)}`,30:`${x(27)}-${ref('cac')}`,31:`${x(27)}+${x(29)}*${ref('annualRenewal')}+${x(29)}*${ref('annualRenewal')}^2`,32:`${x(31)}/3`,33:`MIN(${x(27)}/2,${x(32)})`,34:`${x(31)}-${ref('cac')}`};for(const[n,formula]of Object.entries(F))f(unit,x(n),`=${formula}`);}
v(unit,'C26','Apple commission saved after first year');
for(const c of cols){f(unit,`${c}26`,`=${c}9*(${ref('appleRate')}-${ref('appleRenewalRate')})*(1-${ref('webShare')})*(1-${ref('refundRate')}*(1-${ref('appleRefundFeeRetention')}))`);f(unit,`${c}29`,`=${c}27+${c}20+${c}26`);f(unit,`${c}33`,`=MAX(0,MIN(${c}27/2,${c}32))`);}
unit.getRange('D28:G28').setNumberFormat(pct);unit.getRange('C28:G28').format.font.italic=true;
for(const n of[12,17,25,27,29,30,33])total(unit,n,'G');warn(unit,'D27:G34');
v(unit,'C36','Same scope at all four prices. The 99 feature build is evaluated separately.');
v(unit,'C37','Three-year values use assumed renewal only; no perpetual LTV or ARR claim.');
section(unit,40,'Monthly: first 12 months after acquisition');
row(unit,42,'Paid months',["=1","=3","=6","=12",`=IF(${ref('monthlySurvival')}=1,12,(1-${ref('monthlySurvival')}^12)/(1-${ref('monthlySurvival')}))`]);
row(unit,43,'Monthly displayed price',Array(5).fill("='Inputs'!$D$7"));v(unit,'H41','Expected cohort');unit.getRange('D42:H42').setNumberFormat(num);
const mLabels={44:'Cash billings over paid months',45:'Revenue before refunds, ex tax',46:'Refund / reversal reserve',47:'Net subscription revenue',49:'Weighted Web channel fees',50:'Weighted Apple commission',51:'Variable USD payout fee',52:'Variable channel fees total',54:'Cloud during paid months',55:'One initial support cost',56:'Recurring support during paid months',57:'Active Free population subsidy',58:'Own retained Free plan after lapse',59:'Variable service costs total',61:'Contribution before CAC / fixed costs',62:'Acquisition cost',63:'Contribution after CAC'};
for(const[n,l]of Object.entries(mLabels))v(unit,`C${n}`,l);
for(const c of ['D','E','F','G','H']){const x=n=>`${c}${n}`;const F={44:`${x(42)}*${x(43)}`,45:`${x(44)}*(${ref('webShare')}/(1+${ref('webTaxRate')})+(1-${ref('webShare')})/(1+${ref('appleTaxRate')}))`,46:`${x(45)}*${ref('refundRate')}`,47:`${x(45)}-${x(46)}`,49:`(${x(44)}*${webRate}+${x(42)}*${transactionFixed})*${ref('webShare')}`,50:`${x(44)}/(1+${ref('appleTaxRate')})*${ref('appleRate')}*(1-${ref('webShare')})*(1-${ref('refundRate')}*(1-${ref('appleRefundFeeRetention')}))`,51:`MAX(0,${x(44)}*(1-${ref('refundRate')})-${x(44)}*${webRate}-${x(42)}*${transactionFixed})*${ref('usdPayoutRate')}*${ref('webShare')}`,52:`SUM(${x(49)}:${x(51)})`,54:`${ref('paidInfra')}*${x(42)}/12`,55:`${ref('onboardingMinutes')}*${ref('laborRate')}/60`,56:`${ref('ongoingMinutes')}*${ref('laborRate')}/60*${x(42)}/12`,57:`$E$22*${ref('freeRatio')}*${x(42)}/12`,58:`($E$22+${ref('retainedCost')})*(12-${x(42)})/12`,59:`SUM(${x(54)}:${x(58)})`,61:`${x(47)}-${x(52)}-${x(59)}`,62:ref('cac'),63:`${x(61)}-${x(62)}`};for(const[n,formula]of Object.entries(F))f(unit,x(n),`=${formula}`);}
for(const n of[47,52,59,61,63])total(unit,n);warn(unit,'D61:H63');
v(unit,'C65','Expected cohort sums monthly survival; it is not twelve guaranteed payments.');
v(unit,'C66','One-month cancellation is legitimate; onboarding and CAC still have to be paid.');
section(unit,69,'Channel concentration at the selected annual price');
unit.getRange('C70:F70').values=[['Channel','Fees before payout minimum','Contribution','Contribution margin']];
const basePrice="'Inputs'!$D$6";
v(unit,'C71','100% Stripe HK, USD payout');f(unit,'D71',`=${basePrice}*${webRate}+${transactionFixed}+MAX(0,${basePrice}*(1-${ref('refundRate')})-${basePrice}*${webRate}-${transactionFixed})*${ref('usdPayoutRate')}`);
for(const[n,rate,label]of [[72,.15,'100% Apple, approved SBP'],[73,.30,'100% Apple, standard first year']]){v(unit,`C${n}`,label);f(unit,`D${n}`,`=${basePrice}/(1+${ref('appleTaxRate')}))*${rate}`.replace('))*',')*'));}
for(let n=71;n<=73;n++){const tax=n===71?'webTaxRate':'appleTaxRate';f(unit,`E${n}`,`=${basePrice}/(1+${ref(tax)})*(1-${ref('refundRate')})-D${n}-$E$25`);f(unit,`F${n}`,`=E${n}/(${basePrice}/(1+${ref(tax)})*(1-${ref('refundRate')}))`);}unit.getRange('F71:F73').setNumberFormat(pct);
section(unit,76,'New-payer annual / monthly mix');
v(unit,'C77','Annual share of new payers');f(unit,'D77',`=${ref('annualAcquisitionShare')}`);unit.getRange('D77').setNumberFormat(pct);
v(unit,'C78','First 12-month revenue per new payer');f(unit,'D78','=D77*E12+(1-D77)*H47');
v(unit,'C79','First 12-month contribution per new payer');f(unit,'D79','=D77*E27+(1-D77)*H61');
v(unit,'C80','Contribution after acquisition');f(unit,'D80',`=D79-${ref('cac')}`);
v(unit,'C81','Operations grid is annual-only; this mix prevents equating all buyers with full annual households.');
unit.freezePanes.freezeRows(7);

ops.getRange('D6:H6').values=[[100,500,1000,2500,10000]];v(ops,'C6','Annual paid households');ops.getRange('D6:H6').setNumberFormat('#,##0');section(ops,7,'First-year annual cohort and recurring business');
const opLabels={8:'Net annual revenue',9:'First-year contribution total',10:'Fixed production hosting',11:'Production operations labor',12:'Identity MAU including receivers',13:'Unquoted identity capacity reserve',14:'Additional hosting capacity',15:'USD payout minimum top-up',16:'Fixed direct COGS / fee top-up',18:'Gross profit after fixed direct COGS',19:'Gross margin',21:'Fixed operating expenses',22:'Part-time founder maintenance / admin',23:'Pre-acquisition operating surplus',24:'CAC if all payers are new',25:'All-new cohort operating surplus',27:'Steady-state contribution',28:'CAC replacing nonrenewing payers',29:'Steady-state operating surplus',30:'With full-time founder compensation',31:'Income-tax sensitivity',32:'After-tax profit, if tax rate provided'};
for(const[n,l]of Object.entries(opLabels))v(ops,`C${n}`,l);
const fixedFounder=`(${ref('maintenanceHoursMonthly')}*${ref('developerRate')}+${ref('adminHoursMonthly')}*${ref('laborRate')})*12`;
for(const c of ['D','E','F','G','H']){const x=n=>`${c}${n}`;const F={8:`${x(6)}*'Unit economics'!$E$12`,9:`${x(6)}*'Unit economics'!$E$27`,10:`${ref('fixedCloudMonthly')}*12`,11:`${ref('prodOpsHoursMonthly')}*${ref('laborRate')}*12`,12:`${x(6)}*(${ref('freeRatio')}+${ref('paidMAU')})`,13:`IF(${x(12)}>${ref('auth0FreeMAU')},${ref('auth0IncrementMonthly')}*12,0)`,14:`MAX(0,ROUNDUP(${x(6)}/${ref('hostingStepPaid')},0)-1)*${ref('hostingStepMonthly')}*12`,15:`IF(AND(${ref('webShare')}>0,${ref('usdPayoutRate')}>0),MAX(0,${ref('usdPayoutMinimum')}*${ref('payoutsPerYear')}-${x(6)}*'Unit economics'!$E$16),0)`,16:`SUM(${x(10)}:${x(11)})+SUM(${x(13)}:${x(15)})`,18:`${x(9)}-${x(16)}`,19:`${x(18)}/${x(8)}`,21:ref('fixedOpex'),22:fixedFounder,23:`${x(18)}-${x(21)}-${x(22)}`,24:`${x(6)}*${ref('cac')}`,25:`${x(23)}-${x(24)}`,27:`${x(6)}*('Unit economics'!$E$27*(1-${ref('annualRenewal')})+'Unit economics'!$E$29*${ref('annualRenewal')})`,28:`${x(6)}*(1-${ref('annualRenewal')})*${ref('cac')}`,29:`${x(27)}-${x(16)}-${x(21)}-${x(22)}-${x(28)}`,30:`${x(29)}+${x(22)}-${ref('fullTimeCompAnnual')}`,31:`IF(ISNUMBER(${ref('profitTaxRate')}),MAX(0,${x(29)})*${ref('profitTaxRate')},"n.a.")`,32:`IF(ISNUMBER(${x(31)}),${x(29)}-${x(31)},"n.a.")`};for(const[n,formula]of Object.entries(F))f(ops,x(n),`=${formula}`);}
ops.getRange('D8:H32').setNumberFormat(money);ops.getRange('D12:H12').setNumberFormat('#,##0');ops.getRange('D19:H19').setNumberFormat(pct);ops.getRange('C19:H19').format.font.italic=true;for(const n of[16,18,23,25,29,30,32])total(ops,n);warn(ops,'D18:H32');
v(ops,'C34','Identity spend above 25k MAU is an unquoted reserve; real pricing is unavailable.');
v(ops,'C35','All-new, steady-state and founder-pay views are separate; none is actual profit.');
section(ops,37,'Planning break-even: 50-household resolution');
const gridStart=49,gridEnd=248;
const gridCols=[['D','Before acquisition'],['E','All-new after CAC'],['F','Steady state after replacement CAC'],['G','Full-time compensation']];
for(let i=0;i<gridCols.length;i++){const[col,label]=gridCols[i];v(ops,`C${39+i}`,label);f(ops,`D${39+i}`,`=IF(MAX(${String.fromCharCode(72+i)}${gridStart}:${String.fromCharCode(72+i)}${gridEnd})>=10000,"n.a.",MAX(${String.fromCharCode(72+i)}${gridStart}:${String.fromCharCode(72+i)}${gridEnd})+50)`);ops.getRange(`D${39+i}`).setNumberFormat('#,##0');}
v(ops,'C44','Launch reserve plus 6 months fixed cost');f(ops,'D44',`=${ref('launchCashReserve')}+(D16+D21+D22)/2`);v(ops,'C45','Includes imputed labor, excludes user acquisition and new 99 capabilities.');
ops.getRange('C48:K48').values=[['Paid HH','Pre-CAC','All-new','Steady','Full-time','Last loss A','Last loss B','Last loss C','Last loss D']];
for(let n=gridStart;n<=gridEnd;n++){v(ops,`C${n}`,(n-gridStart+1)*50);const N=`$C${n}`;const fixed=`(${ref('fixedCloudMonthly')}*12+${ref('prodOpsHoursMonthly')}*${ref('laborRate')}*12+IF(${N}*(${ref('freeRatio')}+${ref('paidMAU')})>${ref('auth0FreeMAU')},${ref('auth0IncrementMonthly')}*12,0)+MAX(0,ROUNDUP(${N}/${ref('hostingStepPaid')},0)-1)*${ref('hostingStepMonthly')}*12+IF(AND(${ref('webShare')}>0,${ref('usdPayoutRate')}>0),MAX(0,${ref('usdPayoutMinimum')}*${ref('payoutsPerYear')}-${N}*'Unit economics'!$E$16),0))`;f(ops,`D${n}`,`=${N}*'Unit economics'!$E$27-${fixed}-${ref('fixedOpex')}-${fixedFounder}`);f(ops,`E${n}`,`=D${n}-${N}*${ref('cac')}`);f(ops,`F${n}`,`=D${n}+${N}*'Unit economics'!$E$20*${ref('annualRenewal')}-${N}*(1-${ref('annualRenewal')})*${ref('cac')}`);f(ops,`G${n}`,`=F${n}+${fixedFounder}-${ref('fullTimeCompAnnual')}`);for(let k=0;k<4;k++)f(ops,`${String.fromCharCode(72+k)}${n}`,`=IF(${String.fromCharCode(68+k)}${n}<0,${N},0)`);}
for(let n=gridStart;n<=gridEnd;n++)f(ops,`F${n}`,`=D${n}+$C${n}*('Unit economics'!$E$29-'Unit economics'!$E$27)*${ref('annualRenewal')}-$C${n}*(1-${ref('annualRenewal')})*${ref('cac')}`);
ops.getRange('C49:C248').setNumberFormat('#,##0');ops.getRange('D49:G248').setNumberFormat(money);ops.getRange('H49:K248').setNumberFormat('#,##0');ops.freezePanes.freezeRows(7);

premium.getRange('C6:G6').values=[['Additional work','Low hours','High hours','Fixed yearly','Per HH yearly']];
data.additional99.forEach((item,i)=>{const n=i+7;v(premium,`C${n}`,item.label);premium.getRange(`D${n}:G${n}`).values=[[item.lowHours,item.highHours,item.annualFixed,item.perHH]];premium.getRange(`D${n}:G${n}`).format={font:{color:blue},fill:'#FFF2D8'};premium.getRange(`D${n}:E${n}`).setNumberFormat('#,##0');premium.getRange(`C${n}`).format.wrapText=true;premium.getRange(`C${n}:G${n}`).format.rowHeight=44;});
row(premium,12,'Total',["=SUM(D7:D10)","=SUM(E7:E10)","=SUM(F7:F10)","=SUM(G7:G10)"]);total(premium,12,'G');premium.getRange('D12:E12').setNumberFormat('#,##0');
row(premium,13,'Development labor cost',[`=D12*${ref('developerRate')}`,`=E12*${ref('developerRate')}`]);
const pLabels={16:'Contribution at 99, current scope',17:'Extra service cost including support',18:'Contribution of expanded 99 software',19:'Expanded software contribution margin',20:'Incremental contribution vs 49',21:'Additional fixed service cost / year',22:'Year-one upgrades needed for added cost',23:'Incremental year-one surplus at 1,000',24:'Included human minutes at target margin'};
for(const[n,l]of Object.entries(pLabels))v(premium,`C${n}`,l);
f(premium,'D16',"='Unit economics'!G27");f(premium,'D17',`=G12+${ref('extra99SupportMinutes')}*${ref('laborRate')}/60`);f(premium,'D18','=D16-D17');f(premium,'D19',"=D18/'Unit economics'!G12");f(premium,'D20',"=D18-'Unit economics'!E27");f(premium,'D21','=F12');f(premium,'D22','=IF(D20<=0,"n.a.",ROUNDUP((D21+AVERAGE(D13:E13))/D20,0))');f(premium,'D23','=1000*D20-D21-AVERAGE(D13:E13)');f(premium,'D24',`=MAX(0,'Unit economics'!G12*(1-${ref('premiumTargetCM')})-'Unit economics'!G17-'Unit economics'!G25-D17)*60/${ref('laborRate')}`);premium.getRange('D19').setNumberFormat(pct);premium.getRange('D22:D24').setNumberFormat(num);premium.getRange('D23').setNumberFormat(money);for(const n of[18,20,22,23])total(premium,n,'G');warn(premium,'D18:D23');
v(premium,'C27','Planning estimates, not quotes. 280–480 hours does not guarantee a release date.');v(premium,'C28','No included concierge, legal documents, death determination or bank integrations.');v(premium,'C29','Costs do not prove willingness to pay. No new subscription tier is activated.');v(premium,'C30','At 1,000 upgrades, assume every current customer accepts 99; this is not a forecast.');v(premium,'C31','Additional per-HH budgets are not quoted AI prices or shipped functionality.');

v(summary,'C6','建议先重新定价');v(summary,'C7','Family 年付候选');f(summary,'D7',"='Inputs'!D6");v(summary,'F7','月付候选');f(summary,'G7',"='Inputs'!D7");v(summary,'C8','年付比连续月付节省');f(summary,'D8',"=1-'Inputs'!D6/('Inputs'!D7*12)");summary.getRange('D8').setNumberFormat(pct);
v(summary,'C10','复核保留为辅助能力。99 不再是当前目标价，49 也仍需真实付款验证。');
summary.getRange('C12:G12').values=[['同一当前功能范围','年价','每户贡献','贡献率','首年扣获客成本']];
for(let i=0;i<4;i++){const c=cols[i],n=i+13;v(summary,`C${n}`,i===1?'当前测试候选':'价格敏感性');f(summary,`D${n}`,`='Unit economics'!${c}6`);f(summary,`E${n}`,`='Unit economics'!${c}27`);f(summary,`F${n}`,`='Unit economics'!${c}28`);f(summary,`G${n}`,`='Unit economics'!${c}30`);}summary.getRange('F13:F16').setNumberFormat(pct);summary.getRange('C14:G14').format.fill=sage;warn(summary,'E13:G16');
v(summary,'C18','1,000 年付家庭（USD / 年）');
const sumMetrics=[['扣退款后收入','F8'],['毛利：已扣固定生产成本','F18'],['毛利率','F19'],['税前：未计获客','F23'],['税前：全新客户','F25'],['税前：稳定规模','F29'],['税前：全职工资','F30']];
sumMetrics.forEach(([l,c],i)=>{v(summary,`C${19+i}`,l);f(summary,`D${19+i}`,`='Operations'!${c}`);});summary.getRange('D19:D25').setNumberFormat(money);summary.getRange('D21').setNumberFormat(pct);warn(summary,'D19:D25');
const chart=summary.charts.add('bar',[summary.getRange('C22:C25'),summary.getRange('D22:D25')]);chart.title='经营口径不同，结果不同（USD / 年）';chart.titleTextStyle.fontSize=13;chart.titleTextStyle.typeface='Arial';chart.hasLegend=false;chart.series.items[0].fill=clay;chart.xAxis={axisType:'textAxis',textStyle:{typeface:'Arial',fontSize:10}};chart.yAxis={numberFormatCode:'$#,##0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:10}};chart.setPosition('F18','K31');
v(summary,'C28','稳定规模盈亏平衡家庭数');f(summary,'D28',"='Operations'!D41");v(summary,'C29','含全职工资的平衡家庭数');f(summary,'D29',"='Operations'!D42");summary.getRange('D28:D29').setNumberFormat('#,##0');
v(summary,'C32','只订 1 个月：贡献 / 扣获客后');f(summary,'D32',"='Unit economics'!D61");f(summary,'E32',"='Unit economics'!D63");warn(summary,'D32:E32');
v(summary,'C34','把功能做成 99 的新增成本');f(summary,'D35',"='99 option'!D13");f(summary,'E35',"='99 option'!E13");v(summary,'C35','新增开发投入范围');v(summary,'C36','新增固定服务成本 / 年');f(summary,'D36',"='99 option'!D21");v(summary,'C37','新增软件服务后的贡献率');f(summary,'D37',"='99 option'!D19");summary.getRange('D37').setNumberFormat(pct);
v(summary,'C39','费用依据：当前官方费率。其余运营、客服、转化、续费均为可调假设。');v(summary,'C40','AWS 实际账单未取得；超过 Auth0 免费容量的费用只是未报价准备金。');v(summary,'C41','没有实际营收或税后净利润。本表不把零现金工资当作零劳动成本。');
for(const s of sheets){for(const region of s===summary?['C12:G12']:s===inputs?[]:s===premium?['C6:G6']:s===ops?['C48:K48']:['C70:F70'])s.getRange(region).format={fill:ink,font:{color:'#FFFFFF',bold:true},wrapText:true,rowHeight:36,horizontalAlignment:'center'};}
summary.getRange('C1:C45').format.columnWidth=43;summary.getRange('D1:G45').format.columnWidth=18;summary.getRange('H1:K45').format.columnWidth=13;
summary.getRange('C1:K45').format.font.color=ink;summary.getRange('D4').format.font.color=green;summary.getRange('C12:G12').format.font.color='#FFFFFF';

wb.recalculate();
const near=(a,b,name)=>{if(typeof a!=='number'||Math.abs(a-b)>1e-7)throw new Error(`${name}: ${a} != ${b}`);};
const captures=[];
for(let c=1;c<=3;c++){v(inputs,'D4',c);wb.recalculate();const expected=independent[c-1];cols.forEach((col,i)=>{near(unit.getRange(`${col}27`).values[0][0],expected.annual[i].contribution,`case ${c} annual ${i}`);});for(const [col,i] of [['D',0],['F',2],['H',4]])near(unit.getRange(`${col}61`).values[0][0],expected.monthly[i].contribution,`case ${c} monthly ${i}`);near(ops.getRange('F29').values[0][0],expected.scales[2].steadyAfterReplacementCAC,`case ${c} ops`);near(premium.getRange('D18').values[0][0],expected.premium.contribution,`case ${c} 99`);captures.push({case:c,annual:unit.getRange('D27:G28').values,monthly:unit.getRange('D61:H63').values,ops:ops.getRange('D39:D42').values});}
v(inputs,'D4',2);const original=inputs.getRange('D6').values[0][0];v(inputs,'D6',original+1);wb.recalculate();if(unit.getRange('E27').values[0][0]===independent[1].annual[1].contribution)throw new Error('Price did not flow through');v(inputs,'D6',original);
const arow=Number(cells.freeRatio.slice(1));v(inputs,`D${arow+1}`,null);wb.recalculate();near(unit.getRange('E27').values[0][0],independent[1].annual[1].contribution,'Blank unselected case');v(inputs,'D4',1);wb.recalculate();if(inputs.getRange(cells.freeRatio).values[0][0]!=='n.a.')throw new Error('Missing selected assumption became zero');v(inputs,`D${arow+1}`,data.drivers.find(d=>d.id==='freeRatio').values[0]);v(inputs,'D4',2);
const survival=cells.monthlySurvival;const sr=Number(survival.slice(1))+2;v(inputs,`D${sr}`,1);wb.recalculate();near(unit.getRange('H42').values[0][0],12,'100 percent survival');v(inputs,`D${sr}`,0);wb.recalculate();near(unit.getRange('H42').values[0][0],1,'Zero survival');v(inputs,`D${sr}`,0.75);
wb.recalculate();
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final formula error scan'});
await fs.writeFile(`${dir}formula-errors.ndjson`,errors.ndjson);
await fs.writeFile(`${dir}verification.json`,JSON.stringify({cases:captures,independentPythonChecks:true,inputChange:true,missingCase:true,monthlyBoundary:true,restoredCase:2,actualAWSBill:false,nativeExcelEngineTested:false},null,2));
await fs.writeFile(`${dir}cell-map.json`,JSON.stringify(cells,null,2));
await fs.writeFile(`${dir}workbook-inspection.ndjson`,(await wb.inspect({kind:'table',range:'Decision!C6:G37',include:'values,formulas',tableMaxRows:32,tableMaxCols:5,maxChars:6500})).ndjson);
for(const[sheet,range,file] of [['Decision','C2:K41','decision'],['Inputs','C2:F24','inputs'],['Unit economics','C6:G34','unit'],['Unit economics','C40:H66','monthly'],['Operations','C6:H45','operations'],['99 option','C2:G31','99-option']]){const blob=await wb.render({sheetName:sheet,range,scale:1.5});await fs.writeFile(`${dir}${file}.png`,new Uint8Array(await blob.arrayBuffer()));}
const out=await SpreadsheetFile.exportXlsx(wb);await out.save(`${dir}Rillora_Pricing_Reset.xlsx`);
console.log(JSON.stringify({output:`${dir}Rillora_Pricing_Reset.xlsx`,verification:'all independent comparisons passed',formulaScan:errors.ndjson,sheets:5}));
