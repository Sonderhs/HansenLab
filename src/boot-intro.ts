import { bootMotion, progress, smooth } from "./boot-motion";
import "./boot-intro.css";

// Reuse RhineLabUI's measured motion tracks; the DOM and monogram belong to Hansen Lab.
const START = 1.76;
const HOLD = 20.96 - START;
const END = 21.92 - START;
type Destination = "home" | "index";
type Options = {
  reduced: boolean;
  onReveal: () => void;
  onFinish: (destination: Destination) => void;
};
const arc = (r: number, start: number, sweep: number, x = 960, y = 540) => {
  const point = (angle: number) =>
    `${x + Math.cos(angle) * r},${y + Math.sin(angle) * r}`;
  if (sweep >= Math.PI * 1.999)
    return `M${point(start)}A${r},${r} 0 1 1 ${point(start + Math.PI)}A${r},${r} 0 1 1 ${point(start + Math.PI * 2)}`;
  return `M${point(start)}A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(start + sweep)}`;
};
const monogram = `<svg viewBox="0 0 310 220" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="12"><path class="intro-stroke" pathLength="1" d="M80 20V150"/><path class="intro-stroke" pathLength="1" d="M230 20V150"/><path class="intro-stroke" pathLength="1" d="M80 85H230"/><path class="intro-stroke" pathLength="1" d="M208 20h22v22" stroke="#a6773b"/></g><text x="155" y="204" text-anchor="middle" fill="currentColor" font-size="21" font-weight="600" letter-spacing="3"></text></svg>`;

export class BlogBoot {
  readonly element: HTMLElement;
  private elapsed = 0;
  private last = 0;
  private frame = 0;
  private fade?: ReturnType<typeof setTimeout>;
  private resourcesReady = false;
  private reduced: boolean;
  private skipped = false;
  private failed = false;
  private closing = false;
  private finished = false;
  private events = new AbortController();
  private stage: HTMLElement;
  private status: HTMLElement;
  private paths: SVGPathElement[];
  private strokes: SVGPathElement[];
  private dots: SVGCircleElement[];
  private core: SVGCircleElement;
  private orbit: SVGCircleElement[];
  private caps: SVGCircleElement[];

