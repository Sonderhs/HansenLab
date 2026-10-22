import { labelMarkSvg as labelMark } from "./brand";
import { BlogBoot } from "./boot-intro";
import "./fonts.css";
import "@kitlangton/rolling-number/styles.css";
import "./style.css";
import {
  createRollingText,
  createRollingNumber,
} from "@kitlangton/rolling-number";
import { ArchiveScene } from "./scene";
import { qualityPresets } from "./render-quality";
import { wrap, type ArchiveNavigation } from "./archive-loop";
import {
  archiveColumns,
  columnFiles,
  fileLocation,
  posts,
  articles,
  collections,
  appearanceFor,
  categoryLabel,
} from "./data";
import { ArticleCatalog, type CatalogPreset } from "./catalog";
import { readerContent } from "./reader-content";

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const mark = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M16 13v38m32-38v38M16 32h32" stroke="currentColor" stroke-width="5"/><path d="M40 13h8v8" stroke="#b07a38" stroke-width="5"/></svg>`;

const titleMeasure = document.createElement("canvas").getContext("2d")!;
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const profileBaseline =
  import.meta.env.DEV &&
  new URLSearchParams(location.search).get("profile") === "baseline";
let qualityMode: "original" | "performance" = "original";
let reduced = motionQuery.matches;
let selected = posts.findIndex((post) => post.collection === "projects");
let ready = false;
let bootActive = true;
let sceneFailed = false;
let boot: BlogBoot;
let scene: ArchiveScene | undefined;
let reading = false;
let sceneFrame = 0;
let lastFrame = 0;
let drawerReturn: HTMLElement | null = null;
let articleReturn: HTMLElement | null = null;
let readerScroll = 0;
const memory = archiveColumns.map(() => 0);
let currentRoute = "";
let readerEntryTimer: ReturnType<typeof setTimeout> | undefined;
let performanceStart = 0;
let performanceFrames = 0;
let performanceCpu = 0;

$("#app").innerHTML = `
  <div id="home">
    <div id="scene" aria-label="三维档案首页"></div><div class="atmosphere"></div>
    <header class="masthead"><a class="wordmark" href="#" aria-label="Hansen Lab 首页"><span class="brand-line">${mark}<span>HANSEN LAB</span><i></i></span><span class="brand-sub">RESEARCH · BUILD · RECORD</span><span class="brand-cn">个人研究与实践档案</span></a>
      <nav aria-label="主导航"><button data-action="index">文章目录 <small>INDEX</small><span class="shortcut">/</span></button><button data-action="projects">项目 <small>PROJECTS</small></button><button data-action="about">关于 <small>ABOUT</small></button></nav>
    </header>
    <div class="intro"><span class="eyebrow"><i class="signal"></i> AN OPEN-ENDED EXPERIMENT</span><p>保持好奇，持续构建。</p><span>技术笔记、项目实践与论文阅读。</span></div>
    <section class="selection" aria-label="当前档案"><div class="eyebrow"><span id="post-category"></span><span class="selection-id" id="post-id"></span></div><h1 id="post-title"><span id="post-title-motion"></span><span id="post-title-static"></span></h1><div class="selection-rule"><i></i><span id="post-en"></span></div><p id="post-lead"></p><div class="post-meta"><time id="post-date"></time><span>／</span><span id="post-minutes"></span><span class="sample">选读 · 正文节选</span></div><a id="read" class="read-link" href="#">打开这份记录 <span>↗</span></a></section>
    <div class="archive-position"><span class="eyebrow">精选 / SELECT</span><div><span id="row-number"></span><i>/</i><small id="row-total"></small></div></div>
    <div class="lane-controls"><button data-action="lane-prev" aria-label="上一分类">←</button><div><span class="eyebrow" id="lane-number"></span><strong id="lane-title"></strong><button class="collection-open" data-action="collection">查看该集合 ↗</button></div><button data-action="lane-next" aria-label="下一分类">→</button></div>
    <div class="row-controls"><button data-action="row-prev" aria-label="上一篇">↑</button><div id="ticks"></div><button data-action="row-next" aria-label="下一篇">↓</button></div>
    <div class="browse-hint">拖动探索 <span>／</span> 滚轮切换 <span>／</span> <kbd>↵</kbd> 打开记录</div>
    <footer class="home-footer"><span><i class="signal"></i> PERSONAL ARCHIVE <b>H / L</b></span><div class="display-controls"><button data-action="replay" id="replay" disabled>重播开场</button><button data-action="quality" id="quality" title="切换画质：原始保留完整光影，流畅降低三维渲染负担，文字与动效不变">画质 原始</button><button data-action="motion" id="motion" aria-pressed="${!reduced}">动效 ${reduced ? "关" : "开"}</button></div><span>CONCEPT DEMO <i>01</i></span></footer>
    <div id="hover" hidden></div>
    <div id="loading" role="status" hidden><span>${mark}</span><b>HANSEN LAB</b><p>正在连接三维档案库…</p><i></i><button data-action="index">先浏览文章目录 →</button></div>
  </div>
  <section id="reader" aria-label="文章阅读" hidden><header class="reader-header"><a href="#" class="reader-brand">${mark} HANSEN LAB</a><span>RESEARCH · BUILD · RECORD</span><a href="#" class="return-home">← 返回三维档案</a></header><div class="reader-layout"><aside id="toc" aria-label="文章目录"></aside><article id="article" tabindex="-1"></article></div><div class="reading-track"><i id="progress"></i></div></section>
  <dialog id="index-dialog" aria-labelledby="index-heading"></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-heading"><button class="about-close" data-action="close" aria-label="关闭关于">✕</button><span class="eyebrow">THE PERSON BEHIND THE LAB</span><h2 id="about-heading">你好，这里是<br>Hansen Lab<span>↗</span></h2><p>一间用于研究、构建与记录的个人实验室。</p><p>这里以技术与项目实践为主，也存放生活里的观察与尚未成形的想法。希望每一件作品都能留下过程，每一次尝试都有迹可循。</p><div class="about-foot"><span>RESEARCH · BUILD · RECORD</span><span>内容组织试用 / 18 篇正文节选</span></div></dialog>
`;

