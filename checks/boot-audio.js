async (page) => {
  const checks=[], errors=[];
  const check=(value,name)=>{if(!value)throw Error(name);checks.push(name)};
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>{
    const Native=window.AudioContext;
    window.audioProbe=[];
    window.AudioContext=class extends Native {
      constructor(...args){
        if(location.search.includes('audio-failure'))throw Error('Controlled unavailable audio device');
        super(...args);
        const meter=this.createAnalyser();meter.fftSize=4096;
        const probe={context:this,peak:0};window.audioProbe.push(probe);
        const original=this.createDynamicsCompressor.bind(this);
        this.createDynamicsCompressor=()=>{
          const limiter=original(),connect=limiter.connect.bind(limiter);
          limiter.connect=(destination,...rest)=>{
            if(destination===this.destination){connect(meter);meter.connect(destination);return destination;}
            return connect(destination,...rest);
          };return limiter;
        };
        const data=new Float32Array(meter.fftSize);
        const tick=()=>{meter.getFloatTimeDomainData(data);probe.peak=Math.max(probe.peak,...data.map(Math.abs));requestAnimationFrame(tick)};
        requestAnimationFrame(tick);
      }
    };
  });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1600,height:900});
  await page.goto('http://127.0.0.1:5175/?profile=1');
  await page.evaluate(()=>localStorage.removeItem('hansen.boot-sound'));
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.hansenProfile?.bootAudio));
  const stats=()=>page.evaluate(()=>window.hansenProfile.bootAudio.stats());
  check((await stats()).state==='locked'&&await page.evaluate(()=>audioProbe.length===0),'Initial opening does not create or autoplay an audio device');
  await page.locator('[data-intro-sound]').click();
  await page.waitForFunction(()=>window.hansenProfile.bootAudio.stats().played.key>1);
  check((await stats()).state==='running','Explicit sound click unlocks Web Audio');
  check(await page.locator('[data-intro-sound]').getAttribute('aria-pressed')==='true','Sound control announces enabled playback');
  await page.waitForFunction(()=>audioProbe[0].peak>0.00001);
  check(await page.evaluate(()=>audioProbe[0].peak>0.00001),'Actual master output contains nonzero audio samples');
  await page.locator('#boot-intro[data-phase="auth"]').waitFor();
  await page.screenshot({path:'output/playwright/hansen/audio-auth.png'});
  await page.locator('#home[data-ready="true"]').waitFor();
  const completed=await stats();
  check(completed.played.brand===1&&completed.played.confirm===2&&completed.played.scan===1&&completed.played.welcome===1&&completed.played['text-reveal']===2,'Original logo, confirmation, scan, welcome and text cues play once per timeline crossing');
  check(completed.played.key>25,'Typing follows actual character reveals');
  check(!completed.active&&completed.voices===0,'Natural completion stops opening effects');
  check(await page.evaluate(()=>localStorage.getItem('hansen.boot-sound'))==='on','Sound preference persists');
  await page.getByRole('button',{name:'重播开场',exact:true}).click();
  await page.waitForFunction(()=>window.hansenProfile.bootAudio.stats().active&&window.hansenProfile.bootAudio.stats().state==='running');
  check(await page.locator('[data-intro-sound]').getAttribute('aria-pressed')==='true','Footer replay restores saved sound preference');
  await page.waitForTimeout(350);
  const keysBefore=(await stats()).played.key;
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForTimeout(200);
  check((await stats()).state==='suspended'&&!(await stats()).active,'Hidden opening suspends the audio device');
  await page.waitForTimeout(400);
  check((await stats()).played.key===keysBefore,'Hidden timeline produces no typing backlog');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForFunction(()=>window.hansenProfile.bootAudio.stats().state==='running');
  await page.locator('[data-intro-sound]').click();
  check(!(await stats()).enabled&&!(await stats()).active,'Mute immediately stops effects');
  check(await page.evaluate(()=>localStorage.getItem('hansen.boot-sound'))==='off','Mute preference persists');
  await page.locator('[data-intro-sound]').click();
  await page.waitForFunction(()=>window.hansenProfile.bootAudio.stats().active&&window.hansenProfile.bootAudio.stats().state==='running');
  await page.keyboard.press('Escape');
  await page.locator('#home[data-ready="true"]').waitFor();
  const stopped=await stats();
  await page.waitForTimeout(200);
  check(!(await stats()).active&&(await stats()).voices===0&&JSON.stringify((await stats()).played)===JSON.stringify(stopped.played),'Skipping stops sound without replaying skipped cues');
  await page.reload();
  await page.waitForFunction(()=>Boolean(window.hansenProfile?.bootAudio));
  check((await stats()).enabled&&(await stats()).state==='locked','Saved preference still requires a gesture on a fresh page');
  await page.locator('[data-intro-sound]').click();
  await page.waitForFunction(()=>window.hansenProfile.bootAudio.stats().state==='running');
  await page.getByRole('button',{name:'先浏览文章目录',exact:true}).click();
  await page.getByRole('dialog',{name:/文章目录/}).waitFor();
  const directoryKeys=(await stats()).played.key;
  await page.waitForTimeout(250);
  check((await stats()).played.key===directoryKeys&&(await stats()).played['page-open']===1,'Directory replaces opening with one interface sound');
  await page.goto('http://127.0.0.1:5175/#post/neko-rag');
  await page.locator('#reader').waitFor({state:'visible'});
  check(await page.evaluate(()=>audioProbe.length===0),'Article deep link creates no audio device');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:5175/?profile=1');
  await page.locator('#home[data-ready="true"]').waitFor();
  check(await page.evaluate(()=>audioProbe.length===0),'Reduced motion has no opening audio');
  for(const viewport of [{width:320,height:700},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'重播开场',exact:true}).click();
    await page.locator('#boot-intro[data-phase="access"]').waitFor();
    const layout=await page.locator('.intro-controls').evaluate(el=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...el.querySelectorAll('button')].filter(b=>!b.hidden).map(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})}));
    check(!layout.overflow&&layout.buttons.every(Boolean),`Audio, skip and browse controls fit ${viewport.width}x${viewport.height}`);
    if(viewport.width===320)await page.screenshot({path:'output/playwright/hansen/audio-mobile.png'});
    await page.keyboard.press('Escape');await page.locator('#home[data-ready="true"]').waitFor();
  }
  await page.setViewportSize({width:1600,height:900});
  await page.goto('http://127.0.0.1:5175/?profile=1&audio-failure=1');
  await page.waitForFunction(()=>Boolean(window.hansenProfile?.bootAudio));
  await page.locator('[data-intro-sound]').click();
  await page.getByRole('button',{name:'重试音效并重播',exact:true}).waitFor();
  check((await stats()).error.includes('Controlled unavailable'),'Audio device failure offers a visible retry');
  await page.getByRole('button',{name:'先浏览文章目录',exact:true}).click();
  await page.getByRole('dialog',{name:/文章目录/}).waitFor();
  check(await page.locator('.result').count()===18,'Audio failure leaves all selected articles accessible');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>localStorage.removeItem('hansen.boot-sound'));
  check(errors.length===0,'No uncaught JavaScript errors');
  return {checks,completed,errors};
}
