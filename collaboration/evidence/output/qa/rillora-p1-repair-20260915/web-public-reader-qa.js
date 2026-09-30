async(page)=>{
 await page.goto('http://127.0.0.1:4263/open-copy');
 await page.getByLabel('Saved copy file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/web-map-backup.json');
 await page.getByText('Friend-only wallet',{exact:true}).click();
 await page.getByText('Friend QA only',{exact:true}).waitFor();
 if(await page.getByRole('button',{name:'Import into an empty map',exact:true}).count())throw Error('Guest must not import');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-public-copy-mobile.png',fullPage:true});
 return {guestReadWorks:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}
