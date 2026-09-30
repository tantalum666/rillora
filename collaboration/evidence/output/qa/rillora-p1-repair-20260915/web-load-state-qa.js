async(page)=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/v1/overview',route=>route.fulfill({status:503,contentType:'application/json',headers:{'access-control-allow-origin':'http://127.0.0.1:4261','access-control-allow-credentials':'true'},body:JSON.stringify({error:{message:'Temporarily unavailable'}})}));
 await page.goto('http://127.0.0.1:4261');
 await page.getByRole('button',{name:'Try again',exact:true}).waitFor({timeout:5000});
 const failure=await page.locator('body').innerText();
 await page.screenshot({path:'/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-p1-repair-20260915/screens/web-service-failure.png'});
 await page.unroute('**/v1/overview');
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await page.getByRole('heading',{name:'Your map',exact:true}).waitFor();
 return {failure,retryRestoresMap:true};
}
