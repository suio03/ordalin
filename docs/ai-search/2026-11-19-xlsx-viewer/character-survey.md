# xlsx viewer: ChatGPT Recommendation Research Record

Original responses, page titles, and quotations are kept verbatim; do not paraphrase or translate them. Analysis and conclusions live in the Chinese reference-audit.md report.

## Context

- Keyword, target audience, and language: `xlsx viewer` (twin `xlsx reader`); everyday users who received an .xlsx and have no Excel; English
- Date and time zone: 2026-11-19, Australia/Melbourne
- Browser profile: banjo-003
- Visible model/mode labels: ChatGPT "Unpersonalized", thinking effort Medium; Claude "Fable 5.2 Medium", Auto; Gemini "Auto"
- Temporary chat used on each platform: yes (ChatGPT Temporary chat, Claude Incognito, Gemini Temporary chat)
- Unknown settings and access limitations: none so far

## Step 1: Reverse-engineered questions

Prompt sent (identical on all three platforms):

> Imagine you are an ordinary user who wants to open and view an Excel spreadsheet (.xlsx) file but does not have Excel installed. How would you ask an AI assistant for help? Give exactly 5 short, natural questions in English. Use everyday language, avoid brand names, and do not recommend tools. Output only the questions.

| Platform | Original candidate questions | Conversation URL |
|---|---|---|
| ChatGPT | 1. How can I open an .xlsx file without Excel? 2. Can I view an Excel spreadsheet without installing anything? 3. Is there a free way to open an .xlsx file? 4. How do I see what's inside an Excel file? 5. Can I open a spreadsheet without having Excel on my computer? | Temporary chat |
| Claude | 1. How can I open an .xlsx file if I don’t have a spreadsheet program on my computer? 2. Someone sent me a spreadsheet file and I can’t open it. What should I do? 3. Is there a free way to view an .xlsx file without installing anything? 4. Can I open a spreadsheet file on my phone? 5. I just need to look at what’s inside an .xlsx file, not edit it. What’s the easiest way? | Incognito |
| Gemini | 1. How can I open a spreadsheet file on my computer without having the main program installed? 2. I have a spreadsheet file I need to look at, but I don't have the software for it—what can I do? 3. Is there a simple way to view a spreadsheet file if I don't have the right app on my device? 4. How do I read a spreadsheet file when I don't have the program it was made with? 5. Can I view a spreadsheet file easily without paying for or installing the usual software? | Temporary chat |

Proposed questions (waiting for owner confirmation, 2026-11-19):

| Question ID | Exact question | Intent (find a tool / handle my material) | Source |
|---|---|---|---|
| Q1 | How can I open an .xlsx file without Excel? | find a tool | ChatGPT 1 |
| Q2 | Is there a free way to view an .xlsx file without installing anything? | find a tool (online, free) | Claude 3 |
| Q3 | Someone sent me a spreadsheet file and I can’t open it. What should I do? | handle my material | Claude 2 |
| Q4 | I just need to look at what’s inside an .xlsx file, not edit it. What’s the easiest way? | handle my material (view only) | Claude 5 |

Confirmed by owner on 2026-11-19 ("好的。"); IDs Q1–Q4 are stable.

## Step 2: ChatGPT answers

| Sample ID | Question ID | Timestamp | Visible mode | Response language | Status | Conversation URL |
|---|---|---|---|---|---|---|
| S1 | Q1 | 2026-11-19 | Unpersonalized, thinking Medium | English | ok, no browsing | Temporary chat |
| S2 | Q2 | 2026-11-19 | Unpersonalized, thinking Medium | English | ok, no browsing | Temporary chat |
| S3 | Q3 | 2026-11-19 | Unpersonalized, thinking Medium | English | ok, no browsing | Temporary chat |
| S4 | Q4 | 2026-11-19 | Unpersonalized, thinking Medium | English | ok, no browsing | Temporary chat |

### S1: Q1

