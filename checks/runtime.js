;async (page) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 667,
    height: 871,
    deviceScaleFactor: 1.5,
    mobile: false,
  })
  const results = []
  for (const variant of ["baseline", "1", "baseline", "1"]) {
    await page.goto(`http://127.0.0.1:5175/?profile=${variant}`)
    await page.locator('#home[data-ready="true"]').waitFor()
    await page.mouse.move(650, 10)
    await page.waitForTimeout(3000)
    const result = await page.evaluate(async () => {
      const scene = window.hansenProfile.scene
      const measure = async (navigating) => {
        const frames = []
        let start,
          last,
          lastSelect = 0
        await new Promise((resolve) => {
          const tick = (ms) => {
            start ??= ms
            if (last) frames.push(ms - last)
            last = ms
            if (navigating && ms - lastSelect > 450) {
              document.querySelector('[data-action="row-next"]').click()
              lastSelect = ms
            }
            if (ms - start >= 3500) resolve()
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
        const mean = frames.reduce((a, b) => a + b, 0) / frames.length
        const sorted = frames.toSorted((a, b) => a - b)
        return {
          fps: 1000 / mean,
          frameMedianMs: sorted[Math.floor(sorted.length / 2)],
          frameP95Ms: sorted[Math.floor(sorted.length * 0.95)],
          frames: frames.length,
          stats: scene.getStats(),
        }
      }
      return {
        gpu: document.querySelector("#scene").dataset.gpu,
        quality: JSON.parse(
          document.querySelector("#scene").dataset.renderQuality,
        ),
        idle: await measure(false),
        navigating: await measure(true),
      }
    })
    results.push({ variant, ...result })
  }
  return results.map(({ variant, gpu, quality, idle, navigating }) => ({
    variant,
    gpu,
    quality,
    idle: { fps: idle.fps, frameP95Ms: idle.frameP95Ms },
    navigating: {
      fps: navigating.fps,
      frameP95Ms: navigating.frameP95Ms,
      returningFiles: navigating.stats.returningFiles,
    },
  }))
}
