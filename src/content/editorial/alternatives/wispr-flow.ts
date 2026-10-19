import type { AlternativesPage } from "@/lib/editorial/types";

export const wisprFlowAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "wispr-flow",
  title: "Wispr Flow alternatives for on-device, cheaper or free dictation",
  description: "Six AI dictation apps compared with Wispr Flow on free plans, on-device recognition, one-time pricing, platforms and price.",
  author: "Ordalin",
  publishedAt: "2026-10-20",
  status: "published",
  groupSlug: "audio",
  anchorSlug: "wispr-flow",
  intro: [
    "Wispr Flow has changed a lot in a few months. It launched Notetaker, its first product beyond dictation, on Mac in August 2026 and on Windows in September, raised a Series B the same month, switched every user to its own speech model, Canto, and added a Growth plan for teams. Free still covers 2,000 words of desktop dictation a week, and Pro is $15 per user a month ($12 billed annually).",
    "Flow remains a strong dictation app on Mac, Windows, iPhone and Android. But every transcription happens in the cloud, the free allowance runs out quickly if you dictate all day, and the product is growing towards meetings and teams. If you want recognition that stays on your computer, a lower price, a one-time purchase or a different free plan, the apps below each cover one of those needs. The comparisons come from each vendor's official pricing pages, help articles and policies, checked on the dates shown, not from dictating the same text into every app.",
  ],
  whySwitch: [
    "You don't want your voice sent to the cloud. Flow transcribes everything on its servers and has no offline mode, even when you turn off cloud storage of your dictations.",
    "You dictate more than 2,000 words a week and don't want to pay. That is the free plan's desktop limit, and free mobile use is also capped.",
    "You want a lower price or no subscription. Pro is $15 per user a month, or $12 billed annually.",
    "You only want dictation. Flow's newer features and its Growth plan centre on Notetaker meeting notes and team controls.",
  ],
  picks: [
    {
      toolSlug: "willow",
      label: "Closest like-for-like replacement",
      bestFor: "People who want the same hold-a-key workflow on Mac, Windows and iPhone, with unlimited free dictation and an offline mode on the paid plan.",
      notIdealIf: "You use Android, or you dictate for more than eight minutes at a stretch.",
      summary: [
        "Willow inserts cleaned-up, punctuated text wherever your cursor is, and its Scribe mode drafts a whole email or reply from a spoken description of what you want to say. Dictation runs on cloud models with Private Mode on by default, and Pro adds offline dictation and a memory of your writing style.",
        "Basic is free with unlimited dictation on a lighter speech model, 20 Scribe uses a week and five minutes per dictation. Pro costs the same as Flow's, $15 a month or $12 billed annually. Android is listed as coming soon.",
      ],
    },
    {
      toolSlug: "walkie",
      label: "Best free plan",
      bestFor: "People who want unlimited free dictation on Mac, Windows and iPhone, plus meeting notes and read-aloud in the same app.",
      notIdealIf: "You need Android, or app-aware formatting outside macOS.",
      summary: [
        "Walkie combines dictation that lands in any app with meeting notes labelled by speaker and text-to-speech in more than 950 voices. On-device dictation is unlimited on the free plan, which also includes 2,000 cloud words a week, 10 read-aloud minutes a month and a one-time trial of three meetings.",
        "Pro is $7.50 a month or $72 a year, about half of Flow Pro, with unlimited cloud dictation and 10 meetings a month. Apps run on Apple silicon Macs, Windows 10 and later, and iPhone.",
      ],
    },
    {
      toolSlug: "yap",
      label: "Cheapest on-device dictation for Mac and Windows",
      bestFor: "People who want recognition to run on their own computer and one low subscription that covers Mac, Windows and phone.",
      notIdealIf: "You dictate in languages outside Europe, use an Intel Mac, or want an ongoing free plan.",
      summary: [
        "Yap types at the cursor when you hold a shortcut, removes hesitation sounds and adds punctuation. Speech recognition runs on your device, so recordings are not uploaded, though the app checks your subscription online at least once every 24 hours. One subscription covers Mac, Windows and the Yap keyboard for iPhone and Android.",
        "It costs $6.90 a month or $69 a year after three free days and a 10-day trial that needs a card. Desktop recognition covers 25 European languages, the Mac app needs Apple silicon, and the phone apps install from outside the main app stores.",
      ],
    },
    {
      toolSlug: "yubi",
      label: "Best on-device option for recent Macs",
      bestFor: "Mac users on macOS 26 and Apple silicon who want unlimited free dictation that never leaves the computer.",
      notIdealIf: "You use Windows, a phone or an older Mac, or want AI cleanup to stay local too.",
      summary: [
        "Yubi is a 6 MB Mac app from a Tokyo studio: hold a key, speak, let go, and the words are typed into the app in front of you, with transcription finished on the Mac. Screen help and AI cleanup requests are separate and go to Yubi's server.",
        "Dictation is unlimited on the free plan, which includes 10 screen-help tasks a month. Paid plans priced in yen raise the task allowance rather than unlocking dictation.",
      ],
    },
    {
      toolSlug: "szept",
      label: "Best one-time purchase for coding with AI agents",
      bestFor: "Mac developers who dictate into Claude Code, Cursor or chat tools and want screenshots and screen recordings pasted alongside their words, without a subscription.",
      notIdealIf: "You need offline recognition or a Windows or phone app.",
      summary: [
        "Szept types speech at the cursor when you hold fn, and can capture a screenshot or recording and paste the file path with your instructions into the app you came from. AI cleanup and translation are optional and use your own API key; speech recognition needs a connection to Soniox.",
        "Personal is a one-time US$25 (US$9.99 for the first 100 buyers) with full source code and a year of updates; the licence does not allow sharing or selling the source. It needs macOS 14 or later.",
      ],
    },
    {
      toolSlug: "speakon",
      label: "Best for dictating on iPhone",
      bestFor: "iPhone users who dictate on the move and would rather press a physical button than open an app.",
      notIdealIf: "You want dictation on a computer or Android.",
      summary: [
        "SpeakON types cleaned-up text into most iPhone apps, removing fillers and backtracks, turning rambling into lists and adapting the tone to the app. It also keeps voice notes you can edit by voice and translates into 12 languages. Transcription runs on third-party cloud providers in the US.",
        "The app is free with 2,000 words of voice typing a week. Buying the $129 MagSafe button unlocks unlimited Pro for life, with no subscription.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I want the same workflow and price as Flow, on the same desktops", toolSlug: "willow" },
    { situation: "I want unlimited dictation without paying", toolSlug: "walkie" },
    { situation: "I want recognition on my own Windows PC or Mac and a low monthly price", toolSlug: "yap" },
    { situation: "I have a recent Mac and want free dictation that stays on it", toolSlug: "yubi" },
    { situation: "I dictate prompts to coding agents and want to pay once", toolSlug: "szept" },
    { situation: "I mostly dictate on my iPhone", toolSlug: "speakon" },
  ],
  faq: [
    {
      question: "Is there a free Wispr Flow alternative?",
      answer: "Yes. Walkie and Willow both offer unlimited dictation for free: Walkie's runs on the device, with 2,000 cloud words a week on top, and Willow's uses a lighter speech model with five minutes per dictation. Yubi is free and unlimited on Macs with macOS 26. Flow's own free plan covers 2,000 desktop words a week.",
    },
    {
      question: "Is there an open-source Wispr Flow alternative?",
      answer: "None of the apps in this guide is open source. Szept includes its full source code with a one-time licence, but the licence limits it to permitted internal use and does not allow sharing or selling it.",
    },
    {
      question: "Which alternative works without sending my voice to the cloud?",
      answer: "Yap and Yubi recognise speech on your own computer, and Walkie's free dictation runs on the device. Yap still needs an online subscription check at least once every 24 hours. Flow transcribes everything in the cloud and has no offline mode.",
    },
    {
      question: "How much does Wispr Flow cost now?",
      answer: "As of our check, Free includes 2,000 words of desktop dictation a week, Pro is $15 per user a month or $12 billed annually, and the new Growth plan is $23 a month for dictation only or $33 with unlimited Notetaker ($18 or $26 billed annually). Enterprise is custom.",
    },
    {
      question: "Did you test these apps hands-on?",
      answer: "No. This guide is based on each vendor's official pricing pages, help articles and policies, checked on the dates shown on each tool's profile.",
    },
  ],
};
