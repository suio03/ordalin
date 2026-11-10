# SERP research: reaction time test

- Market: US, English. Date: 2026-11-11.
- Sources: Google autocomplete (gl=us), live Google SERP (`pws=0`, Chrome) for `reaction time test` and `reaction test`, Google Trends (US, 12 months), top pages measured with `density.py`.
- Failed: Semrush mirror node unavailable today, so there are no absolute volumes or KD. humanbenchmark.com returned a JS shell and cpstest.org a Cloudflare challenge to curl (not measured). The uneed.best/tool/reaction-time-test URL returned 404 to curl.

## Conclusions

- **Intent:** people want to take the test right now, in the browser. Every top result is a playable test. Secondary intent is reading their score ("is 200ms slow?", average by age).
- **Twin keyword:** `reaction test`. Its SERP shares 8 of 9 URLs with `reaction time test`, so it is the same intent. Trends (US, 12 mo) averages 66 vs 28. But a Trends term without quotes also counts queries that contain both words, so `reaction test` includes `reaction time test`. The target stays `reaction time test`, and `reaction test` goes in the title. `reaction speed test` (4) is the same intent but small.
- **Not a twin:** `reflex test` (23) is mostly medical (knee reflex, reflex hammer, grading scale), so it is excluded. `human benchmark` (33) is a brand.
- **Seasonality:** peaks in Feb–Apr (school science projects), lowest in Jul–Aug.
- **Modifiers from autocomplete:**
  - Variants: spacebar/keyboard/click, sound/auditory, F1 start lights, mobile/phone, world record, ms/milliseconds, online/free, with countdown/leaderboard.
  - Audiences: drivers, kids, gamers/FPS/Valorant/CS2, goalkeepers.
  - Other test types: choice, visual, and the ruler test.
- **Score questions (good for an FAQ):** Is 200ms slow? Is 100ms fast? Is 275 good? How fast is a 13-year-old? Average reaction time by age, for drivers, for gamers, for an F1 driver. Are reaction time tests accurate (monitor and input lag)?
- **Claims we can make truthfully once built:** free, no sign-up, works on mobile, spacebar or click or tap, results in ms with an average over 5 tries. We cannot claim lab accuracy; browser, display and input lag add latency.
- **Excluded intents:** medical reflex tests, driving-licence hazard perception tests, "best reaction time games" listicles, and cheats.
- **Competition:** humanbenchmark.com is #1 for both terms and is a strong domain. The rest are small tool sites (cpstest, clickreflex, testyourreactiontime, measurehuman) plus iobit, justpark and university/GSK pages. Ordalin's Authority Score is 2, so the head term is a long shot at first. The realistic entry points are the modifier long tails (F1 lights, sound, spacebar, by age, "is X ms good").

## Top pages

| Page | Words | H1 | "reaction time test" (3-gram) |
|---|---|---|---|
| humanbenchmark.com/tests/reactiontime | JS shell | – | not measured |
| cpstest.org/reaction-time-test | challenge | – | not measured |
| iobit.com/en/reaction-time-test.php | 2498 | IObit Reaction Time Test - Test Your Reaction Speed Now | 1.1%, rank 1 |
| faculty.washington.edu (redgreen) | 119 | none | 1.7%, rank 3 |
| justpark.com/creative/reaction-time-test | 265 | How old… (by age) | 0.8% |
| testyourreactiontime.com/tests | 901 | All Cognitive Reflex & Reaction Time Tests | 1.4%, rank 1 |
| clickreflex.com | 721 | Test Your Reflexes Like a Pro | 0.3% |

## Recurring sections

- The test itself, above the fold: wait for green, then click, tap or press space; too-early detection; 5 tries; average and best.
- Score interpretation: average human ~200–250 ms, comparison by age or group (JustPark is built around age).
- Test variants: auditory, F1 start lights, choice reaction, go/no-go (testyourreactiontime has 15+).
- Accuracy notes: monitor refresh rate, input lag, mouse vs keyboard (clickreflex has an input-lag diagnostic).
- How to improve (sleep, practice, warm-up), with gaming angles (Valorant/CS2).
- FAQ in typed words.
