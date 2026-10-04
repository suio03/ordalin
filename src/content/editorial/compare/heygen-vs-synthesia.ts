import type { ComparePage } from "@/lib/editorial/types";

export const heygenVsSynthesia: ComparePage = {
  kind: "compare",
  slug: "heygen-vs-synthesia",
  title: "HeyGen vs Synthesia: which AI avatar video tool fits your team?",
  description: "HeyGen and Synthesia both turn scripts into AI avatar videos. We compare free plans, credits, translation, training features and team pricing.",
  author: "Ordalin",
  publishedAt: "2026-10-04",
  status: "published",
  groupSlug: "video",
  intro: [
    "HeyGen and Synthesia are the two most common choices for making videos with an AI presenter instead of a camera. Both start from a script or a slide deck, both translate and dub videos, and both price usage in credits. They split on who the plans are built for: HeyGen leans towards creators who want long, high-resolution videos and their own avatar early, while Synthesia builds its plans around training features such as quizzes, branching and SCORM export.",
    "This comparison is based on each company's official pricing pages and help-centre articles, checked on the dates shown, including Synthesia's plan changes of October 1, 2026. We did not produce the same video in both tools.",
  ],
  verdict: "Choose HeyGen if you are a solo creator or marketer who wants a custom avatar on the free plan, videos up to 30 minutes from $29 a month, 4K export from $49, or an API you can pay for as you go. Choose Synthesia if you are building training or internal-communications videos and want interactive quizzes and branching on a self-serve plan, plus 10 minutes of video included every month on every plan.",
  sides: [
    {
      toolSlug: "heygen",
      chooseIf: [
        "You want to try a custom video avatar before paying; the free plan includes one.",
        "You need long videos: up to 30 minutes on Creator and Pro, and 60 minutes on Business.",
        "You want 4K export, which starts on the $49 Pro plan.",
        "You want API access without a subscription: HeyGen sells pay-as-you-go API credits separately from its plans, even to free users.",
      ],
    },
    {
      toolSlug: "synthesia",
      chooseIf: [
        "You make training videos and want quizzes, clickable calls to action and branching paths on the $89 Pro plan.",
        "You want a monthly allowance on every plan: 10 minutes of video, 3 survey responses and 500 credits, even on the free Basic plan.",
        "You want the lowest yearly price for an entry plan: Starter is $18 a month billed yearly.",
        "You want to record your screen with a Chrome extension, remove filler words and edit the recording like any other scene.",
      ],
    },
  ],
  differences: [
    {
      topic: "Free plan",
      left: "One to three videos a month depending on region, each up to one minute and shared through a 720p link, with one custom avatar and limited trial access to Avatar IV.",
      right: "10 minutes of video or dubbing, 3 survey responses and 500 credits a month. Videos carry a Synthesia watermark and are shared by link; downloading starts on Starter.",
    },
    {
      topic: "Entry paid plan",
      left: "Creator, $29 a month or $24 a month billed annually: 600 credits, videos up to 30 minutes, 1080p export, voice cloning and no watermark.",
      right: "Starter, $29 a month or $18 a month billed yearly: 1,250 extra credits (about 12 more minutes of video), downloads without the Synthesia logo, 125+ stock avatars and three guests.",
    },
    {
      topic: "Mid tier",
      left: "Pro from $49 a month adds 4K export, with credit tiers up to $4,300 a month. Business at $149 plus $20 a seat adds shared credits, SSO, SCORM export and interactive video.",
      right: "Pro (formerly Creator), $89 a month or $64 billed yearly: 6,000 extra credits (about 60 more minutes), five personal avatars, interactive videos and five guests. Pro 2× to 8× tiers run up to $676 a month.",
    },
    {
      topic: "Translation and dubbing",
      left: "Upload a video or paste a YouTube link to translate it with voice cloning and lip-sync into 175+ languages and dialects. Pro and above can proofread the translated script.",
      right: "AI dubbing of uploaded files or YouTube links in the speaker's own voice. Lip-synced dubbing uses 80 credits a minute, twice the rate without lip-sync. Avatar videos in 160+ languages.",
    },
    {
      topic: "Training and interactivity",
      left: "Interactive video, SCORM export and LMS integration support come with the $149 Business plan.",
      right: "Quizzes, calls to action and branching on Pro, with quiz and completion analytics. SCORM export is listed on Enterprise.",
    },
    {
      topic: "Credits",
      left: "Monthly plans roll unused credits over for one month; annual credits build up until renewal. Usage varies by model, duration and complexity.",
      right: "One shared pool for video (about 100 credits a minute), dubbing, surveys and the API. Unused credits reset each billing period, and purchases are non-refundable.",
    },
    {
      topic: "Custom avatars",
      left: "One custom avatar on Free, Creator and Pro. Business includes 10 slots by default, or 5 for new purchases in some regions from August 6, 2026. Each avatar needs on-camera verification from the person shown.",
      right: "Five personal avatars on Pro and unlimited on Enterprise, each made with a consent video. Studio Express-1 avatars cost $1,000 a year extra on annual plans.",
    },
    {
      topic: "API",
      left: "Pay-as-you-go API credits, separate from the app plans; for example, Avatar IV digital-twin video costs $4.83 a minute.",
      right: "API video draws on your plan's credits at 160 credits a minute. Real-time Interactive Avatars are billed pay-as-you-go at $0.12 a minute.",
    },
  ],
  faq: [
    {
      question: "Which is cheaper to start with?",
      answer: "Both entry plans cost $29 a month on monthly billing. Billed yearly, Synthesia Starter drops to $18 a month and HeyGen Creator to $24. HeyGen Creator includes 600 credits and videos up to 30 minutes. Synthesia Starter adds 1,250 credits, about 12 minutes of video, on top of the 10 minutes every Synthesia plan includes. Compare how many minutes you actually publish each month before deciding.",
    },
    {
      question: "Can I use either one for free?",
      answer: "Yes. HeyGen's free plan allows one to three videos a month depending on your region, each up to a minute, shared through a 720p link. Synthesia's Basic plan includes 10 minutes of video a month, but videos carry a watermark and can only be shared by link; downloading starts on Starter.",
    },
    {
      question: "Which is better for translating existing videos?",
      answer: "Both clone the speaker's voice and accept YouTube links. HeyGen lists translation with lip-sync in 175+ languages and dialects and lets Pro users proofread the translated script. Synthesia dubs uploaded files or YouTube links in the speaker's own voice, and lip-synced dubbing uses twice the credits of dubbing without lip-sync.",
    },
    {
      question: "Can I make an avatar of myself?",
      answer: "Yes, on both. HeyGen includes one custom avatar even on the free plan and requires on-camera verification from the person depicted. Synthesia includes five personal avatars on Pro, made from a short consent video, and sells higher-quality Studio Express-1 avatars as a $1,000-a-year add-on for annual plans.",
    },
    {
      question: "Do I need a subscription to use the API?",
      answer: "Not for HeyGen: its API runs on pay-as-you-go credits bought separately from the app plans, and free users can buy them too. Synthesia's video API draws on the same credit pool as your plan, at 160 credits a minute, while its real-time Interactive Avatars are billed pay-as-you-go per minute.",
    },
    {
      question: "Did you test both tools with the same script?",
      answer: "No. This comparison uses each vendor's official pricing pages and help-centre articles, checked on the dates shown on each tool's profile.",
    },
  ],
};
