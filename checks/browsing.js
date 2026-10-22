async (page) => {
  const checks = []
  const errors = []
  page.on("pageerror", (error) => errors.push(String(error)))
  const check = (condition, label) => {
    if (!condition) throw new Error(label)
    checks.push(label)
  }
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("http://127.0.0.1:5175/")
  await page.locator('#boot-intro').waitFor({ state: 'attached' })
  if (await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  await page.mouse.move(1550, 10)
  check((await page.locator("#scene canvas").count()) === 1, "3D canvas loaded")
  await page.getByRole("button", { name: "下一篇", exact: true }).click()
  const selected = await page.locator("#home").getAttribute("data-selected")
  await page.getByRole("button", { name: "下一分类", exact: true }).click()
  await page.getByRole("button", { name: "上一分类", exact: true }).click()
  check(
    (await page.locator("#home").getAttribute("data-selected")) === selected,
    "Per-column selection memory",
  )
  await page.getByRole("link", { name: "打开这份记录" }).click()
  await page.locator("#reader").waitFor({ state: "visible" })
  check((await page.title()).includes("Hansen Lab"), "Article title updated")
  check(
    (await page.locator("#article pre").count()) === 1,
    "Code block present",
  )
  await page.locator(".return-home").click()
  await page.locator("#reader").waitFor({ state: "hidden" })
  check(
    (await page.locator("#home").getAttribute("data-selected")) === selected,
    "Return preserves selected archive",
  )
  await page.keyboard.press("/")
  await page.getByRole("dialog", { name: /文章目录/ }).waitFor()
  await page
    .getByRole("searchbox", { name: "搜索文章" })
    .fill("不存在的关键词 xyz")
  check(
    await page.getByText("没有找到对应记录").isVisible(),
    "Empty search state",
  )
  await page.getByRole("button", { name: "清除搜索与筛选" }).click()
  check(
    (await page.locator(".result").count()) === 40,
    "Clear search restores all sample posts",
  )
  await page.getByRole("button", { name: "生活随笔", exact: true }).click()
  check((await page.locator(".result").count()) === 8, "Category filtering")
  await page.getByRole("searchbox", { name: "搜索文章" }).fill("空白")
  check(
    (await page.locator(".result").count()) === 1,
    "Search plus category filtering",
  )
  await page.locator(".result").first().click()
  await page.locator("#reader").waitFor({ state: "visible" })
  check(
    (await page.locator("#index-dialog").isVisible()) === false,
    "Directory closes on article navigation",
  )
  check(
    (await page.locator("#article h1").textContent()).includes("空白"),
    "Search result opens corresponding article",
  )
  await page.reload()
  await page.locator("#reader").waitFor({ state: "visible" })
  check(
    (await page.locator("#article h1").textContent()).includes("空白"),
    "Direct article URL survives reload",
  )
  await page.keyboard.press("Escape")
  await page.locator("#reader").waitFor({ state: "hidden" })
  await page.getByRole("button", { name: "关于 ABOUT" }).click()
  check(
    await page.getByRole("dialog", { name: /你好/ }).isVisible(),
    "About dialog",
  )
  await page.keyboard.press("Escape")
  await page.locator("#home:not([inert])").waitFor()
  check(
    (await page.locator("#home").getAttribute("inert")) === null,
    "Dialog restores home input",
  )
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 700 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport)
    const bounds = await page.evaluate(() => {
      const selection = document
        .querySelector(".selection")
        .getBoundingClientRect()
      const title = document
        .querySelector("#post-title-static")
        .getBoundingClientRect()
      const brand = document.querySelector(".wordmark").getBoundingClientRect()
      const nav = document
        .querySelector(".masthead nav")
        .getBoundingClientRect()
      return {
        width: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        titleRight: title.right,
        titleLeft: title.left,
        selectionRight: selection.right,
        brandRight: brand.right,
        navLeft: nav.left,
      }
    })
    check(
      bounds.pageWidth <= bounds.width + 1,
      `No page overflow ${viewport.width}x${viewport.height}`,
    )
    check(
      bounds.titleLeft >= 0 && bounds.titleRight <= bounds.selectionRight + 1,
      `Title fits ${viewport.width}x${viewport.height}`,
    )
    check(
      bounds.brandRight < bounds.navLeft,
      `Header does not overlap ${viewport.width}x${viewport.height}`,
    )
    if (viewport.width === 390) {
      await page.getByRole("link", { name: "打开这份记录" }).click()
      await page.locator("#reader").waitFor({ state: "visible" })
      const noOverflow = await page.evaluate(
        () => document.querySelector("#reader").scrollWidth <= innerWidth,
      )
      check(noOverflow, "Mobile article has no horizontal overflow")
      await page.keyboard.press("Escape")
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.locator('#motion[aria-pressed="false"]').waitFor()
  check(
    (await page.locator("#motion").getAttribute("aria-pressed")) === "false",
    "System reduced motion honored",
  )
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto("http://127.0.0.1:5175/")
  await page.locator('#boot-intro').waitFor({ state: 'attached' })
  if (await page.locator('[data-intro-skip]').isVisible()) await page.locator('[data-intro-skip]').click()
  await page.locator('#home[data-ready="true"]').waitFor()
  await page.mouse.move(1550, 10)
  check(errors.length === 0, "No JavaScript errors")
  return { checks, errors }
}
