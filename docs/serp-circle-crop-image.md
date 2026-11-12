# SERP research: circle crop image

- 市场 / 语言：US，English；日期 2026-11-12
- 来源：maintainer 的 Keyword Planner + Semrush 截图（2026-11-11）；Google autocomplete（hl=en, gl=us）；Google SERP（banjo-003 Chrome，pws=0）；前排页面 HTML 抓取（字数、H2）；RDAP 注册日期。

## 结论

- **意图：交易型工具意图**（直接要能用的在线工具），夹带 how-to（Canva / PowerPoint / Photoshop / iPhone / Word 里怎么裁圆）。Semrush 标 Informational，但 SERP 前排全是工具页。
- **量：** US 2.9K，全球 12.8K，KD 39，竞争密度 0.01；Semrush 趋势近几个月上升。同义长尾（crop image into circle 1.3K、crop circle image 1.3K、crop image circle 880、crop image in circle 720 等）合计约 20K，全部同一意图 → 一页覆盖。
- **竞争：** 大站只有 Canva、Adobe Express、PhotoAiD；其余是精确匹配域名小站，**多数很新**：roundcut.app 2026-05、circlecropphoto.com 2025-07、circlecropimage.com 2023-04。新站能排进前十 → 不是"老站垄断"的需求。
- **AI Overview** 列两个浏览器工具 + Canva/Adobe，并反问是不是要找真实的麦田怪圈（crop circle）——页面要在首屏明确是"把图片裁成圆形"。

## 修饰词（autocomplete）

| 簇 | 词 |
|---|---|
| 免费 / 在线 | circle crop image online, free, online free, tool, app |
| 边框 / 背景 | with border, with border online, with white background, with black background, no background, transparent background |
| 质量 | without losing quality |
| 用途 | for whatsapp dp, for pfp, for logo, profile picture |
| 软件内做法 | canva, powerpoint, photoshop, word, google slides, google docs, illustrator, iphone, snipping tool |

PAA：How do I circle crop an image? / Is there a free tool to crop a photo into a circle? / Can you crop a circle in iPhone photos? / How to crop a circle using a snipping tool?

## 前排页面（2026-11-12）

| # | 页面 | 字数 | 结构要点 |
|---|---|---|---|
| 1 | crop-circle.imageonline.co | ~1,070 | 4 步、特性卡、用途、5 问 FAQ（透明背景、隐私、水印、格式） |
| 2 | circlecropimage.com | ~880 | 3 步、pfp/logo/sticker、FAQ |
| 3 | canva.com | — | 设计工具里的圆形框 |
| 4 | roundcut.app | ~2,140 | 透明 PNG 或纯色背景、输出尺寸、Discord/LinkedIn/Instagram 头像、5 问 FAQ |
| 5 | adobe.com/express | — | Crop & Shape |
| 6 | photoaid.com | — | 圆形裁剪 |
| 8 | circlecropphoto.com | ~705 | 多种样式、纯色圆、用途、技巧 |

## 功能需求（排名工具提供的）

- 拖动 + 缩放定位圆（全部都有）
- 透明 PNG 输出；可选白 / 黑 / 自定义纯色背景（roundcut、autocomplete）
- **边框**：颜色 + 粗细（autocomplete "with border" 多条）
- 输出尺寸说明 / 可选（roundcut）
- PNG / JPG / WebP；本地处理不上传；无水印、无注册
- 头像用途：WhatsApp DP、Discord、Instagram、LinkedIn

## Pixfy 现有代码（../pixfy/components/free-tools/circle-crop）

有：拖动、缩放滑块、实时预览、PNG/JPEG/WebP、JPEG 质量、10MB 上限、本地 canvas。
缺：输出边框、背景色选择、输出尺寸选择；UI 是 Pixfy 深色样式，要按 Ordalin token 重做外壳。

## 内容机会（别人没写好的）

- 在 Canva / PowerPoint / Google Slides / Word / iPhone 里怎么裁圆：大量 autocomplete，但前排工具页基本不写。用一个短的 "Other ways" 段落各给一两步（事实需核对）。
- 各平台头像尺寸与"会不会被平台再裁一次"（WhatsApp、Discord、Instagram、LinkedIn 都显示成圆，上传方图即可；透明角在部分平台会变黑/白）——要核实后再写。
