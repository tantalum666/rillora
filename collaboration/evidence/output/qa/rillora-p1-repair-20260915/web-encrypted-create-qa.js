async(page)=>{
 await page.getByLabel('Rillora cannot replace the recovery key. Anyone holding it can decrypt this copy.').check();
 await page.getByLabel('Copies outside Rillora cannot be remotely revoked.').check();
 await page.getByRole('button',{name:'Create encrypted package',exact:true}).click();
 await page.getByRole('button',{name:'Save recovery key',exact:true}).waitFor({timeout:8000});
 return await page.getByRole('dialog').innerText();
}
