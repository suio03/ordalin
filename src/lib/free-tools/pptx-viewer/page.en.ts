import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// Facts: docs/keywords/pptx-viewer.md, "Verified product facts". Every claim maps to that list.
export const pptxViewerPageEn: ToolPageCopy = {
  title: "Online PPTX Viewer & PPTX Reader: Free, No Sign-Up | Ordalin",
  description:
    "Free online PPTX viewer: open a PowerPoint file in your browser, read the speaker notes and present it full screen. View only; the file is never uploaded.",
  h1: "PPTX Viewer: Open PowerPoint Files Without Uploading Them",
  subtitle:
    "Free online PPTX viewer: open a PowerPoint file in your browser, read the speaker notes and present it full screen. View only; the file is never uploaded.",
  sections: [
    {
      id: "how-to",
      h2: "How do you open a PPTX file without PowerPoint?",
      blocks: [
        {
          ol: [
            "**Drop the PPTX into the box above,** or click it to choose a .pptx from your computer or phone. No account, no install.",
            "**Read it.** Click a thumbnail or use the arrows to move between slides, zoom in on small text, and open the speaker notes.",
            "**Present or save it.** Press Present (or F5) for a full-screen slideshow, or download one slide as PNG, every slide as a ZIP of PNGs, or the whole deck as a PDF.",
          ],
        },
        {
          p: "This online PPTX viewer reads the deck inside your browser tab. Nothing is sent to Ordalin or anyone else, so a confidential deck stays on your device. Most other ways to open PPTX online upload the PPTX to a server first. To view another deck, drop it on the name above the slide.",
        },
      ],
    },
    {
      id: "facts",
      h2: "Quick facts",
      blocks: [
        {
          table: {
            head: ["", ""],
            rows: [
              ["What it is", "A free PPTX viewer and PPTX reader that runs in the browser: read, present and export, no editing"],
              ["Files the PPTX viewer opens", ".pptx, .ppsx (slide show), .potx (template) and .pptm; macros in a .pptm never run"],
              ["Largest file", "300 MB"],
              ["Slides", "Every slide of the deck, with no page cap"],
              ["Where it runs", "In your browser. Your PPTX is not uploaded"],
              ["Exports", "PNG 1920 pixels wide, a ZIP of all slides, or a PDF with one page per slide"],
              ["Cost", "Free, no sign-up, no daily limit"],
            ],
          },
        },
      ],
    },
    {
      id: "what-you-see",
      h2: "What the PPTX viewer shows",
      blocks: [
        {
          ul: [
            "**Slides as designed:** theme colours, backgrounds, pictures, tables, charts, SmartArt and grouped shapes, at the deck's own slide size (16:9, 4:3 or custom).",
            "**Thumbnails** of every slide down the side, or in a row under the slide on a phone. A 120-slide, 28 MB deck opened in about a third of a second in our tests on a laptop.",
            "**Speaker notes** for the current slide, in a panel you can show or hide.",
            "**Hidden slides,** marked with a Hidden badge. You can still read them, and the slideshow skips them like PowerPoint does.",
            "**Video and audio** in web formats such as MP4 and MP3, with play controls.",
            "**A list of what may look different** for this file, slide by slide (see below).",
          ],
        },
      ],
    },
    {
      id: "present",
      h2: "Present a PPTX full screen",
      blocks: [
        {
          p: "Press Present to start from the current slide, or F5 to start from the first one. The slideshow uses the same keys as PowerPoint, so a presenter who knows them doesn't have to learn anything:",
        },
        {
          table: {
            head: ["Key", "What it does"],
            rows: [
              ["→, Space, Enter, Page Down, N", "Next"],
              ["←, Backspace, Page Up, P", "Previous"],
              ["Home / End", "Go to the start / end"],
              ["A number, then Enter", "Jump to that slide, hidden ones included"],
              ["B or W", "Black or white screen; press again to come back"],
              ["Esc", "End the show and return to the slide you stopped on"],
            ],
          },
        },
        {
          p: "On a touch screen, swipe left or right to change slides.",
        },
      ],
    },
    {
      id: "export",
      h2: "Save slides as PNG or PDF",
      blocks: [
        {
          p: "Need to send the deck to someone without PowerPoint, or drop a slide into a document? Download the current slide as a PNG image, all slides as PNGs in one ZIP file (slide-01.png, slide-02.png…), or the whole deck as a PDF. Images are 1920 pixels wide, and each PDF page has the slide's own shape. Exports match what the PPTX viewer shows, so the notes below apply to them too.",
        },
      ],
    },
    {
      id: "differences",
      h2: "Why some slides may look different from PowerPoint",
      blocks: [
        {
          p: "A .pptx file is a ZIP of XML and media files that PowerPoint draws on screen. This PPTX reader draws the same file with web technology, which is very close for most decks but not identical. After a PPTX opens, the online PPTX viewer lists what applies to that deck under the slides. The usual cases:",
        },
        {
          ul: [
            "**Fonts:** a font that isn't installed on your device is replaced with a similar one, so a line can wrap differently. The list names the missing fonts.",
            "**Animations and transitions** don't play. Each slide shows its final state, with every animated item visible.",
            "**Video in older formats** such as WMV doesn't play in browsers; its poster frame is shown instead.",
            "**Embedded objects** (an Excel sheet or document inside a slide) show their preview picture and can't be opened. Some previews in old vector formats show a placeholder.",
            "**Pattern fills** can look lighter than in PowerPoint.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Other ways to open a PPTX file",
      blocks: [
        {
          table: {
            head: ["Option", "Best when", "Not ideal when"],
            rows: [
              ["**This online PPTX viewer**", "You want to read or present a deck now, on any computer, without an account or uploading it", "You need to edit the slides or watch the animations"],
              ["**PowerPoint (desktop, web or mobile app)**", "You have Office or a Microsoft account and want exact formatting and editing", "You don't want to sign in, install an app or put the file in OneDrive"],
              ["**Google Slides**", "You want to edit and share the deck online", "You'd rather not upload the file to Google Drive; conversion can shift layouts"],
              ["**Keynote (Mac, iPhone, iPad)**", "You're on Apple devices and want to edit", "You're on Windows, Android or a Chromebook"],
              ["**LibreOffice Impress**", "You want a free desktop editor that also opens old .ppt files", "You can't install software on the computer"],
            ],
          },
        },
      ],
    },
    {
      id: "limits",
      h2: "Good for, not for",
      blocks: [
        {
          ul: [
            "**Good for:** reading a deck someone sent you, checking slides before a meeting, presenting from a borrowed or locked-down computer, and turning slides into images or a PDF.",
            "**Not for:** editing text or slides, old PowerPoint 97–2003 .ppt files, Keynote or .odp files (the viewer explains how to convert each one), or password-protected decks (remove the password in PowerPoint first).",
            "**Know before you start:** the whole PPTX is read into your browser's memory. Phones have less memory than laptops, so a very large deck may not open on a phone.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "Is this online PPTX viewer free? Do I need to sign up?",
      a: "Yes, it's free, with no account, no daily limit and no watermark on exports.",
    },
    {
      q: "Is my PPTX file uploaded?",
      a: "No. The PPTX viewer reads it inside your browser on your own device; it is never sent to a server, which makes it safe for confidential decks.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. This online PPTX viewer works in any current browser, including Chrome, Edge, Firefox and Safari, on Windows, Mac, Linux and Chromebook. It's an online PPTX viewer, so there's no app to download: this page is the PPTX opener.",
    },
    {
      q: "Can I open a PPTX file on my iPhone or Android phone?",
      a: "Yes, open this online PPTX viewer in the phone's browser and tap the box to choose the file. Swipe to change slides; thumbnails sit in a row under the slide.",
    },
    {
      q: "Why can't I open my PPTX file?",
      a: "The PPTX viewer tells you why: the file may be an old .ppt, protected with a password, damaged during download, or larger than 300 MB. Each case gets a message with what to do next.",
    },
    {
      q: "Can it open old .ppt files?",
      a: "No. The .ppt format from PowerPoint 97–2003 can't be read here. PowerPoint for the web, Google Slides or LibreOffice Impress can open it and save it as .pptx.",
    },
    {
      q: "Can I edit the slides?",
      a: "No, this PPTX reader only views, presents and exports. To change slides, use PowerPoint, Google Slides, Keynote or LibreOffice Impress.",
    },
    {
      q: "Does the PPTX reader show speaker notes?",
      a: "Yes. Press Notes above the slide to show the notes for the slide you're on.",
    },
    {
      q: "How do I convert a PPTX to PDF?",
      a: "Open the PPTX and press Whole deck as PDF. You get one page per slide, made in your browser. For single slides, use the PNG download.",
    },
    {
      q: "What is the difference between PPT and PPTX?",
      a: "PPT is the binary format PowerPoint used until 2003. PPTX, used since PowerPoint 2007, is a ZIP of XML files, which is why a browser-based pptx file viewer can read it.",
    },
  ],
  closing:
    "Got a spreadsheet instead? Open it in the [XLSX viewer](/free-tools/xlsx-viewer). Looking for more? See the other [free tools](/free-tools) or browse the [Ordalin AI tool directory](/) for presentation and productivity tools.",
};
