import type { ComparePage } from "@/lib/editorial/types";

export const heygenVsSynthesia: ComparePage = {
  kind: "compare",
  slug: "heygen-vs-synthesia",
  title: "HeyGen vs Synthesia: which AI avatar video tool fits your team?",
  description: "HeyGen and Synthesia both turn scripts into AI avatar videos. We compare free plans, credits, translation, training features and team pricing.",
  author: "Ordalin",
  publishedAt: "2026-10-04",
  status: "draft",
  groupSlug: "video",
  intro: [
    "HeyGen and Synthesia are the two most common choices for making videos with an AI presenter instead of a camera. Both start from a script or a slide deck, both translate and dub videos, and both price usage in credits. They split on who the plans are built for: HeyGen leans towards creators who want long, high-resolution videos and their own avatar early, while Synthesia packs its paid plans with training features such as quizzes, branching and an API.",
    "This comparison is based on each company's official pricing pages and documentation, checked on the dates shown. We did not produce the same video in both tools.",
  ],
  verdict: "Choose HeyGen if you are a solo creator or marketer who wants a custom avatar on the free plan, 4K exports and videos up to 30 minutes from $29 a month. Choose Synthesia if you are building training or internal-communications videos and want interactive quizzes, branching and API access on a self-serve plan before you need an enterprise contract.",
  sides: [
    {
      toolSlug: "heygen",
      chooseIf: [
        "You want to try a custom video avatar before paying; the free plan includes one.",
        "You need long videos: up to 30 minutes on Creator and Pro, and 60 minutes on Business.",
        "You want 4K export, which starts on the $49 Pro plan.",
        "You translate a lot of footage and want voice cloning and lip-sync across 175+ languages and dialects.",
      ],
    },
    {
      toolSlug: "synthesia",
      chooseIf: [
        "You make training videos and want quizzes, clickable calls to action and branching paths on the $89 Creator plan.",
        "You want to automate video creation through an API without an enterprise contract.",
        "You want up to 10 minutes of video a month free, rather than a fixed number of short videos.",
        "You want to record your screen with a Chrome extension and edit the recording like any other scene.",
      ],
    },
  ],
  differences: [
    {
      topic: "Free plan",
      left: "Three videos a month, each up to one minute, with one custom avatar and trial access to Avatar IV. No card required.",
      right: "1,200 shared credits a month, enough for about 10 minutes of video. No card required, but downloading videos starts on Starter.",
    },
    {
      topic: "Entry paid plan",
      left: "Creator, $29 a month or $24 a month billed annually: 600 credits, videos up to 30 minutes, 1080p export, voice cloning and no watermark.",
      right: "Starter, $29 a month: 1,200 credits (about 10 minutes of video), downloads without the Synthesia logo, 125+ stock avatars, one editor and three guests.",
    },
    {
      topic: "Mid tier",
      left: "Pro from $49 a month adds 4K export, with credit tiers up to $4,300 a month. Business at $149 plus $20 a seat adds team features.",
      right: "Creator at $89 a month: 3,600 credits, five personal avatars, API access, interactive videos and one editor with five guests.",
    },
    {
      topic: "Translation and dubbing",
      left: "Video translation with voice cloning and lip-sync in 175+ languages and dialects.",
      right: "AI dubbing of uploaded files or YouTube links that keeps the speaker's voice, accent and tone. Avatar videos in 160+ languages; lip-sync doubles credit use.",
    },
    {
      topic: "Training and interactivity",
      left: "Interactive video, SCORM export and LMS integrations come with the $149 Business plan.",
      right: "Quizzes, calls to action and branching on Creator. SCORM export is listed on Enterprise.",
    },
    {
      topic: "Credits",
      left: "Monthly plans roll unused credits over for one month; annual credits build up until renewal. Usage varies by model, duration and complexity.",
      right: "One shared credit pool across video, dubbing and generated assets. Enterprise has custom credits and unlimited video minutes.",
    },
    {
      topic: "Custom avatars",
      left: "One custom avatar on Free and five on Business. Each needs on-camera verification from the person shown.",
      right: "Five personal avatars on Creator and unlimited on Enterprise. Studio Express-1 avatars cost $1,000 a year extra on annual plans.",
    },
  ],
  faq: [
    {
      question: "Which is cheaper to start with?",
      answer: "Both entry plans list $29 a month on monthly billing, and HeyGen Creator drops to $24 a month billed annually. HeyGen Creator includes 600 credits and videos up to 30 minutes; Synthesia Starter includes 1,200 credits, which Synthesia says covers about 10 minutes of video. Compare how many minutes you actually publish each month before deciding.",
    },
    {
      question: "Can I use either one for free?",
      answer: "Yes. HeyGen's free plan allows three videos a month of up to a minute each. Synthesia's Basic plan gives 1,200 credits a month, about 10 minutes of video, but downloading videos is listed from the Starter plan. Neither needs a credit card.",
    },
    {
      question: "Which is better for translating existing videos?",
      answer: "Both clone the speaker's voice. HeyGen lists translation with lip-sync in 175+ languages and dialects. Synthesia dubs uploaded files or YouTube links while keeping the original voice, accent and tone, and enabling lip-sync doubles the credits used.",
    },
    {
      question: "Can I make an avatar of myself?",
      answer: "Yes, on both. HeyGen includes one custom avatar on the free plan and requires on-camera verification from the person depicted. Synthesia includes five personal avatars on Creator and sells higher-quality Studio Express-1 avatars as a $1,000-a-year add-on for annual plans.",
    },
    {
      question: "Did you test both tools with the same script?",
      answer: "No. This comparison uses each vendor's official pricing pages and documentation, checked on the dates shown on each tool's profile.",
    },
  ],
};
