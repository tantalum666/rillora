async(page)=>{
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:'My plan',exact:true}).click();
 await page.getByRole('button',{name:'Review Start Here guide',exact:true}).click();
 await page.getByRole('button',{name:'For a person',exact:true}).click();
 await page.getByLabel('Connected person',{exact:true}).selectOption({label:'Parent QA'});
 await page.getByRole('button',{name:'Review this copy',exact:true}).click();
 await page.getByRole('button',{name:'Choose a format',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByLabel('I reviewed the guide and understand this file is plaintext.').check();
 await page.getByLabel('Saved, shared or printed copies cannot be revoked.').check();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download printable guide',exact:true}).click();
 const file=await pending;await file.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/parent-guide.txt');
 return {scopedGuideSaved:true,filename:file.suggestedFilename()};
}
