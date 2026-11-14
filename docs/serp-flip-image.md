# SERP research: flip image

- 市场 / 语言：US，English；日期 2026-11-14
- 来源：maintainer 的 Semrush + Keyword Planner 截图（2026-11-14）；Google autocomplete（hl=en, gl=us）；Google SERP（banjo-003 Chrome，pws=0）；前排 10 页 HTML 抓取 + `density.py`；RDAP 注册日期。
- 失败：Canva（Client Challenge）、Adobe Express（Access Denied）抓不到，未测量；SERP 无 People also ask 模块。

## 结论

- **意图：工具意图，匹配。** 前 8 名 7 个是在线翻转工具页 + 1 个 Google Play app。AI Overview 先给定义（水平/垂直翻转 = 镜像），再列在线工具，再讲 Word/PowerPoint/Photoshop 里怎么翻。
- **量：** US 12.1K，全球 41K，KD 45，竞争密度 0.02。`image flip` 5.4K、`flip an image` 1.6K 同意图；GKP 的 flip picture / flip a pic / flip and image 等同一桶（10K–100K），不叠加。
- **竞争：** Canva、Adobe Express、Picsart 三个大站 + PineTools（2016）、imagy.app（2022）、PhotoAid、retoucher.online。**flip-image.com 2026-07-12 注册，已在第 7 位** —— 新的精确匹配站四个月能进前 10，说明内容够好有机会。
- **Twin：** `image flipper`（Canva、Picsart、imagy 标题都用），`flip picture` / `flip photo` 作为自然变体各出现一次。

## 变体测试（top 10 host+path 对比 `flip image`）

| 词 | 共享 / 总数 | 不共享的结果 | 结论 |
|---|---|---|---|
| image flip | 6/8 | imgflip（meme）、bookify | 同意图 |
| flip picture | 6/8 | retoucher.online | 同意图 |
| image flipper | 6/9 | App Store、imageinverter | 同意图（twin） |
| flip image online | 5/9 | 小工具站 | 同意图 |
| flip photo online | 6/9 | 小工具站 | 同意图 |
| photo flipper | 6/8 | App Store | 同意图 |
| flip image horizontally | 6/8 | gifgit、ipvoid | 同意图 |
| mirror flip image | 3/8 | Canva/resizepixel 的 **mirror** 页、true mirror、Reddit | 偏 mirror |
| mirror image / mirror an image / mirror image online | 1/8–1/9 | 各大站单独的 **mirror-image 页**（Canva、Adobe、Picsart、Kapwing、resizepixel）+ D&D 法术 | **不同页**：竞品都单独做 mirror 页 |
| rotate picture online | 0/9 | rotate 工具页（PineTools、Canva、iLoveIMG、Adobe） | 不同意图，单独页 |
| flip image without flipping text | 3/8 | Reddit/Adobe 社区/Facebook 求助、igly 博客 | 痛点，答不了的问题（见下） |

## 修饰词（autocomplete）

| 簇 | 词 |
|---|---|
| 方向 | horizontally, vertically, upside down, left to right |
| 免费/在线 | online, free, free online, online png |
| 质量/痛点 | **without flipping text / without mirroring text**, without losing quality |
| 用途 | for printing（转印/iron-on）, for zoom / teams background, iphone 自拍 |
| 别的软件怎么翻 | in canva (2.4K), in google docs (1.6K+1.0K), photoshop (1.6K), powerpoint, word, iphone, capcut, photopea, illustrator, css |
| 相邻 | image flipper mirror, image flip gif, rotate image online, invert image（另一个意思） |

## 前排页面（2026-11-14）

| # | 页面 | 字数 | H1 | "flip image" 排名 / % |
|---|---|---|---|---|
| 1 | pinetools.com/flip-image | 439 | PineTools.com \| Flip image online | #4，1.1% |
| 2 | canva.com/features/flip-image | 未测 | — | — |
| 3 | Google Play app | — | — | — |
| 4 | picsart.com/flip-image | 1,410 | Flip images for free in seconds | #5，0.4% |
| 5 | adobe.com/express/…/flip | 未测 | — | — |
| 6 | imagy.app/flip-image | 545 | Flip Image Online | #56，0.2% |
| 7 | flip-image.com | 1,325 | Flip a photo or picture online | #3，0.5% |
| 8 | photoaid.com/en/tools/flip | 256 | Free Online Photo Flipper | 0 |
| — | retoucher.online/image-flipper | 1,334 | Flip Image Online | #5，1.3% |
| — | ipvoid.com/flip-image | 1,455 | Flip Image | #7，0.4% |

密度都不高，没人堆词。

## 反复出现的版块和 FAQ

- 版块：3 步用法；水平 vs 垂直（哪种该用哪个）；支持什么；文件不上传；用途（社媒、印刷、设计）。
- FAQ：翻转和旋转的区别；水平和垂直的区别；翻转 = 镜像吗；会不会降质量 / 改尺寸；透明 PNG 还透明吗；能批量吗；会上传吗；收费/水印吗；**怎么把自拍里反的字翻回来**；支持什么格式；动图（imagy）。

## 功能需求（排名工具提供的）

- 水平、垂直、两者；旋转 90°（flip-image.com、pixfy 都有）
- 实时预览；保持原尺寸与原格式（PNG/JPG/WebP），透明保留；"无损"
- 浏览器本地处理、无注册、无水印
- 可选：批量 + ZIP（imagy、flip-image.com）、粘贴截图（flip-image.com）、动图 GIF/WebP（imagy）

**Pixfy 现有代码**（`../pixfy/components/free-tools/flip-image`）：水平/垂直翻转、±90° 旋转、实时预览、PNG/JPEG/WebP 下载、10 MB。缺：批量、粘贴、保持原格式默认、Ordalin UI token、i18n copy 结构（参照 image-shape）。

## 内容机会

- **"翻转 vs 旋转 vs 镜像"** 一张图讲清楚（搜索者混用，rotate/mirror 又各是大词）。
- **自拍反字**：翻转不能只把字翻正而人不动——要说实话（整图翻转后字就正了，但人脸也会反），这是高频求助。
- **用途**：印 T 恤/转印要镜像打印、Zoom/Teams 背景看起来是反的、自拍 un-mirror、设计构图。
- **在其他软件里怎么翻**（Canva、Google Docs、Word/PowerPoint、Photoshop、iPhone）：AI Overview 就是这么组织的。在工具页里给一张简短表，详细教程不在本页展开（one keyword one page，量大的可以单独做 guide）。

## 排除 / 另立页

- `mirror image` 系列：竞品都有单独 mirror 页 → 以后单独做 `/free-tools/mirror-image`（同一工具，不同文案），本页只提一次 "mirror"。
- `rotate picture online`：单独的 rotate 工具页。
- `image flip meme generator`（imgflip）：不同意图。
- `invert image`：颜色反转，不同意图。
