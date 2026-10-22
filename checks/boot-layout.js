async (page) => {
  const checks=[]
  const check=(value,name)=>{if(!value)throw Error(name);checks.push(name)}
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.setViewportSize({width:320,height:700})
  await page.goto('http://127.0.0.1:5175/')
  await page.locator('#home[data-ready="true"]').waitFor()
  const footer=await page.locator('.display-controls').evaluate(el=>{
    const r=el.getBoundingClientRect();return {left:r.left,right:r.right,overlap:r.left<document.querySelector('.home-footer > span').getBoundingClientRect().right}
  })
  check(footer.left>=0&&footer.right<=320&&!footer.overlap,'All footer controls fit at 320px')
  await page.screenshot({path:'output/playwright/hansen/boot-mobile-home.png'})
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.getByRole('button',{name:'重播开场',exact:true}).click()
  await page.locator('#boot-intro[data-phase="access"]').waitFor()
  await page.waitForTimeout(250)
  const paused=await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true})
    document.dispatchEvent(new Event('visibilitychange'))
    return document.querySelector('.intro-stage').innerHTML
  })
  await page.waitForTimeout(650)
  check(await page.locator('.intro-stage').innerHTML()===paused,'Synthetic hidden-tab event freezes opening')
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))})
  await page.locator('#boot-intro[data-phase="auth"]').waitFor()
  await page.screenshot({path:'output/playwright/hansen/boot-mobile-auth.png'})
  await page.locator('#boot-intro[data-phase="welcome"]').waitFor()
  await page.waitForTimeout(2400)
  await page.screenshot({path:'output/playwright/hansen/boot-mobile-welcome.png'})
  await page.getByRole('button',{name:'跳过开场',exact:false}).click()
  await page.locator('#home[data-ready="true"]').waitFor()
  check(!await page.locator('#boot-intro').isVisible(),'Opening resumes and remains skippable after visibility restoration')
  return {checks,footer}
}
