async (page) => {
  const checks = [], errors = [], samples = []
  const check = (value, label) => { if (!value) throw Error(label); checks.push(label) }
  page.on('pageerror', error => errors.push(String(error)))
  const base = new URL(page.url()).origin
  const production = base.endsWith(':4185')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto(`${base}/?profile=1`)
  await page.evaluate(() => localStorage.setItem('hansen.boot-sound', 'off'))
  await page.reload()
  await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  const stats = () => page.evaluate(() => window.hansenProfile.scene.getStats())
  const settled = async () => {
    if (!production) await page.waitForFunction(() => window.hansenProfile.scene.getStats().cameraDetail < .01 && window.hansenProfile.scene.getStats().archiveMomentum === null)
    else await page.waitForTimeout(2400)
  }
  await settled()
  await page.waitForTimeout(2000)
  const slug = await page.locator('#home').getAttribute('data-selected')
  const original = !production && await stats()
  await page.locator('#boot-sound').click()
  const counts = () => page.evaluate(() => window.hansenProfile.audio.stats().played)
  const before = !production && await counts()
  // Hit the actual selected card through its projected center, rather than calling a callback.
  const center = !production && await page.evaluate(() => {
    const scene = window.hansenProfile.scene, selected = scene.getStats().selectedCell
    for (const y of [3.3, 3.55, 2.8, 1.85]) for (const x of [-1.3, 0, 1.3]) {
      const point = scene.projectCard(x, y), cell = scene.pickCell(...point)
      if (cell?.lane === selected.lane && cell?.row === selected.row) return point
    }
    throw Error('Selected card has no visible test point')
  })
  if (production) await page.locator('#preview-open').click()
  else await page.mouse.click(...center)
  await page.locator('#home.previewing').waitFor()
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#preview-content')).opacity) > .99)
  check(!new URL(page.url()).hash && await page.locator('#reader').isHidden(), 'Actual archive click stays in a preview without opening the reader')
  check(await page.locator('#preview-title').textContent() === await page.locator('#post-title-static').textContent(), 'Preview describes the clicked archive')
  check(await page.locator('.preview-tags span').count() > 0 && await page.locator('.preview-outline li').count() > 0, 'Preview contains original tags and actual section headings')
  check(await page.locator('.selection').evaluate(el => el.inert), 'Hidden archive controls are excluded from keyboard input')
  if (!production) {
    await page.waitForFunction(() => window.hansenProfile.scene.getStats().canInspect && window.hansenProfile.scene.getStats().cameraDetail > .99 && window.hansenProfile.scene.getStats().extraction > 4)
    const raised = await stats()
    check(raised.extraction > 3.9 && raised.cameraDetail > .98, 'Full original extraction and camera approach remain visible')
    check(Math.abs(raised.modelPosition[0] - original.modelPosition[0]) < .02 && Math.abs(raised.modelPosition[2] - original.modelPosition[2]) < .02, `Extraction keeps the physical horizontal and depth coordinates: ${JSON.stringify([original.modelPosition, raised.modelPosition])}`)
    check((await counts()).open === (before.open ?? 0) + 1, 'Opening preview plays one extraction sound')
    const inspectPoint = await page.evaluate(() => window.hansenProfile.scene.projectCard(0, 1.85))
    await page.mouse.move(...inspectPoint); await page.mouse.down()
    await page.mouse.move(inspectPoint[0] + 90, inspectPoint[1], { steps: 10 }); await page.mouse.up()
    await page.waitForTimeout(400)
    check(Math.abs((await stats()).rotation) > .05, 'Preview supports dragging the raised card after clearance')
  }
  await page.screenshot({ path: 'output/playwright/archive-preview-desktop.png' })
  await page.locator('.preview-read').click()
  await page.locator('#reader').waitFor({ state: 'visible' })
  check(page.url().endsWith(`#post/${slug}`), 'Preview opens the canonical article route')
  if (!production) {
    const frame = (await stats()).renderedFrames
    await page.waitForTimeout(300)
    check((await stats()).renderedFrames === frame, 'Reading pauses the scene after preview')
    check((await counts()).open === (before.open ?? 0) + 1, 'Reading from preview does not replay extraction')
  }
  await page.keyboard.press('Escape')
  await page.locator('#reader').waitFor({ state: 'hidden' })
  check(await page.locator('#home').evaluate(el => el.classList.contains('previewing')), 'Return from reading restores the same preview')
  await page.getByRole('button', { name: /文章目录/ }).click()
  await page.keyboard.press('Escape')
  await page.locator('#home:not([inert])').waitFor()
  check(await page.locator('#preview').isVisible() && await page.locator('#home').evaluate(el => !el.inert), 'Directory can close back to the interactive preview')
  await page.keyboard.press('Escape')
  await page.locator('#preview').waitFor({ state: 'hidden' })
  check(await page.locator('#home').getAttribute('data-selected') === slug, 'Closing preview preserves the selected archive')
  if (!production) {
    check((await counts()).back === (before.back ?? 0) + 1, 'Closing preview plays one return sound')
    const returning = await stats()
    check(returning.returnPhase === 'aligning' || Math.abs(returning.rotation) < .001, 'Rotated archive aligns before descending')
  }
  await page.locator('#preview-open').click()
  await page.keyboard.press('Escape')
  await page.locator('#preview-open').click()
  await page.waitForTimeout(350)
  check(await page.locator('#preview').isVisible() && await page.locator('#preview').evaluate(el => !el.inert), 'Reopening interrupts the pending preview exit')
  await page.keyboard.press('Escape')
  await page.locator('#preview').waitFor({ state: 'hidden' })
  await settled()
  await page.locator('#scene canvas').focus()
  await page.keyboard.press('Enter')
  await page.locator('#home.previewing').waitFor()
  check(await page.locator('#reader').isHidden(), 'Enter previews the selected archive before reading')
  await page.keyboard.press('Escape')
  await page.locator('#preview').waitFor({ state: 'hidden' })
  await settled()
  await page.mouse.move(440, 480); await page.mouse.down(); await page.mouse.move(710, 410, { steps: 12 }); await page.mouse.up()
  check(!(await page.locator('#home').evaluate(el => el.classList.contains('previewing'))), 'Free plane dragging selects without activating a preview')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await settled()
  // A real touch sequence on the canvas uses the same activation path.
  if (!production) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(500)
    const touchPoint = await page.evaluate(() => {
      const scene = window.hansenProfile.scene
      for (let y = 220; y < 360; y += 12) for (let x = 12; x < innerWidth - 12; x += 12) {
        if (document.elementFromPoint(x, y)?.tagName === 'CANVAS' && scene.pickCell(x, y)) return [x, y]
      }
      throw Error('No exposed archive touch point')
    })
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchPoint[0], y: touchPoint[1] }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
    await page.locator('#home.previewing').waitFor()
    check(await page.locator('#preview').isVisible(), 'Touching the archive also opens preview')
    await page.keyboard.press('Escape')
  }
  for (const size of [{ width: 1600, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 700 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    await page.locator('#preview-open').click()
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#preview-content')).opacity) > .99)
    const bounds = await page.evaluate(() => {
      const panel = document.querySelector('#preview-content'), back = document.querySelector('.preview-back').getBoundingClientRect(), rect = panel.getBoundingClientRect()
      return { width: innerWidth, height: innerHeight, pageWidth: document.documentElement.scrollWidth, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, overflow: panel.scrollWidth > panel.clientWidth + 1, backTop: back.top, backBottom: back.bottom }
    })
    samples.push(bounds)
    check(bounds.pageWidth <= size.width + 1 && bounds.left >= 0 && bounds.right <= size.width && bounds.bottom <= size.height && !bounds.overflow && bounds.backTop >= 0 && bounds.backBottom <= size.height, `Preview fits and can scroll at ${size.width}x${size.height}`)
    await page.locator('.preview-read').scrollIntoViewIfNeeded()
    check(await page.locator('.preview-read').isVisible(), `Reading entry reachable at ${size.width}x${size.height}`)
    if (size.width === 390 || size.width === 844) {
      await page.locator('#preview-content').evaluate(el => el.scrollTop = 0)
      await page.screenshot({ path: `output/playwright/archive-preview-${size.width}.png` })
    }
    await page.keyboard.press('Escape')
    await page.locator('#preview').waitFor({ state: 'hidden' })
  }
  check(errors.length === 0, 'No browser errors')
  return { checks, samples, errors }
}
