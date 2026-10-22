async(page)=>{
 await page.emulateMedia({reducedMotion:'no-preference'})
 await page.setViewportSize({width:1600,height:900})
 await page.goto('http://127.0.0.1:5175/')
 await page.locator('#boot-intro').waitFor({state:'attached'})
 if(await page.locator('[data-intro-skip]').isVisible())await page.locator('[data-intro-skip]').click()
 await page.locator('#home[data-ready="true"]').waitFor()
 await page.getByRole('button',{name:'下一分类',exact:true}).click()
 await page.locator('[data-row="4"]').click()
 await page.waitForTimeout(700)
 const title=await page.locator('#post-title-motion').evaluate(el=>({display:getComputedStyle(el).display,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,text:el.textContent,post:document.querySelector('#home').dataset.selected}))
 if(title.post!=='go-context'||title.display==='none'||title.width<50||title.height<15)throw Error(JSON.stringify(title))
 return {check:'Short rolling title remains visible after long title',title}
}
