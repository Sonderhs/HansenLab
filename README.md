# Hansen Lab

GitHub 私有仓库：[Sonderhs/HansenLab](https://github.com/Sonderhs/HansenLab)。

个人研究与实践档案。以技术笔记、项目过程与实验记录为主，也保留生活随笔。

首页保留可拖动的三维玻璃档案阵列；文章使用独立阅读界面，提供目录、代码复制、阅读进度与下一篇。支持文章搜索、分类筛选、键盘导航和手机布局。

![Hansen Lab 三维玻璃档案首页预览](docs/images/homepage.png)

## 本地运行

需要 Node.js 22.12 或以上版本（已使用 Node.js 24 验证）。

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:5175/ 。这是独立项目，不需要 RhineLabUI 目录、其 node_modules 或本地服务。

```powershell
npm run build
npm run preview
```

静态产物位于 `dist/`。默认部署在站点根路径；子路径部署可在构建时设置 `HANSEN_BASE=/HansenLab/`。文章采用 `#post/neko-rag` 形式的链接，无需服务端路由回退。

## 使用与内容

- 首页拖动、滚轮、方向键切换；点击三维档案或按 Enter 先预览，再选择「打开这份记录」进入文章；`/` 搜索，Esc 返回。
- 预览复用原场景的竖直抽取、镜头靠近与解密；获得净空后可拖动查看角度，旁边显示摘要、标签和章节。阅读后返回同一预览，再按 Esc 或「返回档案阵列」先转正归位；首页也保留直接阅读入口。手机预览采用上方模型、下方独立滚动信息。验证见 [verification/ARCHIVE-PREVIEW.md](verification/ARCHIVE-PREVIEW.md)。
- `content/selection.json` 保存 18 篇原博客正文节选；来源与哈希见 `content/SOURCE.json`。
- `src/data.ts` 分别配置唯一文章、展示集合、系列、标签别名与三维精选位置。
- `src/catalog.ts` 管理目录筛选，`src/reader-content.ts` 管理节选阅读与系列导航。
- `src/main.ts` 管理页面交互，`src/style.css` 管理博客布局，`src/scene.ts` 管理三维场景。
- `public/assets/` 为模型，`art/` 为对应 Blender 源文件与脚本。

当前为内容组织试用版：从原博客 390 篇文章中只选入 18 篇正文节选，保留原标题、日期、分类、标签及原文入口。提供五个展示集合、七个原分类、24 个展示标签和六个系列／专题。标签别名只合并显示，原标签保留；系列标明实际选入数量。阅读时长按节选长度估算。

首页展示集合与文章分类分开，同一篇 Neko 可同时出现在 AI 与项目中，目录中仍只有一条文章记录。各列精选篇数分别为 6 / 4 / 3 / 2 / 5，不再强制每列八篇；打开集合可查看本次选入的全部相关文章。目录支持集合、分类、多标签交集、关键词及发布时间排序；正文可点击标签、分类和专题继续浏览。

本轮未进行全量迁移，未复制旧站图片、PDF、草稿或服务端配置。完整 Markdown、公式／图片渲染、旧链接迁移和长期写作流程仍待后续讨论。维护说明见 [content/README.md](content/README.md)，验收见 [verification/CONTENT-CATALOG.md](verification/CONTENT-CATALOG.md)。

## 开场与加载

首页自动播放约 20 秒的开场：逐字访问提示、Hansen 标志绘制、圆环扫描、欢迎页，再淡入三维首页。轨迹复用自 RhineLabUI，使用本站 MiSans 和 Hansen 品牌。开场期间并行准备真实三维资源，资源未就绪时停留在欢迎页；可点击「跳过开场」或按 Esc／Enter 跳过动效，仍需等待场景准备完成。「先浏览文章目录」可立即打开文章；文章直达链接跳过开场。页脚可重播，系统减少动态效果时使用静态加载页。后台标签页暂停开场，失败时提供重试与文章入口。详见 [verification/BOOT-INTRO.md](verification/BOOT-INTRO.md)。

开场支持原项目的打字、标志、验证、扫描与欢迎提示音。首次访问默认开启音效，浏览器允许时开场直接带声播放；受自动播放策略限制时提示点击页面，点击后从当前进度接续，也可点「有声重播」从头试听。播放中可点击「音效 开」静音，主动关闭的偏好优先于默认值。页脚音效开关保存偏好，再点击「重播开场」即可试听；刷新时会尝试自动播放；浏览器仍可能要求一次点击解锁声音。跳过、提前阅读、减少动态效果及后台暂停均停止开场音效，音频不可用时仍可正常浏览。浏览时也复用原项目音效：选档／切列、文章打开／返回使用玻璃声，目录／关于弹窗、筛选和设置操作使用电子提示音。页脚「音效」统一控制开场与浏览，开启后无需重播即可听到交互反馈；首次进入仍需一次点击或键盘操作。后台停止声音，返回后的下一次交互恢复；减少动态效果独立于浏览音效。没有接入背景音乐。浏览验收见 [verification/INTERFACE-AUDIO.md](verification/INTERFACE-AUDIO.md)。开场实现与历史验证见 [verification/BOOT-AUDIO.md](verification/BOOT-AUDIO.md)，默认开启与浏览器播放策略见 [verification/DEFAULT-OPENING-AUDIO.md](verification/DEFAULT-OPENING-AUDIO.md)。

## 画质与验证

默认原始画质，页脚可手动切换流畅档。文章、目录及隐藏标签页暂停三维绘制，返回后恢复。开发模式 `/?profile=1` 可测量场景；`/?profile=baseline` 可作性能对照，生产构建不提供探针。Chrome 的实际帧率也受 Windows 给浏览器分配的 GPU 影响。

使用 Playwright CLI 复用现有检查（先启动开发服务）：

```powershell
npx --yes --package @playwright/cli playwright-cli --session hansen open http://127.0.0.1:5175/
npx --yes --package @playwright/cli playwright-cli --session hansen run-code --filename checks/browsing.js
npx --yes --package @playwright/cli playwright-cli --session hansen run-code --filename checks/interaction.js
npx --yes --package @playwright/cli playwright-cli --session hansen close
```

`checks/rendering.js` 提供渲染前后像素对照；`checks/gpu.js` 与 `checks/runtime.js` 提供开发机性能测量。历史测试见 [docs/DEMO-HISTORY.md](docs/DEMO-HISTORY.md)，独立项目验收见 [verification/STANDALONE.md](verification/STANDALONE.md)。

## 来源与许可

本项目从 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI) 的 Hansen Lab 实验版本拆出，复用其三维引擎、交互及 Blender 模型。保留原 MIT 署名，字体遵循单独许可，详细来源见 [NOTICE.md](NOTICE.md)。
