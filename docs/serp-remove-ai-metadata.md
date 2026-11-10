# SERP research: remove ai metadata (Ordalin free tool)

- Market: US, English. Date: 2026-11-11.
- Builds on the full research for the same task in the owner's other site, ailabelremover.tools (`docs/serp-remove-ai-label.md` and `docs/ai-search/2026-11-02-remove-ai-label/` in that repo, 2026-11-02). This doc covers only what changed and how the Ordalin page differs.
- Sources: live Google SERP (Chrome, `pws=0`) for `remove ai label`, `ai metadata remover`, `remove ai metadata` and `c2pa remover`; Google autocomplete; Google Trends (US, 12 months).
- Failed: Semrush mirror node down, so there are no absolute volumes.

## Why a second page

The owner decided on 2026-11-11 that both sites compete for the same searches. Google rarely shows two results from one domain, but two of our domains can each take a slot, and competitors take the slots otherwise.

Conditions:
- Separate copy, structure and examples.
- No link network between the two sites.

## Conclusions

- **Trends (US, 12 mo, average):**

  | Term | Average |
  |---|---|
  | remove ai label | 46 |
  | remove ai metadata | 16 |
  | ai metadata remover | 1 |
  | c2pa remover | 1 |
  | remove content credentials | 0 |

- **Split between the two sites:**
  - ailabelremover.tools leads with `remove ai label`, with `remove ai metadata` as the twin.
  - **The Ordalin page reverses this.** Target `remove ai metadata` (tool name "AI Metadata Remover"), with twin `remove ai label` in the title.
  - The SERPs share 5+ results (same intent), so each page competes for both terms with different emphasis.
- **Directory sites rank with free-tool subpages:**
  - bizscal.com/tools/ai-label-remover is on page 1 for `remove ai label`.
  - leapd.ai/tools/ai-metadata-remover is on page 1 for `ai metadata remover`.
  - reepl.io/free-tools/image-metadata-remover ranks for `c2pa remover`.
  - So a page on a directory domain like Ordalin is not ruled out.
- **ailabelremover.tools is not in the top 9** for any of these terms yet (9 days old).
- **Incumbents:**
  - Both main terms: removeailabel.com, aimetadatacleaner.com, deletefootprints.ai, exifreader.com.
  - `remove ai metadata` adds blankai.app and metadata2go.
  - `c2pa remover` is a separate small cluster (noc2pa.com, unc2pa.com, removeailabel.com/c2pa-remover). It is too small for its own page now and gets a section instead.
- **New autocomplete since 11-02:**
  - "c2pa & synthid remover" and "remove c2pa and synthid": we cannot remove SynthID, so this goes in the honest-limits section.
  - "remove content credentials linkedin / photoshop".
  - "ai metadata remover from text / pdf / video": excluded, images only.

## Differentiation for the Ordalin page

- **Lead with the scan:** what AI metadata is in this file and which generator wrote it (C2PA claim generator, XMP DigitalSourceType, PNG prompt chunks). Then remove it.
- **Generator table:** what ChatGPT, Gemini (Nano Banana), Seedream, Firefly, Midjourney and ComfyUI write into files. Fill it only with rows we verify on real files.
- **Content Credentials / C2PA explainer:** covers the `c2pa remover` and `remove content credentials` terms in one section.
- **Ordalin-only block:** related tools from the catalogue below the tool, and a link to the Watermarks Remover skill test page.
- **Kept off this page:** Instagram/Facebook how-tos (ailabelremover has those), video, text, PDF, visible watermarks.
