async(page)=>{
 await page.goto('https://app.staging.rillora.xyz');await page.getByRole('heading',{name:'Make the important things clear.',exact:true}).waitFor({timeout:10000});
 const home={title:await page.title(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
 await page.goto('https://app.staging.rillora.xyz/open-copy');await page.getByRole('heading',{name:'Open a saved copy',exact:true}).waitFor();
 await page.getByLabel('Saved copy file',{exact:true}).setInputFiles('/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/native-map-backup.json');
 await page.getByText('Friend-only wallet',{exact:true}).click();await page.getByText('Friend QA only',{exact:true}).waitFor();
 const reader={fileOpened:true,noSignInRequired:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/deployment-20260916/published-copy-reader-mobile.png'});
 return {home,reader};
}
