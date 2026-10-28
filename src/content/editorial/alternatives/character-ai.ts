import type { AlternativesPage } from "@/lib/editorial/types";

export const characterAiAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "character-ai",
  title: "Character.AI alternatives after the Chapter 11 filing",
  description: "Character.AI filed for Chapter 11 and may shut down if no buyer keeps it running. What is confirmed, how to export your chats, and three apps to move to.",
  author: "Ordalin",
  publishedAt: "2026-10-26",
  updatedAt: "2026-10-29",
  status: "published",
  groupSlug: "writing",
  anchorSlug: "character-ai",
  intro: [
    "Character.AI filed for Chapter 11 bankruptcy on 12 October 2026 to sell the company under court supervision. The app is still running and subscriptions still bill as normal, and the company expects the sale to finish by late November or early December 2026. The risk is what comes after: Character.AI says that if no buyer offers to keep the platform going, \"the platform will be wound down\". Its press release names a Disney affiliate as the opening bidder, but that $20 million bid is for a non-exclusive licence to some of the company's intellectual property, not a purchase of the app.",
    "Nothing has to be done today, but two steps make sense now: export your data while the service is up, and try a second app before you need one. The apps below are character chat services that were available when we checked, chosen for where they run, who they are for and how they charge. The comparisons come from each company's official website, help pages and terms, and from Character.AI's own announcement and press release, not from hands-on testing.",
  ],
  whySwitch: [
    "The service may close. Character.AI says the platform will be wound down if the sale does not produce a buyer that keeps it running, and it will not know which way it goes until the sale ends in late November or early December 2026.",
    "You pay for a subscription. Billing is \"unchanged for now\", and Character.AI says it intends to tell subscribers in advance if paid features change, but it has not said what happens to a yearly plan if the platform winds down.",
    "Your characters and chats live only on Character.AI. There is no import into other apps, so recreating a favourite character elsewhere takes time you may not have later.",
    "You are a teen. Most alternatives are adults-only; Character.AI's minimum age is 13, or 16 in the EEA and UK, so younger users have fewer places to go and should check each app's age rules first. In New York, a law signed on 28 October 2026 restricts what these apps may offer under-18s from 1 January 2027.",
  ],
  picks: [
    {
      toolSlug: "polybuzz",
      label: "Best for bringing characters with you",
      bestFor: "Adults on the web or Android who want a community character library and the option to load character cards made on other platforms.",
      notIdealIf: "You use an iPhone app, are under 18, or want long memory without paying.",
      summary: [
        "PolyBuzz is the closest in shape to Character.AI: a community character library, characters you create yourself, and voice. It also accepts character cards from other platforms, which none of the other picks documents, so if you saved or wrote your characters as cards you can bring them in instead of retyping them.",
        "Its iPhone app left Apple's App Store in October 2026 and was still missing when we checked on 25 October, so use polybuzz.ai in a browser or the Android app. Free use shows ads and limits voice; the Basic membership was listed at $16.99 a month when we checked, and the terms are adults-only.",
      ],
    },
    {
      toolSlug: "talkie",
      label: "Best for teens 14 and over",
      bestFor: "Users who want a character chat app with a lower minimum age than most, plus collectible cards and a creator revenue share.",
      notIdealIf: "You want explicit content, want to see the subscription price before installing, or are a New York teen: a state law restricts character features for under-18s from 1 January 2027.",
      summary: [
        "Talkie, from SUBSUP and powered by MiniMax models, adds a game layer to character chat: conversations earn collectible cards, and creators can earn a share of revenue. The beta Talkie Claw feature lets characters send images, videos and songs and message you on Telegram or Discord.",
        "The minimum age is 14, or 15 to 16 in some countries, and pornographic and violent content are prohibited. Free use is available; Talkie+ is a monthly subscription bought in the mobile apps, and the website does not list its price. On iPhone, check that the developer is SUBSUP before installing.",
      ],
    },
    {
      toolSlug: "swerve",
      label: "Best for story roleplay on iPhone",
      bestFor: "Adults on iPhone who mostly used Character.AI for interactive stories rather than ongoing chats with one character.",
      notIdealIf: "You use Android or a browser, are under 18, or want to see prices before you install.",
      summary: [
        "Swerve is AI fiction that unfolds around what you say and do, from MSPW Labs, a Y Combinator-backed company in Palo Alto. It is iPhone-only for now; Android and web versions have waitlists, and Swerve warns that there is no official APK or web version yet.",
        "It is for adults only. A monthly subscription and gems are sold in the app, the website does not list prices, and all sales are final. Messages are screened for self-harm content, and the terms forbid sexually explicit contributions.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I want a community character library and to bring my own character cards", toolSlug: "polybuzz" },
    { situation: "I am a teen, or want an app with stricter content rules", toolSlug: "talkie" },
    { situation: "I am an adult on iPhone and mostly play interactive stories", toolSlug: "swerve" },
  ],
  faq: [
    {
      question: "Is Character.AI shutting down?",
      answer: "Not yet. Character.AI filed for Chapter 11 on 12 October 2026 to sell the company, and says the platform remains up and running. It also says that if the sale does not produce a buyer that keeps the platform going, the platform will be wound down. The sale is expected to finish by late November or early December 2026.",
    },
    {
      question: "How do I export my Character.AI chats?",
      answer: "Character.AI says you can export your data, or delete your account, in the app or on the Character.AI website. Do it now rather than near the end of the sale process, in case requests take time to arrive.",
    },
    {
      question: "What happens to my c.ai+ subscription?",
      answer: "Character.AI says subscriptions remain active and billing is unchanged for now, and that it intends to notify subscribers in advance if paid features change. It has not said whether unused time on a plan would be refunded if the platform winds down.",
    },
    {
      question: "Did Disney buy Character.AI?",
      answer: "No. Character.AI's press release names Disney Worldwide Services as the stalking-horse bidder for a non-exclusive perpetual licence to certain intellectual property and claims, for $20 million and transition services. That is not a purchase of the app, and other bidders can still make higher offers for the company.",
    },
    {
      question: "Can I move my characters to another app?",
      answer: "Character.AI has no export into other apps. PolyBuzz accepts character cards from other platforms, so it is the easiest place to bring characters you have saved as cards; on Talkie and Swerve you would recreate them by hand.",
    },
    {
      question: "Can teens in New York still use Character.AI and other character apps?",
      answer: "For now, yes. New York's S9051-B, signed on 28 October 2026 and in force from 1 January 2027, does not ban minors from chatbots, but it bars operators from giving users they know are under 18 what it calls unsafe features. These include a chatbot that presents itself as a human or a real or fictional person, implies a personal relationship, makes emotional appeals or flatters excessively, remembers personal information from an earlier session, or produces sexually explicit content. Operators must also offer more than one way to check age, including one that does not rely only on a government ID. The law's definition of an AI companion is broad, so character chat apps are likely to change what New York teens see, but none of the apps here had announced changes when we checked on 29 October 2026.",
    },
    {
      question: "Did you test these apps hands-on?",
      answer: "No. This guide is based on Character.AI's announcement of 12 October 2026 and its press release, each alternative's official website, help pages and terms, and Apple's public App Store listings, checked on 25 October 2026.",
    },
  ],
};
