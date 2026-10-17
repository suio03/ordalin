import type { ComparePage } from "@/lib/editorial/types";

export const kling4VsViduQ4: ComparePage = {
  kind: "compare",
  slug: "kling-4-0-vs-vidu-q4",
  title: "Kling 4.0 vs Vidu Q4: clip length, references, editing and access",
  description: "Kling 4.0 generates 3 to 30 second clips in the Kling web app; Vidu Q4 is a preview API model for 3 to 16 second clips. We compare inputs, audio and pricing.",
  author: "Ordalin",
  publishedAt: "2026-10-17",
  status: "published",
  groupSlug: "video",
  intro: [
    "Kling 4.0 and Vidu Q4 are two of the newest AI video models from Chinese labs. Kling AI announced the global launch of Kling 4.0 on October 16, 2026, after a preview that began on September 28. Vidu offers Q4 as a preview model on its developer platform. Both generate clips with sound made together with the picture, so the choice comes down to how long the shot runs, how much reference material you bring, and whether you work in an app or through an API.",
    "Kling 4.0 is a creator app first: it generates 3 to 30 seconds in one pass, takes up to 15 combined references and 10 keyframes, and edits existing footage. Its API is announced but not yet open. Vidu Q4 is an API first: it animates a start frame or a set of reference images into 3 to 16 seconds at up to 4K, with an exact per-second credit price.",
    "This comparison is based on Kling AI's launch announcement, product guide and feature pages, and on Vidu's API documentation and pricing page, checked on the dates shown. We did not generate the same shot with both models.",
  ],
  verdict: "Choose Kling 4.0 if you work in a web app and need longer takes of up to 30 seconds, tight control over story beats with keyframes and video references, or edits to existing footage. Choose Vidu Q4 if you are building video generation into a product and need an API and a published per-second price today, or if you animate product and character images into short clips of up to 16 seconds.",
  sides: [
    {
      toolSlug: "kling-4-0",
      chooseIf: [
        "You need one continuous generation longer than 16 seconds: Kling 4.0 runs from 3 to 30 seconds.",
        "You plan a shot beat by beat and want up to 10 keyframes along the timeline.",
        "You want to steer a shot with reference videos, including white-model and depth-map clips, alongside images and subjects.",
        "You need to edit existing footage, such as replacing a product or changing a background, rather than only generate new clips.",
      ],
    },
    {
      toolSlug: "vidu-q4",
      chooseIf: [
        "You are building video generation into an app and need an API now; Kling has only said its 4.0 API is coming soon.",
        "You want a published price: 9 to 78 credits per second depending on resolution, at a standard rate of $0.005 per credit.",
        "You start from a still image, or up to 15 reference images plus up to 3 voice clips, and want them animated with a prompt.",
        "You need 4K output from a documented API parameter today.",
      ],
    },
  ],
  differences: [
    {
      topic: "Where you use it",
      left: "The Kling AI website, with a redesigned creation page, timeline editing, Canvas and an Agent. Kling says API access for enterprises and developers is coming soon, and Adobe says Kling 4.0 is coming to Firefly.",
      right: "A REST API on the Vidu Open Platform, with API keys and credit purchases in its console. Result links last 24 hours, so outputs must be downloaded promptly.",
    },
    {
      topic: "Clip length",
      left: "3 to 30 seconds in one generation. Kling also says an uploaded video can be extended to up to two minutes.",
      right: "3 to 16 seconds per generation, 5 by default.",
    },
    {
      topic: "What you start from",
      left: "Text alone, a start and end frame, or Omni Reference with up to 15 combined assets: up to 10 images, up to 5 videos totalling 30 seconds, and up to 7 subjects, plus voice references. Prompts run up to 8,000 tokens.",
      right: "One start-frame image for image-to-video, or 1 to 15 reference images and up to 3 MP3 voice clips for reference-to-video, with a prompt of up to 20,000 characters. Q4 has no documented text-only mode.",
    },
    {
      topic: "Timing control and editing",
      left: "Up to 10 keyframes to fix what happens when. Multimodal editing adds, replaces or removes elements in existing footage, with up to 5 input videos per edit.",
      right: "Automatic camera switching within a clip. Editing of existing footage is not listed for Q4.",
    },
    {
      topic: "Resolution",
      left: "Kling's product guide lists 4K output and 21:9 ultrawide video. Its launch release says 10-bit HDR at 1080p and 4K is coming soon.",
      right: "540p, 720p, 1080p, 2K and 4K, set per request (720p by default).",
    },
    {
      topic: "Audio",
      left: "Native dialogue, sound effects and ambient sound in two-channel stereo, with improved lip sync and dialogue in English, Japanese, Korean, Spanish, Portuguese, German, French, Hindi and other languages.",
      right: "Generates dialogue and sound effects with the video by default; audio can be switched off for silent clips. Reference voice clips keep a character's voice consistent.",
    },
    {
      topic: "Pricing",
      left: "Credits in the Kling app, with free generation for eligible users and a watermark on free exports. Kling has not published 4.0 API rates.",
      right: "Prepaid credits per second of output: 9 at 540p, 19 at 720p, 24 at 1080p, 38 at 2K and 78 at 4K. At $0.005 per credit, a second of 720p is about $0.095. Failed generations are not charged.",
    },
  ],
  faq: [
    {
      question: "Can I use Kling 4.0 through an API yet?",
      answer: "Not yet. Kling AI's October 16, 2026 launch announcement says Kling 4.0 is fully available on the Kling AI website and will come to enterprise customers and developers through API access soon. Vidu Q4 preview is available through Vidu's API now.",
    },
    {
      question: "Which one makes longer clips?",
      answer: "Kling 4.0. It generates 3 to 30 seconds in one pass, and Kling says an uploaded video can be extended to up to two minutes. Vidu Q4 generates 3 to 16 seconds per request.",
    },
    {
      question: "Can either model start from text alone?",
      answer: "Kling 4.0 supports text-to-video without a reference image. Vidu documents Q4 preview for image-to-video and reference-to-video, so you start from at least one image and guide it with a prompt.",
    },
    {
      question: "Do both generate sound?",
      answer: "Yes. Kling 4.0 generates dialogue, sound effects and ambient sound in stereo with multilingual lip sync. Vidu Q4 generates dialogue and sound effects with the video by default, can take up to three voice clips as reference, and can turn audio off.",
    },
    {
      question: "Did you test both models with the same prompt?",
      answer: "No. This comparison uses Kling AI's launch announcement, product guide and feature pages, and Vidu's API documentation and pricing page, checked on the dates shown on each tool's profile.",
    },
  ],
};
