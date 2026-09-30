async(page)=>{
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Matters',exact:true}).click();await page.getByRole('button',{name:/Open Lost-response QA/}).click();
 await page.setViewportSize({width:390,height:844});const results=[];
 for(const kind of ['400','409','503','offline']){
  await page.getByLabel('Notes',{exact:true}).fill('Kept after '+kind);
  await page.route('**/v1/matters/*',async route=>{if(route.request().method()!=='PATCH')return route.continue();if(kind==='offline')return route.abort('failed');return route.fulfill({status:Number(kind),contentType:'application/json',headers:{'access-control-allow-origin':'http://127.0.0.1:4261','access-control-allow-credentials':'true'},body:JSON.stringify({error:{code:kind==='409'?'version_conflict':'test_failure',message:'Simulated '+kind+' response'}})});});
  await page.getByRole('button',{name:/^(Save matter|Try saving again)$/}).click();await page.getByRole('alert').waitFor();
  const alert=await page.getByRole('alert').boundingBox(),button=await page.getByRole('button',{name:'Try saving again',exact:true}).boundingBox();
  const kept=await page.getByLabel('Notes',{exact:true}).inputValue();if(kept!=='Kept after '+kind||alert.y<0||button.y+button.height>844)throw Error('Invisible save failure '+kind);
  results.push({kind,draftKept:true,errorAndRetryVisible:true});
  await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-save-'+kind+'-mobile.png'});await page.unroute('**/v1/matters/*');
 }
 await page.getByRole('button',{name:'Try saving again',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});return results;
}
