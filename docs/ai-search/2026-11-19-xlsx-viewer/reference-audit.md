# xlsx viewer：ChatGPT 推荐偏好与行动建议

- 关键词与确认问题：`xlsx viewer`（US，英语）。Q1 "How can I open an .xlsx file without Excel?"；Q2 "Is there a free way to view an .xlsx file without installing anything?"；Q3 "Someone sent me a spreadsheet file and I can’t open it. What should I do?"；Q4 "I just need to look at what’s inside an .xlsx file, not edit it. What’s the easiest way?"
- 采样日期：2026-11-19（ChatGPT 临时对话，Unpersonalized，thinking Medium）
- 有效样本数／确认问题数：4／4
- 采样记录：[character-survey.md](character-survey.md)

## 结论摘要

- ChatGPT 对这类问题**完全不联网**，4 题都凭记忆推荐大牌：Google Sheets、Excel 网页版、LibreOffice Calc、Apple Numbers（Zoho Sheet 出现 1 次）。没有引用任何文章或小工具站，所以短期内靠“写文章被引用”进入这类回答不现实；这个页面的流量主要来自 Google 搜索（SERP 调研已确认头部弱）。
- 它推荐的每个方案都有一个代价：Google／Microsoft／Zoho 要登录并上传，LibreOffice 要安装，Numbers 只限苹果设备。它自己也承认这个缺口：Q2 里写 "Don't want to create an account?"，然后推荐把文件传给 ChatGPT；同一题还提醒 "avoid uploading it to unfamiliar online file viewers"。
- **空位**：不登录、不上传、不安装、只看不改、格式尽量接近 Excel。ChatGPT 的四个理由轴（免费、免安装、隐私、格式保真）里，没有一个被推荐的方案能同时满足。新工具要同时做到这四点，并且让“不上传”可以被用户自己验证（陌生站点正是它警告的对象）。
- 最优先：(1) 本地渲染 + 页面上可验证的“不上传”说明；(2) 打不开时给出明确诊断（真实格式、加密、损坏），对应 Q3；(3) 打开后先给工作簿概览（工作表名、行列数、隐藏内容），对应 Q4 里 ChatGPT 自己承诺的内容。

## 偏好画像

| 偏好 | 类型 | 依据样本或页面 | 出现问题数／总问题数 | ChatGPT 总结是否提到 |
|---|---|---|---|---|
| 默认推荐熟悉的大牌（Google Sheets 4 题、Microsoft Excel 系 4 题、LibreOffice 2 题、Numbers 2 题、Zoho 1 题） | 推荐标准 | S1–S4 | 4／4 | 是（P9、P10） |
| 免费 | 推荐标准 | S1、S2、S4（"free" 标注） | 3／4 | 是（P1） |
| 免安装、浏览器内完成 | 推荐标准 | S1（"easiest online"）、S2、S4（"No Excel installation needed"） | 3／4 | 是（P2） |
| 格式保真时首选 Microsoft 自家产品 | 推荐标准 | S1（"Want to preserve Excel formatting"）、S2（"as close as possible to the original"）、S3（"Best for Excel files"） | 3／4 | 是（P4） |
| 隐私：不想上传就用离线方案；敏感文件不要传给不熟悉的在线查看器 | 推荐标准 | S1、S2 | 2／4 | 是（P5） |
| 按设备给方案，并反问用户用什么设备 | 推荐标准 | S1、S3 | 2／4 | 是（P6） |
| 把“上传给 ChatGPT”当作备选，Q4 直接作为首选推荐 | 推荐标准 | S1–S4 | 4／4 | 是（P8） |
| 打不开时先判断文件类型、是否损坏或有密码 | 推荐标准 | S3 | 1／4（单例） | 是（P7） |
| 只看不改：强调原文件不被修改 | 推荐标准 | S4 | 1／4（单例） | 是（P14） |
| 只给官方产品链接，不搜索、不引用文章 | 页面类型／站点 | S1–S4 | 4／4 | 是（P10） |
| 免登录查看没有被回答（列出的浏览器方案都要账号） | 缺口 | S1、S2 | 2／4 | 是（P11） |
| 格式、图表、公式到底显示成什么样，只有断言没有证据 | 缺口 | S1、S2 | 2／4 | 是（P12） |

