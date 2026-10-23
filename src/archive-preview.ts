import { articleTags, categoryLabel, seriesFor, type Post } from "./data";
import { escapeHtml as esc } from "./html";
import "./archive-preview.css";

/** The preview shares the live archive scene; only its document panel is new. */
export function archivePreview(post: Post) {
  const series = seriesFor(post.slug)[0];
  return `<div class="preview-kicker"><span>ARCHIVE PREVIEW / 档案预览</span><span>${esc(post.id)}</span></div>
    <h2 id="preview-title" tabindex="-1">${esc(post.title)}</h2>
    <div class="preview-meta"><span>${esc(categoryLabel(post.category))}</span><time datetime="${esc(post.date)}">${esc(post.date.replaceAll("-", "."))}</time><span>节选约 ${post.minutes} 分钟</span></div>
    <p class="preview-lead">${esc(post.lead)}</p>
    <div class="preview-tags">${articleTags(post)
      .map((tag) => `<span>${esc(tag)}</span>`)
      .join("")}</div>
    ${series ? `<p class="preview-series">${esc(series.kind)} <span>${esc(series.name)}</span></p>` : ""}
    <div class="preview-outline"><span class="eyebrow">INSIDE THIS RECORD / 本篇内容</span><ol>${post.sections.map((section) => `<li>${esc(section.heading)}</li>`).join("")}</ol></div>
    <a class="preview-read read-link" href="#post/${esc(post.slug)}">打开这份记录 <span>↗</span></a>
    <p class="preview-note">当前收录正文节选，完整内容可在阅读页访问原文。</p>`;
}
