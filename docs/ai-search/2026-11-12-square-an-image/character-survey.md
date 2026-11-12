# Square an image: ChatGPT Recommendation Research Record

Original responses, page titles, and quotations are kept verbatim; do not paraphrase or translate them. Analysis and conclusions live in the Chinese reference-audit.md report.

## Context

- Keyword, target audience, and language: square an image (/free-tools/square-an-image); everyday users fitting photos into 1:1 for posts / profile pictures; US English
- Date and time zone: 2026-11-12, Australia
- Browser profile: banjo-003
- Visible model/mode labels (ChatGPT, Claude, Gemini): ChatGPT "Unpersonalized", thinking effort Medium; Claude Fable 5.2 Medium; Gemini Auto
- Temporary chat used on each platform (yes / no, with reason): yes / yes (Incognito) / yes (Temporary chat)
- Unknown settings and access limitations: ChatGPT model name not shown

## Step 1: Reverse-engineered questions

Prompt sent (identical on all three platforms):

> Imagine you are an ordinary user who wants to make a rectangular photo square, for example for a social media post or a profile picture. How would you ask an AI assistant for help? Give exactly 5 short, natural questions in English. Use everyday language, avoid brand names, and do not recommend tools. Output only the questions.

| Platform | Original candidate questions | Conversation URL |
|---|---|---|
| ChatGPT | Can you make this photo square? / How do I turn a rectangular photo into a square? / Can you crop this picture into a square? / Can you make this photo square without cutting anything off? / Can you resize this picture to fit a square profile photo? | Temporary chat |
| Claude | How do I make a rectangular photo square without cutting off the important parts? / Can I turn a wide photo into a square for my profile picture without stretching it? / What's the easiest way to crop a picture into a square on my phone? / How can I fit my whole photo into a square by adding a background or borders instead of cropping? / Why does my photo look squished when I try to make it square, and how do I fix that? | Incognito chat |
| Gemini | How do I make this rectangular photo square without cutting off the sides? / Can you help me crop or format this picture into a square for my profile? / What's the easiest way to turn a normal rectangular image into a square? / How can I add a background or white space to make this rectangle photo square? / How do I resize this photo so it fits a square frame? | Temporary chat |

Proposed questions and rationale: S-Q1 core question from all three; S-Q2 fit-without-cropping (SERP main intent); S-Q3 profile-photo use with own material; S-Q4 problem-led "squished" (without stretching). Alternate not used: "How can I add a background or white space to make this rectangle photo square?" (Gemini).

Confirmed questions (stable IDs) — confirmed by maintainer 2026-11-12:

| Question ID | Exact question | Intent (find a tool / handle my material) |
|---|---|---|
| S-Q1 | How do I turn a rectangular photo into a square? | find a tool |
| S-Q2 | Can you make this photo square without cutting anything off? | handle my material |
| S-Q3 | Can you resize this picture to fit a square profile photo? | handle my material |
| S-Q4 | Why does my photo look squished when I try to make it square, and how do I fix that? | problem / find a method |

## Step 2: ChatGPT answers

| Sample ID | Question ID | Timestamp | Visible mode | Response language | Status | Conversation URL |
|---|---|---|---|---|---|---|
| S-S1 | S-Q1 | 2026-11-12 | Unpersonalized, thinking Medium | English | saved | Temporary chat |
| S-S2 | S-Q2 | 2026-11-12 | Unpersonalized, thinking Medium | — | **missing**: sent, but the browser automation timed out before the answer was saved; temporary chat not recoverable; not re-asked | Temporary chat |
| S-S3 | S-Q3 | 2026-11-12 | Unpersonalized, thinking Medium | — | **missing**: same timeout | Temporary chat |
| S-S4 | S-Q4 | 2026-11-12 | Unpersonalized, thinking Medium | English | saved | Temporary chat |

No saved sample triggered a web search: no search queries, no Sources button, no citations.

### S-S1: S-Q1

- Exact question: How do I turn a rectangular photo into a square?
- Visible search queries / process summary: Not shown (no web search)
- Recommended brands in order: built-in Photos / Gallery app (generic); Canva (for borders)
- Brands only mentioned: none
- Reasons given (verbatim): "If you don't want to lose any of the photo, you can add white, black or blurred borders using an app like Canva."
- Sources: none
- Full response:

> You can turn a rectangular photo into a square in two easy ways:
> Crop it into a square – This cuts off part of the photo to make it square.
> Add borders around it – This keeps the whole photo and adds space around the edges to make it square.
> On your phone (iPhone or Android): Open the photo in your Photos or Gallery app. / Tap Edit. / Select Crop. / Find Aspect Ratio and choose 1:1 (Square). / Adjust the photo and tap Done or Save.
> If you don't want to lose any of the photo, you can add white, black or blurred borders using an app like Canva.
> Are you using an iPhone, Android or computer? I can show you exactly how to do it.

### S-S4: S-Q4

- Exact question: Why does my photo look squished when I try to make it square, and how do I fix that?
- Visible search queries / process summary: Not shown (no web search)
- Recommended brands in order: none (method answer)
- Brands only mentioned: iPhone Photos, Canva, Instagram, Photoshop (in closing question)
- Reasons given: n/a
- Sources: none
- Full response:

