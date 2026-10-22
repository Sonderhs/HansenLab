async(page)=>{
 const checks=[],errors=[],failed=[];
 const check=(value,name)=>{if(!value)throw Error(name);checks.push(name)};
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('response',response=>{if(response.url().startsWith('http://127.0.0.1:4185/')&&response.status()>=400)failed.push(response.url())});
 await page.addInitScript(()=>{
  const Native=AudioContext;window.uiOutput={oscillators:0,peak:0,pans:[]};
  window.AudioContext=class extends Native{
   constructor(...args){super(...args);uiOutput.context=this;const meter=this.createAnalyser();meter.fftSize=2048;const original=this.createDynamicsCompressor.bind(this);this.createDynamicsCompressor=()=>{const node=original(),connect=node.connect.bind(node);node.connect=destination=>{connect(meter);meter.connect(destination);return destination};return node};const data=new Float32Array(meter.fftSize);const tick=()=>{meter.getFloatTimeDomainData(data);uiOutput.peak=Math.max(uiOutput.peak,...data.map(Math.abs));requestAnimationFrame(tick)};requestAnimationFrame(tick)}
   createOscillator(){uiOutput.oscillators++;return super.createOscillator()}
   createStereoPanner(){const node=super.createStereoPanner();uiOutput.pans.push(node);return node}
  };
 });
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1600,height:900});
 await page.goto('http://127.0.0.1:4185/');await page.evaluate(()=>localStorage.setItem('hansen.boot-sound','off'));await page.reload();
 await page.locator('[data-intro-skip]').click();await page.locator('#home[data-ready="true"]').waitFor();
 await page.locator('#boot-sound').click();await page.waitForFunction(()=>uiOutput.peak>0.00001);
 check(await page.evaluate(()=>uiOutput.oscillators>0&&uiOutput.context.state==='running'),'Production sound switch produces actual interface audio');
 const count=()=>page.evaluate(()=>uiOutput.oscillators);
 let before=await count();await page.locator('[data-action="row-next"]').click();
 check(await count()>before,'Production row navigation emits glass sound');
 await page.locator('[data-action="lane-next"]').click();
 check(await page.evaluate(()=>uiOutput.pans.some(node=>node.pan.value>0.44)),'Production column sound retains directional panning');
 before=await count();await page.getByRole('link',{name:'打开这份记录'}).click();await page.locator('#reader').waitFor({state:'visible'});
 check(await count()>before,'Production article entry emits extraction sound');
 before=await count();await page.keyboard.press('Escape');await page.locator('#reader').waitFor({state:'hidden'});
 check(await count()>before,'Production article exit emits return sound');
 before=await count();await page.getByRole('button',{name:/文章目录/}).click();await page.getByRole('dialog',{name:/文章目录/}).waitFor();
 check(await count()>before,'Production directory emits electronic opening sound');
 await page.keyboard.press('Escape');await page.locator('#boot-sound').click();before=await count();
 await page.locator('[data-action="row-next"]').click();await page.getByRole('button',{name:/文章目录/}).click();await page.keyboard.press('Escape');
 check(await count()===before,'Production shared mute silences browsing and dialogs');
 check(await page.evaluate(()=>typeof window.hansenProfile==='undefined')&&errors.length===0&&failed.length===0,'Production has no developer probe, page errors or failed resources');
 return {checks,errors,failed};
}