- Exact question: How can I open an .xlsx file without Excel?
- Visible search queries / process summary: Not shown (no web search, no sources panel; links are plain brand links)
- Recommended brands in order: Google Sheets ("easiest online"), LibreOffice Calc ("best offline option"), Microsoft Excel for the web ("free browser version"), Apple Numbers (Mac, iPhone, iPad)
- Brands only mentioned: ChatGPT itself ("You can upload the .xlsx file directly here in ChatGPT")
- Reasons given for each recommendation (verbatim): table "Just want to view the file → Google Sheets / Want to edit it for free → Google Sheets / Don't want to upload it online → LibreOffice Calc / Want to preserve Excel formatting → Excel for the web / Using a Mac or iPhone → Apple Numbers"

| Source ID | Original title | URL | Citation status | Associated passage |
|---|---|---|---|---|
| S1-a | Google Sheets | sheets.google.com (brand link) | Brand link (not a cited source) | option 1 |
| S1-b | libreoffice.org | libreoffice.org (plain text) | Brand mention | option 2 |
| S1-c | excel.cloud.microsoft | excel.cloud.microsoft (plain text) | Brand mention | option 3 |

- Missing evidence: none (no citations to expand)
- Full response:

> You can open an .xlsx file without Microsoft Excel using several free alternatives. An .xlsx file is an Excel spreadsheet, but you don't need Excel to view or edit it.
>
> Best free options
>
> 1. Google Sheets (easiest online): Go to Google Sheets. Sign in with your Google account. Click the folder icon, select Upload, and choose your .xlsx file. You can view, edit, and download it for free.
>
> 2. LibreOffice Calc (best offline option): Download it free from libreoffice.org. Install LibreOffice. Double-click your .xlsx file or open it through LibreOffice Calc. Works on Windows, Mac, and Linux without an internet connection.
>
> 3. Microsoft Excel for the web (free browser version): Go to excel.cloud.microsoft. Sign in with a free Microsoft account. Upload your .xlsx file and open it in your browser.
>
> 4. Apple Numbers (Mac, iPhone, iPad): Open the Numbers app. Select your .xlsx file. Numbers will import the spreadsheet automatically.
>
> Which should you use? (table) Just want to view the file: Google Sheets. Want to edit it for free: Google Sheets. Don't want to upload it online: LibreOffice Calc. Want to preserve Excel formatting: Excel for the web. Using a Mac or iPhone: Apple Numbers.
>
> Another option: You can upload the .xlsx file directly here in ChatGPT. I can help you read its contents, explain the data, or analyse the spreadsheet without Excel.
>
> Are you using Windows, Mac, iPhone, or Android? I can show you the quickest way to open it on your device.

### S2: Q2

- Exact question: Is there a free way to view an .xlsx file without installing anything?
- Visible search queries / process summary: Not shown (no web search, no sources panel; links are plain brand links)
- Recommended brands in order: Microsoft Excel Online ("Best option for Excel files"), Google Sheets, Zoho Sheet
- Brands only mentioned: ChatGPT itself (no-account option)
- Reasons given for each recommendation (verbatim): "Use Excel Online if you want the formatting to look as close as possible to the original Excel file." / "Don't want to create an account? You can also upload the .xlsx file here" / "If the spreadsheet contains sensitive information, avoid uploading it to unfamiliar online file viewers."

| Source ID | Original title | URL | Citation status | Associated passage |
|---|---|---|---|---|
| S2-a | Microsoft Excel Online | brand link | Brand link (not a cited source) | option 1 |
| S2-b | Google Sheets | brand link | Brand link | option 2 |
| S2-c | Zoho Sheet | brand link | Brand link | option 3 |

- Missing evidence: none (no citations to expand)
- Full response:

> Yes! You can view an .xlsx (Excel) file for free in your web browser, without installing anything.
>
> Here are three good options:
>
> 1. Microsoft Excel Online — Best option for Excel files. Sign in with a free Microsoft account and upload your file to view or edit it.
>
> 2. Google Sheets — Upload your .xlsx file using a free Google account. You can view and edit it directly in your browser.
>
> 3. Zoho Sheet — Another free browser-based spreadsheet viewer and editor.
>
> My recommendation: Use Excel Online if you want the formatting to look as close as possible to the original Excel file.
>
> Don't want to create an account? You can also upload the .xlsx file here, and I can help you view its contents, including tables and data, without installing anything.
>
> If the spreadsheet contains sensitive information, avoid uploading it to unfamiliar online file viewers.

### S3: Q3

