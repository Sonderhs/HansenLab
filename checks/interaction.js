async (page) => {
  await page.goto("http://127.0.0.1:5175/?profile=1")
  await page.locator('#boot-intro').waitFor({ state: 'attached' })
  if (await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  const output = { checks: [] }
  const check = (condition, name) => {
    if (!condition) throw new Error(name)
    output.checks.push(name)
  }
  const count = () =>
    page.evaluate(() => window.hansenProfile.scene.getStats().renderedFrames)
  await page.getByRole("button", { name: /文章目录/ }).click()
  const directoryStart = await count()
  await page.waitForTimeout(800)
  check((await count()) === directoryStart, "No 3D draws behind directory")
  await page.getByRole("searchbox", { name: "搜索文章" }).fill("Neko")
  check(
    (await page.locator(".result").count()) === 1,
    "Search responds with background paused",
  )
  await page.keyboard.press("Escape")
  await page.waitForTimeout(500)
  check((await count()) > directoryStart, "3D resumes after dialog closes")
  await page.getByRole("link", { name: "打开这份记录" }).click()
  await page.locator("#reader").waitFor({ state: "visible" })
  const readerStart = await count()
  await page.waitForTimeout(800)
  check((await count()) === readerStart, "No 3D draws while reading")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(500)
  check((await count()) > readerStart, "3D resumes after reading")
  await page.getByRole("button", { name: "画质 原始", exact: true }).click()
  await page.waitForTimeout(3000)
  output.smooth = await page.evaluate(async () => {
    const frames = []
    let start,
      last,
      lastSelect = 0
    await new Promise((resolve) => {
      function tick(ms) {
        start ??= ms
        if (last) frames.push(ms - last)
        last = ms
        if (ms - lastSelect > 450) {
          document.querySelector('[data-action="row-next"]').click()
          lastSelect = ms
        }
        if (ms - start > 3500) resolve()
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    return {
      fps: 1000 / (frames.reduce((a, b) => a + b, 0) / frames.length),
      quality: JSON.parse(
        document.querySelector("#scene").dataset.renderQuality,
      ),
      stats: window.hansenProfile.scene.getStats(),
    }
  })
  check(
    output.smooth.quality.aoSamples === 0 &&
      output.smooth.quality.transmission === 0.5,
    "Explicit smooth preset applied",
  )
  await page.getByRole("button", { name: "画质 流畅", exact: true }).click()
  const restored = await page.evaluate(() =>
    JSON.parse(document.querySelector("#scene").dataset.renderQuality),
  )
  check(
    restored.aoSamples === 32 &&
      restored.transmission === 1 &&
      restored.depthOfField === 100,
    "Original lighting restored",
  )
  const timing = await page.evaluate(() => {
    const { scene, pause } = window.hansenProfile
    pause()
    const render = scene.composer.render.bind(scene.composer)
    scene.composer.render = () => {}
    const samples = []
    let time = performance.now() / 1000
    for (const limit of [0.05, 0.25]) {
      scene.setMode("archive")
      scene.setReduced(true)
      for (let i = 0; i < 300; i++) scene.update((time += 1 / 60))
      scene.setReduced(false)
      scene.setFrameDeltaLimit(limit)
      scene.setMode("detail")
      for (let i = 0; i < 12; i++) scene.update((time += 1 / 8))
      samples.push({
        limit,
        extraction: scene.getStats().extraction,
        cameraDetail: scene.getStats().cameraDetail,
      })
    }
    scene.composer.render = render
    return samples
  })
  check(
    timing[1].extraction > timing[0].extraction && timing[1].extraction > 3.8,
    "Low-FPS extraction follows elapsed time",
  )
  output.timing = timing
  output.smooth = {
    fps: output.smooth.fps,
    quality: output.smooth.quality,
    returningFiles: output.smooth.stats.returningFiles,
  }
  return output
}
