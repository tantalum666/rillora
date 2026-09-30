async(page)=>{
 let pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download recovery key',exact:true}).click();let file=await pending;await file.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/test-recovery-key.json');
 pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download package',exact:true}).click();file=await pending;await file.saveAs('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/encrypted-parent-guide.json');
 await page.getByLabel('I kept the recovery key separately.').check();
 await page.goto('http://127.0.0.1:4263/open-copy');
 await page.getByLabel('Saved copy file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/encrypted-parent-guide.json');
 await page.getByLabel('Recovery file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/test-recovery-key.json');
 await page.getByText('Retry-safe account',{exact:true}).waitFor();const text=await page.locator('main').innerText();if(text.includes('Private letter')||text.includes('Friend-only wallet'))throw Error('Recipient copy leaked');
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-encrypted-copy-opened.png'});
 return {decryptedLocally:true,text};
}
