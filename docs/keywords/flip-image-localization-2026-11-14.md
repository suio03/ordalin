# Free tools 多语言调研：flip image

- 日期：2026-11-14
- 来源：Semrush 镜像 Keyword Overview / 批量分析（各国数据库，桌面）；Google SERP（banjo-003，pws=0，hl/gl 按市场）。
- 只调研需求，没有翻译、没有写本地化文案。
- 对照（英文）：flip image US 12.1K / 全球 41K，KD 45。

## 各语言主词

| 语言 | 本地说法（主词） | 主库量 | KD | 其他同意图词 | 备注 |
|---|---|---|---|---|---|
| 日语 | 画像 反転 | **8.1K**（JP） | 36 | 写真 反転 3.6K（44）、画像 左右反転 1.6K、画像 反転 サイト 1.0K（17）、写真 左右反転 720、写真 反転 iphone 590（26） | 合计远超其他语言；画像 回転 1.6K 属于 rotate |
| 葡语（巴西） | inverter imagem / espelhar imagem | **1.9K / 1.6K**（BR） | 24 / 36 | espelhar foto 1.3K、espelhar imagem online 1.3K（27）、inverter foto 1.3K、virar imagem 880、inverter imagem online 480（22）、como inverter foto 480、imagem espelhada 390 | 合计约 1 万，仅次于日语；girar imagem 1.6K 属于 rotate |
| 德语 | bild spiegeln | **1.6K**（DE） | **20** | foto spiegeln 590（23）、bild spiegeln online 320（19）、bild umdrehen 210、foto spiegeln iphone 210 | 难度最低；bild drehen 1.6K 属于 rotate |
| 法语 | photo miroir | 1.6K（FR） | 33 | inverser une image 720（31）、effet miroir photo 590、image miroir 590、inverser photo 320、retourner une image 320 | photo miroir 意图混杂（见 SERP） |
| 西语 | voltear imagen / invertir imagen | 880 / 720（MX）；480 / 590（ES） | 29–42 | espejo imagen 320、imagen en espejo 320、efecto espejo foto 210、invertir foto 210–260、invertir imagen online 140（ES） | 量分散在 MX、ES 两库（及其他拉美国家，未查）；girar imagen 属于 rotate |
| 印尼语 | mirror foto | 880（ID） | 33 | mirror foto online 390（25）、cara mirror foto 390、mirror gambar 170、cara membalik foto 140、flip foto 90 | 本地直接用英文 mirror；putar foto 320 属于 rotate |

## SERP 抽查

- **画像 反転（JP）：** bannerkoubou、imagy、Canva、ResizePixel、Picsart、Adobe、Google Play、Evernote。是翻转工具意图。图片包和相关搜索里混入“色反転”（颜色反相），日语页要在开头说清是左右/上下翻转。PAA 问的是部分翻转、电脑、iPhone、手机做法。
- **invertir imagen（MX）：** Canva「Voltea imágenes」、PineTools「Voltear imagen」、另一个“voltear imagen”工具、Microsoft Support、YouTube 教程。是翻转意图，没有被颜色反相占据。
- **inverter imagem（BR）：** Canva「Inversor de imagens」、「Girar imagem online - Inverter e espelhar」、Word/Photoshop 教程、「Inverter imagem online grátis – Horizontal e Vertical」、Evoto。是翻转意图。
- **photo miroir（FR）：** 前排有 Evoto（自拍修图），结果标题没能确认是翻转工具意图；可能混入“镜子自拍”等意思。按意图未确认处理。

## 判断

- **值得做（按优先级）：**
  1. **日语**：量最大（主词 8.1K），KD 36，而且 ja 已经是现有语言。
  2. **西语、印尼语**：量中等（各约 1–2K 合计），KD 25–42，也都是现有语言，加页成本低。
  3. **德语**：bild spiegeln 1.6K，KD 20，是最容易排上去的一组。de 还不是现有语言，但 11-12 的调研里 square 的德语词干净（KD 6–14）。加上 flip 就有两个工具有需求，满足 docs/i18n/README.md 的“2–3 个工具”门槛，可以考虑开 de。
  4. **葡语（巴西）**：flip 需求第二大（约 1 万合计，KD 22–36）。pt 也还不是现有语言，circle、square 的巴西量偏小（各约 1K 变体）。等 rotate、mirror 做完后再看是否凑够门槛。
- **暂不做：** 法语（主词意图未确认，其余词量小）。
- **和 mirror-image 页的关系：** 在德语（spiegeln）、葡语（espelhar）、印尼语（mirror foto）、西语（espejo）里，“翻转”和“镜像”是同一组词。这些语言的本地化 flip 页应直接覆盖这些 mirror 说法。英文 /free-tools/mirror-image 上线后，这些语言里不要再单独开 mirror 本地页，避免两页抢同一个词。日语的“画像 ミラー 反転”同理。
- **rotate 词：** 各语言的 rotate 词（画像 回転、bild drehen、girar imagem、putar foto）量也不小，留给 rotate 工具，不放进 flip 本地页的标题。