标题与结构的共同点：无法判断（没有任何被引用页面）。

## 推荐结果一览

| 问题 ID | 推荐品牌（按顺序） | 主要理由 | 正文直接引用的页面 |
|---|---|---|---|
| Q1 | Google Sheets → LibreOffice Calc → Excel for the web → Apple Numbers；另提 ChatGPT 上传 | 最容易的在线方式／最好的离线方式／保留 Excel 格式／苹果设备 | 无（仅品牌链接） |
| Q2 | Excel Online → Google Sheets → Zoho Sheet；另提 ChatGPT 上传（免账号） | 格式最接近原文件；提醒敏感文件别传陌生查看器 | 无（仅品牌链接） |
| Q3 | Microsoft Excel → Google Sheets → Apple Numbers；另提 ChatGPT 上传检查 | 先看扩展名，再换应用，再看报错（损坏／不支持／密码） | 无 |
| Q4 | Microsoft Excel → Google Sheets → LibreOffice Calc → ChatGPT 上传（最终推荐） | "quick look"；显示工作表名、表格、行列；原文件不变 | 无（仅 Google Drive 品牌链接） |

## 关键页面快速核查

4 个样本都没有搜索和引用页面，没有可核查的被引用页。排名页面的实测（字数、功能、限制）已在 [serp-xlsx-viewer.md](../../serp-xlsx-viewer.md) 中完成，这里不重复。

## ChatGPT 总结核对

| Point ID | 内容 | 结论 | 依据或缺失 |
|---|---|---|---|
| P1 | 看重免费 | 有样本支撑 | S1、S2、S4 明确标 free；S3 没提价格 |
| P2 | 看重免安装 | 有样本支撑 | S1、S2、S4 |
| P3 | 看重简单快速 | 有样本支撑 | S1 "easiest online"，S4 "quick look" |
| P4 | 格式保真选 Microsoft | 有样本支撑 | S1、S2、S3 原文 |
| P5 | 隐私与离线 | 有样本支撑 | S1 表格行、S2 警告句 |
| P6 | 设备适配 | 有样本支撑 | S1、S3 结尾反问设备 |
| P7 | 排障思路 | 有样本支撑（单例） | 仅 S3 |
| P8 | 反复推荐上传给 ChatGPT | 有样本支撑 | S1–S4 均有，S4 为最终推荐 |
| P9 | 顺序随任务变化 | 部分支撑 | 4 题顺序确实不同，但每题只有 1 个样本 |
| P10 | 只链接官方产品，无文章引用 | 有样本支撑 | S1–S4 均无搜索 |
| P11 | 免登录是缺口 | 有样本支撑 | S1、S2 的浏览器方案都写了 sign in |
| P12 | 保真度没有证据 | 有样本支撑 | S1、S2 只有断言 |
| P13 | 上传后文件去向未说明 | 部分支撑 | S2 有警告；S1、S4 只是没提 |
| P14 | 只看不改 | 有样本支撑（单例） | S4 |
| P15 | 损坏／加密文件缺少诊断 | 有样本支撑（单例） | S3 只说找发件人 |
| P16 | 大文件没有证据 | 部分支撑 | 样本没提大小，属“未涉及”而非观察到的偏好 |
| P17 | 离线方案未比较 | 部分支撑 | S1、S4 只提 LibreOffice |
| A1–A2 | “不用 Excel 打开 xlsx”“免安装在线查看”教程 | 部分支撑 | 题目来自 Q1、Q2；“会被引用”无支撑（ChatGPT 自己也标为未证实） |
| A3 | 查看器对比 + 测试工作簿 | 无支撑（灵感） | 没有样本引用对比文章；测试工作簿思路可用于我们自己的验收 |
| A4 | 附件打不开排障 | 部分支撑 | 对应 Q3；属另一篇内容，不在本页范围 |
| A5 | 只看不改 | 部分支撑 | 对应 Q4；作为本页一节即可 |
| A6 | 各设备打开方式 | 部分支撑 | S1、S3 反问设备；浏览器工具天然跨设备，写成 FAQ |
| A7 | 上传到在线查看器是否安全 | 部分支撑 | S2 警告句；作为本页隐私一节 |
| A8 | ChatGPT 能否打开 xlsx | 部分支撑 | S1–S4 都自荐；可作为后续 guide 选题，非本页 |
| A9 | 先给答案、步骤、前提、限制、对比表 | 无支撑（灵感） | 纯属其判断 |
| C1 | 大厂生态只是被推荐的产品 | 有样本支撑 | 不构成可用渠道 |
| C2 | 用联网模式重测 | 无支撑（灵感） | 属研究建议 |
| C3 | 邮件／WhatsApp 是文件来源 | 有样本支撑（单例） | S3；用于文案场景，不是渠道 |
| C4 | 搜索、问答社区、Reddit、YouTube、厂商链接 | 无支撑（灵感） | 样本中未出现 |

