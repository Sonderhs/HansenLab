export type Section = { heading: string; paragraphs: string[]; code?: string };
export type Post = {
  id: string;
  slug: string;
  title: string;
  en: string;
  category: string;
  date: string;
  minutes: number;
  tags: string[];
  lead: string;
  sections: Section[];
};

export const archiveColumns = [
  "工程笔记",
  "图形与交互",
  "项目实践",
  "实验记录",
  "生活随笔",
];
export const categories = ["全部档案", ...archiveColumns];
const titles = [
  [
    "让复杂界面保持简单",
    "为异步任务设计可靠的取消机制",
    "把内容从界面中分离出来",
    "一次缓存更新的完整旅程",
    "如何记录一个难以复现的问题",
    "给个人项目建立发布流程",
    "可维护的设置系统",
    "写给未来自己的代码注释",
  ],
  [
    "玻璃之后：一个三维界面的构建过程",
    "让动作在被打断后继续",
    "屏幕位移与三维轨道",
    "透明材质中的光与层次",
    "为移动屏幕重新构图",
    "从逐帧观察到运动曲线",
    "静止画面为什么还在渲染",
    "细小反馈如何影响交互手感",
  ],
  [
    "Hansen Lab：一间持续生长的实验室",
    "RhineLabUI：从参考画面到可交互档案",
    "一个本地优先的个人工具",
    "把项目过程写成可读的记录",
    "为长文设计一张安静的页面",
    "从原型走向可以长期使用的网站",
    "项目的第一份设计说明",
    "给作品建立一个可访问的入口",
  ],
  [
    "同一幅画面，三种渲染预算",
    "观察一次真实的字体加载",
    "测量之前，先确定要回答的问题",
    "一段动画的速度与距离",
    "用对照页讨论视觉差异",
    "一个小功能的输入边界",
    "清晰度与帧率之间",
    "把实验保留为可复现的过程",
  ],
  [
    "在构建之外，留一点空白",
    "为什么还想拥有一个个人网站",
    "关于慢慢做完一件事",
    "工具、习惯与注意力",
    "记录那些暂时没有结论的想法",
    "从日常中收集灵感",
    "整理，也是重新理解",
    "给下一阶段的一封短笺",
  ],
];
const leads = [
  "从一个具体的问题出发，记录约束、选择与实现。让解决方案留下来，也让推理过程可以被重新理解。",
  "从材质、镜头到运动，拆开一个界面的构建过程。探索视觉表达如何与真实交互一起成立。",
  "把想法变成可以打开、可以使用的作品。在这里保存设计选择、实现过程，以及下一次迭代的起点。",
  "给一个问题建立对照，观察结果，再决定下一步。记录条件与局限，让每一次尝试都可以重来。",
  "写下屏幕之外的观察，也给尚未成形的想法留一个位置。有些记录，暂时不需要结论。",
];
const tagGroups = [
  ["TypeScript", "工程实践"],
  ["Three.js", "交互设计"],
  ["项目日志", "持续构建"],
  ["性能", "实验方法"],
  ["随笔", "日常观察"],
];

export const posts: Post[] = titles.flatMap((group, lane) =>
  group.map((title, row) => ({
    id: `H-${String(lane * 8 + row + 1).padStart(3, "0")}`,
    slug: `lab-${String(lane * 8 + row + 1).padStart(3, "0")}`,
    title,
    en: [
      "ENGINEERING NOTES",
      "GRAPHICS & INTERACTION",
      "PROJECT JOURNAL",
      "EXPERIMENT LOG",
      "FIELD NOTES",
    ][lane],
    category: archiveColumns[lane],
    date: "2026-10-18",
    minutes: lane === 4 ? 3 : 6,
    tags: tagGroups[lane],
    lead: leads[lane],
    sections: [
      {
        heading: "从一个问题开始",
        paragraphs: [
          `这是一篇用于体验 Hansen Lab 阅读界面的示例文章，主题是「${title}」。日期、阅读时长和内容均为演示数据，不代表已经发布的个人经历或项目成果。`,
          lane === 4
            ? "做项目时，我们习惯保存完成的东西。但那些没有落地的想法、临时画下的草图和路上偶然想到的问题，也值得拥有一个去处。"
            : "一个项目的价值，不只体现在最终的画面中。最初的限制、比较过的方案、验证的方式，共同解释了它为什么变成现在的样子。",
        ],
      },
      {
        heading: lane === 4 ? "给观察留一个位置" : "把过程变成可以理解的记录",
        paragraphs: [
          "记录可以从一个很小的问题开始：希望改善什么，哪些条件需要保留，怎样判断这次修改是否有效。先把问题说清楚，后面的实现才有可以对照的目标。",
          "在这间实验室里，一篇文章可以关联到一个项目，一个项目也可以持续产生新的笔记。成果和过程连接起来，读者可以按自己的兴趣选择深入的方向。",
        ],
        ...(lane !== 4
          ? {
              code: 'type LabEntry = {\n  title: string;\n  question: string;\n  observations: string[];\n  nextStep?: string;\n};\n\nconst principle = "Make the process visible.";',
            }
          : {}),
      },
      {
        heading: "保留下一步",
        paragraphs: [
          "好的记录不必假装已经解决了所有问题。把仍然不确定的地方写下来，给下一次尝试留下清晰的起点。",
          "这个 Demo 先验证浏览与阅读之间的衔接。正式内容、写作方式和发布流程，可以在体验确认后逐步加入。",
        ],
      },
    ],
  })),
);

// The scene only needs category membership and stable physical slots.
export const records = posts;
export function columnFiles(lane: number) {
  return posts.flatMap((post, index) =>
    post.category === archiveColumns[lane] ? [index] : [],
  );
}
export function fileLocation(index: number) {
  const lane = archiveColumns.indexOf(posts[index].category);
  const row = 12 + columnFiles(lane).indexOf(index);
  return { lane, row, slot: lane * 32 + row };
}
export function fileAtSlot(slot: number) {
  const files = columnFiles(Math.floor(slot / 32));
  return files[Math.max(0, Math.min(files.length - 1, (slot % 32) - 12))];
}
