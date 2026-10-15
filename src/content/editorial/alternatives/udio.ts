import type { AlternativesPage } from "@/lib/editorial/types";

export const udioAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "udio",
  title: "Udio alternatives: AI music generators that still let you download",
  description: "Udio has switched off downloads. Four alternatives compared on downloads, songs with vocals, working from your own audio and release rights.",
  author: "Ordalin",
  publishedAt: "2026-10-15",
  status: "draft",
  groupSlug: "music",
  anchorSlug: "udio",
  intro: [
    "Since its October 29, 2025 partnership with Universal Music Group, Udio has disabled downloading of audio, video and stems. You can still make songs and share them through udio.com links, but you cannot take the files into an editor, a video or a release while Udio works on a licensed, reimagined platform.",
    "If you need the files, the alternatives below each replace a different part of what Udio did: full songs with vocals, songs rendered on your own computer, generation from your own material, or background tracks you are licensed to release. The comparisons come from each vendor's official pages and help articles, checked on the dates shown, not from running the same prompts through every tool.",
  ],
  whySwitch: [
    "You need the audio. Udio has disabled downloading of audio, video and stems, so songs can only be shared as udio.com links.",
    "You build songs from your own recordings. Songs made from uploaded audio, or styled from such songs, cannot be published on udio.com.",
    "You want more than a few songs a day without paying. The free plan is capped at three roughly two-minute songs a day.",
  ],
  picks: [
    {
      toolSlug: "suno",
      label: "Closest replacement for full songs with vocals",
      bestFor: "People who used Udio to write complete songs from a description or their own lyrics and now need to download them.",
      notIdealIf: "You want unlimited downloads, or commercial rights without paying.",
      summary: [
        "Suno does the same core job: a genre, mood, theme or your lyrics becomes a full track with vocals and instruments. Remix can change a song's style or lyrics or rebuild it around a recording you upload, and eligible paid plans can sing in a voice you record.",
        "Downloads are allowed but counted. Pro includes 20 song downloads a month and Premier 60, unused downloads do not roll over, and the free plan has up to 7 lifetime trial downloads for personal, non-commercial use. Paid plans add stem separation, and Premier adds Suno Studio, whose workflows are not subject to the download limits.",
      ],
    },
    {
      toolSlug: "yue2-studio",
      label: "Best for songs that stay on your own computer",
      bestFor: "Windows users with a capable graphics card who want songs with vocals, as files on their own disk, with no plan, account or download limit.",
      notIdealIf: "You use a Mac or a laptop without a dedicated GPU, or you are a company that needs commercial rights.",
      summary: [
        "YuE2 Studio is a free, open-source desktop app for the open YuE2 song model. You give it a style and lyrics and it renders a full song with vocals on your own GPU, together with the sheet-music score the song was sung from. It can also make covers from a transcribed melody, convert tracks to MIDI and train a LoRA on one style.",
        "It needs Windows 10 or 11 and a GPU with at least 6 GB of VRAM. The model weights are CC BY-NC 4.0: individual creators may sell and monetise their songs, but companies need a licence from the model authors. It is an independent project, not made by the YuE2 model authors.",
      ],
    },
    {
      toolSlug: "stable-audio",
      label: "Best for generating from your own material",
      bestFor: "Producers who used Udio's uploads and references to start from their own audio, and want variations and section edits inside a DAW.",
      notIdealIf: "You want songs with vocals, or a free plan.",
      summary: [
        "Stable Audio starts from your own material to make variations, and replaces individual sections instead of regenerating the whole track, which covers much of what Udio's uploads, extend and inpaint were used for. It generates music and sound effects from short loops to six-minute pieces.",
        "Every plan includes the web app and a plugin for DAWs such as Ableton, Logic and Pro Tools, from Solo at $12 a month. Stem export is marked experimental, and our profile does not establish a free plan.",
      ],
    },
    {
      toolSlug: "soundraw",
      label: "Best for instrumentals you can release",
      bestFor: "Creators who mostly made instrumental beds or beats on Udio and need unlimited downloads or the right to release tracks on streaming services.",
      notIdealIf: "You want vocals, or WAV and stems on the cheapest plans.",
      summary: [
        "SOUNDRAW builds royalty-free tracks from genre and mood choices, with a browser mixer that toggles instruments, adjusts intensity and sets length. It says its model is trained only on music its own producers create.",
        "The Creator plan includes unlimited MP3 downloads, and the Artist tiers add song distribution with 10, 20 or unlimited downloads a month and let you keep 100% of streaming royalties. Tracks made while subscribed stay licensed after you cancel. WAV and stems start at Artist Pro, and our profile does not establish a free plan.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I want songs with vocals from my lyrics and need to download them", toolSlug: "suno" },
    { situation: "I want to finish songs in another audio workstation with stems", toolSlug: "suno" },
    { situation: "I have a Windows PC with a good GPU and want files with no download limit", toolSlug: "yue2-studio" },
    { situation: "I don't want my music sent to a cloud service", toolSlug: "yue2-studio" },
    { situation: "I want variations and section edits of my own audio inside Ableton, Logic or Pro Tools", toolSlug: "stable-audio" },
    { situation: "I need instrumentals I can release on Spotify", toolSlug: "soundraw" },
    { situation: "I need unlimited background music downloads for videos", toolSlug: "soundraw" },
  ],
  faq: [
    {
      question: "Can I still download songs from Udio?",
      answer: "No. Udio's help centre says that downloading of audio, video and stems has been disabled since its October 29, 2025 partnership with Universal Music Group. Songs can still be shared through udio.com links.",
    },
    {
      question: "What is the closest alternative to Udio?",
      answer: "Suno. It also turns a description or your lyrics into a full song with vocals, can rebuild a song around an uploaded recording, and lets you download songs within a monthly allowance: 20 on Pro and 60 on Premier.",
    },
    {
      question: "Is there a free Udio alternative with downloads?",
      answer: "YuE2 Studio is free and open source and saves songs to your own disk, but it needs Windows and a GPU with at least 6 GB of VRAM. Suno's free plan has 50 credits a day and up to 7 lifetime trial downloads for personal, non-commercial use.",
    },
    {
      question: "Which alternative lets me release songs on streaming services?",
      answer: "SOUNDRAW's Artist plans include song distribution and let you keep 100% of streaming royalties. For other tools, read the plan's licence terms before distributing a track.",
    },
    {
      question: "Did you test these tools hands-on?",
      answer: "No. This guide is based on each vendor's official pages, help articles and pricing, checked on the dates shown on each tool's profile.",
    },
  ],
};