const catalog = new ArticleCatalog($<HTMLDialogElement>("#index-dialog"));

const rollingTitle = createRollingText($("#post-title-motion"), {
  text: posts[selected].title,
  transition: "direct",
  duration: 460,
  direction: "up",
  stagger: "none",
  animated: !reduced,
  motionBlur: true,
});
const rollingRow = createRollingNumber($("#row-number"), {
  value: 1,
  format: { minimumIntegerDigits: 2 },
  duration: 460,
  animated: !reduced,
});

function fitTitle() {
  const title = $("#post-title");
  title.dataset.long = "false";
  const style = getComputedStyle(title);
  titleMeasure.font =
    style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
  title.dataset.long = String(
    titleMeasure.measureText(posts[selected].title).width >
      title.clientWidth - 8,
  );
}
function syncSelection() {
  const post = posts[selected];
  const { lane } = fileLocation(selected);
  const row = columnFiles(lane).indexOf(selected);
  memory[lane] = row;
  $("#post-category").textContent = categoryLabel(post.category);
  $("#post-id").textContent = post.id;
  rollingTitle.update({ text: post.title, animated: !reduced });
  $("#post-title-static").textContent = post.title;
  fitTitle();
  rollingRow.update({ value: row + 1, animated: !reduced });
  $("#post-en").textContent = post.en;
  $("#post-lead").textContent = post.lead;
  $("#post-date").textContent = post.date.replaceAll("-", ".");
  $("#post-date").setAttribute("datetime", post.date);
  $("#post-minutes").textContent = `${post.minutes} MIN · EXCERPT`;
  $("#read").setAttribute("href", `#post/${post.slug}`);
  $("#lane-number").textContent =
    `COLLECTION ${String(lane + 1).padStart(2, "0")} / 05`;
  $("#lane-title").textContent = collections[lane].name;
  $(".collection-open").textContent =
    `查看该集合 · ${collections[lane].articleSlugs.length} 篇 ↗`;
  $("#home").dataset.collection = collections[lane].id;
  const count = columnFiles(lane).length;
  $("#row-total").textContent = String(count).padStart(2, "0");
  if ($("#ticks").childElementCount !== count)
    $("#ticks").innerHTML = Array.from(
      { length: count },
      (_, row) =>
        `<button data-row="${row}" aria-label="选择第 ${row + 1} 篇"><i></i></button>`,
    ).join("");
  document
    .querySelectorAll<HTMLButtonElement>("[data-row]")
    .forEach((button) => {
      const active = Number(button.dataset.row) === row;
      button.setAttribute("aria-pressed", String(active));
    });
  $("#home").dataset.selected = post.slug;
}
function select(index: number, navigation?: ArchiveNavigation) {
  if (index < 0 || index >= posts.length) return;
  selected = index;
  scene?.select(index, navigation);
  syncSelection();
}
function navigate(axis: "lane" | "row", direction: number) {
  const { lane } = fileLocation(selected);
  if (axis === "lane") {
    const next = wrap(lane + direction, archiveColumns.length);
    select(columnFiles(next)[memory[next]], { axis, direction });
  } else {
    const files = columnFiles(lane);
    select(files[wrap(files.indexOf(selected) + direction, files.length)], {
      axis,
      direction,
    });
  }
}