  constructor(
    host: HTMLElement,
    private options: Options,
  ) {
    this.reduced = options.reduced;
    this.element = document.createElement("section");
    this.element.id = "boot-intro";
    this.element.setAttribute("aria-label", "Hansen Lab 开场与加载");
    this.element.innerHTML = `
      <div class="intro-background" aria-hidden="true"><svg viewBox="0 0 1920 1080" preserveAspectRatio="none"><g fill="none" stroke="#fff" stroke-width="3"><path d="M-210 705C-45 705 182 704 247 567C337 377 99 306 4 435S27 680 169 631C309 584 227 314 279 111S568-113 568-113"/><path d="M1560-80C1374 114 1671 168 1601 323S1371 367 1431 480S1692 666 1559 787S1329 886 1498 1130"/><circle cx="1450" cy="648" r="346"/></g></svg></div>
      <div class="intro-stage" aria-hidden="true">
        <div class="intro-brand"><strong>HANSEN LAB</strong><span>RESEARCH · BUILD · RECORD</span><small>PERSONAL ARCHIVE / 01</small></div>
        <div class="intro-access"></div>
        <div class="intro-logo">${monogram}</div>
        <div class="intro-auth"><i></i><span></span></div>
        <div class="intro-scan"><svg viewBox="0 0 1920 1080"><g fill="none" stroke="#242622" stroke-width="2" stroke-linecap="round"><path/><path stroke="#fff"/><path/><path/><path/><path/><circle class="intro-orbit" fill="#a6773b" stroke="none"/><circle class="intro-orbit" fill="#a6773b" stroke="none"/>${Array.from({ length: 6 }, () => '<circle class="intro-dot" fill="#242622" stroke="none"/>').join("")}<circle class="intro-core" cx="959.5" cy="539.5" fill="#242622" stroke="none"/><circle class="intro-cap" fill="#242622" stroke="none"/><circle class="intro-cap" fill="#fff" stroke="none"/></g></svg><span>ARCHIVE SCAN IN PROGRESS</span></div>
        <div class="intro-welcome"><div class="intro-panel"></div><div class="intro-welcome-heading">WELCOME TO</div><div class="intro-company"><strong>HANSEN LAB</strong><strong class="intro-highlight">HANSEN LAB</strong></div><div class="intro-database">PERSONAL ARCHIVE</div><div class="intro-welcome-logo">${monogram}</div></div>
        <div class="intro-powered">POWERED BY <b>HANSEN LAB</b><i></i></div>
      </div>
      <div class="intro-static" aria-hidden="true">${monogram}<strong>HANSEN LAB</strong><span>个人研究与实践档案</span></div>
      <footer class="intro-controls"><div><span class="intro-indicator" aria-hidden="true"></span><p role="status" aria-live="polite">正在准备三维档案…</p></div><nav aria-label="开场操作"><button data-intro-retry hidden>重新载入</button><button data-intro-browse>先浏览文章目录</button><button data-intro-skip>跳过开场 <span aria-hidden="true">↗</span></button></nav></footer>`;
    host.append(this.element);
    this.stage = this.find(".intro-stage");
    this.status = this.find('[role="status"]');
    this.paths = [
      ...this.element.querySelectorAll<SVGPathElement>(".intro-scan path"),
    ];
    this.strokes = [
      ...this.element.querySelectorAll<SVGPathElement>(
        ".intro-logo .intro-stroke",
      ),
    ];
    this.dots = [
      ...this.element.querySelectorAll<SVGCircleElement>(".intro-dot"),
    ];
    this.orbit = [
      ...this.element.querySelectorAll<SVGCircleElement>(".intro-orbit"),
    ];
    this.caps = [
      ...this.element.querySelectorAll<SVGCircleElement>(".intro-cap"),
    ];
    this.core = this.find(".intro-core");
    this.find(".intro-welcome-logo text").textContent = "HANSEN LAB";
    const signal = this.events.signal;
    this.find("[data-intro-skip]").addEventListener(
      "click",
      () => this.skip(),
      { signal },
    );
    this.find("[data-intro-browse]").addEventListener(
      "click",
      () => this.browse(),
      { signal },
    );
    this.find("[data-intro-retry]").addEventListener(
      "click",
      () => location.reload(),
      { signal },
    );
    window.addEventListener("resize", () => this.resize(), { signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        this.stop();
        if (!document.hidden) this.schedule();
      },
      { signal },
    );
    this.resize();
    this.element.dataset.reduced = String(this.reduced);
    this.render(START);
    this.schedule();
  }
  private find<T extends Element = HTMLElement>(selector: string) {
    return this.element.querySelector<T>(selector)!;
  }
  private opacity(selector: string, value: number | boolean) {
    this.find<HTMLElement>(selector).style.opacity = String(Number(value));
  }
  private resize() {
    // Keep the whole composition in portrait; the background and controls fill the viewport.
    const portrait = innerWidth <= 600 && innerHeight > innerWidth;
    const width = portrait ? 1100 : 1920;
    const scale = Math.min(innerWidth / width, innerHeight / 1080);
    this.element.dataset.portrait = String(portrait);
    this.stage.style.width = `${width}px`;
    this.stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  private stop() {
    cancelAnimationFrame(this.frame);
    this.frame = this.last = 0;
  }
  private schedule() {
    if (this.finished || this.closing || document.hidden || this.frame) return;
    if (this.reduced || this.skipped || this.failed) return;
    this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (ms: number) => {
    this.frame = 0;
    if (this.last) this.elapsed += (ms - this.last) / 1000;
    this.last = ms;
    // Never reveal the homepage or claim completion until the actual scene is ready.
    if (!this.resourcesReady && this.elapsed >= HOLD) {
      this.elapsed = HOLD;
      this.render(START + HOLD);
      this.element.dataset.phase = "waiting";
      this.last = 0;
      return;
    }
    this.render(START + this.elapsed);
    if (this.elapsed >= END) this.finish("home");
    else this.schedule();
  };
  private render(time: number) {
    const s = bootMotion(time);
    this.element.dataset.phase = s.step;
    this.opacity(".intro-access", s.accessOpacity);
    this.find(".intro-access").textContent = s.access;
    this.opacity(".intro-logo", s.logoOpacity);
    this.find<HTMLElement>(".intro-logo").style.transform =
      `translateX(${s.logo.offsetX}px)`;
    const draw = smooth(progress(s.t, 9.16, 10.24));
    this.strokes.forEach((path, i) => {
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = String(
        1 - Math.min(1, Math.max(0, draw * 1.35 - i * 0.1)),
      );
    });
    this.find(".intro-logo text").textContent = s.logoLetters;
    this.opacity(".intro-auth", s.authOpacity);
    this.find(".intro-auth span").textContent = s.auth;
    const brand = this.find(".intro-brand");
    [...brand.children].forEach((node, i) => {
      const element = node as HTMLElement;
      element.style.opacity = String(s.brand[i].opacity);
      element.style.transform = `translateX(${s.brand[i].x}px)`;
    });
    this.opacity(".intro-powered", s.poweredLetters > 0);
    this.find<HTMLElement>(".intro-powered").style.clipPath =
      `inset(0 ${100 * (1 - s.poweredLetters / "POWERED BY HANSEN LAB".length)}% 0 0)`;
    this.opacity(".intro-scan", s.scanVisible);
    if (s.scanVisible) this.renderScan(s);
    this.opacity(".intro-welcome", s.welcomeVisible ? s.welcomeOpacity : 0);
    const welcome = this.find<HTMLElement>(".intro-welcome");
    welcome.style.transform = `scale(${s.welcomeScale})`;
    welcome.style.filter = `blur(${s.exitBlur}px)`;
    this.opacity(".intro-panel", s.welcomePanel);
    this.find<HTMLElement>(".intro-welcome-heading").style.color =
      `rgb(${255 * (1 - s.welcomeInk)} ${255 * (1 - s.welcomeInk)} ${255 * (1 - s.welcomeInk)})`;
    this.opacity(
      ".intro-company",
      s.companyVisible ? (s.companyMask ? 0.65 : 1) : 0,
    );
    this.find<HTMLElement>(".intro-highlight").style.clipPath =
      `inset(0 ${100 * (1 - s.highlight)}% 0 0)`;
    this.opacity(".intro-database", s.databaseOpacity);
    this.opacity(".intro-welcome-logo", s.welcomeLogo);
    this.find<HTMLElement>(".intro-background svg").style.transform =
      `translate(${Math.sin(s.t * 0.16) * 18}px, ${-(s.t - 6) * 5}px) scale(1.08)`;
  }
  private renderScan(s: ReturnType<typeof bootMotion>) {
    const { scan } = s;
    const group = this.paths[0].parentElement!;
    group.setAttribute(
      "transform",
      `translate(960 540) scale(${s.ringScale}) translate(-960 -540)`,
    );
    group.style.opacity = String(s.ringOpacity);
    group.style.filter = `blur(${s.ringBlur}px)`;
    const paths = [
      arc(scan.radius, scan.outerStart, scan.outerSweep),
      arc(scan.whiteRadius, scan.whiteStart, scan.whiteSweep),
      arc(scan.innerRadius, scan.innerStart, scan.innerSweep),
      arc(scan.innerRadius, scan.innerStart + Math.PI, scan.innerSweep),
      ...s.scanOrbit.sides.map((side) =>
        arc(side.radius, side.start, side.sweep, side.x, side.y),
      ),
    ];
    this.paths.forEach((path, i) => {
      path.setAttribute("d", paths[i]);
      if (i > 3) path.style.opacity = s.scanOrbit.sideVisible ? "1" : "0";
    });
    this.core.setAttribute("r", String(s.coreRadius));
    this.core.style.opacity = s.ornament ? "1" : "0";
    s.scanOrbit.satellites.forEach((point, i) => {
      this.dots[i].setAttribute("cx", String(point.x));
      this.dots[i].setAttribute("cy", String(point.y));
      this.dots[i].setAttribute("r", String(point.radius));
    });
    this.orbit.forEach((dot, i) => {
      dot.setAttribute(
        "cx",
        String(960 + Math.cos(scan.orbit + i * Math.PI) * scan.orbitRadius),
      );
      dot.setAttribute(
        "cy",
        String(540 + Math.sin(scan.orbit + i * Math.PI) * scan.orbitRadius),
      );
      dot.setAttribute("r", String(scan.dotRadius));
    });
    this.caps.forEach((cap, i) => {
      const angle = i ? scan.whiteStart : scan.outerStart + scan.outerSweep;
      const radius = i ? scan.whiteRadius : scan.radius;
      cap.setAttribute("cx", String(960 + Math.cos(angle) * radius));
      cap.setAttribute("cy", String(540 + Math.sin(angle) * radius));
      cap.setAttribute("r", String(i ? scan.whiteCap : scan.blackCap));
    });
    const label = this.find<HTMLElement>(".intro-scan > span");
    label.style.opacity = String(s.permissionOpacity);
    label.style.letterSpacing = `${s.scanTracking}px`;
  }
  ready() {
    this.resourcesReady = true;
    this.status.textContent = "三维档案已就绪";
    this.element.dataset.resources = "ready";
    if (this.finished || this.closing) return;
    if (this.reduced || this.skipped) this.finish("home");
    else this.schedule();
  }
  fail() {
    this.failed = true;
    this.stop();
    this.element.dataset.resources = "failed";
    this.element.dataset.reduced = "true";
    this.status.textContent = "三维场景暂时无法载入，文章仍可阅读。";
    this.find<HTMLElement>("[data-intro-retry]").hidden = false;
    this.find("[data-intro-skip]").textContent = "进入文章目录 ↗";
  }
  skip() {
    if (this.closing || this.finished) return;
    if (this.failed) return this.browse();
    this.skipped = true;
    this.stop();
    this.element.dataset.reduced = "true";
    this.element.dataset.phase = "waiting";
    this.find("[data-intro-skip]").textContent = "正在准备首页…";
    if (this.resourcesReady) this.finish("home");
    else this.status.textContent = "开场已跳过，三维档案仍在准备…";
  }
  browse() {
    this.finish("index");
  }
  direct() {
    this.finish("home", true);
  }
  setReduced(value: boolean) {
    this.reduced = value;
    this.element.dataset.reduced = String(value || this.skipped || this.failed);
    if (value) {
      this.stop();
      if (this.resourcesReady) this.finish("home");
    } else this.schedule();
  }
  replay() {
    this.stop();
    clearTimeout(this.fade);
    this.elapsed = 0;
    this.closing = this.finished = this.skipped = false;
    this.element.hidden = this.element.inert = false;
    this.element.classList.remove("intro-leaving");
    this.element.dataset.reduced = String(this.reduced);
    this.find("[data-intro-skip]").innerHTML =
      '跳过开场 <span aria-hidden="true">↗</span>';
    this.render(START);
    if (this.reduced && this.resourcesReady) this.finish("home", true);
    else {
      this.find<HTMLElement>("[data-intro-skip]").focus();
      this.schedule();
    }
  }
  private finish(destination: Destination, immediate = false) {
    if (this.finished || this.closing) return;
    this.stop();
    this.closing = true;
    this.element.inert = true;
    // Paint a settled welcome frame before preparing WebGL's first frame.
    // Shader compilation must not consume the logo/scan timeline or fade to an empty canvas.
    this.render(START + HOLD);
    this.element.dataset.phase = "preparing";
    const done = () => {
      this.element.hidden = true;
      this.finished = true;
      this.closing = false;
      this.element.dataset.phase = "done";
      this.options.onFinish(destination);
    };
    const reveal = () => {
      this.options.onReveal();
      this.element.dataset.phase = "leaving";
      if (immediate || this.reduced) done();
      else {
        this.element.classList.add("intro-leaving");
        this.fade = setTimeout(done, 420);
      }
    };
    if (immediate) reveal();
    else this.fade = setTimeout(reveal, 32);
  }
  dispose() {
    this.stop();
    clearTimeout(this.fade);
    this.events.abort();
    this.element.remove();
  }
}
