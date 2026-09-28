# Phase B.5 task coverage map

Date: 23 August 2026
Last updated: 25 August 2026
Status: five-task validation cohort live
Product source: `MVP_PLAN.md`
Catalogue source: `data/catalog.seed.json`, checked 23 August 2026

## Decision

The 16-tool validation catalogue now supports five high-intent Tasks with three
credible alternatives each. Four tools were added through a deliberately
bounded acquisition pass: Miora, Superflow AI, Lispr, and Vaquill AI. Each one
fills one previously documented coverage gap and adds a distinct selection
reason rather than category volume.

This is enough inventory for the Phase B.5 validation cohort. The controlled
Task model, seed data, index, and decision pages are implemented. Stop general
tool acquisition here and validate the cohort before expanding it.

`Task` remains the internal content and data term. Visitors see **Find by goal**:
they choose what they want to accomplish, match themselves to one of three
plain-language situations, and then inspect the supporting tool details.

## Selection rules

A publishable Task must:

1. describe an action or outcome in the user's language;
2. contain at least three tools that can credibly produce that outcome;
3. give each option a distinct selection reason, not a fictional rank;
4. state pricing model, material limitation, and last-checked source;
5. have unique editorial guidance rather than generated category prose.

The first-screen selection copy must complete `Choose [tool] if …` in direct,
concrete language. It must not require the visitor to interpret labels such as
`Best fit` or `Decision guide` before understanding the choice.

Tools that perform different steps of a larger workflow belong in a Collection.
They do not count as alternatives merely because they share a category or
audience.

## Current tool-to-task map

| Tool | Core job | Best fit | Material boundary | Candidate task |
| --- | --- | --- | --- | --- |
| Zen Whisper | Local dictation and media transcription | Apple Silicon Mac users who want speech recognition at the active cursor | Mac-focused; optional network-backed features are separate from core local recognition | Work with spoken content across languages; later local Mac transcription task |
| Lispr | Cross-app voice dictation with optional translation | macOS and Windows users who want to speak in one language and write in another | Cloud transcription is required; it is not the local/private option | Work with spoken content across languages |
| Playyy | Generate and edit campaign images on a layer-aware canvas | Teams adapting one campaign direction across image formats | Current official page lists image-to-video as coming soon; exports are image formats | Create on-brand campaign visuals |
| Miora | Produce a campaign asset system with an agent, canvas, skills, and memory | Teams carrying one brand direction across image, video, UI, and 3D work | Credit-based broad creative environment; free sign-up credits expire after 90 days | Create on-brand campaign visuals |
| Capptivo | Record and edit polished screen demonstrations | Software demos that need cursor zoom, annotations, captions, and multiple aspect ratios | Records real screen flows; it is not a generative avatar or product-video system | Create a short product video |
| HearSub | Translate YouTube subtitles and generate synchronized dubbing during playback | Watching supported YouTube material across languages without uploading the full video | Browser-extension and YouTube-playback workflow, not a general media editor | Work with spoken content across languages |
| Coldtea | Run coding agents with review, end-to-end QA, and production monitoring | Software teams that want the build-to-monitor loop around existing coding agents | Requires a development project and external agent tooling; not a general-purpose device cloud | Test a web app before release |
| Hey Noah | Coordinate scheduling, meetings, notes, and follow-ups | Executives who want email-led meeting logistics handled for them | Narrow executive-assistant workflow; public pricing remains unverified | Later scheduling and follow-up task |
| AdAnt | Research social-ad formats and batch-generate short-form variants | Social teams starting from a product link, brief, or reference video | Credit-based generation for TikTok, Reels, and Shorts; not a real product screen recorder | Create a short product video |
| Decisity | Turn briefs and documents into source-traceable strategy analysis and decks | Strategy and advisory teams producing board-ready deliverables | Contact-sales enterprise workflow, not a lightweight consumer document chat | Turn documents into source-backed analysis |
| Vaquill AI | Research legal authority and review documents with verified citations | Legal and corporate teams working with contracts, compliance, and case law | Legal-specific workflow with paid plans after a seven-day trial | Turn documents into source-backed analysis |
| Soloop | Propose and execute one approved growth or product move for a solo founder | Founders who already have a product, repo, demo, deck, or landing page | Broad operating workflow; current agents and channels are intentionally narrow | Collection only: focused founder operating stack |
| LumiChats Offline | Run GGUF models and private document chat on Windows | Windows users who need offline chat and local document retrieval without a GPU | Windows 10/11; 8 GB RAM minimum; local models rather than frontier cloud models | Turn documents into source-backed analysis, with a narrower local/private fit |
| TestMu AI | Author and run software tests across browsers and real devices | QA teams needing broad browser, device, framework, and CI coverage | Cloud testing platform; broader and more operational than a local coding workspace | Test a web app before release |
| Superflow AI | Run a reusable review checklist against a live or staging website | Agencies and web teams checking accessibility, copy, links, and metadata before sign-off | Review and evidence workflow; not a real-device matrix or code-level test runner | Test a web app before release |
| Zawa | Generate a brand kit and reusable image, social, and product-video assets | Small businesses that need consistent brand identity across channels | Broad creative suite; exact free and paid usage limits need confirmation | Create a short product video; create on-brand campaign visuals |

## Candidate Tasks

### Validation cohort

#### Create a short product video

