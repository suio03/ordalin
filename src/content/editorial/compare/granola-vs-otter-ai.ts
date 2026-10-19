import type { ComparePage } from "@/lib/editorial/types";

export const granolaVsOtter: ComparePage = {
  kind: "compare",
  slug: "granola-vs-otter-ai",
  title: "Granola vs Otter: which AI meeting notes app should you use?",
  description: "Granola takes bot-free notes from your own device; Otter can send a bot and caps free minutes. We compare free limits, prices, languages and recordings.",
  author: "Ordalin",
  publishedAt: "2026-10-19",
  status: "published",
  groupSlug: "productivity",
  intro: [
    "Granola and Otter.ai both turn meetings into transcripts and AI summaries you can search and question later. They start from different ideas. Granola is a notepad: it listens through your own computer or phone, never joins the call, and builds the summary around the notes you type. Otter is a meeting assistant: it can join Zoom, Microsoft Teams and Google Meet by itself, transcribes live, and keeps the audio so you can play it back.",
    "That difference decides most of the choice, and it also shapes the free plans. Granola's free plan has no daily transcription cap but shows only the last 30 days of notes. Otter's free plan has no time cutoff but shows only the 25 most recent conversations, and it limits minutes and meeting length.",
    "This comparison uses each company's official pricing pages and help documentation. We rechecked both pricing pages on 19 October 2026. We did not record the same meetings with both tools.",
  ],
  verdict: "Choose Granola if you join most calls yourself, want notes shaped by what you wrote down, and would rather no bot appeared in the meeting; its free plan suits occasional use if 30 days of history is enough. Choose Otter if you want meetings recorded even when you are not there, need to replay the audio, or want a free plan whose recent conversations stay visible however old they are, within a monthly minute allowance.",
  sides: [
    {
      toolSlug: "granola",
      chooseIf: [
        "You don't want a bot in the call; Granola only captures your own computer or phone audio.",
        "You type a few notes during meetings and want the summary built around them.",
        "Your meetings switch between languages; the desktop apps cover 31 and can follow a change mid-meeting.",
        "You are a student or at a startup and can apply for 12 months of Business for free.",
      ],
    },
    {
      toolSlug: "otter-ai",
      chooseIf: [
        "You want an assistant to join Zoom, Teams or Google Meet and take notes when you can't attend.",
        "You want to replay the recording, not just read the transcript.",
        "You want a free plan with no 30-day cutoff and can live with 300 minutes a month, 30 minutes per conversation and your 25 most recent conversations.",
        "You transcribe uploaded recordings such as interviews or lectures as well as live meetings.",
      ],
    },
  ],
  differences: [
    {
      topic: "How it records",
      left: "No meeting bot. The desktop app (macOS or Windows) or mobile app captures your microphone and system audio, and you start each session.",
      right: "An assistant can join Zoom, Teams and Google Meet automatically. You can also record without a bot from the Mac or Windows app, Chrome or a phone.",
    },
    {
      topic: "Free plan",
      left: "No daily transcription limit. Notes older than 30 days are kept but hidden in the app until you upgrade; you can export their titles and summaries as a CSV.",
      right: "300 minutes a month, up to 30 minutes per conversation, the 25 most recent conversations, three lifetime file imports and 20 AI Chat questions a month.",
    },
    {
      topic: "Paid entry plan",
      left: "Business at $14 per user a month, billed monthly only. Adds unlimited history, model choice in Chat, pre-meeting briefs and follow-up emails.",
      right: "Pro at $16.99 per user a month, or $8.33 a month billed annually. Adds 1,200 minutes, meetings up to 90 minutes and 10 file imports a month.",
    },
    {
      topic: "Audio afterwards",
      left: "Audio is deleted once it has been transcribed, so there is no recording to replay.",
      right: "Every plan includes audio playback, with speed control and skip silence on paid plans.",
    },
    {
      topic: "Languages",
      left: "31 transcription languages on desktop and 17 on mobile. Desktop can switch languages within one meeting.",
      right: "AI transcription in English, Spanish, French, German, Japanese and Chinese.",
    },
    {
      topic: "Student pricing",
      left: "Accepted students can get 12 months of Business free by applying with an academic email.",
      right: "20% off Pro with a .edu email: $13.59 a month, or $79.99 a year.",
    },
    {
      topic: "Larger teams",
      left: "Enterprise from $35 per user a month adds SSO, SCIM, Salesforce and HIPAA-compliant workspaces. The billing guide offers SSO to teams of 50 or more.",
      right: "Business at $19.99 a month billed annually allows four-hour meetings and unlimited meeting minutes. SSO and SCIM need at least 100 Enterprise licences.",
    },
  ],
  faq: [
    {
      question: "Does Granola join my meetings as a bot?",
      answer: "No. Granola's help centre says there is no meeting bot: it runs on your computer or phone and transcribes your microphone and system audio. Other participants see no extra attendee, so Granola recommends telling them you are taking AI notes.",
    },
    {
      question: "Is Granola's free plan really unlimited?",
      answer: "Transcription has no daily limit on any plan, but on Basic the app only shows notes from the last 30 days. Older notes are kept, not deleted, and come back if you upgrade. Some third-party articles describe a different free limit, so go by Granola's own billing guide.",
    },
    {
      question: "Can Otter take notes without a bot?",
      answer: "Yes. Otter's Mac and Windows app and its Chrome extension can record without a bot joining the call, and the iOS and Android apps can record too. The automatic assistant is optional.",
    },
    {
      question: "Which is cheaper for one person?",
      answer: "Paid monthly, Granola Business costs $14 and Otter Pro costs $16.99. Paid annually, Otter Pro drops to $8.33 a month, while Granola offers no annual billing below Enterprise. Granola's free plan has no minute cap, which may matter more than either price if you only need recent notes.",
    },
    {
      question: "Can I replay a meeting recording in Granola?",
      answer: "No. Granola deletes the audio after transcription and keeps the transcript and notes. If you need to listen back, Otter keeps the recording on every plan.",
    },
    {
      question: "Did you test both apps in the same meetings?",
      answer: "No. This comparison is based on each company's official pricing pages and help documentation, not hands-on use.",
    },
  ],
};