- Exact question: Someone sent me a spreadsheet file and I can’t open it. What should I do?
- Visible search queries / process summary: Not shown (no web search, no sources panel)
- Recommended brands in order: Microsoft Excel ("Best for Excel files"), Google Sheets, Apple Numbers
- Brands only mentioned: ChatGPT itself ("upload the spreadsheet here, and I can check whether the file is readable")
- Reasons given for each recommendation (verbatim): "Microsoft Excel — Best for Excel files." / "Google Sheets — You can upload the file to Google Sheets." / "Apple Numbers — An option for iPhones, iPads and Macs."

| Source ID | Original title | URL | Citation status | Associated passage |
|---|---|---|---|---|
| — | none | — | no links or citations | — |

- Missing evidence: none (no citations to expand)
- Full response:

> If someone sent you a spreadsheet and you can't open it, there are a few easy things to try. The solution depends on the type of file and what device you're using.
>
> Try these steps first
>
> 1. Check the file type. Look at the end of the filename: .xlsx or .xls — Microsoft Excel spreadsheet; .csv — Can be opened in Excel or Google Sheets; .ods — OpenDocument spreadsheet
>
> 2. Try opening it with another app. Microsoft Excel — Best for Excel files. Google Sheets — You can upload the file to Google Sheets. Apple Numbers — An option for iPhones, iPads and Macs.
>
> 3. Download the file first. If you received it by email, WhatsApp or another messaging app, save it to your device before opening it.
>
> 4. Check for an error message. If it says the file is corrupted, unsupported or password-protected, you may need the sender to resend it or provide a password.
>
> I can help you open it. What device are you using? (buttons: iPhone or iPad / Android phone or tablet / Windows computer / Mac computer / Show me how to open it)
>
> You can also upload the spreadsheet here, and I can check whether the file is readable and help you figure out what's wrong.

### S4: Q4

- Exact question: I just need to look at what’s inside an .xlsx file, not edit it. What’s the easiest way?
- Visible search queries / process summary: Not shown (no web search, no sources panel; one brand link)
- Recommended brands in order: Microsoft Excel, Google Sheets (free), LibreOffice Calc (free), ChatGPT itself ("My recommendation")
- Brands only mentioned: Google Drive (as the upload step for Google Sheets)
- Reasons given for each recommendation (verbatim): "My recommendation: If you just want a quick look, upload it here. I can display its contents in an easy-to-read format, and your original file will remain unchanged."

| Source ID | Original title | URL | Citation status | Associated passage |
|---|---|---|---|---|
| S4-a | Google Drive | brand link | Brand link (not a cited source) | option 2 |

- Missing evidence: none (no citations to expand)
- Full response:

> The easiest way to view an .xlsx file without editing it is to use one of these options:
>
> Microsoft Excel – Open the file and select View → Sheet View, or use File → Info → Protect Workbook → Always Open Read-Only if you want to discourage accidental edits.
>
> Google Sheets (free) – Upload the .xlsx file to Google Drive, then double-click it to view the contents. No Excel installation needed.
>
> LibreOffice Calc (free) – Open the file in Calc and use Edit → Edit Mode to switch to read-only viewing.
>
> Here in ChatGPT – Simply upload the .xlsx file, and I can show you what's inside, including the sheet names, tables, rows, and columns, without modifying the original.
>
> My recommendation: If you just want a quick look, upload it here. I can display its contents in an easy-to-read format, and your original file will remain unchanged.

## Step 3: ChatGPT summary

- Timestamp / visible mode / conversation URL: 2026-11-19 / Unpersonalized, thinking Medium / Temporary chat
- Browsed or searched despite instructions? No

Evidence package sent: the skill's step-3 prompt (topic "opening and viewing Excel spreadsheet (.xlsx) files without Excel"), followed by "EVIDENCE PACKAGE" with S1–S4: question, "Visible search: none", brand links, recommended brands in order, verbatim reasons, and the missing items (no web search, queries, sources panel or cited pages in any sample). No Ordalin information. Sent as one paragraph.

Response (verbatim text; tables flattened to rows with " | "):