## 新工具需求清单

可行性都要在第 4 步用真实文件验证；“可复用”一栏只写已在代码里确认存在的部分。

| 偏好标准 | 新工具要做到 | 页面要写清 | 竞品做法 | 可复用的现有能力 | 必做／后做 |
|---|---|---|---|---|---|
| 免费 + 免登录（P1、P11） | 打开页面即可用，无账号、无每日次数 | "No sign-up"，无次数限制 | Google／Microsoft／Zoho 要账号；Jumpshare 每天 2 个；Aspose 反复提示登录 | 免费工具页本身无登录墙（pptx viewer 同模式） | 必做 |
| 免安装（P2） | 浏览器内解析渲染，手机也能用 | 任何设备的浏览器；不需要装应用 | LibreOffice、各应用商店 app 要安装 | pptx viewer 外壳 `src/components/free-tools/pptx-viewer/` | 必做 |
| 隐私，不传陌生站点（P5、P13） | 文件只在本机解析，不发任何上传请求；加载后断网可用（待验证） | 文件不离开设备，并告诉用户怎么自己验证（断网后仍能打开） | ReoGrid、ExcelTool 也是本地；Canva／GroupDocs／Aspose 上传 | pptx viewer 同为本地处理 | 必做 |
| 格式保真（P4、P12） | 单元格样式、合并、数字格式、列宽、冻结窗格；图片；图表待评估 | 逐项列出显示什么、不显示什么；每个文件给“未显示”清单 | ReoGrid／ExcelTool 明说不显示图表；Excel 网页版最接近原样 | `report.ts`（pptx 的未显示清单思路），xlsx 需新写 | 必做（图表：待评估） |
| 只看不改（P14） | 只读；不写回文件；宏不执行 | 原文件不会被修改；`.xlsm` 的宏不会运行 | Excel／Sheets／LibreOffice 都是编辑器，要另开只读模式 | 无需额外能力 | 必做 |
| 快速看里面有什么（P3、S4 原话 "sheet names, tables, rows, and columns"） | 打开后先显示工作簿概览：工作表列表、每表行列范围、隐藏的表／行／列 | 概览截图或说明 | ChatGPT 上传后给文字概览；ExcelTool 只标隐藏行 | 待验证（取决于解析库） | 必做 |
| 打不开时的诊断（P7、P15） | 按文件头识别真实格式；区分加密、损坏、改错扩展名、其他 Office 文件，并给下一步建议 | FAQ：文件打不开怎么办；有密码的文件不能打开（不做破解） | S3 只说“找发件人重发” | `src/lib/free-tools/pptx-viewer/detect.ts` 已有 CFB／EncryptedPackage 识别和错误类型，可照此改写 | 必做 |
| 多种表格格式（S3 列出 .xlsx／.xls／.csv／.ods） | `.xlsx`、`.xlsm`、`.csv`；`.xls`、`.xlsb`、`.ods` 待验证 | 支持的格式清单 | onlinedocumentviewer 支持 7 种；ReoGrid／ExcelTool 本页只 `.xlsx` | 待验证（第 4 步库测试） | `.xlsx／.xlsm／.csv` 必做，其余验证后定 |
| 大文件（P16，部分支撑） | 虚拟滚动；给出实测上限 | 实测过的最大文件和行数 | ExcelTool 50 MB；onlinedocumentviewer 20 MB | 待评估 | 必做（上限数值待测） |
| 设备（P6） | 手机布局可用（横向滚动、表格标签） | FAQ：Mac／iPhone／Android／Chromebook 都能用 | Numbers 只限苹果 | 现有免费工具的移动端布局 | 必做 |