function closeDialogs() {
  document
    .querySelectorAll<HTMLDialogElement>("dialog[open]")
    .forEach((dialog) => dialog.close());
}
function openDialog(id: string) {
  drawerReturn = document.activeElement as HTMLElement;
  $("#hover").hidden = true;
  $("#home").inert = true;
  $("#reader").inert = true;
  $<HTMLDialogElement>(id).showModal();
  if (!profileBaseline) pauseScene();
  if (id === "#index-dialog") $("#search").focus();
}
function showIndex(preset: CatalogPreset = {}) {
  catalog.reset(preset);
  openDialog("#index-dialog");
}

document.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) => {
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dialog.close();
  });
  dialog.addEventListener("close", () => {
    $("#home").inert = reading || bootActive;
    $("#reader").inert = !reading;
    drawerReturn?.focus({ preventScroll: true });
    resumeScene();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  });
});

function applyRoute() {
  const slug = location.hash.startsWith("#post/") ? location.hash.slice(6) : "";
  if (slug === currentRoute) return;
  clearTimeout(readerEntryTimer);
  currentRoute = slug;
  const index = articles.findIndex((post) => post.slug === slug);
  if (index < 0) {
    if (!reading) return;
    reading = false;
    $("#reader").hidden = true;
    $("#reader").inert = true;
    $("#home").inert = bootActive;
    document.title = "Hansen Lab · 个人研究与实践档案";
    scene?.setMode("archive");
    $("#home").classList.remove("reading");
    articleReturn?.focus({ preventScroll: true });
    resumeScene();
    return;
  }
  if (!reading) articleReturn = document.activeElement as HTMLElement;
  reading = true;
  closeDialogs();
  if (bootActive) boot.direct();
  const delay = ready && !reduced && $("#reader").hidden ? 1100 : 0;
  $("#reader").inert = false;
  $("#home").inert = true;
  $("#home").classList.add("reading");
  const post = articles[index];
  const appearance = appearanceFor(post.slug, fileLocation(selected).lane);
  if (appearance >= 0) select(appearance);
  scene?.setMode("detail");
  readerScroll = 0;
  document.title = `${post.title} · Hansen Lab`;
  const content = readerContent(post);
  $("#toc").innerHTML = content.toc;
  $("#article").innerHTML = content.body;
  $("#reader").scrollTop = 0;
  $("#progress").style.width = "0%";
  readerEntryTimer = setTimeout(() => {
    $("#reader").hidden = false;
    $("#reader").scrollTop = 0;
    $("#article").focus({ preventScroll: true });
    if (!profileBaseline) pauseScene();
  }, delay);
}
window.addEventListener("hashchange", applyRoute);
$("#reader").addEventListener(
  "scroll",
  () => {
    readerScroll = $("#reader").scrollTop;
    const range = $("#reader").scrollHeight - $("#reader").clientHeight;
    $("#progress").style.width =
      `${range > 0 ? (readerScroll / range) * 100 : 100}%`;
  },
  { passive: true },
);

