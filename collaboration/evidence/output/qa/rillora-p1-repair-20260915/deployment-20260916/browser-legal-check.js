async(page)=>{
 const scripts=await page.locator('script').evaluateAll(es=>es.map(e=>({src:e.src,type:e.type,inlineLength:e.src?0:e.textContent.length,cloudflare:e.textContent.includes('__CF$cv$params')||e.textContent.includes('/cdn-cgi/'),platform:e.textContent.includes('__oai')||e.textContent.includes('appgen'),prefix:e.src?'':e.textContent.slice(0,90)})));
 await page.getByRole('heading',{name:'Cookie Notice',exact:true}).waitFor();
 const version=await page.getByText('cookies-2026-09-15-1',{exact:true}).count();
 const storage=await page.getByText('rillora.matter-draft.v1:',{exact:true}).count();
 await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'Current first-party storage details',exact:true}).click();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/deployment-20260916/legal-cookie-mobile.png'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.goto('https://legal.rillora.xyz/privacy');await page.getByRole('heading',{name:'Privacy Policy',exact:true}).waitFor();
 const privacy=await page.getByText('privacy-2026-09-15-1',{exact:true}).count();
 return {scripts,cookieVersion:version===1,draftStorageVisible:storage===1,mobileOverflow:overflow,privacyVersion:privacy===1};
}
