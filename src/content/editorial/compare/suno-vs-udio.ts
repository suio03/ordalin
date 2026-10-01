import type { ComparePage } from "@/lib/editorial/types";

export const sunoVsUdio: ComparePage = {
  kind: "compare",
  slug: "suno-vs-udio",
  title: "Suno vs Udio: which AI song generator fits your workflow?",
  description: "Suno and Udio both write full songs from a prompt. We compare their free limits, style controls, editing tools and paths to production.",
  author: "Ordalin",
  publishedAt: "2026-10-01",
  status: "published",
  groupSlug: "music",
  intro: [
    "Suno and Udio are the two best-known AI song generators. Both turn a description or your own lyrics into a finished track with vocals, and both let you extend and rework what they produce. The differences show up after the first generation: how you steer the sound, what you can edit, and what you can take into other music software.",
    "This comparison is based on each company's official pricing pages and help documentation, checked on the dates shown. We did not run the same prompts through both tools.",
  ],
  verdict: "Choose Suno if you want to take songs further: stem separation, a browser-based studio on Premier, singing in your own voice and Android as well as iPhone apps. Choose Udio if you want to steer a song with reference tracks, blend two styles and inpaint sections, and you are happy working mainly on the web.",
  sides: [
    {
      toolSlug: "suno",
      chooseIf: [
        "You want to split songs into stems and finish them in the audio workstation you already use.",
        "You want a browser studio with MIDI, effects and automation; it is included on Premier.",
        "You want generated songs sung in your own recorded voice on an eligible paid plan.",
        "You want more free songs each day; the free plan allows up to 10, against three full-length songs on Udio.",
      ],
    },
    {
      toolSlug: "udio",
      chooseIf: [
        "You want to guide a song with one or two reference tracks and set how strongly they influence it.",
        "You want to blend two genres or references with a slider.",
        "You want to inpaint or edit parts of a song, with trimming that costs no credits.",
        "You want bought credits that never expire.",
      ],
    },
  ],
  differences: [
    {
      topic: "Free plan",
      left: "50 credits a day with a shared queue. No commercial rights, monthly song downloads or stem separation.",
      right: "10 credits a day and 100 a month, capped at three full-length (2:10) songs a day.",
    },
    {
      topic: "Steering the sound",
      left: "Describe genre, mood and theme, or provide lyrics. Remix changes a song's style or lyrics or rebuilds it around your recording.",
      right: "Prompts, lyrics or reference tracks used as a style, with adjustable style strength and two-way style blending.",
    },
    {
      topic: "Editing a song",
      left: "Remix and reshape existing songs. Premier adds Suno Studio for MIDI, effects and automation.",
      right: "Extend, remix, inpaint and edit, and each action creates two new versions. Trimming is free.",
    },
    {
      topic: "Taking songs elsewhere",
      left: "Time-aligned stems for another audio workstation. Pro has two stem types and Premier three.",
      right: "The profile does not establish stem export. Songs built from uploaded audio cannot be published on udio.com.",
    },
    {
      topic: "Where it runs",
      left: "Web, iPhone and Android. Suno Studio runs in the browser.",
      right: "Web and iOS. Style blending and the Style Library are desktop-only.",
    },
    {
      topic: "Credits",
      left: "Plan credits do not roll over. Top-up credits do not expire but need an active subscription.",
      right: "Plan credits do not roll over. Bought credits never expire, and a lapsed subscription returns to free limits.",
    },
  ],
  faq: [
    {
      question: "Which is cheaper to start with?",
      answer: "With annual billing, Suno Pro and Udio Standard both list $8 a month. Suno Pro includes 2,500 credits a month and Udio Standard 2,400. Check each plan's credit costs and limits before comparing value.",
    },
    {
      question: "Can I use the songs commercially?",
      answer: "Suno's free plan has no commercial rights; Pro and Premier include them, subject to Suno's terms of service. For Udio, read its current terms before commercial use; our profile does not summarise its licence.",
    },
    {
      question: "Can I use my own voice or recordings?",
      answer: "Suno can rebuild a song around your recording and, on eligible paid plans, sing in a voice you record. Udio's paid plans can generate from uploaded audio, but songs made that way cannot be published on udio.com, and you must hold the rights to anything you upload.",
    },
    {
      question: "Did you test both tools with the same prompts?",
      answer: "No. This comparison uses each vendor's official documentation and pricing, checked on the dates shown on each tool's profile.",
    },
  ],
};