document.addEventListener("click", async (event) => {
  const target = event.target as Element;
  const actionElement = target.closest<HTMLElement>("[data-action]");
  const action = actionElement?.dataset.action;
  if (action === "replay" && ready && !reading) {
    bootActive = true;
    $("#home").dataset.ready = "false";
    $("#home").dataset.booting = "true";
    $("#home").inert = true;
    pauseScene();
    boot.replay();
  }
  if (action === "index") showIndex();
  if (action === "projects")
    showIndex({ collection: "projects", view: "series" });
  if (action === "collection")
    showIndex({ collection: collections[fileLocation(selected).lane].id });
  if (action === "about") openDialog("#about-dialog");
  if (action === "close") closeDialogs();
  if (action === "retry") location.reload();
  if (action === "lane-prev") navigate("lane", -1);
  if (action === "lane-next") navigate("lane", 1);
  if (action === "row-prev") navigate("row", -1);
  if (action === "row-next") navigate("row", 1);
  if (action === "motion") {
    reduced = !reduced;
    syncMotion();
  }
  if (action === "quality") {
    qualityMode = qualityMode === "original" ? "performance" : "original";
    scene?.setQuality({ ...qualityPresets[qualityMode] });
    $("#quality").textContent =
      `画质 ${qualityMode === "original" ? "原始" : "流畅"}`;
  }
  if (action === "copy") {
    const text =
      actionElement!.closest(".code-heading")?.nextElementSibling
        ?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      actionElement!.textContent = "已复制 ✓";
    } catch {
      actionElement!.textContent = "请选中下方代码复制";
    }
  }
  const tag = target.closest<HTMLElement>("[data-read-tag]")?.dataset.readTag;
  if (tag) showIndex({ tag });
  const category = target.closest<HTMLElement>("[data-read-category]")?.dataset
    .readCategory;
  if (category) showIndex({ category });
  const series =
    target.closest<HTMLElement>("[data-read-series]")?.dataset.readSeries;
  if (series) showIndex({ series });
  const row = target.closest<HTMLElement>("[data-row]");
  if (row)
    select(columnFiles(fileLocation(selected).lane)[Number(row.dataset.row)]);
  const section = target.closest<HTMLElement>("[data-section]");
  if (section) {
    event.preventDefault();
    $(`#section-${section.dataset.section}`).scrollIntoView({
      behavior: reduced ? "instant" : "smooth",
      block: "start",
    });
  }
  const postLink = target.closest<HTMLAnchorElement>('a[href^="#post/"]');
  if (postLink) closeDialogs();
});
document.addEventListener("keydown", (event) => {
  if (document.querySelector("dialog[open]")) return;
  if (bootActive) {
    if (
      event.key === "Escape" ||
      (event.key === "Enter" &&
        !(event.target as HTMLElement).closest("button"))
    ) {
      event.preventDefault();
      boot.skip();
    }
    if (event.key === "/") {
      event.preventDefault();
      boot.browse();
    }
    return;
  }
  if (
    (event.target as HTMLElement).matches("input, textarea, [contenteditable]")
  )
    return;
  if (event.key === "/") {
    event.preventDefault();
    showIndex();
    return;
  }
  if (reading) {
    if (event.key === "Escape") location.hash = "";
    return;
  }
  if (!ready) return;
  if (
    (event.target as HTMLElement).closest("button, a") &&
    (event.key === "Enter" || event.key === " ")
  )
    return;
  const keys: Record<string, ["lane" | "row", number]> = {
    ArrowLeft: ["lane", -1],
    ArrowRight: ["lane", 1],
    ArrowUp: ["row", -1],
    ArrowDown: ["row", 1],
  };
  if (keys[event.key]) {
    event.preventDefault();
    navigate(...keys[event.key]);
  }
  if (event.key === "Enter") location.hash = `post/${posts[selected].slug}`;
});

function syncMotion() {
  scene?.setReduced(reduced);
  boot?.setReduced(reduced);
  document.documentElement.dataset.reduced = String(reduced);
  $("#motion").textContent = `动效 ${reduced ? "关" : "开"}`;
  $("#motion").setAttribute("aria-pressed", String(!reduced));
  rollingTitle.update({ animated: !reduced });
  rollingRow.update({ animated: !reduced });
}
motionQuery.addEventListener("change", (event) => {
  reduced = event.matches;
  syncMotion();
});

function frame(ms: number) {
  sceneFrame = 0;
  if (
    !document.hidden &&
    !bootActive &&
    (profileBaseline ? !reading || ms - lastFrame < 1800 : canRenderScene())
  ) {
    const start = import.meta.env.DEV ? performance.now() : 0;
    scene?.update(ms / 1000);
    if (import.meta.env.DEV) {
      performanceCpu += performance.now() - start;
      performanceFrames++;
      if (ms - performanceStart >= 1000) {
        const stats = scene?.getStats();
        $("#scene").dataset.performance = JSON.stringify({
          fps: Math.round((performanceFrames * 1000) / (ms - performanceStart)),
          cpuMs: performanceCpu / performanceFrames,
          calls: stats?.drawCalls,
          renderedFrames: stats?.renderedFrames,
          reusedFrames: stats?.reusedFrames,
        });
        performanceStart = ms;
        performanceFrames = performanceCpu = 0;
      }
    }
    if (!reading) lastFrame = ms;
    sceneFrame = requestAnimationFrame(frame);
  }
}
function canRenderScene() {
  return (
    !document.hidden &&
    !bootActive &&
    !document.querySelector("dialog[open]") &&
    (!reading || $("#reader").hidden)
  );
}
function pauseScene() {
  cancelAnimationFrame(sceneFrame);
  sceneFrame = 0;
}
function resumeScene() {
  if (!ready || sceneFrame || !canRenderScene()) return;
  scene?.resetFrameClock();
  performanceStart = performance.now();
  performanceFrames = performanceCpu = 0;
  sceneFrame = requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseScene();
  else resumeScene();
});
window.addEventListener("resize", () => {
  scene?.resize();
  fitTitle();
});
document.fonts.addEventListener("loadingdone", fitTitle);

