# SERP research: square an image

- 市场 / 语言：US，English；日期 2026-11-12
- 来源：maintainer 的 Keyword Planner + Semrush 截图（2026-11-11）；Google autocomplete（hl=en, gl=us）；Google SERP（banjo-003 Chrome，pws=0）；前排页面 HTML 抓取；RDAP 注册日期。

## 结论

- **意图：工具意图，核心是"不裁剪变方形"（square fit）**，其次才是裁成 1:1。前排 8 个结果几乎都主打 blur / 纯色背景补边 + 裁剪两种模式。
- **量：** US 590，全球 14.6K，KD 24（Easy），竞争密度 0.01。同意图：make an image square 260、square an image online 110、make an image a square 70 等。`square image`、`make image square without cropping` 同意图，一页覆盖。
- **竞争：** 全是精确匹配域名小站，**很新**：squareimage.vip 2026-02、squareimage.run 2026-01、squareyourimage.com 2025-08、square-images.com 2025-07、squaredimage.com 2024-12、squareanimage.com 2023-03。另有 capitalizemytitle.com 工具页。没有大站。
- 前排页面关键词堆得很重（squareimage.vip 1,515 词里 "square" 79 次），我们不跟着堆。

## 修饰词（autocomplete）

| 簇 | 词 |
|---|---|
| 不裁剪 | square image without cropping, make image square without cropping (online), without stretching, without losing quality, square fit |
| 背景 | with blur, with white background, with transparent background, with color, with border |
| 用途 | for instagram, for whatsapp dp, for profile / pfp, for twitch emote, for distrokid（3000×3000 封面）, for drawing |
| 相邻 | square image to circle, square image resizer / converter / maker, square image size / dimensions |

## 前排页面（2026-11-12）

| # | 页面 | 字数 | 结构要点 |
|---|---|---|---|
| 1 | squareanimage.com | ~970 | 3 步、选哪种方法、为什么 1:1、尺寸表、Instagram、PFP、FAQ；子页 square crop / blurred frame / rounded corners / Instagram grid |
| 2 | square-images.com | ~960 | blur / 纯色 / 拉伸 / 手动裁剪四模式、用途、6 问 FAQ |
| 3 | squareimage.vip | ~1,515 | 批量、模式、圆角、自定义尺寸、一堆子工具链接 |
| 4 | squaredimage.com | — | blur、纯色、resize、crop |
| 5 | capitalizemytitle.com | — | 社媒、缩略图、头像 |
| 6 | squareimage.run/square-fit | — | 全图放进 1:1，blur 或纯色补边 |
| 7 | squareyourimage.com | — | blur frame、color fill、crop、resize |

## 功能需求（排名工具提供的）

- **Fit（不裁剪）：** 整图放进方形，补边 = 模糊背景 / 纯色（白、黑、自选）/ 透明
- **Crop：** 1:1 拖动缩放裁剪
- 输出尺寸：原尺寸或常用尺寸（1080、3000 等）
- PNG / JPG / WebP；本地处理；无水印无注册
- 可选：圆角、边距（padding）、批量（squareimage.vip）

## Pixfy 现有代码（../pixfy/components/free-tools/square-crop）

有：方形裁剪、拖动、缩放（缩小后四周透明，JPEG 为白底）、PNG/JPEG/WebP。
缺：**blur 背景、纯色背景选择**（最大的修饰词簇）、输出尺寸；UI 要按 Ordalin token 重做。

## 内容机会

- "选 Fit 还是 Crop"：用一张图说清楚两者结果差别。
- 平台尺寸表（Instagram 1080×1080、DistroKid 3000×3000、Twitch emote 112/56/28 等）——数字上线前逐条核对官方说明。
