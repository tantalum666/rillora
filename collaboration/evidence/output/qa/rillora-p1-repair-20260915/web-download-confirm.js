async(page)=>{
 const pending=page.waitForEvent('download');
 await page.getByRole('dialog').getByRole('button',{name:'Download my map',exact:true}).click();
 const file=await pending;
 await file.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/web-map-backup.json');
 return {saved:true,filename:file.suggestedFilename()};
}
