async(page)=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4262');
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Delete my account',exact:true}).click();
 if(await page.getByRole('button',{name:'Delete account',exact:true}).isEnabled())throw Error('Delete must require confirmation');
 await page.getByLabel('I understand copies already saved or shared cannot be removed.').check();await page.getByLabel('Type DELETE to confirm',{exact:true}).fill('DELETE');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Delete account',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-deletion-confirmation.png'});
 await page.getByRole('button',{name:'Delete account',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Delete account',exact:true}).click();
 await page.getByRole('heading',{name:'Account deleted',exact:true}).waitFor({timeout:10000});
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-deletion-completed.png'});
 let pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save deletion reference',exact:true}).click();const file=await pending;await file.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/deletion-reference.json');
 await page.reload();await page.getByRole('heading',{name:'Account deleted',exact:true}).waitFor();
 return {completed:true,survivesReload:true,text:await page.locator('body').innerText()};
}
