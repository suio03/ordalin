import type { ComparePage } from "@/lib/editorial/types";

export const aceMusicVsSuno: ComparePage = {
  kind: "compare",
  slug: "ace-music-vs-suno",
  title: "ACE Music vs Suno: vocal ranking, downloads and free limits",
  description: "ACE Music v1 now edges Suno v6 on a blind vocal leaderboard. We compare downloads, free plans, melody input, editing and commercial rights.",
  author: "Ordalin",
  publishedAt: "2026-11-12",
  updatedAt: "2026-11-12",
  status: "published",
  groupSlug: "music",
  intro: [
    "ACE Music and Suno both turn a description or your own lyrics into a finished song with vocals in the browser. ACE Music comes from ACE Studio, the company behind the ACE Studio music workstation; Suno is the best-known song generator, and its paid plans run its v6 and v6-wild models.",
    "Two things changed recently. ACE Music v1 placed first on Artificial Analysis's AA-Music-Vocal v1.1 blind listening leaderboard at 1160 Elo, ahead of Suno v6 at 1144. The ranking covers vocal music only, and a 16-point gap is small. Since September 3, 2026, Suno has also counted downloads: 20 songs a month on Pro, 60 on Premier and up to 7 lifetime trial downloads on the free plan. ACE Music's paid plans have no download cap.",
    "This comparison is based on each company's official pricing pages, model pages and help documentation, checked on the dates shown. We did not run the same prompts through both tools, so it says nothing about which one sounds better to you.",
  ],
  verdict: "Choose ACE Music if you need many song files, want to start from a hummed or played melody, or want free downloadable songs from its open-source ACE-Step model. Choose Suno if you want the larger editing toolkit, with Remix, songs sung in your own voice, custom v6 models, the Suno Studio workstation and an official connector for AI assistants.",
  sides: [
    {
      toolSlug: "ace-music",
      chooseIf: [
        "You download a lot of songs: Creator and Artist include unlimited downloads, against Suno's 20 or 60 a month.",
        "You want to start from a melody you hum, play on a keyboard or upload as MIDI or a score.",
        "You want free songs you can download and use commercially; the open-source ACE-Step v1.5 model on the site has no credit cost.",
        "You want MIDI or a melody-and-chords score of a generated song to keep arranging in your own DAW.",
        "You want the model currently ranked first for vocal music on Artificial Analysis's blind leaderboard.",
      ],
    },
    {
      toolSlug: "suno",
      chooseIf: [
        "You want to remix songs: change their style or lyrics, or rebuild them around your own recording.",
        "You want generated songs sung in a voice you record, or a custom v6 model tuned on your own audio.",
        "You want a browser workstation with MIDI, effects and automation; Suno Studio is included on Premier.",
        "You want to make songs from ChatGPT, Claude, Gemini or Cursor through Suno's official MCP connector.",
        "You want mobile apps; Suno runs on iPhone and Android as well as the web.",
      ],
    },
  ],
  differences: [
    {
      topic: "Vocal ranking",
      left: "ACE Music v1: 1160 Elo, first on AA-Music-Vocal v1.1. The ranking covers vocal music only.",
      right: "Suno v6: 1144 Elo on the same leaderboard.",
    },
    {
      topic: "Free plan",
      left: "20 credits a day, up to 10 ACE Music v1 songs, with no downloads or commercial rights for them. ACE-Step v1.5 songs are unlimited, download as MP3 and may be used commercially.",
      right: "50 credits a day, about 10 songs, on the free v6-mini model. Up to 7 lifetime trial downloads for personal, non-commercial use.",
    },
    {
      topic: "Downloads",
      left: "Unlimited on Creator and Artist.",
      right: "20 songs a month on Pro and 60 on Premier. Unused downloads do not roll over, and extra downloads can be bought.",
    },
    {
      topic: "Price",
      left: "Creator $9.90 a month, or $7.90 billed yearly, for 1,000 credits (up to 500 songs). Artist $29, or $16.58 yearly, for 2,500 credits, and it adds the ACE Studio desktop app.",
      right: "Pro $10 a month, or $8 billed yearly, for 2,500 credits (up to 500 songs). Premier $30, or $24 yearly, for 10,000 credits and Suno Studio.",
    },
    {
      topic: "How you start a song",
      left: "Text, lyrics with line-by-line directions in parentheses, a hummed recording, keyboard or MIDI notes, a MIDI or MusicXML score, an image, or reference songs for covers and mashups.",
      right: "A description of genre, mood and theme, or your own lyrics. Remix rebuilds a song around your recording.",
    },
    {
      topic: "Editing and export",
      left: "Convert songs to MIDI, download a melody-and-chords score where notation exists, and split stems. ACE Music v1.1 Preview lets you edit the planned melody and chords and regenerate.",
      right: "Remix, stem separation (two types on Pro, three on Premier), voices from your own recording and custom v6 models. Premier adds Suno Studio with MIDI, effects and automation.",
    },
    {
      topic: "API and assistants",
      left: "No public MCP integration, and new API key sign-ups are paused while the API is updated.",
      right: "Suno MCP (beta) connects ChatGPT, Claude, Claude Code, Gemini and Cursor with no API key. Early access is by request.",
    },
    {
      topic: "Where it runs",
      left: "Web only. ACE-Step can also run locally from its open-source code.",
      right: "Web, iPhone and Android. Suno Studio runs in the browser.",
    },
  ],
  faq: [
    {
      question: "Is ACE Music better than Suno?",
      answer: "On one blind test, narrowly. ACE Music v1 ranked first on Artificial Analysis's AA-Music-Vocal v1.1 leaderboard at 1160 Elo, against 1144 for Suno v6. That leaderboard covers vocal music only, and a 16-point gap is small, so try both with your own lyrics before paying. Suno has the larger editing toolkit; ACE Music has more ways to start from a melody and no download cap on paid plans.",
    },
    {
      question: "Can I download songs for free?",
      answer: "On ACE Music, only songs made with the open-source ACE-Step v1.5 model: they are unlimited, download as MP3 and may be used commercially. ACE Music v1 songs cannot be downloaded on the free plan. Suno's free plan includes up to 7 lifetime trial downloads, for personal, non-commercial use only.",
    },
    {
      question: "How many songs can I download on a paid plan?",
      answer: "ACE Music's Creator and Artist plans have unlimited downloads. Suno Pro includes 20 song downloads a month and Premier 60; unused downloads do not roll over and extra downloads can be bought.",
    },
    {
      question: "Which is cheaper?",
      answer: "Monthly, ACE Music Creator is $9.90 and Suno Pro $10; billed yearly, $7.90 and $8. Both say their credits make up to 500 songs a month. ACE Music v1 costs 2 credits a song, two songs per generation. The difference is downloads: unlimited on ACE Music Creator, 20 a month on Suno Pro.",
    },
    {
      question: "Can I use the songs commercially?",
      answer: "On both, commercial use of the main models depends on being on a paid plan when the song is made. ACE Music's free ACE-Step v1.5 songs are the exception and may be used commercially without paying. Suno's free trial downloads are personal use only. ACE Music payments are non-refundable except where its terms or the law require.",
    },
    {
      question: "Can I make a song from a melody I hum?",
      answer: "ACE Music, yes: record yourself humming, play notes on an on-screen or MIDI keyboard, or upload a MIDI or score, and it builds a complete song from it. Suno's Remix can rebuild a song around your own recording, and its Voices feature sings your lyrics in a voice you record on eligible paid plans.",
    },
    {
      question: "Can I use ACE Music or Suno inside ChatGPT or Claude?",
      answer: "Suno, yes, in beta: Suno MCP connects ChatGPT, Claude, Claude Code, Gemini and Cursor through https://api.suno.com/mcp, with no API key, and songs use your plan's credits. Early access is by request. ACE Music has no public MCP integration, and it has paused new API key sign-ups while it updates its API.",
    },
    {
      question: "Did you test both tools with the same prompts?",
      answer: "No. This comparison uses each vendor's official documentation and pricing, checked on the dates shown on each tool's profile. The ranking figures come from Artificial Analysis's published leaderboard, not from our own listening.",
    },
  ],
};
