# 来源与许可

## 原项目

Hansen Lab 源自 [LBEILC/RhineLabUI](https://github.com/LBEILC/RhineLabUI)，原项目 Copyright (c) 2026 LBEILC，代码许可见 LICENSE。提取基线提交 12cc5e4013acb9408f753ff71de6b8492299b7c8，并包含 2026-10-18 的 Hansen Lab 实验工作区改动。此仓库以新的 Git 历史独立维护，源文件原路径及提取前 SHA-256 见 docs/SOURCE-MANIFEST.json。

复用范围：Three.js 场景与交互、玻璃档案及拆解模型、Blender 工程和生成脚本、字体加载、文字测量补丁。新增个人品牌、博客页面、文章阅读、示例内容及性能适配。原项目场景以《明日方舟》莱茵生命相关参考画面为视觉来源，原参考视频：https://www.bilibili.com/video/BV1rr4y1b7sz/ 。原作品及相关标识权利归其权利人；MIT 许可不改变第三方素材的权利。模型内仍保留原场景的 RHINE LAB 浮雕，此版本未修改模型几何。参考视频、音频与 Novecento 授权字体未包含在此仓库。

## 字体与依赖

- MiSans：小米字体，使用 misans-webfont@4.3.1 分包（字体 4.003）。字体字节保留原样；许可见 public/fonts/MiSans-license.pdf，来源与校验见 public/fonts/NOTICE.txt 和 public/fonts/misans-webfont-4.3.1/source.json。
- @kitlangton/rolling-number：MIT，见 public/licenses/rolling-number.txt；本地测量补丁为 scripts/patch-rolling-number.mjs。
- Three.js、Vite、TypeScript 等依赖保留各自随 npm 分发的许可；版本由 package-lock.json 锁定。

## 模型复现

art/rhine-archive.blend 与 art/archive-assembly.blend 对应 public/assets/ 的两个 GLB。art/build_archive.py 和 art/build_assembly.py 共用 clear_reference_details.py、internal_architecture.py、shell_reference_details.py。资源修改应通过 Blender MCP 执行这些脚本并保留源工程；无需 Blender 即可安装、运行与构建网站。

## Hansen Lab 开场（2026-10-22）

复用 RhineLabUI 的 boot-motion.ts、boot-tracks.ts、boot-orbit-tracks.ts、boot-logo-tracks.ts，保留逐帧测量轨迹。Hansen 的 DOM/SVG 渲染、品牌笔画、真实加载衔接、跳过与重播单独实现。开场文字使用已随项目分发的 MiSans；未复制 BootLettering、Novecento 或原片音频。新增来源哈希记录于 docs/SOURCE-MANIFEST.json。