## 行动清单

| 优先级 | 类别 | 行动 | 回应的偏好或缺口 | 依据 |
|---|---|---|---|---|
| 1 | 产品 | 本地渲染的只读查看器：样式／合并／数字格式／冻结窗格、工作表标签、公式栏、未显示清单 | 免登录 + 免上传 + 保真 | P1、P2、P4、P5、P11、P12；SERP 文档 |
| 2 | 产品 | 文件诊断：真实格式、加密、损坏，各自给明确提示 | 排障 | P7、P15（S3） |
| 3 | 产品 | 打开即显示工作簿概览（工作表、行列范围、隐藏内容） | 快速查看 | S4 原话、P3 |
| 4 | 内容 | 页面首屏直接回答“不用 Excel、不登录、不上传就能看”；隐私一节写可验证的方法；FAQ 用 Q1–Q4 的原话 | 免登录缺口、隐私警告 | P5、P11、P13 |
| 5 | 内容 | “显示什么／不显示什么”对照表，用自建测试工作簿实测后填写 | 保真度没有证据 | P12、A3（灵感） |
| 6 | 内容（后做） | 独立 guide 选题：附件表格打不开怎么办；ChatGPT 能否打开 xlsx | Q3 排障、ChatGPT 自荐 | A4、A8（部分支撑） |
| 7 | 渠道 | 本轮不设渠道行动：样本里没有任何可进入的引用来源；依靠 Google 搜索 | — | P10、C1 |

最优先两项的细节：

- **查看器（行动 1）**：页面要回答“不用 Excel 怎么打开”“要不要登录／安装”“文件会不会被上传”“格式会不会变”“能不能编辑（不能，只读）”。需要的真实证据：一个自建测试工作簿（多工作表、公式、合并、条件格式、图片、图表、隐藏行列）的实测结果，和实测过的文件大小上限。限制要写明：公式显示保存的结果、不重算；图表等未显示项按实测列出。
- **文件诊断（行动 2）**：页面要回答“别人发来的表格打不开怎么办”。需要的证据：加密文件、损坏文件、改错扩展名文件各一个的实际提示文案。限制：有密码的文件不能打开，不提供去除密码。

## 局限

- 每题 1 个样本、单一模式（未联网）；ChatGPT 开启搜索时的引用来源没有观察到，“只推荐大牌”只代表未联网时的回答。
- 没有任何被引用页面，标题与结构偏好无法判断。
- 需求清单里的 `.xls／.xlsb／.ods`、图表、大文件上限、断网可用都还没有测试，页面文案只能在第 4 步验证后写。
- Google AI Overview 的做法不同（会列 ExcelTool、Canva、GroupDocs、Aspose，按隐私和渲染内容两个维度比较），见 SERP 文档；它比 ChatGPT 更可能带到小工具站。
