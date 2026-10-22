async (page) => {
  await page.goto("http://127.0.0.1:5175/?profile=1")
  await page.locator('#boot-intro').waitFor({ state: 'attached' })
  if (await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  return await page.evaluate(() => {
    const { scene, pause } = window.hansenProfile
    pause()
    const gl = scene.renderer.getContext(),
      render = scene.composer.render.bind(scene.composer)
    const results = []
    let time = performance.now() / 1000
    const read = () => {
      const p = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      )
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        p,
      )
      return p
    }
    const advance = (count) => {
      scene.composer.render = () => {}
      for (let i = 0; i < count; i++) scene.update((time += 1 / 60))
      scene.composer.render = render
    }
    const original = { ...scene.quality }
    for (const scenario of [
      "archive",
      "detail",
      "inspect",
      "switch",
      "dark",
      "half-ao",
      "no-ao",
      "smaa",
    ]) {
      scene.setTheme(scenario === "dark", true)
      scene.setQuality({
        ...original,
        ...(scenario === "half-ao"
          ? { aoResolution: 0.5 }
          : scenario === "no-ao"
            ? { aoSamples: 0 }
            : scenario === "smaa"
              ? { antialias: "smaa" }
              : {}),
      })
      scene.setReduced(true)
      scene.setMode(
        ["detail", "inspect"].includes(scenario) ? "detail" : "archive",
      )
      advance(360)
      if (scenario === "inspect") {
        scene.targetRotation = 0.5
        advance(120)
      }
      if (scenario === "switch") {
        scene.setReduced(false)
        scene.select(17)
        advance(15)
      }
      scene.setArrayDepthOrder(false)
      scene.setOpaqueDepthPrepass(false)
      scene.update(time)
      const before = read()
      scene.setArrayDepthOrder(true)
      scene.setOpaqueDepthPrepass(true)
      scene.update(time)
      const after = read()
      let min = 255,
        high = 0
      for (let i = 0; i < before.length; i += 4) {
        min = Math.min(min, before[i], before[i + 1], before[i + 2])
        high = Math.max(high, before[i], before[i + 1], before[i + 2])
      }
      if (high - min < 20 || gl.getError() !== gl.NO_ERROR)
        throw new Error(
          `Invalid framebuffer read: ${scenario} (${min}..${high})`,
        )
      let channels = 0,
        total = 0,
        max = 0,
        squares = 0
      for (let i = 0; i < before.length; i++) {
        const d = Math.abs(before[i] - after[i])
        if (d) channels++
        total += d
        max = Math.max(max, d)
        squares += d * d
      }
      results.push({
        scenario,
        channels,
        max,
        mean: total / before.length,
        rms: Math.sqrt(squares / before.length),
        pixels: before.length / 4,
        rgbRange: [min, high],
      })
    }
    return results
  })
}
