import type { AlternativesPage } from "@/lib/editorial/types";

export const polybuzzAlternatives: AlternativesPage = {
  kind: "alternatives",
  slug: "polybuzz",
  title: "PolyBuzz alternatives after the iPhone app left the App Store",
  description: "PolyBuzz's iPhone app is gone from the App Store. Three AI character chat apps compared on platforms, age limits, content rules and price.",
  author: "Ordalin",
  publishedAt: "2026-10-22",
  updatedAt: "2026-10-25",
  status: "published",
  groupSlug: "writing",
  anchorSlug: "polybuzz",
  intro: [
    "PolyBuzz's iPhone app disappeared from Apple's App Store in October 2026. The listing was still live in an archived copy from 4 October and returned \"not found\" by 16 October; as of 22 October, Apple's own lookup service returns no PolyBuzz app in the US, UK, Australian or other stores we checked. Neither Apple nor PolyBuzz has published a reason. PolyBuzz is not shut down: the website polybuzz.ai and the Android app on Google Play still work, and the Play listing was updated on 20 October. If you already have the app on your iPhone it may keep running, but you cannot download it again and may not get updates.",
    "Be careful with look-alike apps: an App Store search for PolyBuzz now shows unrelated apps with similar names. If you want to keep your characters, PolyBuzz on the web is the direct route. If you want to move on, the apps below are character chat services that are still available, chosen for where they run, who they are for and how they charge. The comparisons come from each company's official website, help pages and terms, not from hands-on testing.",
  ],
  whySwitch: [
    "You use an iPhone. The PolyBuzz app is no longer on the App Store, so new installs are only possible on Android or through the website, even though PolyBuzz's FAQ still points to both stores.",
    "You find membership expensive. Free use shows ads and limits voice, and when we checked, the Basic membership was listed at $16.99 a month or $164.99 a year, with prices varying by region.",
    "You want longer memory. PolyBuzz says characters can forget earlier parts of long chats, and its permanent-memory model is reserved for the top membership tier.",
    "You want clearer account rules. The terms are adults-only and let PolyBuzz suspend accounts when it believes a birthdate is false, while an older FAQ answer still mentions a Teen Mode.",
  ],
  picks: [
    {
      toolSlug: "character-ai",
      label: "Largest library on web, iPhone and Android",
      bestFor: "People who want millions of community characters, free unlimited messaging and apps on every platform, and accept that the service's future depends on a sale.",
      notIdealIf: "You want an app you can rely on long term: Character.AI filed for Chapter 11 in October 2026 and may be wound down if no buyer keeps it running.",
      summary: [
        "Character.AI filed for Chapter 11 on 12 October 2026 to sell the company. It is still running and subscriptions still bill as normal, but it says the platform will be wound down if the sale, expected to finish by late November or early December 2026, does not produce a buyer that keeps it going. Character.AI has more than 10 million user-made characters and lets you create your own, with guides on writing personas and scenes. Messaging is free and unlimited on the standard chat styles, with 15 memory pins; when the service is busy, free users can be placed in a waiting room.",
        "(c.ai) lite starts at $4.99 a month (varying by region) for daily premium chat styles, fewer ads and 30 memory pins, and c.ai+ adds unlimited premium styles, no ads and Lorebooks. The terms set a minimum age of 13, or 16 in the EEA and UK, and teens can share a weekly Parental Insights report with a parent.",
      ],
    },
    {
      toolSlug: "swerve",
      label: "Best for story roleplay on iPhone",
      bestFor: "Adults on iPhone who mainly used PolyBuzz for interactive stories and want an App Store app.",
      notIdealIf: "You use Android or a browser, are under 18, or want to see prices before you install.",
      summary: [
        "Swerve is AI fiction that unfolds around what you say and do, from MSPW Labs, a Y Combinator-backed company in Palo Alto. It is iPhone-only for now; Android and web versions have waitlists, and Swerve warns that there is no official APK or web version yet.",
        "It is for adults only. A monthly subscription and gems are sold in the app, the website does not list prices, and all sales are final. Messages are screened for self-harm content, and the terms forbid sexually explicit contributions.",
      ],
    },
    {
      toolSlug: "talkie",
      label: "Best for collecting and creating characters",
      bestFor: "Android and web users who like collecting cards from chats, or who create characters and want a revenue share.",
      notIdealIf: "You need an iPhone app: the main Talkie app was not listed on the US, UK or Australian App Store when we checked.",
      summary: [
        "Talkie, from SUBSUP and powered by MiniMax models, adds a game layer to character chat: conversations earn collectible cards that can be traded for virtual currency, and creators can earn a share of revenue. The beta Talkie Claw feature lets characters send images, videos and songs and message you on Telegram or Discord.",
        "Free use is available, and Talkie+ is a monthly subscription bought in the mobile apps; the website advertises a discount but not the price. The minimum age is 14, or 15 to 16 in some countries, and pornographic and violent content are prohibited.",
      ],
    },
  ],
  decisionGuide: [
    { situation: "I want a free app on iPhone, Android and the web now, even if it may not last", toolSlug: "character-ai" },
    { situation: "I am an adult on iPhone and mostly play interactive stories", toolSlug: "swerve" },
    { situation: "I am on Android and enjoy collecting or creating characters", toolSlug: "talkie" },
  ],
  faq: [
    {
      question: "Did PolyBuzz get deleted?",
      answer: "No. Only the iPhone app was removed from the App Store, between 4 and 16 October 2026. The website polybuzz.ai and the Android app on Google Play were still working on 22 October, and your account can be used through the website.",
    },
    {
      question: "Is PolyBuzz banned?",
      answer: "There is no public ban. Apple has not said why the app left the App Store, and PolyBuzz has not published a statement. The service remains available on the web and on Google Play, where it is rated Mature 17+; PolyBuzz's own terms require users to be 18 or older.",
    },
    {
      question: "Is the PolyBuzz app on the App Store a fake?",
      answer: "When we checked on 22 October 2026, the official PolyBuzz app was not on the App Store, so any app that appears in a PolyBuzz search there is a different product. Use polybuzz.ai in your browser instead.",
    },
    {
      question: "Can I move my PolyBuzz characters to another app?",
      answer: "None of these alternatives documents an import from PolyBuzz. Character.AI and Talkie let you recreate a character by hand. PolyBuzz itself accepts character cards from other platforms, so moving in the other direction is easier.",
    },
    {
      question: "Is Character.AI still a safe choice?",
      answer: "It works today, but Character.AI filed for Chapter 11 on 12 October 2026 and says the platform will be wound down if its sale does not produce a buyer that keeps it running. The sale is expected to finish by late November or early December 2026. If you move there, avoid long prepaid plans and export your data from time to time.",
    },
    {
      question: "Did you test these apps hands-on?",
      answer: "No. This guide is based on each company's official website, help pages and terms, checked on the dates shown on each tool's profile, plus Apple's and Google's public store listings for availability.",
    },
  ],
};
