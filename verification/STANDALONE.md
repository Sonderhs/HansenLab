# 独立仓库验收

2026-10-18。从 RhineLabUI 的 Hansen Lab 实验版本提取至独立目录 D:/Alist/HansenLab，独立 Git 历史，远程 https://github.com/Sonderhs/HansenLab ，可见性为私有。

## 依赖与资源

- src 的相对导入均在新项目内，移除原 Vite 内容 alias、父目录 publicDir、父目录 tsconfig 扩展及外部 fs.allow。
- 标准命令 npm ci、npm run dev、npm run build、npm run preview；开发端口 5175，静态发行目录 dist。
- 依赖版本独立锁定；安装后自动应用文字测量补丁。更新间接依赖 source-map-js 至 1.2.2，npm audit 报告零告警。
- 保留两份 GLB、对应 Blender 工程及所有共享生成脚本。模型未经改制；保留模型内原有浮雕和来源说明。
- 753 份 MiSans WOFF2 的 SHA-256 全部符合原来源清单。保留字体许可、来源和分包元数据。未包含 Novecento、视频、音频、原项目的部署文件或凭据。

## 验证结果

- 新目录独立安装与 TypeScript / Vite 生产构建通过。
- checks/browsing.js：三维载入、分类记忆、文章阅读与返回、目录搜索与空状态、组合筛选、直达链接刷新、弹窗与输入恢复、系统减少动态效果均通过；1600×900 桌面及 390×844、320×700、844×390 视口无页面横向溢出、导航重叠或标题超出容器。
- checks/interaction.js：八项检查通过，包括目录／阅读期间零三维绘制、退出恢复、显式画质切换与恢复、模拟低帧率下按实际经过时间抽取。
- checks/rendering.js：archive、detail、inspect、switch、dark、half-ao、no-ao、smaa 共八组，1440000 像素帧缓冲均有效，无 WebGL 错误；优化开关前后所有通道差异为零。
- 根路径生产包实际运行：三维画布正常，字体加载成功，文章直达刷新正常，手机阅读无横向溢出，零 JavaScript 错误及失败资源请求；即使使用 ?profile=1，生产页面也不暴露开发探针。
- /HansenLab/ 子路径构建通过，CSS 字体 URL 正确带有子路径。
- 桌面首页、手机正文截图已目视复核。测试浏览器已关闭，以释放三维渲染资源。

## 已知边界

文章仍为明确标注的演示内容，内容适配暂为五类各八篇。模型保持原资源，尚未改制内部浮雕。构建仍有约 809 KB 主 JS 分块提示；Three.js 有既存的 PCFSoftShadowMap 弃用与显卡着色器精度警告，验收中未出现 JavaScript 或 WebGL 错误。本轮未部署网站、配置域名或迁移真实文章。

docs/DEMO-HISTORY.md 与 performance-results.json 记录提取前的历史测试，不能作为所有设备的帧率承诺。
