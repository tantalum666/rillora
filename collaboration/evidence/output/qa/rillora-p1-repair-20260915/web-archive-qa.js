async(page)=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:4261');
 await page.getByRole('button',{name:'Matters',exact:true}).click();
 await page.getByRole('button',{name:/Open Lost-response QA/}).click();
 await page.getByRole('button',{name:'Archive matter',exact:true}).click();
 await page.getByRole('dialog',{name:'Archive this matter?'}).getByRole('button',{name:'Archive matter',exact:true}).click();
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Archived matters · 1',exact:true}).click();
 await page.getByRole('button',{name:'Restore privately',exact:true}).click();await page.getByText('Restored as a private draft. Sharing stays off.',{exact:true}).waitFor();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-archive-restored.png'});return {archivedAndRestored:true};
}
