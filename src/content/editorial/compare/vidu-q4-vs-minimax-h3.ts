import type { ComparePage } from "@/lib/editorial/types";

export const viduQ4VsMinimaxH3: ComparePage = {
  kind: "compare",
  slug: "vidu-q4-vs-minimax-h3",
  title: "Vidu Q4 vs MiniMax H3: inputs, clip length, audio and pricing",
  description: "Vidu Q4 animates images into clips up to 16 seconds and 4K; MiniMax H3 mixes text, image, video and audio inputs. We compare inputs, audio and pricing.",
  author: "Ordalin",
  publishedAt: "2026-10-16",
  status: "published",
  groupSlug: "video",
  intro: [
    "Vidu Q4 and MiniMax H3 are two of the newest AI video models. MiniMax launched H3 on July 31, 2026, and Vidu offers Q4 as a preview model on its developer platform. Both generate short clips with sound produced together with the picture, so the choice comes down to what you start from, how long and sharp the clip needs to be, and how you want to pay.",
    "Vidu Q4 starts from images: one start frame, or a set of reference images, guided by a text prompt. MiniMax H3 takes text, images, video clips and audio as context in a single prompt, and also edits and re-uses motion from existing footage. Vidu publishes an exact per-second credit price; MiniMax's launch post does not.",
    "This comparison is based on Vidu's API documentation and pricing page and on MiniMax's H3 launch post, checked on the dates shown. We did not generate the same shot with both models.",
  ],
  verdict: "Choose Vidu Q4 if you want to animate a product shot or character images into a clip of up to 16 seconds, need 4K output, or need to know the exact cost per second before you build it into an app. Choose MiniMax H3 if your shot depends on mixing several kinds of reference, such as a camera move from one clip and a character from an image, or if you need to edit footage or transfer motion rather than generate from a still.",
  sides: [
    {
      toolSlug: "vidu-q4",
      chooseIf: [
        "You start from a still image or a set of reference images and want them animated with a text prompt.",
        "You need longer or sharper clips: 3 to 16 seconds, from 540p up to 2K and 4K.",
        "You want a published price: 9 to 78 credits per second depending on resolution, at a standard rate of $0.005 per credit.",
        "You are building video generation into an app and want an asynchronous REST API with callbacks.",
      ],
    },
    {
      toolSlug: "minimax-h3",
      chooseIf: [
        "You want to combine text, images, video clips and audio in one prompt and describe how each relates to the shot.",
        "You need editing as well as generation, including V2V motion transfer from a reference clip.",
        "You want voice, sound effects and music generated together in stereo with the video.",
        "Your clips contain product names, titles or brand text, which MiniMax says H3 renders accurately at 2K.",
      ],
    },
  ],
  differences: [
    {
      topic: "What you start from",
      left: "One start-frame image (PNG, JPEG or WebP, up to 50 MB) for image-to-video, or a set of reference images for reference-to-video, plus a prompt of up to 20,000 characters.",
      right: "Text, images, video clips and audio combined as context in one prompt, with plain-language instructions on how they relate to the target shot.",
    },
    {
      topic: "Clip length and resolution",
      left: "3 to 16 seconds (5 by default), from 540p up to 2K and 4K (720p by default).",
      right: "Up to 15 seconds, at 2K by default, with native multi-shot modelling. A cheaper 768p output is also mentioned in the pricing note.",
    },
    {
      topic: "Audio",
      left: "Generates sound with the video by default, including dialogue and sound effects. Audio can be switched off for silent clips.",
      right: "Generates stereo audio jointly with the video, covering voice, sound effects and music in one model rather than separate ones.",
    },
    {
      topic: "Editing and motion transfer",
      left: "Documented for image-to-video and reference-to-video generation, with automatic camera switching within a clip. Editing of existing footage is not listed.",
      right: "One model covers generation, reference-based creation and editing, including V2V motion transfer that re-uses a camera move or motion from a reference clip.",
    },
    {
      topic: "Pricing",
      left: "Prepaid credits per second of output: 9 at 540p, 19 at 720p, 24 at 1080p, 38 at 2K and 78 at 4K. At $0.005 per credit, a second of 720p is about $0.095. Failed generations are not charged.",
      right: "Billed per second of video, but the launch post gives no exact rate. MiniMax only says the 2K price is under a third of mainstream models and 768p under half of mainstream 720p.",
    },
    {
      topic: "Where you use it",
      left: "A REST API on the Vidu Open Platform, with API keys and credit purchases in its console. Result links last 24 hours, so outputs must be downloaded promptly.",
      right: "MiniMax points users to its Hailuo AI video site to try H3 hands-on.",
    },
    {
      topic: "Maturity",
      left: "Listed as a preview model (viduq4-preview), so parameters and pricing may change.",
      right: "Launched on July 31, 2026. MiniMax says multimodal understanding and visual detail in some scenarios still need work.",
    },
  ],
  faq: [
    {
      question: "Can Vidu Q4 make a video from text alone?",
      answer: "Vidu documents Q4 preview for image-to-video and reference-to-video, so you start from at least one image and guide it with a prompt. If you want to start from a text description, or mix in video and audio references, MiniMax H3 takes all of those as input.",
    },
    {
      question: "Which one makes longer or higher-resolution clips?",
      answer: "Vidu Q4 goes slightly further on both: clips of 3 to 16 seconds and resolutions up to 4K. MiniMax H3 generates up to 15 seconds at 2K by default, and uses in-context regeneration to recover small text and fine detail at 2K instead of a separate upscaler.",
    },
    {
      question: "How much does each cost?",
      answer: "Vidu Q4 preview costs 9 to 78 credits per second depending on resolution, with a standard rate of $0.005 per credit and cheaper rates on larger, time-limited credit packages. MiniMax prices H3 per second of video but its launch post gives no exact figure, only that it is cheaper than mainstream models. Check each tool's profile for the current pricing details.",
    },
    {
      question: "Do both generate sound?",
      answer: "Yes. Vidu Q4 generates dialogue and sound effects with the video by default and can turn audio off. MiniMax H3 generates stereo voice, sound effects and music together with the picture.",
    },
    {
      question: "Did you test both models with the same prompt?",
      answer: "No. This comparison uses Vidu's API documentation and pricing page and MiniMax's launch post, checked on the dates shown on each tool's profile.",
    },
  ],
};
