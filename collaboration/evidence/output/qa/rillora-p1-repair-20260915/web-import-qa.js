async(page)=>{
 await page.goto('http://127.0.0.1:4264');
 await page.getByRole('button',{name:'Settings',exact:true}).click();
 await page.getByRole('button',{name:'Open a saved copy',exact:true}).click();
 await page.getByLabel('Saved copy file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/web-map-backup.json');
 await page.getByRole('button',{name:'Import into an empty map',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Import private records',exact:true}).click();
 await page.getByText('3 matters imported. Choose sharing separately.',{exact:true}).waitFor();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-import-private.png'});
 return await page.locator('main').innerText();
}
