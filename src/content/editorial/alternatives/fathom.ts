import type { AlternativesPage } from "@/lib/editorial/types";

export const fathomAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "fathom",
  title: "Fathom alternatives now that it is part of Superhuman",
  description: "Fathom joined Superhuman in September 2026. Six AI meeting notetakers compared on free plans, bot-free capture, mobile apps and team pricing.",
  author: "Ordalin",
  publishedAt: "2026-10-16",
  status: "published",
  groupSlug: "productivity",
  anchorSlug: "fathom",
  intro: [
    "On September 14, 2026, Fathom became part of Superhuman, the company formerly called Grammarly, which plans to bring Fathom's notetaking into its email, calendar, docs and database apps. Fathom says nothing changes for users today: same app, same login. No pricing changes have been announced on its official pages, but nothing has been said about the long term either.",
    "Fathom remains a strong choice, with unlimited recordings and transcription on its free plan. If you would rather not wait to see what the new owner does, or you need something Fathom doesn't offer, such as bot-free capture outside the Mac beta or an Android app, the tools below each cover a different need. The comparisons come from each vendor's official pricing pages and help articles, checked on the dates shown, not from recording the same meeting in every tool.",
  ],
  whySwitch: [
    "You want certainty about the product's future. Fathom is now owned by Superhuman, which plans to fold its notetaking into Superhuman's suite, and long-term plan and product changes have not been announced.",
    "You don't want a bot in the meeting and don't use a Mac. Fathom's bot-free capture is a Mac beta, and organisation admins can block it.",
    "You need apps beyond Web, macOS, Windows and iOS. Those are the platforms Fathom lists.",
    "You are a team of one buying a team plan. Fathom's Team and Business plans require at least two users.",
  ],
  picks: [
    {
      toolSlug: "tactiq",
      label: "Best bot-free notetaker on any computer",
      bestFor: "People who don't want a bot joining their Google Meet, Zoom or Teams calls and work in Chrome on any operating system.",
      notIdealIf: "You need the meeting audio or video afterwards, or many AI requests on the free plan.",
      summary: [
        "Tactiq transcribes calls from a Chrome extension without a bot, with speaker identification in more than 60 languages, and lets you ask questions and generate action items during the meeting. Reusable prompts and shared workflows send results to Slack, Notion, Linear or HubSpot. A native Mac app is also offered.",
        "It saves the transcript as text only and does not record audio. The free plan includes 10 transcripts and 5 AI credits a month; Pro adds unlimited transcripts for A$11.42 per user a month billed annually.",
      ],
    },
    {
      toolSlug: "read-ai",
      label: "Best for Android and search beyond meetings",
      bestFor: "People who want meeting notes on Android as well as iOS, and want to search across meetings, email and messages in one place.",
      notIdealIf: "You record more than a handful of meetings a month on the free plan.",
      summary: [
        "Read AI produces meeting reports with summaries, topics, action items and key questions, and adds email and calendar context to recommend follow-ups. You can ask questions across meetings, email and messages, route action items to work tools, and get a coaching report on things like speaking speed and filler words.",
        "It runs through Google Meet, Zoom and Teams integrations and apps for Windows, macOS, Android and iOS. The free plan covers five transcripts a month with meetings up to an hour; Pro is $15 per user a month billed annually.",
      ],
    },
    {
      toolSlug: "otter-ai",
      label: "Best for live transcripts you can follow during the call",
      bestFor: "People who want to read the transcript as the meeting happens and ask questions across past meetings and connected apps.",
      notIdealIf: "Your meetings run longer than 30 minutes and you want to stay on the free plan.",
      summary: [
        "Otter writes live transcripts with speaker recognition in several languages, then summarises decisions and assigns next steps. Its AI chat answers questions across meetings and connected apps and drafts reports and follow-ups, and sales teams can sync call notes to a CRM. It captures through a meeting assistant, Mac and Windows apps, Chrome or mobile.",
        "Basic is free with 300 transcription minutes a month and conversations up to 30 minutes. Pro costs $8.33 per user a month billed annually ($16.99 monthly) and allows meetings up to 90 minutes.",
      ],
    },
    {
      toolSlug: "fireflies-ai",
      label: "Best for teams that want low-cost seats and many ways to capture",
      bestFor: "Teams that want a cheap per-seat price and capture through a bot, Chrome extension, mobile app or desktop app, in more than 100 languages.",
      notIdealIf: "You want generous AI features on the free plan, or one allowance that covers everything.",
      summary: [
        "Fireflies transcribes and identifies speakers in more than 100 languages, writes notes, action items and custom summaries, and lets you search past meetings or ask its assistant about them. AI Skills draft follow-up emails, extract details and score candidates.",
        "The free plan has limited AI summaries, 400 minutes of team storage and 20 AI credits. Pro is $10 per seat a month billed annually, with unlimited transcription and summaries, though AI credits stay separately capped on every plan.",
      ],
    },
    {
      toolSlug: "tl-dv",
      label: "Best for sales calls and euro pricing",
      bestFor: "Sales and customer teams that want unlimited free recordings and AI analysis of calls across many conversations, priced in euros.",
      notIdealIf: "Your meetings run longer than three hours, or you need full AI notes on every free meeting.",
      summary: [
        "tl;dv records Google Meet, Zoom and Teams calls, writes customisable AI notes, logs outcomes to your CRM and drafts follow-ups. It analyses customer calls and feature requests across many conversations and reviews playbook adherence, objections and rep performance.",
        "Free includes unlimited recordings and transcripts, but only the first ten meetings get full AI notes, AI allowances do not reset monthly, and recordings are kept for three months. Pro is €18 per seat a month billed annually (€29 monthly). Every plan caps meetings at three hours.",
      ],
    },
    {
      toolSlug: "krisp-ai-meeting-assistant",
      label: "Best if you also want noise cancellation",
      bestFor: "People in noisy rooms or on calls with strong accents who want noise removal, accent conversion and AI notes in one subscription.",
      notIdealIf: "You want an ongoing free plan.",
      summary: [
        "Krisp combines meeting transcripts, recordings and AI notes with removal of background noise, echo and cross-talk, plus accent conversion. Notes and action items can go to Salesforce, HubSpot and Slack, and it suggests agendas from earlier conversations. It works on desktop and mobile, with a Chrome extension for browser calls.",
        "There is a seven-day free trial without a card, but no ongoing free plan. Core costs $8 per user a month billed annually ($16 monthly), with unlimited note-taking and noise cancellation and an hour a day of accent conversion.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I don't want a bot in my meetings and I'm not on a Mac", toolSlug: "tactiq" },
    { situation: "I don't want my meeting audio stored at all", toolSlug: "tactiq" },
    { situation: "I need an Android app", toolSlug: "read-ai" },
    { situation: "I want to search meetings, email and messages together", toolSlug: "read-ai" },
    { situation: "I want to read a live transcript during the call", toolSlug: "otter-ai" },
    { situation: "I need transcription in many languages at a low per-seat price", toolSlug: "fireflies-ai" },
    { situation: "I want AI analysis of sales calls across many conversations", toolSlug: "tl-dv" },
    { situation: "My calls are noisy or I want accent conversion", toolSlug: "krisp-ai-meeting-assistant" },
  ],
  faq: [
    {
      question: "Is Fathom shutting down?",
      answer: "No shutdown has been announced. Fathom became part of Superhuman on September 14, 2026, and says nothing changes for users today, with the same app and login. Superhuman plans to bring Fathom's notetaking into its own apps, and a Fathom connector already works inside Superhuman Go.",
    },
    {
      question: "Will Fathom's free plan or prices change?",
      answer: "Fathom's official pages have not announced any pricing changes. As of our check, Free still includes unlimited recordings and transcription, Premium is $16 per user a month billed annually, and Team and Business need at least two users.",
    },
    {
      question: "Which alternative works without a meeting bot?",
      answer: "Tactiq transcribes Google Meet, Zoom and Teams calls from a Chrome extension without a bot, and stores text only. Fathom's own bot-free capture is a beta for Mac.",
    },
    {
      question: "Which alternative has the most generous free plan?",
      answer: "It depends on what you need. tl;dv records and transcribes unlimited meetings for free but gives full AI notes only for the first ten. Otter includes 300 minutes a month in conversations up to 30 minutes. Tactiq allows 10 transcripts a month and Read AI five. Fathom's own free plan, with unlimited recordings and transcription, is still hard to beat.",
    },
    {
      question: "Did you test these tools hands-on?",
      answer: "No. This guide is based on each vendor's official pricing pages and help articles, checked on the dates shown on each tool's profile.",
    },
  ],
};
