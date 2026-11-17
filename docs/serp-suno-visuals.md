# SERP research: suno visuals

- 市场 / 语言：US，English；日期 2026-11-18（Suno 11-17 发布后约 6–24 小时）
- 来源：Google autocomplete（hl=en, gl=us，14 个种子）；Google SERP（banjo-003 Chrome，pws=0）：`suno visuals`、`suno music video`；官方页 suno.com/blog/introducing-visuals、suno.com/visuals、suno.com/pricing、help.suno.com/en/articles/14617153；排名页 density（scripts/density.py）。
- 没做 / 失败：Google Trends（词才出现 1 天，Trends 没有可比数据）；suno.com/pricing/visuals 的额度包价格是 JS 加载，curl 拿不到；Billboard 走 tollbit 付费墙，未读正文；Semrush 未用。

## 结论

- **意图：信息型（是什么 / 怎么用 / 多少钱），没有工具页可做。** SERP 被官方页（blog、/visuals、@visuals 账号）、新闻（Billboard、Bloomberg、MBW、Unite.AI）、YouTube 教程（官方 11:39 教程、AI Creatives Connect "BUT…"）和 Reddit 占据。第三方解释页只有 Mubert 一篇（"What We Know"，2,256 词）。
- **AI Overview** 按「功能 → 价格与获取方式」两段回答，最后反问：要做完整 MV 还是短视频？想看额度成本还是提示词技巧？这两个反问就是还没被满足的子需求。
- **PAA：** Can Suno turn your song into a video? / What are song visuals? / What model is Suno based on? / Do any big artists use Suno?
- **Twin：** 不存在。`suno visual` 的联想词全是 `suno visuals`，另有 `suno music visualizer`、`suno audio visualizer`（visualizer 是另一个需求：音频波形可视化）。
- **相邻词（意图不同，不在本页抢）：** `suno music video`（联想词多：generator / maker / app / free / reddit），SERP 首位是第三方 MV 生成器 suno.bi、freebeat.ai，加上教程和 Reddit「求推荐 MV 生成器」帖。也就是「给 Suno 歌做 MV 的工具」，偏工具和榜单意图，适合以后做 best/listicle 页，不该塞进 Visuals 解释页。
- **可以在页内覆盖的同意图修饰词：** `suno lyric video`（`can suno make lyric videos`、`does suno make lyric videos`）、`suno album art`（还有 size / dimensions，不一定能回答）、`suno video app`、`how to make a music video with suno`、`suno platinum plan`。
- **新鲜度：** 官方 YouTube 教程 6 小时前，Reddit 讨论帖 2 小时前（"There's also a new pay tier!"）。官方 Instagram 送免费额度（限前 3000 人）。

## 官方已核实事实（2026-11-18）

| 事实 | 值 | 来源 |
|---|---|---|
| 发布 | 2026-11-17，作者 Jack Brody（CPO） | blog |
| 平台 | blog 写「today on web, iOS, and Android」；TNW 和 AI Overview 写移动端「未来几周」 | blog vs TNW，矛盾，页面上写「web；官方称 iOS/Android 同步」，待复核 |
| 产出 | 歌词视频（跟拍子、可改字体和颜色）、专辑封面（图片）、视频片段、照片转视频、对口型 | blog、/visuals |
| 片段时长 | 最长 15 秒；可在时间线上延长、编辑、用文字重新提示 | blog、/visuals |
| 起点 | 从曲库拖歌到 Visuals 标签页；用官方原创角色（Astronaut、Chrome Diva、Sphere Girl 等 13 个）或上传自己的图 | blog |
| 画幅 | 可选时长和画幅比例 | /visuals |
| 质量 | Fast / Standard 两档，Fast 更省额度 | /visuals FAQ |
| 模型 | H3 Move，基于 MiniMax H3，Suno 自己优化并加了保护 | /visuals FAQ |
| 额度 | Visual credits 和 song credits 分开；花费按时长和质量算；未公布单价 | /visuals FAQ |
| 获取方式 | 限时：Pro、Premier 订阅者有少量 Visual credits 试用；任何用户都能买额度包（suno.com/pricing/visuals），买的额度不过期 | /visuals FAQ |
| Platinum | $120/月，年付 $100/月（$1,200/年）；每月 15,000 song credits + 20,000 visual credits + 120 次下载；仅网页可买 | /pricing、help center |
| 其他档 | Pro $10（年付 $8），Premier $30（年付 $24），两档都不含每月 visual credits | /pricing |
| 防护 | 文字和图像过滤，拦截特定艺人、公众人物、版权作品和 IP；「别的视频平台能用的提示词在 Suno 可能不行」；生成后先审核再展示；分享到站外前嵌入水印；首次上传时提醒确认版权 | blog |
| 音频版权检测 | Audible Magic、ACRCloud、Musixmatch | blog |
| API | 未公布 | 官方页里没有 |

未核实：额度包价格（二手文章写 $14.99 = 2,500 credits ≈ 3 分钟视频，未核实），每秒 / 每张图耗多少额度。

## 排名页测量

| 页 | 词数 | H1 | `suno visuals` |
|---|---|---|---|
| suno.com/blog/introducing-visuals | 880 | Introducing Visuals | 0（"visuals" 1.9%，第 1） |
| suno.com/visuals | 435 | Set your music in motion. | 0（"visuals" 2.5%，第 1） |
| mubert.com（What We Know） | 2,256 | Suno Visuals Launches: … | 20 次，0.9%，2-gram 第 1 |
| alphasignal.ai | 1,082 | Suno Visuals Turns Your AI Songs Into Synchronized 15-Second Video Clips | 0.2% |
| emergent.sh | 1,201 | Suno Launches AI Music Video Generator… | 0.2% |
| musicbusinessworldwide.com | 1,639 | Suno launches AI music video tool built on model from MiniMax… | 0 |

只有 Mubert 一页在写「suno visuals」这个精确词，其余是新闻稿式写法。

## 空位（新页能多给的）

1. **把价格算清楚：** 哪一档有多少 visual credits、试用额度、Fast 和 Standard 的区别，配上实测「15 秒片段耗多少额度」。目前没有任何页面给出这个数（需要有账号实测，或等官方公布）。
2. **怎么做一支完整 MV：** 15 秒片段 → 延长 → 拼接，按步骤写，对应 AI Overview 的反问和 `how to make a music video with suno`。
3. **限制写诚实：** 艺人和 IP 过滤、水印、没有 API、模型背景（MiniMax H3 和 Disney 诉讼）。
4. **和第三方 MV 工具比：** Neural Frames、freebeat、PixVerse MV 等（Reddit 和 YouTube 常见），给想要更长 MV、不想加订阅的人另一条路。只做类别级对比，不写成榜单。

## Ordalin 现有相关页

/tools/suno、/tools/minimax-h3、/alternatives/suno、/compare/suno-vs-udio、/compare/ace-music-vs-suno、/best/ai-music-generators、/guides/suno-mcp。都还没有提到 Visuals。