- Slug: `create-a-short-product-video`
- Outcome: produce a short video that explains or promotes a product.
- AdAnt: best for generated avatar-led vertical advertising.
- Capptivo: best for a real software screen recording and polished demo.
- Zawa: best for on-brand product, UGC-style, or social video assets.
- Coverage: three verified options; implemented in the Task seed.

These tools reach the same output through materially different production
methods. The page should help the visitor choose the right method; it must not
claim that one tool is universally best.

#### Create on-brand campaign visuals

- Slug: `create-on-brand-campaign-visuals`
- Outcome: produce a consistent set of campaign images and visual assets.
- Playyy: best for hands-on, layer-aware editing of individual campaign images.
- Zawa: best for creating the brand identity and reusing it across marketing
  assets.
- Miora: best for carrying a remembered brand direction across multiple creative
  formats on one canvas.
- Coverage: three verified options; implemented in the Task seed.

#### Test a web app before release

- Slug: `test-a-web-app-before-release`
- Outcome: find release-blocking web issues and keep evidence close to the fix.
- Coldtea: best for teams that want QA inside an agent-led development loop.
- TestMu AI: best for broad browser, framework, and real-device execution.
- Superflow AI: best for focused checklist reviews of live or staging pages.
- Coverage: three verified options; implemented in the Task seed.

#### Work with spoken content across languages

- Slug: `work-with-spoken-content-across-languages`
- Outcome: dictate, transcribe, translate, or understand spoken material across
  languages.
- Zen Whisper: best for local-first Mac dictation and transcription.
- HearSub: best for translated subtitles and dubbing during YouTube playback.
- Lispr: best for cross-app dictation with translation on macOS and Windows.
- Coverage: three verified options; implemented in the Task seed.

#### Turn documents into source-backed analysis

- Slug: `turn-documents-into-source-backed-analysis`
- Outcome: analyse documents while keeping claims traceable to source material.
- Decisity: best for enterprise strategy analysis and board-ready deliverables.
- LumiChats Offline: best for private, local document chat on Windows.
- Vaquill AI: best for legal research, contracts, and authority-linked citations.
- Coverage: three verified options; implemented in the Task seed.

### Later candidates

| Candidate task | Current options | Reason to defer |
| --- | --- | --- |
| Dictate and transcribe locally on a Mac | Zen Whisper | Needs two genuine alternatives; do not dilute it with unrelated local tools |
| Schedule meetings and automate follow-ups | Hey Noah | Needs two alternatives and verified pricing before comparison is useful |

## Keep as Collections

The following are useful editorial workflows but fail the alternative-options
test for Tasks:

- **Keep more work on your device** combines dictation, local model use, screen
  recording, and a local development environment. Privacy is the shared
  selection principle, but the tools do different jobs.
- **A focused founder operating stack** combines scheduling, strategy, coding,
  and demand work. The tools are complementary parts of founder operations.
- **Ship with agent support** remains a broader Collection even though a narrower
  pre-release testing Task is now supported; Soloop and the QA tools do not all
  compete on the same outcome.

## Verified sources and open gaps

- Playyy campaign visuals and image-only export boundary:
  `https://playyy.ai/use-cases/campaign-visual-creation` and
  `https://playyy.ai/`
- Capptivo demo workflow, platforms, and local-first release facts:
  `https://capptivo.com/` and `https://capptivo.com/changelog/`
- Zawa brand kit, campaign, and product-video capabilities:
  `https://zawa.ai/`, `https://zawa.ai/ai-branding-design`, and
  `https://zawa.ai/workspace`
- Coldtea development, QA, and monitoring scope:
  `https://www.coldtea.ai/docs/get-started/overview` and
  `https://www.coldtea.ai/docs/testing/overview`
- TestMu AI browser and real-device testing scope:
  `https://www.testmuai.com/cross-browser-testing/`
- Soloop audience, approval boundary, and current agents:
  `https://www.soloop.io/about`
- LumiChats Offline system requirements and local document chat:
  `https://lumichats.com/docs/offline`
- Zen Whisper local recognition, languages, and Mac boundary:
  `https://www.zenproducts.ai/posts/mac-dictation-that-stays-on-your-mac`
- Hey Noah scheduling and follow-up scope:
  `https://app.heynoah.io/`
- Decisity source traceability and enterprise workflow:
  `https://decisity.com/en/how-it-works`
- Miora brand, canvas, memory, and multimodal workflows:
  `https://miora.design/docs`; current free, Standard, and Pro plans:
  `https://miora.design/pricing`
- Superflow AI checklist-led site review and pricing:
  `https://usesuperflow.ai/` and `https://usesuperflow.ai/pricing`
- Lispr language coverage, cloud-processing boundary, and current pricing:
  `https://lispr.ai/windows/` and `https://lispr.ai/pricing/`
- Vaquill AI legal research, verified citations, and current pricing:
  `https://www.vaquill.ai/`, `https://www.vaquill.ai/benchmarks`, and
  `https://app.vaquill.ai/pricing`
- AdAnt social-ad workflow, free sign-up credits, and current Pro, Max, and
  custom pricing: `https://adant.ai/`; Product Hunt launch record:
  `https://www.producthunt.com/products/adant-ai`

Remaining catalogue verification gaps that do not block the current Task copy:

1. Hey Noah's public pricing model remains unknown.
2. Zawa's exact free and paid usage limits need confirmation; the Task pages
   expose that uncertainty as a material limitation rather than claiming a limit.

## Next step

Validate the five-task cohort with qualified outbound and task-to-tool
progression events before adding more inventory or expanding the taxonomy.