> **Analysis: How AI assistants recommend tools for opening Excel files without Excel**
>
> Evidence base: S1–S4, using only the supplied records. No external searches or sources were used.
>
> **Executive summary.** Across the four samples, the assistant appears to favour familiar, free, low-friction tools that solve the user's immediate problem, rather than comprehensive comparisons of spreadsheet software. Three findings are especially important: Recommendations are driven by user circumstances. Whether someone needs to view or edit a file, avoid installation, preserve formatting, work offline, or use a particular device influences which tool is recommended first. There is no evidence of article citations or search-driven discovery. All four samples report no web search. Links point to brands or services, not independently researched articles. A new publisher's opportunity is to answer practical questions more completely. Useful content would provide tested instructions, device-specific troubleshooting, privacy guidance, and evidence about formatting compatibility. Importantly, these records show what the assistant said, not why its underlying system selected particular brands. Recommendations below are hypotheses based on observable behaviour, not established facts about its ranking mechanisms.
>
> **1. Preferences: What does the assistant appear to value? 1.1 Apparent recommendation criteria.** The following criteria are inferred from the wording and ordering of recommendations.
>
> Criterion | Evidence | Interpretation
> - Free access | S1, S2, S4 | Free options are consistently prominent, particularly when the user explicitly asks for one.
> - No installation | S1, S2, S4 | Browser-based options are favoured for quick access, especially in S2.
> - Ease and speed | S1, S4 | The assistant emphasises the easiest way to accomplish a simple task.
> - Excel compatibility | S1, S2, S3 | Microsoft Excel's own tools receive preference when formatting fidelity matters.
> - Privacy and offline access | S1, S2 | LibreOffice is recommended when avoiding uploads; unfamiliar online viewers trigger a privacy warning.
> - Device compatibility | S1, S3 | The assistant distinguishes Windows, Mac, Linux, iPhone, iPad, and Android contexts.
> - Troubleshooting usefulness | S3 | It recognises that the problem may be the file itself, its delivery method, or password protection.
> - Ability to inspect files in ChatGPT | S1–S4 | ChatGPT is repeatedly presented as an alternative, sometimes as the preferred solution.
>
> What the ordering reveals
> - S1 | #1 Google Sheets | General opening without Excel | Google Sheets is described as the easiest online option. LibreOffice comes second for offline use, and Excel for the web third.
> - S2 | #1 Excel Online | Free viewing without installation | Excel Online moves ahead of Google Sheets because the assistant emphasises Excel formatting fidelity.
> - S3 | #1 Microsoft Excel | Unspecified spreadsheet-opening problem | The answer begins with file-type identification and recommends familiar applications rather than assuming a free alternative is required.
> - S4 | #1 Microsoft Excel | View-only task | The initial list starts with Excel, but the final recommendation is to upload the file to ChatGPT. List position and final endorsement do not always agree.
>
> Interpretation: There is no single consistently preferred provider. The assistant appears to select a recommendation based on the task framing, with familiarity, convenience, and compatibility affecting the result. S4 also illustrates a limitation: recommending Excel as the first option for someone asking how to inspect an .xlsx file is less aligned with the broader theme of avoiding Excel. This suggests some recommendations may rely on familiar application-level instructions rather than consistently applying every implied constraint.
>
> **1.2 What kinds of pages and sites does it cite?** The critical distinction is between links, cited sources, and search evidence.
>
> Sample | Visible search | Linked destinations | Cited articles or pages
> - S1 | None | Google Sheets; mentions libreoffice.org and excel.cloud.microsoft in plain text | None
> - S2 | None | Microsoft Excel Online, Google Sheets, Zoho Sheet brand links | None
> - S3 | None | None | None
> - S4 | None | Google Drive brand link | None
>
> The material does not establish that any external page was consulted. What the links have in common: Where links appear, they generally identify: A product or brand: Google Sheets, Zoho Sheet, Microsoft Excel Online. A service used to complete the task: Google Drive. A directly relevant official-looking domain mentioned in text: libreoffice.org, excel.cloud.microsoft. Their common feature is destination relevance, not article structure. There are no visible article titles, publication dates, author names, headings, comparison tables, or citations to supporting research. Consequently, it is not possible to establish whether the assistant prefers listicles, tutorials, product landing pages, independent reviews, or particular SEO heading formats. The narrower supported conclusion is that official products and services are prominent in answers even without visible research or article citations.
>
> **1.3 What questions do the cited pages fail to answer?** Strictly speaking, no cited pages are available to evaluate. The evidence supports identifying gaps in the assistant's answers, not deficiencies in the underlying websites. Those gaps are commercially and editorially useful.
>
> Unanswered or weakly answered question | Samples | Why it matters
> - Can a file be viewed without creating an account? | S1, S2 | Most browser options described require sign-in; ChatGPT is suggested, but access conditions are not established.
> - Which viewer preserves charts, formulas, merged cells, and formatting? | S1, S2 | Compatibility is asserted broadly, with no demonstrations or test results.
> - What happens to a file uploaded to a cloud viewer? | S1, S2, S4 | Privacy concerns are mentioned but storage, retention, permissions, and deletion are not explained.
> - How can I view an .xlsx file on a particular device? | S1, S3 | Devices are named, but operating-system-specific workflows are largely missing.
> - Can I view an .xlsx file without accidentally editing it? | S4 | The answer discusses read-only features without systematically distinguishing view-only access from editing capabilities.
> - How do I fix a corrupted, unsupported, or password-protected file? | S3 | Problems are identified, but there is little detailed diagnosis.
> - Can I view very large or complex workbooks? | S1, S2, S4 | No file-size, performance, or feature-limit evidence is provided.
> - Which options work fully offline? | S1, S4 | LibreOffice is mentioned, but installation requirements and practical limitations are not compared.
> - How do I inspect sheets and data without altering the original? | S4 | The assistant promises this through ChatGPT but does not compare verification methods across tools.
>
> Editorial implication (my judgment): A publisher is unlikely to differentiate itself by merely repeating a list of familiar tools. Better opportunities lie in answering these unresolved questions with concrete instructions and original evidence.
>
> **2. Articles: What should a new website publish?** I would build a small, interconnected resource centre rather than one generic page listing Excel alternatives. The following are proposed editorial assets, not pages observed in the samples.
>
> 1. How to Open an XLSX File Without Excel: 5 Free Methods (Priority 1). Primary intent: S1, with supporting demand patterns in S2 and S4. Questions it must answer: What is an .xlsx file? Can it be opened without Microsoft Excel? Which methods require accounts or installation? Which work on Windows, Mac, Linux, or mobile? Which method is easiest for view-only use? Evidence needed: Tested workflows for Google Sheets, Excel for the web, LibreOffice Calc, Apple Numbers, and any other included tool; screenshots of opening the same test workbook; verified free-access and sign-in conditions; clear compatibility limitations. Why publish: Directly matches the broadest opening question in S1 and provides a central page linking to specialised guides.
>
> 2. How to View XLSX Files Online for Free Without Installing Software (Priority 2). Primary intent: S2. Questions it must answer: Which browser viewers are genuinely free? Which require registration? Can users only view, or also edit? How are files uploaded? Is downloading required afterward? What happens when opening a complex workbook? Evidence needed: Step-by-step browser tests, actual account requirements, free-tier restrictions, screenshots, and a comparison of Google Sheets, Excel for the web, and Zoho Sheet. Why publish: S2 is a tightly defined problem where an article can supply more precise and verifiable answers than the sample response.
>
> 3. Best Free XLSX Viewers Compared: Formatting, Privacy, and Ease of Use. Primary intent: S1, S2, S4. Questions it must answer: Which viewer renders Excel formatting most accurately? Do charts, formulas, conditional formatting, images, and multiple sheets remain usable? Which tools need cloud uploads? Which work offline? Evidence needed: A documented test workbook, actual results for each viewer, side-by-side screenshots, a dated compatibility matrix, and a clear distinction between displaying formulas and recalculating them. Why publish: It replaces unsupported general claims about formatting fidelity with comparative evidence.
>
> 4. Can't Open a Spreadsheet Attachment? Troubleshooting XLSX, XLS, CSV, and ODS Files. Primary intent: S3. Questions it must answer: What file format did I receive? Should I download the attachment first? What causes unsupported-format, corruption, and password prompts? When should I ask the sender to resend the file? Evidence needed: Reproduced error messages, screenshots across common devices, tested recovery steps, and guidance that distinguishes damaged files from incorrectly named files. Why publish: It addresses an immediate troubleshooting problem rather than competing only on software recommendations.
>
> 5. How to View an Excel Spreadsheet Without Editing It. Primary intent: S4. Questions it must answer: What does read-only mean? How can I inspect rows, columns, and sheets without saving changes? What is the difference between a view-only permission and opening an editable document without making changes? How can I preserve the original? Evidence needed: Tested view-only and permission workflows, before-and-after file checks, screen captures, and documented limitations for each tool. Why publish: S4 exposes an especially relevant distinction between viewing a file and changing it.
>
> 6. How to Open XLSX Files on iPhone, Android, Mac, and Windows. Primary intent: S1, S3. Questions it must answer: What should users tap or open on each device? Which built-in or readily available applications can view the file? What changes when it arrives through email or a messaging app? Evidence needed: Device-specific screenshots, tested operating-system workflows, account and installation requirements, and clearly dated testing conditions. Why publish: S1 and S3 both end by asking for the user's device, indicating that device specificity is an important unresolved dimension.
>
> 7. Is It Safe to Upload an XLSX File to an Online Viewer? Primary intent: S2, supporting S1 and S4. Questions it must answer: What information might a workbook contain? Where is an uploaded file stored? Who can access it? Can it be deleted? When should users avoid online viewers and choose an offline tool? Evidence needed: Current provider privacy and retention documentation, product-specific settings, independent verification where practical, and explicit distinctions between documented policies and tested behaviour. Why publish: S2 explicitly warns against unfamiliar online viewers without giving enough evidence for readers to assess them.
>
> 8. Can ChatGPT Open an XLSX File? Capabilities, Limits, and Privacy. Primary intent: S1–S4. Questions it must answer: Can ChatGPT read sheet names, rows, columns, and formulas? Can it reproduce the spreadsheet's visual layout? What happens with complex workbooks? How do upload restrictions, account access, and privacy settings affect use? Evidence needed: Reproducible example files, documented capability and upload limits, comparisons with dedicated viewers, and official documentation for privacy and file handling. Why publish: Every sample presents ChatGPT as an option, yet none rigorously establishes when it is an adequate substitute for a spreadsheet viewer.
>
> **2.1 Recommended publication sequence.** Phase 1: Publish articles 1, 2, and 4. Capture the broad how-to, browser-only, and troubleshooting intents. Phase 2: Publish articles 3, 5, and 6. Add original testing and more precise answers for task-specific needs. Phase 3: Publish articles 7 and 8. Address important trust questions and the AI-based alternative. This sequence is my editorial judgment, based on direct intent matches and the opportunities to produce differentiated evidence. The four samples provide no search-volume, traffic, competition, or conversion data, so these priorities should not be interpreted as measured commercial demand.
>
> **2.2 What every article should include.** The most valuable common structure would be a direct answer near the beginning, followed by a tested procedure, clear prerequisites, limitations, and a comparison of relevant alternatives. For example, the main guide could include a compact comparison:
>
> Tool | Installation | Account | Primary use case
> - Google Sheets | No, browser method | Google account | Easy online viewing and editing
> - Excel for the web | No | Microsoft account | Excel-oriented browser viewing
> - LibreOffice Calc | Yes | No cloud account required | Offline viewing and editing
> - Apple Numbers | Depends on device and setup | Depends on method | Apple-device users
> - Zoho Sheet | No, browser method | Verify by workflow | Alternative online viewing
>
> These are working editorial categories based on the supplied samples, not a newly verified feature matrix. For original evidence, I would create one downloadable test workbook containing several worksheets, formulas, charts, merged cells, conditional formatting, and non-sensitive sample data. Run it through each supported viewer, record the results, and update the article when software behaviour changes. That creates a credible reason for another assistant or website to reference the publisher's comparison rather than simply directing readers to a well-known brand.
>
> **3. Channels: Which off-site channels appear, and which are worth trying?** The evidence contains product destinations, brand links, vendor domains, communication channels, and an AI-assistant channel. It does not contain observed backlinks, referral traffic, publisher placements, or search-engine citations. I distinguish observed channels from my proposed distribution strategy below.
>
> 3.1 Channel assessment: Channel | Evidence | What was observed | Worth trying? — My judgment
> - Google ecosystem (Google Sheets, Google Drive) | S1, S2, S3, S4 | Google Sheets appears repeatedly; Google Drive is directly linked in S4. | High relevance for content explaining Google-based XLSX workflows. A third-party article being cited by the assistant is not demonstrated.
> - Microsoft ecosystem (Excel, Excel Online, Excel for the web) | S1, S2, S3, S4; excel.cloud.microsoft in S1 | Microsoft Excel products appear in every sample and lead the S2 and S4 lists. | High relevance for compatibility and formatting guides; difficult to infer independent publisher-placement opportunities.
> - LibreOffice website and ecosystem | S1, S4; libreoffice.org in S1 | LibreOffice is positioned as the offline alternative. | Worth testing for offline-specific educational content and relevant community resources, subject to their contribution rules.
> - Apple ecosystem (Numbers) | S1, S3 | Apple Numbers is recommended for Apple-device users. | Worth creating device-specific resources, but the samples provide no evidence of third-party placements or traffic opportunities.
> - Zoho Sheet | S2 | Appears as a third free browser option with a brand link. | Secondary priority for a comparison or tutorial; recommendation frequency in this tiny sample is lower.
> - ChatGPT / AI assistant conversations | S1, S2, S3, S4 | The assistant offers its own file-analysis workflow in all four samples. | High priority for testing answer usefulness and whether well-evidenced articles receive citations in separate, search-enabled evaluations.
> - Email attachments | S3 | Email is mentioned as a way spreadsheet files arrive. | Useful topic and user-journey context, not evidence of an acquisition channel.
> - WhatsApp / messaging apps | S3 | WhatsApp and other messaging apps are named as attachment-delivery methods. | Useful for troubleshooting tutorials; no demonstrated distribution or referral value.
>
> 3.2 Additional channels worth testing. These channels do not appear as observed recommendation sources in S1–S4. They are strategic suggestions only. Proposed channel | Evidence behind the idea | My judgment and proposed test
> - Search-engine results | S1–S4 contain no visible search | Publish intent-matched help pages and monitor organic discovery. The samples cannot establish likely rankings.
> - Community Q&A forums | S3's common attachment and error questions | Answer relevant questions with practical guidance and link to a guide only when permitted and useful.
> - Reddit and other discussion communities | S1–S4's recurring user problems | Share genuinely helpful troubleshooting advice and collect recurring questions, respecting community rules.
> - YouTube tutorials | S1, S3, S4's step-by-step and device-specific needs | Test short screen-recorded tutorials for Google Sheets, phone file opening, and read-only viewing.
> - Software documentation or resource links | S1 and S2's repeated official-product recommendations | Consider relevant documentation contributions or partnerships where allowed; do not assume vendors will link to an independent publisher.
>
> No sample supports claiming that a particular community, search engine, video platform, or vendor programme already influences the assistant's recommendations.
>
> 3.3 Channel priorities (My suggested test priorities, not measured performance): Search-oriented help articles 5/5; AI-answer citation evaluation 5/5; Google/Microsoft workflow guides 5/5; Device-specific video tutorials 4/5; Relevant troubleshooting communities 3/5; Vendor resource/link outreach 2/5. These scores represent editorial test priority based on relevance to the observed questions, not predicted traffic, citation likelihood, or ROI.
>
> **4. What the evidence does and does not establish.** The most consequential limitation is that zero of the four samples shows a web search or an article citation. This affects how confidently a publisher can use the findings. Finding | Confidence within these records
> - The assistant repeatedly recommends familiar spreadsheet brands. | High — directly observed in S1–S4.
> - Free, convenient, and compatible solutions are prominent. | High — explicitly supported by the recommendation explanations.
> - User intent changes recommendation ordering. | Moderate — visible across different questions, but based on only four samples.
> - The assistant favours official brands over independent publishers. | Limited — official brands are visible, but no search-based selection was observed.
> - A particular article format is more likely to be cited. | Not established.
> - Publishing the suggested articles will result in AI citations. | Not established.
> - Particular external channels generate meaningful referral traffic. | Not established.
>
> To test actual citation preferences, a future study would need search-enabled answers, the full source URLs and titles, information about which sources supported which claims, and repeated queries under controlled conditions.
>
> **5. Overall recommendation.** For a new website entering this topic, I would pursue three complementary objectives. First, cover the immediate task: explain how to open, view, and troubleshoot .xlsx files quickly, with clear online and offline choices. Second, produce evidence the four answers lack: independently tested formatting compatibility, account requirements, file-handling behaviour, device-specific instructions, and read-only procedures. Third, separate discoverability from recommendation: a website can become a useful cited source by answering questions accurately and transparently, but that is different from having its own product recommended as a top tool. The samples show named products being recommended without any accompanying evidence that an external article influenced the choice. The strongest opportunity is therefore to become a trustworthy reference for the practical questions that generic brand recommendations leave unresolved. That conclusion is supported by the repeated patterns in S1–S4; the proposed articles, publication priorities, and off-site distribution tests are my own judgments rather than observed outcomes.

