import {
  articles,
  articleBySlug,
  articleTags,
  categoryLabel,
  seriesFor,
  type Post,
} from "./data";
import { escapeHtml as esc } from "./html";
export function readerContent(post: Post) {
  const series = seriesFor(post.slug)[0];
  const members = series?.articleSlugs ?? [];
  const position = members.indexOf(post.slug);
  const next =
    articleBySlug(members[position + 1]) ??
    articles.find(
      (p) => p.slug !== post.slug && p.category === post.category,
    ) ??
    articles.find((p) => p.slug !== post.slug)!;
  const seriesPanel = series
    ? `<section class="reader-series"><div><span class="eyebrow">${esc(series.kind)} / ${position + 1} OF ${members.length}</span><button data-read-series="${series.id}">${esc(series.name)} ↗</button><small>${series.originalCount && series.originalCount > members.length ? `本次选入 ${members.length} / 原系列 ${series.originalCount} 篇` : "按专题顺序阅读"}</small></div><nav aria-label="系列阅读">${position > 0 ? `<a href="#post/${members[position - 1]}">← 上一篇</a>` : "<span>专题起点</span>"}<button data-read-series="${series.id}">专题目录</button>${position < members.length - 1 ? `<a href="#post/${members[position + 1]}">下一篇 →</a>` : "<span>本次选读到此</span>"}</nav></section>`
    : "";
  const toc = `<span class="eyebrow">ON THIS PAGE</span>${post.sections.map((section, n) => `<a href="#section-${n}" data-section="${n}"><span>${String(n + 1).padStart(2, "0")}</span>${esc(section.heading)}</a>`).join("")}<div class="toc-note">${post.id}<br>原博客选读 · 正文节选${series ? `<br><button data-read-series="${series.id}">${esc(series.name)} ↗</button>` : ""}</div>`;
  const body = `<div class="article-kicker"><button data-read-category="${esc(post.category)}">${esc(categoryLabel(post.category))} ↗</button><span>${post.id} / 选读节选</span></div><h1>${esc(post.title)}</h1><p class="article-lead">${esc(post.lead)}</p><div class="article-meta"><span>Hansen</span><time datetime="${post.date}">${post.date.replaceAll("-", ".")}</time><span>节选约 ${post.minutes} 分钟</span></div><div class="article-tags">${articleTags(
    post,
  )
    .map((tag) => `<button data-read-tag="${esc(tag)}">${esc(tag)}</button>`)
    .join(
      "",
    )}</div><aside class="excerpt-note"><div><strong>来自现有博客的正文节选</strong><p>本次先体验内容组织与阅读顺序。完整文字、插图与公式可在原文中查看。</p></div><a href="${esc(post.source.url)}" target="_blank" rel="noopener noreferrer">查看原文 ↗</a></aside>${seriesPanel}<div class="article-body">${post.sections.map((section, n) => `<section id="section-${n}"><h2><span>${String(n + 1).padStart(2, "0")}</span>${esc(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}${section.code ? `<div class="code-heading"><span>${esc(section.language || "CODE").toUpperCase()} / 代码节选</span><button data-action="copy">复制代码</button></div><pre><code>${esc(section.code)}</code></pre>` : ""}</section>`).join("")}</div><div class="article-end"><span>END OF EXCERPT <i>■</i></span><a href="${esc(post.source.url)}" target="_blank" rel="noopener noreferrer">继续阅读原文 ↗</a></div><a class="next-post" href="#post/${next.slug}"><span class="eyebrow">CONTINUE READING / 继续阅读</span><strong>${esc(next.title)} <span>→</span></strong></a><footer class="article-footer">HANSEN LAB <span>RESEARCH · BUILD · RECORD</span></footer>`;
  return { toc, body };
}
