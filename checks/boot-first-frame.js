async (page) => {
  const errors=[]
  page.on('pageerror',error=>errors.push(String(error)))
  await page.emulateMedia({reducedMotion:'no-preference'})
  await page.goto('http://127.0.0.1:5175/?profile=1')
  await page.locator('#boot-intro[data-resources="ready"]').waitFor()
  await page.evaluate(()=>{window.hansenProfile.scene.update=()=>{throw Error('Controlled first-frame failure')}})
  await page.getByRole('button',{name:'跳过开场',exact:false}).click()
  await page.locator('#loading').waitFor({state:'visible'})
  if(await page.locator('#home').getAttribute('inert')!==null)throw Error('Fallback home stayed inert')
  if(!await page.getByRole('button',{name:'重新载入三维场景',exact:false}).isVisible())throw Error('Missing fallback retry')
  await page.locator('#loading').getByRole('button',{name:'先浏览文章目录',exact:false}).click()
  await page.getByRole('dialog',{name:/文章目录/}).waitFor()
  await page.locator('.result').first().click()
  await page.locator('#reader').waitFor({state:'visible'})
  if(errors.length)throw Error(JSON.stringify(errors))
  return {checks:['First-frame exception releases opening input','Fallback offers retry','Articles remain readable after first-frame failure','No uncaught errors'],errors}
}
