import {
  articles,
  collections,
  series,
  categories,
  tags,
  articleTags,
  categoryLabel,
  articleBySlug,
  type Post,
} from "./data";
import { escapeHtml as esc } from "./html";
import "./catalog.css";
export type CatalogPreset = {
  collection?: string;
  category?: string;
  tag?: string;
  series?: string;
  view?: "articles" | "series";
};

export class ArticleCatalog {
  private collection = "";
  private category = "";
  private selectedTags = new Set<string>();
  private activeSeries = "";
  private view: "articles" | "series" = "articles";
  private query = "";
  private sort = "newest";
  constructor(private dialog: HTMLDialogElement) {
    dialog.innerHTML = `<header class="dialog-header"><div><span class="eyebrow">HANSEN LAB / ARCHIVE INDEX</span><h2 id="index-heading">文章目录<span>${articles.length} 篇选读</span></h2></div><button data-action="close" aria-label="关闭目录">✕</button></header>
   <p class="catalog-note">从现有博客选入 ${articles.length} 篇正文节选，先体验内容组织。完整内容保留原文入口。</p>
   <label class="search-field"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="搜索标题、主题、标签…" autocomplete="off" aria-label="搜索文章"><kbd>ESC</kbd></label>
   <nav class="catalog-tabs" aria-label="目录视图"><button data-catalog-view="articles">文章 <span>${articles.length}</span></button><button data-catalog-view="series">系列与专题 <span>${series.length}</span></button></nav>
   <div class="catalog-layout"><aside class="catalog-sidebar" aria-label="内容筛选"><div class="facet-title">展示集合 <span>COLLECTIONS</span></div><div id="collection-filters"></div><label class="facet-title" for="category-filter">原文章分类</label><select id="category-filter" aria-label="按原分类筛选"><option value="">全部分类</option>${categories.map((c) => `<option value="${esc(c)}">${esc(categoryLabel(c))} · ${articles.filter((p) => p.category === c).length}</option>`).join("")}</select><details id="tag-panel"><summary>主题标签 <span>${tags.length}</span></summary><p class="tag-hint">可多选，同时包含所选标签</p><div id="tag-filters"></div></details><button class="catalog-reset" data-catalog-reset aria-label="清除所有筛选">清除所有筛选 ↗</button></aside>
   <div class="catalog-main"><div id="active-filters" aria-label="已选条件"></div><div id="series-context"></div><div class="index-info"><span id="result-count" role="status"></span><label>排序 <select id="sort-filter" aria-label="文章排序"><option value="newest">最新发布</option><option value="oldest">最早发布</option></select></label></div><div id="results"></div></div></div>`;
    this.el<HTMLInputElement>("#search").addEventListener("input", (e) => {
      this.query = (e.target as HTMLInputElement).value;
      this.render();
    });
    this.el<HTMLSelectElement>("#category-filter").addEventListener(
      "change",
      (e) => {
        this.category = (e.target as HTMLSelectElement).value;
        this.render();
      },
    );
    this.el<HTMLSelectElement>("#sort-filter").addEventListener(
      "change",
      (e) => {
        this.sort = (e.target as HTMLSelectElement).value;
        this.render();
      },
    );
    dialog.addEventListener("click", (event) => {
      const target = event.target as Element;
      const view = target.closest<HTMLElement>("[data-catalog-view]")?.dataset
        .catalogView;
      if (view) {
        this.view = view as typeof this.view;
        this.render();
      }
      const collection = target.closest<HTMLElement>(
        "[data-catalog-collection]",
      );
      if (collection) {
        this.collection = collection.dataset.catalogCollection!;
        this.activeSeries = "";
        this.render();
        this.el<HTMLElement>(
          `[data-catalog-collection="${CSS.escape(this.collection)}"]`,
        ).focus();
      }
      const tag =
        target.closest<HTMLElement>("[data-catalog-tag]")?.dataset.catalogTag;
      if (tag) {
        this.selectedTags.has(tag)
          ? this.selectedTags.delete(tag)
          : this.selectedTags.add(tag);
        this.render();
        this.el<HTMLButtonElement>(
          `[data-catalog-tag="${CSS.escape(tag)}"]`,
        ).focus();
      }
      const series = target.closest<HTMLElement>("[data-catalog-series]")
        ?.dataset.catalogSeries;
      if (series) {
        this.reset({ series });
        this.el<HTMLElement>("#series-context h3").focus();
      }
      if (target.closest("[data-catalog-reset]")) {
        this.reset({ view: this.view });
        this.el<HTMLElement>("#search").focus();
      }
      const clear = target.closest<HTMLElement>("[data-catalog-clear]")?.dataset
        .catalogClear;
      if (clear) {
        if (clear === "collection") this.collection = "";
        if (clear === "category") this.category = "";
        if (clear === "series") this.activeSeries = "";
        if (clear.startsWith("tag:")) this.selectedTags.delete(clear.slice(4));
        this.render();
        this.el<HTMLElement>("#search").focus();
      }
    });
    this.reset();
  }
  private el<T extends HTMLElement = HTMLElement>(selector: string) {
    return this.dialog.querySelector<T>(selector)!;
  }
  reset(preset: CatalogPreset = {}) {
    this.collection = preset.collection ?? "";
    this.category = preset.category ?? "";
    this.selectedTags = new Set(preset.tag ? [preset.tag] : []);
    this.activeSeries = preset.series ?? "";
    this.view = preset.view ?? "articles";
    this.query = "";
    this.sort = "newest";
    this.el<HTMLInputElement>("#search").value = "";
    this.el<HTMLDetailsElement>("#tag-panel").open = Boolean(preset.tag);
    this.render();
    this.el(".catalog-main").scrollTop = 0;
    this.el(".catalog-sidebar").scrollTop = 0;
  }
  private matches(post: Post) {
    const collection = collections.find((c) => c.id === this.collection);
    const selectedSeries = series.find((s) => s.id === this.activeSeries);
    const haystack =
      `${post.title} ${post.category} ${post.tags.join(" ")} ${articleTags(post).join(" ")} ${post.lead} ${series
        .filter((s) => s.articleSlugs.includes(post.slug))
        .map((s) => s.name)
        .join(" ")}`.toLocaleLowerCase();
    return (
      (!collection || collection.articleSlugs.includes(post.slug)) &&
      (!this.category || post.category === this.category) &&
      (!selectedSeries || selectedSeries.articleSlugs.includes(post.slug)) &&
      [...this.selectedTags].every((tag) => articleTags(post).includes(tag)) &&
      haystack.includes(this.query.trim().toLocaleLowerCase())
    );
  }
  private render() {
    const found = articles.filter((p) => this.matches(p));
    const selectedSeries = series.find((s) => s.id === this.activeSeries);
    found.sort((a, b) =>
      selectedSeries
        ? selectedSeries.articleSlugs.indexOf(a.slug) -
          selectedSeries.articleSlugs.indexOf(b.slug)
        : this.sort === "newest"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date),
    );
    this.dialog.dataset.view = this.view;
    this.el<HTMLSelectElement>("#category-filter").value = this.category;
    const sort = this.el<HTMLSelectElement>("#sort-filter");
    sort.value = this.sort;
    sort.disabled = Boolean(selectedSeries) || this.view === "series";
    this.dialog
      .querySelectorAll<HTMLElement>("[data-catalog-view]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.catalogView === this.view),
        ),
      );
    this.el("#collection-filters").innerHTML = [
      { id: "", name: "全部文章", articleSlugs: articles.map((p) => p.slug) },
      ...collections,
    ]
      .map(
        (c) =>
          `<button data-catalog-collection="${c.id}" aria-pressed="${this.collection === c.id}"><span>${esc(c.name)}</span><small>${c.articleSlugs.length}</small></button>`,
      )
      .join("");
    this.el("#tag-filters").innerHTML = tags
      .map(
        (tag) =>
          `<button data-catalog-tag="${esc(tag)}" aria-pressed="${this.selectedTags.has(tag)}">${esc(tag)}<small>${articles.filter((p) => articleTags(p).includes(tag)).length}</small></button>`,
      )
      .join("");
    const chips = [];
    if (this.collection)
      chips.push([
        "collection",
        collections.find((c) => c.id === this.collection)!.name,
      ]);
    if (this.category) chips.push(["category", categoryLabel(this.category)]);
    if (this.activeSeries) chips.push(["series", selectedSeries!.name]);
    for (const tag of this.selectedTags) chips.push(["tag:" + tag, tag]);
    this.el("#active-filters").innerHTML = chips
      .map(
        ([key, label]) =>
          `<button data-catalog-clear="${esc(key)}" aria-label="移除筛选 ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`,
      )
      .join("");
    this.el("#series-context").innerHTML =
      selectedSeries && this.view === "articles"
        ? `<section class="series-summary"><span class="eyebrow">${esc(selectedSeries.kind)} / READING PATH</span><h3 tabindex="-1">${esc(selectedSeries.name)}</h3><p>${esc(selectedSeries.description)}</p><small>${selectedSeries.originalCount && selectedSeries.originalCount > selectedSeries.articleSlugs.length ? `原系列 ${selectedSeries.originalCount} 篇，本次选入 ${selectedSeries.articleSlugs.length} 篇。` : `本次选入 ${selectedSeries.articleSlugs.length} 篇。`}下方按阅读顺序排列。</small></section>`
        : "";
    if (this.view === "series") {
      const matches = series.filter((s) =>
        s.articleSlugs.some((slug) => found.some((p) => p.slug === slug)),
      );
      this.el("#result-count").textContent =
        `${matches.length} 个系列与专题 · ${found.length} 篇符合条件的选读`;
      this.el("#results").innerHTML = matches
        .map(
          (s) =>
            `<button class="series-card" data-catalog-series="${s.id}"><span class="eyebrow">${esc(s.kind)} <i>／</i> ${s.articleSlugs.length} 篇选读</span><h3>${esc(s.name)}<span>↗</span></h3><p>${esc(s.description)}</p><ol>${s.articleSlugs
              .slice(0, 2)
              .map((slug) => `<li>${esc(articleBySlug(slug)!.title)}</li>`)
              .join(
                "",
              )}</ol><small>${s.originalCount && s.originalCount > s.articleSlugs.length ? `选入 ${s.articleSlugs.length} / ${s.originalCount} 篇` : "查看阅读顺序"} →</small></button>`,
        )
        .join("");
    } else {
      this.el("#result-count").textContent =
        `${found.length} / ${articles.length} 篇选读${selectedSeries ? " · 系列顺序" : ""}`;
      this.el("#results").innerHTML = found
        .map(
          (post) =>
            `<a class="result" href="#post/${post.slug}"><span class="result-code">${selectedSeries ? String(selectedSeries.articleSlugs.indexOf(post.slug) + 1).padStart(2, "0") : post.id}</span><div><span class="result-category">${esc(categoryLabel(post.category))} <i>／</i> ${post.date.replaceAll("-", ".")} <i>／</i> 正文节选</span><h3>${esc(post.title)}</h3><p>${articleTags(post).map(esc).join(" · ")}</p></div><span class="result-arrow">↗</span></a>`,
        )
        .join("");
    }
    this.el(".catalog-main").scrollTop = 0;
    if (!this.el("#results").children.length)
      this.el("#results").innerHTML =
        '<div class="no-results"><span>∅</span><p>没有找到对应记录</p><small>试试其他关键词，或移除部分筛选。</small><button data-catalog-reset>清除搜索与筛选 →</button></div>';
  }
}