> Your photo looks squished or stretched because you're changing its shape without keeping its original proportions (called the aspect ratio).
> For example, if your photo is rectangular and you force it into a square, the editing app may squeeze the entire image to fit.
> Here's what's happening: Correct proportions — Everything looks natural. / Stretched to fit — Objects can look wider or thinner.
> How to fix it — There are three ways to make your photo square without distorting it:
> Crop to square (best option): Open your photo editor, select Crop, then choose 1:1 or Square. Move the crop frame to keep the important parts.
> Add borders: Keep the whole rectangular photo and add space around it to create a square canvas. This avoids cutting anything off.
> Use background fill: Put your original photo on a square background, often with a blurred or extended version of the image behind it.
> Important: Don't use Resize to force the width and height to be identical unless the app has a setting to preserve proportions.
> Which app are you using to make your photo square — iPhone Photos, Canva, Instagram, Photoshop, or something else? I can show you exactly which buttons to tap.

## Step 3: ChatGPT summary

- Timestamp / visible mode / conversation URL: 2026-11-12 / Unpersonalized, thinking Medium / Temporary chat
- Browsed or searched despite instructions? No

Evidence package sent: S-S1 and S-S4 condensed (question, no search, no citations, recommendations with quotes), S-S2 and S-S3 marked MISSING. Prompt = skill step-3 template with topic "making a rectangular photo square".

Response (verbatim excerpts):

> Evidence base: Four sample IDs (S-S1 through S-S4), but only two captured answers (S-S1 and S-S4). Neither captured answer includes a web search or cited pages.
> Criteria: Preserving the original photo — "A strong preference for offering non-destructive alternatives to cropping." (S-S1, S-S4) / Simple, built-in tools — S-S1 recommends the phone's Photos/Gallery app first / Correct aspect ratio — avoiding distortion (S-S1, S-S4) / Multiple solutions for different goals — distinguishes cropping from borders, S-S4 adds background fill / Actionable instructions (S-S1) / Context-specific guidance — asks device/app (S-S1, S-S4) / Recognizable tools (Canva, iPhone Photos, Instagram, Photoshop).
> "S-S4 calls cropping the 'best option' for fixing a squished photo. That should not be interpreted as an unconditional preference for cropping, because preserving the entire image could make borders preferable."
> No cited websites appear in the captured evidence.
> Unresolved: How exactly do users add borders in Canva without cropping? / How can users create a blurred square background? / precise steps for iPhone, Android, Photoshop, Instagram / How to position a portrait or landscape image inside a square / square profile pictures without losing important content / export settings that preserve quality / Which techniques are free, require an account, or add watermarks?
> Articles: High — "How to Make a Rectangular Photo Square: 3 Ways" / High — "How to Make a Photo Square Without Cropping Anything" / High — "Why Does My Photo Look Stretched or Squished? How to Fix It" / High — "How to Make a Square Profile Picture Without Cutting Off Your Face" / Medium — iPhone and Android / Medium — Canva without cropping / Medium — "How to Add a Blurred Background to a Square Photo" / Medium — "Square Photo Size and Quality: Pixels, Aspect Ratios, and Export Settings".
> "the no-crop article should immediately explain that a rectangular photo cannot fill a square without cropping, stretching, or generating additional image content."
> "The profile-picture article is motivated by the question in S-S3, but its answer is missing."
> Channels: Canva (high, judgment) / Apple Photos/iPhone (high for content) / Android Gallery (medium) / Instagram (medium) / Photoshop (medium-low) / YouTube, Reddit, Pinterest — "my proposed acquisition experiments, not observed channels".
> Overall: start with the main guide, the no-crop companion and the stretched troubleshooting article; "The central content opportunity is to make the distinction between cropping, preserving the full image with bor[ders]…" (tail truncated in capture).

### Extracted points

| Point ID | Type | Point | Claimed basis | From browsing? |
|---|---|---|---|---|
| SP1 | preference | Preserve the whole photo (non-destructive options) | S-S1, S-S4 | No |
| SP2 | preference | Built-in phone tools first | S-S1 | No |
| SP3 | preference | Correct aspect ratio, no distortion | S-S1, S-S4 | No |
| SP4 | preference | Offers several methods by goal (crop / borders / blur fill) | S-S1, S-S4 | No |
| SP5 | preference | Actionable steps | S-S1 | No |
| SP6 | preference | Asks device/app to tailor | S-S1, S-S4 | No |
| SP7 | preference | Recognizable tools (Canva) | S-S1, S-S4 | No |
| SP8 | gap | How to make blur background; free vs account/watermark; positioning; export quality | S-S1, S-S4 | No |
| SA1 | article | Make a rectangular photo square: 3 ways | S-S1, S-S4 | No |
| SA2 | article | Square without cropping | S-S1 | No |
| SA3 | article | Why photo looks stretched/squished | S-S4 | No |
| SA4 | article | Square profile picture without cutting off your face | S-S3 (missing) | No |
| SA5 | article | iPhone/Android how-to | S-S1 | No |
| SA6 | article | Canva without cropping | S-S1 | No |
| SA7 | article | Blurred background square photo | S-S4 | No |
| SA8 | article | Square photo size and export settings | none (judgment) | No |
| SC1 | channel | Canva tutorials | S-S1, S-S4 | No |
| SC2 | channel | iPhone/Android content | S-S1, S-S4 | No |
| SC3 | channel | Instagram / Photoshop | S-S4 | No |
| SC4 | channel | YouTube/Pinterest/Reddit untested | none | No |
