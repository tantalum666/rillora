async(page)=>{
 const context=page.context();const fresh=await context.newPage();await fresh.goto('http://127.0.0.1:4261');
 await fresh.getByRole('button',{name:'Add a matter',exact:true}).click();
 await fresh.getByLabel('Name',{exact:true}).fill('Lost-response QA');await fresh.getByLabel('Provider',{exact:true}).fill('QA service');
 let dropped=false;
 await fresh.route('**/v1/matters',async route=>{if(route.request().method()==='POST'&&!dropped){dropped=true;await route.fetch();await route.abort('failed');}else await route.continue();});
 await fresh.getByRole('button',{name:'Save matter',exact:true}).click();
 await fresh.getByRole('alert').waitFor();await fresh.getByLabel('Notes',{exact:true}).fill('Edited after an uncertain first save');
 await fresh.getByRole('button',{name:'Try saving again',exact:true}).click();
 await fresh.getByText('The first save completed. Your latest edits are kept here; review them and save again.',{exact:true}).waitFor();
 await fresh.getByRole('button',{name:'Try saving again',exact:true}).click();
 await fresh.getByRole('dialog').waitFor({state:'hidden'});
 await fresh.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-lost-response-recovered.png'});
 const result={recovered:true};await fresh.close();return result;
}
