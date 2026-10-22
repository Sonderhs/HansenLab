# 内容组织试用

selection.json 是用户已有 Hexo 博客中 18 篇已发布文章的元数据和正文节选。SOURCE.json 记录原相对路径与提取时 SHA-256；未修改源备份，也未导入其余 372 篇文章、草稿、图片、PDF 或后台服务。正常安装、构建和运行不依赖备份目录或其 node_modules。

- id、slug 是本试用版的稳定文章标识，slug 生成 #post/ 路由。标题、日期、category、原 tags 来自备份；source.url 按备份生成索引保留原文地址。
- sections 为少量纯文本段落和代码片段，不是完整 Markdown。excerpt 必须保持 true，页面标明节选与原文入口；minutes 仅估算当前节选。
- src/data.ts 的 articles 是唯一内容目录；collections 中 articleSlugs 是集合内容，featured 是首页精选。展示位置可跨集合复用文章，目录仍按文章去重。
- 五个集合当前全部有内容，每列 featured 为 1–20 个不重复 slug。完整目录可包含未精选文章；打开这类文章时保持原三维选档。
- series 保存选读顺序、学习项目／个人项目类型和已知原系列篇数，只为本次存在的文章提供可点击链接。
- category 与 tags 保留旧元数据。articleTags 统一界面别名，例如 Go八股 / go-interview 显示为 Go 面试，大语言模型显示为 LLM；搜索仍包含原标签。

本轮只验证组织与浏览方式，尚未建立全量导入、写作发布或旧链接重定向流程。
