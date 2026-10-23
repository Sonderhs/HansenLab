# 开场音效默认开启

日期：2026-10-23。用户要求将开场加载动画音效改为默认开启；本记录覆盖 BOOT-AUDIO.md 中首次自动静音的历史行为。

- 没有保存偏好时默认开启；本地存储不可用时也使用开启默认。已保存的 `hansen.boot-sound=off` 继续静音，不创建音频设备。
- 正常开场创建共享 AudioContext。浏览器允许自动播放时直接沿现有时间轴输出原音效；若设备初始 suspended，保持等待手势，不启动超时计时、不误报设备故障，也不阻塞动画与加载。
- 开场背景的真实点击或普通键盘输入可解锁并从当前时间点接续，不补播之前的提示音；跳过、目录、静音、重播等控件仍执行各自操作。受限时显示「音效已开启，点击页面播放」与「有声重播」。
- 文章直达和减少动态效果不创建开场音频设备。静音、跳过、后台、进入阅读及自然结束继续停止开场声音；已解锁设备支持后台返回恢复。浏览音效沿用共用开关。

## 验证

- `npm run build` 通过，保留已有 Vite 单包超过 500KB 提示。
- `checks/default-opening-audio.js` 在默认 Chromium 自动播放限制下 12 项通过，实际输出采样非零；单独测试浏览器以 `--autoplay-policy=no-user-gesture-required` 模拟允许自动播放时 11 项通过，验证任何点击前已输出实际音频。这是测试进程参数，不修改用户浏览器设置。
- 同一脚本覆盖未保存偏好、明确静音及刷新、受限等待、点击接续、跳过、正文直达和减少动态效果；策略受限分支另以初始化状态控制复核。
- `checks/boot-audio.js` 24 项、`checks/interface-audio.js` 22 项、`checks/boot-audio-production.js` 9 项通过。音频探针使用独立浏览器会话，避免重复注入干扰输出采样。
- `checks/boot.js` 22 项、`checks/loading.js` 11 项通过，确认开场时间轴与真实资源加载不受影响。
- 后台暂停计数改为在派发 visibilitychange 的同一浏览器调用中记录，避免测试自身跨帧采样竞态。

浏览器策略参考：[Chrome Autoplay policy](https://developer.chrome.com/blog/autoplay)。首次访问是否允许无操作有声仍由浏览器决定；iPhone / Safari 实机尚未验收。
