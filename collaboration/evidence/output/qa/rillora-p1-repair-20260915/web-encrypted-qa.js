async(page)=>{
 await page.getByRole('button',{name:'Format',exact:true}).click();
 await page.getByRole('button',{name:'Encrypted',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 return await page.getByRole('dialog').innerText();
}
