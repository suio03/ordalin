import type { ComparePage } from "@/lib/editorial/types";

export const sunoVsUdio: ComparePage = {
  kind: "compare",
  slug: "suno-vs-udio",
  title: "Suno vs Udio: downloads, limits and which AI song generator to use",
  description: "Suno caps downloads and Udio has switched them off. We compare download rules, free limits, style controls and editing tools.",
  author: "Ordalin",
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-15",
  status: "published",
  groupSlug: "music",
  intro: [
    "Suno and Udio are the two best-known AI song generators. Both turn a description or your own lyrics into a finished track with vocals, and both let you extend and rework what they produce. The differences show up after the first generation: how you steer the sound, what you can edit, and what you can take into other music software.",
    "The biggest difference is now what you can take away. Since September 3, 2026, Suno limits downloads to 20 songs a month on Pro and 60 on Premier, and free accounts get up to seven lifetime trial downloads. Udio has disabled downloads of audio, video and stems since October 29, 2025, so songs stay on udio.com and are shared by link.",
    "This comparison is based on each company's official pricing pages and help documentation, checked on the dates shown. We did not run the same prompts through both tools.",
  ],
  verdict: "Choose Suno if you need song files: it is the only one of the two that lets you download audio, stems and video, within monthly limits on paid plans. Choose Udio only if you make and share songs inside Udio and want reference-track styling, blending and inpainting, since downloads are switched off.",
  sides: [
    {
      toolSlug: "suno",
      chooseIf: [
        "You need audio files for streaming, video or another app; paid plans include 20 or 60 song downloads a month, and more can be bought.",
        "You want to split songs into stems and finish them in the audio workstation you already use.",
        "You want a browser studio with MIDI, effects and automation; it is included on Premier.",
        "You want generated songs sung in your own recorded voice on an eligible paid plan.",
        "You want more free songs each day; the free plan allows up to 10, against three full-length songs on Udio.",
      ],
    },
    {
      toolSlug: "udio",
      chooseIf: [
        "You create and share songs inside Udio and do not need to download them.",
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
      left: "50 credits a day with a shared queue. Up to seven lifetime trial downloads for personal use; no commercial rights or stem separation.",
      right: "10 credits a day and 100 a month, capped at three full-length (2:10) songs a day.",
    },
    {
      topic: "Downloads",
      left: "Pro 20 and Premier 60 songs a month, with extra downloads for sale. Stems come with the song's download. The limits also cover songs made before September 3, 2026.",
      right: "Audio, video and stem downloads are disabled. Songs are shared through udio.com links.",
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
      right: "Nothing leaves Udio while downloads are off. Songs built from uploaded audio cannot be published on udio.com.",
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
      question: "Can I still download songs from Udio?",
      answer: "No. Udio disabled downloading of audio, video and stems on October 29, 2025, when it partnered with Universal Music Group. You can still share songs through udio.com links while Udio works on a licensed new platform.",
    },
    {
      question: "How many songs can I download from Suno?",
      answer: "Pro includes 20 song downloads a month and Premier 60; unused downloads do not roll over and extra downloads can be bought. A song counts once, whatever formats or stems you take. Free accounts get up to seven lifetime trial downloads for personal, non-commercial use.",
    },
    {
      question: "Which is cheaper to start with?",
      answer: "With annual billing, Suno Pro and Udio Standard both list $8 a month. Suno Pro includes 2,500 credits a month and Udio Standard 2,400. Only Suno Pro lets you download songs, up to 20 a month.",
    },
    {
      question: "Can I use the songs commercially?",
      answer: "Suno grants commercial use for songs downloaded while you are on Pro or Premier, subject to its terms; free trial downloads are personal use only. Udio songs cannot be downloaded at the moment, so they can only be shared through udio.com links; read Udio's current terms before any other use.",
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