function handleSceneFailure(error: unknown) {
  console.error("Hansen Lab 3D load failed", error);
  scene?.dispose();
  scene = undefined;
  sceneFailed = true;
  ready = false;
  boot.fail();
  $("#loading").hidden = !boot.element.hidden;
  $("#loading p").textContent = "三维档案暂时无法载入，可以先浏览文章目录。";
  $("#loading").insertAdjacentHTML(
    "beforeend",
    '<button data-action="retry">重新载入三维场景 ↻</button>',
  );
  $("#home").dataset.ready = "false";
  $<HTMLButtonElement>("#replay").disabled = true;
}

async function init() {
  syncSelection();
  syncMotion();
  applyRoute();
  try {
    scene = new ArchiveScene($("#scene"), undefined, undefined, undefined, {
      title: "HANSEN LAB",
      subtitle: "RESEARCH & FIELD NOTES",
      code: "H L / 01",
      mark: labelMark,
    });
    scene.uiOnlyParallax = true;
    scene.setArrayDepthOrder(!profileBaseline);
    scene.setOpaqueDepthPrepass(!profileBaseline);
    scene.setFrameDeltaLimit(profileBaseline ? 0.05 : 0.25);
    scene.setQuality({ ...qualityPresets[qualityMode] });
    scene.setReduced(reduced);
    await scene.load();
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2500);
      void document.fonts.ready.then(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
    scene.setMode(reading ? "detail" : "archive");
    scene.select(selected);
    scene.revealImmediately();
    scene.onSelect = (index, cell) => {
      if (!bootActive && !reading && !document.querySelector("dialog[open]"))
        select(index, cell ? { cell } : undefined);
    };
    scene.onNavigate = (axis, direction) => {
      if (!bootActive && !reading && !document.querySelector("dialog[open]"))
        navigate(axis, direction);
    };
    scene.onHover = (index) => {
      $("#hover").hidden =
        index === null ||
        bootActive ||
        reading ||
        Boolean(document.querySelector("dialog[open]"));
      if (index !== null)
        $("#hover").textContent = `${posts[index].id} / ${posts[index].title}`;
    };
    ready = true;
    $<HTMLButtonElement>("#replay").disabled = false;
    if (import.meta.env.DEV) {
      const gl = scene.renderer.getContext();
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      $("#scene").dataset.gpu = debug
        ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
    }
    if (
      import.meta.env.DEV &&
      new URLSearchParams(location.search).has("profile")
    ) {
      Object.assign(window, {
        hansenProfile: {
          scene,
          pause: pauseScene,
          resume: resumeScene,
        },
      });
    }
    $("#home").dataset.ready = String(!bootActive && boot.element.hidden);
    $("#loading").hidden = true;
    boot.ready();
    resumeScene();
  } catch (error) {
    handleSceneFailure(error);
  }
}
document.addEventListener(
  "pointermove",
  (event) => {
    if ($("#hover").hidden) return;
    $("#hover").style.left =
      `${Math.min(event.clientX + 18, innerWidth - 280)}px`;
    $("#hover").style.top = `${event.clientY + 22}px`;
  },
  { passive: true },
);
boot = new BlogBoot($("#app"), {
  reduced,
  onReveal: () => {
    if (ready && scene && !reading) {
      try {
        scene.resetFrameClock();
        scene.update(performance.now() / 1000);
      } catch (error) {
        handleSceneFailure(error);
      }
    }
    bootActive = false;
    $("#home").dataset.booting = "false";
    resumeScene();
  },
  onFinish: (destination) => {
    $("#home").dataset.ready = String(ready);
    $("#home").inert =
      reading || Boolean(document.querySelector("dialog[open]"));
    $("#reader").inert = !reading;
    if (sceneFailed) $("#loading").hidden = false;
    if (!reading && !document.querySelector("dialog[open]"))
      $(".wordmark").focus({ preventScroll: true });
    if (destination === "index") showIndex();
    resumeScene();
  },
});
$("#home").inert = true;
$("#home").dataset.booting = "true";
void init();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(sceneFrame);
    boot.dispose();
    scene?.dispose();
  });
