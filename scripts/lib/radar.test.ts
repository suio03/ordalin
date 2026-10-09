import { baseModelId, decodeText, looksLikeLaunch, matchesKnown, nameKey, parseFeed } from "./radar";

describe("radar feed parsing", () => {
  it("reads RSS items", () => {
    const xml = `<rss><channel><title>Google News</title>
      <item><title>Google launches Gemini agent &amp; more - Reuters</title><link>https://news.google.com/a</link>
      <pubDate>Thu, 08 Oct 2026 16:00:00 GMT</pubDate><source url="https://reuters.com">Reuters</source></item>
    </channel></rss>`;
    expect(parseFeed(xml, "news")).toEqual([
      { id: "", source: "news", title: "Google launches Gemini agent & more - Reuters", url: "https://news.google.com/a", publishedAt: "2026-10-08T16:00:00.000Z" },
    ]);
  });

  it("reads Atom entries with href links and CDATA titles", () => {
    const xml = `<feed><entry><title type="html"><![CDATA[OpenAI&#8217;s new model]]></title>
      <link rel="alternate" type="text/html" href="https://www.theverge.com/x"/><updated>2026-10-08T21:54:31+00:00</updated></entry></feed>`;
    expect(parseFeed(xml, "verge")[0]).toMatchObject({ title: "OpenAI’s new model", url: "https://www.theverge.com/x" });
  });

  it("drops items without a usable date", () => {
    expect(parseFeed("<item><title>x</title><link>https://a.b</link></item>", "s")).toEqual([]);
  });

  it("decodes entities and strips tags", () => {
    expect(decodeText("<b>A</b> &quot;B&quot; &#39;C&#39;")).toBe(`A "B" 'C'`);
  });
});

describe("radar matching", () => {
  it("keeps only headlines about a launched agent or model", () => {
    expect(looksLikeLaunch("Google launches Gemini AI workplace agent")).toBe(true);
    expect(looksLikeLaunch("Show HN: NanoMuse – An open-source AI agent for your phone")).toBe(true);
    expect(looksLikeLaunch("Anthropic cuts Claude Haiku 5.5 prices")).toBe(false);
    expect(looksLikeLaunch("Apple launches a new iPad")).toBe(false);
  });

  it("collapses OpenRouter variants", () => {
    expect(baseModelId("openai/gpt-6.1-sol:batch")).toBe("openai/gpt-6.1-sol");
    expect(baseModelId("apodex/apodex-1.1-mini:free")).toBe("apodex/apodex-1.1-mini");
  });

  it("matches names across punctuation and vendor prefixes", () => {
    expect(nameKey("GPT-6.1 Sol")).toBe("gpt61sol");
    expect(matchesKnown("Grok Bot", ["Grok Bot", "Muse"])).toBe(true);
    expect(matchesKnown("OpenAI GPT-6.1 Sol", ["GPT-6.1 Sol"])).toBe(true);
    expect(matchesKnown("Gemini agent", ["Gemini Spark"])).toBe(false);
    expect(matchesKnown("Muse", ["Meta Muse"])).toBe(false);
  });
});
