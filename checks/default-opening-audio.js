async (page) => {
  const checks = [], errors = []
  const check = (value, label) => { if (!value) throw Error(label); checks.push(label) }
  const base = new URL(page.url()).origin
  page.on('pageerror', error => errors.push(String(error)))
  await page.addInitScript(() => {
    const Native = AudioContext
    window.defaultAudioProbe = []
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args)
        const record = { context: this, peak: 0 }, meter = this.createAnalyser()
        defaultAudioProbe.push(record)
        const original = this.createDynamicsCompressor.bind(this)
        this.createDynamicsCompressor = () => {
          const node = original(), connect = node.connect.bind(node)
          node.connect = target => { connect(meter); meter.connect(target); return target }
          return node
        }
        const data = new Float32Array(meter.fftSize)
        const sample = () => { meter.getFloatTimeDomainData(data); record.peak = Math.max(record.peak, ...data.map(Math.abs)); requestAnimationFrame(sample) }
        requestAnimationFrame(sample)
      }
      // Model autoplay denial without changing the browser's global settings.
      get state() { return location.search.includes('policy-blocked') && !navigator.userActivation.hasBeenActive ? 'suspended' : super.state }
    }
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(`${base}/?profile=1`)
  await page.evaluate(() => localStorage.removeItem('hansen.boot-sound'))
  await page.reload()
  await page.waitForFunction(() => defaultAudioProbe.length === 1)
  check(await page.locator('#boot-sound').getAttribute('aria-pressed') === 'true', 'First visit defaults to enabled without a saved preference')
  const automatic = await page.evaluate(() => defaultAudioProbe[0].context.state === 'running')
  if (automatic) {
    await page.waitForFunction(() => defaultAudioProbe[0].peak > .00001)
    check(true, 'Allowed autoplay produces actual audio before any gesture')
  } else {
    check(await page.locator('[data-intro-audio-note]').textContent() === '音效已开启，点击页面播放', 'Autoplay denial is shown as waiting for a gesture')
    await page.mouse.click(30, 300)
    await page.waitForFunction(() => defaultAudioProbe[0].peak > .00001)
    check(true, 'First background click unlocks actual opening audio')
  }
  await page.locator('[data-intro-sound]').click()
  check(await page.evaluate(() => localStorage.getItem('hansen.boot-sound')) === 'off', 'Muting persists the explicit opt-out')
  await page.reload()
  await page.waitForTimeout(400)
  check(await page.evaluate(() => defaultAudioProbe.length === 0) && await page.locator('#boot-sound').getAttribute('aria-pressed') === 'false', 'Saved mute overrides the default and creates no audio device')
  await page.evaluate(() => localStorage.removeItem('hansen.boot-sound'))
  await page.goto(`${base}/?profile=1&policy-blocked=1`)
  await page.waitForFunction(() => defaultAudioProbe.length === 1)
  await page.getByRole('button', { name: '有声重播', exact: true }).waitFor()
  check(await page.evaluate(() => defaultAudioProbe[0].peak === 0), 'Blocked startup does not emit audio')
  await page.waitForTimeout(1700)
  check(await page.getByRole('button', { name: '有声重播', exact: true }).isVisible(), 'Expected autoplay denial does not become an activation timeout error')
  const phase = await page.locator('#boot-intro').getAttribute('data-phase')
  await page.mouse.click(30, 300)
  await page.waitForFunction(() => defaultAudioProbe[0].peak > .00001)
  check(await page.locator('#boot-intro').getAttribute('data-phase') !== 'access' || phase === 'access', 'Background unlock continues the current animation without restarting it')
  await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  check(await page.evaluate(() => defaultAudioProbe[0].context.state === 'suspended'), 'Skipping still stops automatic opening audio')
  await page.goto(`${base}/#post/neko-rag`)
  await page.locator('#reader').waitFor({ state: 'visible' })
  check(await page.evaluate(() => defaultAudioProbe.length === 0), 'Article deep links never start opening audio')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}/`)
  await page.locator('#home[data-ready="true"]').waitFor()
  check(await page.evaluate(() => defaultAudioProbe.length === 0), 'Reduced motion still suppresses opening audio')
  check(errors.length === 0, 'No browser errors')
  return { checks, automatic, errors }
}
