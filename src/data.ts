import selection from "../content/selection.json";

export type Section = {
  heading: string;
  paragraphs: string[];
  code?: string;
  language?: string;
};
export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  minutes: number;
  tags: string[];
  lead: string;
  sections: Section[];
  source: { path: string; url: string };
  excerpt: boolean;
};
export type Collection = {
  id: string;
  name: string;
  en: string;
  description: string;
  articleSlugs: string[];
  featured: string[];
};
export type Series = {
  id: string;
  name: string;
  kind: string;
  description: string;
  articleSlugs: string[];
  originalCount?: number;
};
export const articles: Post[] = selection;
const slugsFor = (categories: string[]) =>
  articles.filter((p) => categories.includes(p.category)).map((p) => p.slug);
export const collections: Collection[] = [
  {
    id: "engineering",
    name: "开发与工程",
    en: "DEVELOPMENT & ENGINEERING",
    description: "语言、数据库与后端实践，从原理到工程细节。",
    articleSlugs: slugsFor([
      "Java",
      "Go",
      "MySQL",
      "Linux",
      "Redis",
      "Python",
      "markdown",
    ]),
    featured: [
      "clickhouse-01",
      "clickhouse-02",
      "clickhouse-03",
      "go-concurrency",
      "go-context",
      "dianping-02",
    ],
  },
  {
    id: "ai",
    name: "AI 与智能体",
    en: "AI & AGENTS",
    description: "Agent、RAG 与模型实践，连接原理和真实问题。",
    articleSlugs: slugsFor(["Agent", "LLM", "深度学习", "机器学习"]),
    featured: ["neko-rag", "rag-foundations", "peft", "transformer"],
  },
  {
    id: "algorithms",
    name: "算法与题解",
    en: "ALGORITHMS & SOLUTIONS",
    description: "从具体题目出发，保存思路与实现。",
    articleSlugs: slugsFor(["Leetcode"]),
    featured: ["two-sum", "binary-search", "reverse-list"],
  },
  {
    id: "research",
    name: "论文阅读",
    en: "PAPERS & RESEARCH",
    description: "沿着论文里的问题、方法与实验继续探索。",
    articleSlugs: slugsFor(["paper"]),
    featured: ["hyperbert", "bioserc"],
  },
  {
    id: "projects",
    name: "项目与作品",
    en: "PROJECTS & BUILD LOGS",
    description: "项目实践与学习项目的过程记录，保留每一次构建。",
    articleSlugs: [
      "neko-rag",
      "dianping-01",
      "dianping-02",
      "sky-01",
      "sky-02",
    ],
    featured: ["neko-rag", "dianping-01", "dianping-02", "sky-01", "sky-02"],
  },
];
export const series: Series[] = [
  {
    id: "clickhouse",
    name: "ClickHouse 学习笔记",
    kind: "学习系列",
    description:
      "从列式存储和 OLAP，到部署、分区与索引。按原系列顺序选入前三篇。",
    articleSlugs: ["clickhouse-01", "clickhouse-02", "clickhouse-03"],
    originalCount: 5,
  },
  {
    id: "go-concurrency",
    name: "Go 并发与面试",
    kind: "选读专题",
    description: "把并发基础与 Context 相关问题连起来阅读。",
    articleSlugs: ["go-concurrency", "go-context"],
  },
  {
    id: "neko",
    name: "Neko 博客助手",
    kind: "个人项目",
    description: "从关键词匹配到可追问的 RAG，记录博客助手的实际设计。",
    articleSlugs: ["neko-rag"],
    originalCount: 1,
  },
  {
    id: "dianping",
    name: "黑马点评实践",
    kind: "学习项目",
    description: "短信登录、商户查询与缓存设计。先体验前两篇开发记录。",
    articleSlugs: ["dianping-01", "dianping-02"],
    originalCount: 8,
  },
  {
    id: "sky",
    name: "苍穹外卖实践",
    kind: "学习项目",
    description: "从环境搭建到员工管理，沿开发日志继续前进。",
    articleSlugs: ["sky-01", "sky-02"],
    originalCount: 12,
  },
  {
    id: "algorithm-starters",
    name: "算法入门选读",
    kind: "选读专题",
    description: "两数之和、二分查找与反转链表，体验不同思路的题解。",
    articleSlugs: ["two-sum", "binary-search", "reverse-list"],
  },
];
const categoryLabels: Record<string, string> = {
  paper: "论文",
  Leetcode: "LeetCode",
  markdown: "Markdown",
};
export const categoryLabel = (value: string) => categoryLabels[value] ?? value;
const aliases: Record<string, string> = {
  Go八股: "Go 面试",
  "go-interview": "Go 面试",
  "go-basics": "Go 基础",
  transformer: "Transformer",
  Leetcode: "LeetCode",
  paper: "论文",
  大语言模型: "LLM",
};
export const tagLabel = (tag: string) => aliases[tag] ?? tag;
export const articleTags = (post: Post) => [
  ...new Set(post.tags.map(tagLabel)),
];
export const categories = [...new Set(articles.map((p) => p.category))].sort(
  (a, b) => a.localeCompare(b, "zh-CN"),
);
export const tags = [...new Set(articles.flatMap(articleTags))].sort((a, b) =>
  a.localeCompare(b, "zh-CN"),
);
export const articleBySlug = (slug: string) =>
  articles.find((p) => p.slug === slug);
export const seriesFor = (slug: string) =>
  series.filter((s) => s.articleSlugs.includes(slug));
export const collectionsFor = (slug: string) =>
  collections.filter((c) => c.articleSlugs.includes(slug));

// Physical appearances are independent from unique articles. An article can have
// a card in several collections, while its URL and catalog record stay unique.
export const posts = collections.flatMap((collection, lane) =>
  collection.featured.map((slug) => ({
    ...articleBySlug(slug)!,
    collection: collection.id,
    lane,
    en: collection.en,
  })),
);
export const records = posts;
export const archiveColumns = collections.map((c) => c.name);
const lanes = collections.map((_, lane) =>
  posts.flatMap((p, index) => (p.lane === lane ? [index] : [])),
);
export const columnFiles = (lane: number) =>
  lanes[((lane % lanes.length) + lanes.length) % lanes.length];
export function fileLocation(index: number) {
  const lane = posts[index].lane;
  const row = 12 + lanes[lane].indexOf(index);
  return { lane, row, slot: lane * 32 + row };
}
export function fileAtSlot(slot: number) {
  const lane = Math.floor(slot / 32);
  const files = columnFiles(lane);
  const row = slot - lane * 32 - 12;
  return files[((row % files.length) + files.length) % files.length];
}
export function appearanceFor(slug: string, lane: number) {
  return posts.findIndex((p) => p.slug === slug && p.lane === lane) >= 0
    ? posts.findIndex((p) => p.slug === slug && p.lane === lane)
    : posts.findIndex((p) => p.slug === slug);
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const archiveRowPeriod = lanes.reduce(
  (period, files) => (period * files.length) / gcd(period, files.length),
  1,
);

for (const c of collections) {
  if (!c.featured.length || c.featured.length > 20)
    throw Error("Featured collection must contain 1–20 appearances: " + c.id);
  for (const slug of [...c.featured, ...c.articleSlugs])
    if (!articleBySlug(slug)) throw Error("Unknown article: " + slug);
  if (c.featured.some((slug) => !c.articleSlugs.includes(slug)))
    throw Error("Featured article outside collection: " + c.id);
}
for (const s of series)
  for (const slug of s.articleSlugs)
    if (!articleBySlug(slug)) throw Error("Unknown series article: " + slug);
