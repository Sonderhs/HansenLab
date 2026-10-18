;async (page) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 667,
    height: 871,
    deviceScaleFactor: 1.5,
    mobile: false,
  })
  await page.goto("http://127.0.0.1:5175/?profile=1")
  await page.locator('#home[data-ready="true"]').waitFor()
  return await page.evaluate(async () => {
    const { scene, pause } = window.hansenProfile
    pause()
    const gl = scene.renderer.getContext(),
      ext = gl.getExtension("EXT_disjoint_timer_query_webgl2")
    const wait = (ms) => new Promise((r) => setTimeout(r, ms)),
      render = scene.composer.render.bind(scene.composer)
    let time = performance.now() / 1000
    const read = () => {
      const pixels = new Uint8Array(
        gl.drawingBufferWidth * gl.drawingBufferHeight * 4,
      )
      gl.readPixels(
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      )
      return pixels
    }
    const results = []
    for (const mode of ["archive", "detail"]) {
      scene.setReduced(true)
      scene.setMode(mode)
      scene.composer.render = () => {}
      for (let i = 0; i < 600; i++) scene.update((time += 1 / 60))
      scene.composer.render = render
      const variants = [
        { order: false, pre: false },
        { order: true, pre: false },
        { order: true, pre: true },
      ]
      let baseline
      const samples = []
      for (const variant of variants) {
        scene.setArrayDepthOrder(variant.order)
        scene.setOpaqueDepthPrepass(variant.pre)
        scene.update(time)
        const pixels = read()
        baseline ??= pixels
        let channels = 0,
          total = 0,
          max = 0
        for (let i = 0; i < pixels.length; i++) {
          const d = Math.abs(baseline[i] - pixels[i])
          if (d) channels++
          total += d
          max = Math.max(max, d)
        }
        const timers = []
        for (let i = 0; i < 14; i++) {
          const q = gl.createQuery()
          gl.beginQuery(ext.TIME_ELAPSED_EXT, q)
          scene.renderer.shadowMap.needsUpdate = true
          scene.renderer.info.reset()
          const start = performance.now()
          render()
          const cpu = performance.now() - start
          gl.endQuery(ext.TIME_ELAPSED_EXT)
          for (
            let n = 0;
            n < 200 && !gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE);
            n++
          )
            await wait(2)
          const gpu =
            gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) &&
            !gl.getParameter(ext.GPU_DISJOINT_EXT)
              ? gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6
              : null
          gl.deleteQuery(q)
          if (i > 1) timers.push({ cpu, gpu })
        }
        const median = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)]
        samples.push({
          ...variant,
          difference: { channels, total, max },
          cpu: median(timers.map((t) => t.cpu)),
          gpu: median(timers.filter((t) => t.gpu !== null).map((t) => t.gpu)),
          calls: scene.renderer.info.render.calls,
          triangles: scene.renderer.info.render.triangles,
        })
      }
      results.push({ mode, samples })
    }
    return results
  })
}
