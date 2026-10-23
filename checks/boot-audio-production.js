async (page) => {
  const checks=[],errors=[],failed=[];
  const check=(value,name)=>{if(!value)throw Error(name);checks.push(name)};
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',response=>{if(response.url().startsWith('http://127.0.0.1:4185/')&&response.status()>=400)failed.push(response.url())});
  await page.addInitScript(()=>{
    const Native=window.AudioContext;
    window.audioProbe=[];
    window.AudioContext=class extends Native {
      constructor(...args){
        super(...args);this.pending=location.search.includes('audio-pending');
        const meter=this.createAnalyser();meter.fftSize=2048;
        const record={context:this,peak:0};window.audioProbe.push(record);
        const original=this.createDynamicsCompressor.bind(this);
        this.createDynamicsCompressor=()=>{const limiter=original(),connect=limiter.connect.bind(limiter);limiter.connect=(destination)=>{connect(meter);meter.connect(destination);return destination};return limiter};
        const data=new Float32Array(meter.fftSize);
        const tick=()=>{meter.getFloatTimeDomainData(data);record.peak=Math.max(record.peak,...data.map(Math.abs));requestAnimationFrame(tick)};requestAnimationFrame(tick);
      }
      get state(){return this.pending?'suspended':super.state}
      resume(){return this.pending?new Promise(resolve=>{this.release=()=>{this.pending=false;super.resume().then(resolve)}}):super.resume()}
    };
  });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1600,height:900});
  await page.goto('http://127.0.0.1:4185/?profile=1');
  await page.evaluate(()=>localStorage.setItem('hansen.boot-sound','off'));
  await page.reload();
  await page.locator('[data-intro-sound]').waitFor();
  check(await page.evaluate(()=>audioProbe.length===0&&typeof window.hansenProfile==='undefined'),'Production respects saved mute and exposes no developer probe');
  await page.locator('[data-intro-sound]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>audioProbe[0]?.peak>0.00001);
  check(await page.locator('[data-intro-sound]').getAttribute('aria-pressed')==='true','Keyboard activation produces actual sound in the production bundle');
  await page.locator('[data-intro-sound]').click();
  await page.waitForFunction(()=>audioProbe[0].context.state==='suspended');
  check(await page.locator('[data-intro-sound]').getAttribute('aria-pressed')==='false','Production mute suspends output');
  await page.locator('[data-intro-sound]').click();
  await page.waitForFunction(()=>audioProbe[0].context.state==='running');
  await page.keyboard.press('Escape');await page.locator('#home[data-ready="true"]').waitFor();
  check(await page.evaluate(()=>audioProbe[0].context.state==='suspended'),'Production skip suspends output');
  await page.getByRole('button',{name:'重播开场',exact:true}).click();
  await page.waitForFunction(()=>audioProbe[0].context.state==='running');
  await page.getByRole('button',{name:'先浏览文章目录',exact:true}).click();
  await page.getByRole('dialog',{name:/文章目录/}).waitFor();
  check(await page.evaluate(()=>audioProbe[0].context.state==='running'),'Production early directory enables interface feedback');
  await page.goto('http://127.0.0.1:4185/?audio-pending=1');
  await page.locator('[data-intro-sound]').click();
  await page.getByRole('button',{name:'重试音效并重播',exact:true}).waitFor();
  await page.evaluate(()=>audioProbe[0].context.release());
  await page.waitForTimeout(250);
  check(await page.evaluate(()=>audioProbe[0].context.state==='suspended'&&audioProbe[0].peak===0),'Late device resume after timeout stays silent and suspended');
  await page.getByRole('button',{name:'先浏览文章目录',exact:true}).click();
  await page.getByRole('dialog',{name:/文章目录/}).waitFor();
  check(await page.locator('.result').count()===18,'Activation timeout preserves reading');
  await page.goto('http://127.0.0.1:4185/?audio-pending=1');
  await page.locator('[data-intro-sound]').click();
  await page.locator('[data-intro-skip]').click();
  await page.evaluate(()=>audioProbe[0].context.release());
  await page.locator('#home[data-ready="true"]').waitFor();
  check(await page.evaluate(()=>audioProbe[0].context.state==='suspended'&&audioProbe[0].peak===0),'Skip cancels an activation already in progress');
  check(errors.length===0&&failed.length===0,'Production has no JavaScript errors or failed site resources');
  await page.evaluate(()=>localStorage.removeItem('hansen.boot-sound'));
  return {checks,errors,failed};
}
