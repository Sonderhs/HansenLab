# 开场音效来源

打字声来自 RhineLabUI 已使用的三个 38ms 参考短音；PCM 嵌入 src/typing-samples.ts，精确剪切位置、原片哈希及处理参数见 typing-source.json，复现脚本为 scripts/extract-typing-audio.mjs（需自行提供参考视频及 FFmpeg）。原音及衍生片段权利归原作者，不纳入 MIT。未复制整段音轨或视频。

标志、验证、扫描、欢迎与文字出现音效沿用 RhineLabUI src/audio.ts 的 Web Audio 合成参数，位于 src/audio-synthesis.ts，遵循仓库 MIT。后续浏览交互同样使用该合成器的玻璃音与电子提示音，和开场共用开关、音量及音频设备。没有接入循环背景音乐。