### Extracted points

| Point ID | Type (preference / article / channel) | Point | Claimed basis (sample IDs / URLs) | From browsing? |
|---|---|---|---|---|
| P1 | preference | Free access is consistently prominent | S1, S2, S4 | No |
| P2 | preference | No installation: browser options favoured for quick access | S1, S2, S4 | No |
| P3 | preference | Ease and speed for a simple task | S1, S4 | No |
| P4 | preference | Excel compatibility: Microsoft's own tools win when formatting fidelity matters | S1, S2, S3 | No |
| P5 | preference | Privacy and offline: LibreOffice when avoiding uploads; unfamiliar online viewers trigger a warning | S1, S2 | No |
| P6 | preference | Device compatibility (Windows, Mac, Linux, iPhone, iPad, Android) | S1, S3 | No |
| P7 | preference | Troubleshooting: the problem may be the file type, delivery, corruption or a password | S3 | No |
| P8 | preference | ChatGPT presents its own file upload as an alternative in every sample, sometimes as the preferred one | S1–S4 | No |
| P9 | preference | Ordering follows the task framing; no single always-first provider | S1–S4 | No |
| P10 | preference | Only official product/brand destinations are linked; no article was cited, so no page-format preference can be established | S1–S4 | No |
| P11 | preference (gap) | No-account viewing is unanswered (browser options named all need sign-in) | S1, S2 | No |
| P12 | preference (gap) | Which viewer keeps charts, formulas, merged cells, formatting: asserted, never shown | S1, S2 | No |
| P13 | preference (gap) | What happens to an uploaded file (storage, retention, deletion) | S1, S2, S4 | No |
| P14 | preference (gap) | View without accidentally editing; original unchanged | S4 | No |
| P15 | preference (gap) | Diagnosis of corrupted / unsupported / password-protected files | S3 | No |
| P16 | preference (gap) | Large or complex workbooks: no size or performance evidence | S1, S2, S4 | No |
| P17 | preference (gap) | Fully offline options not compared | S1, S4 | No |
| A1 | article | How to Open an XLSX File Without Excel: 5 Free Methods | S1 (S2, S4) | No |
| A2 | article | How to View XLSX Files Online for Free Without Installing Software | S2 | No |
| A3 | article | Best Free XLSX Viewers Compared: Formatting, Privacy, and Ease of Use (test workbook, dated matrix) | S1, S2, S4 | No |
| A4 | article | Can't Open a Spreadsheet Attachment? Troubleshooting XLSX, XLS, CSV, and ODS Files | S3 | No |
| A5 | article | How to View an Excel Spreadsheet Without Editing It | S4 | No |
| A6 | article | How to Open XLSX Files on iPhone, Android, Mac, and Windows | S1, S3 | No |
| A7 | article | Is It Safe to Upload an XLSX File to an Online Viewer? | S2 (S1, S4) | No |
| A8 | article | Can ChatGPT Open an XLSX File? Capabilities, Limits, and Privacy | S1–S4 | No |
| A9 | article | Common structure: direct answer first, tested procedure, prerequisites, limits, comparison table; one downloadable test workbook | own judgment | No |
| C1 | channel | Google / Microsoft / LibreOffice / Apple / Zoho ecosystems appear as recommended products, not as placements | S1–S4 | No |
| C2 | channel | AI-assistant answers themselves: re-test with search-enabled runs | S1–S4 | No |
| C3 | channel | Email / WhatsApp are how files arrive (user journey, not acquisition) | S3 | No |
| C4 | channel | Proposed, not observed: search results, community Q&A, Reddit, YouTube tutorials, vendor resource links | own judgment | No |
