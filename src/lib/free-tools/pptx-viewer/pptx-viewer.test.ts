import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { notesText, readDeckInfo } from "./deck";
import { inlineDiagramImages } from "./diagram";
import { detectDeck } from "./detect";
import { buildPdf } from "./pdf";
import { showKey, startShow, type ShowState } from "./slideshow";

const CT = (main: string) =>
  `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="${main}"/></Types>`;
const PPTX_MAIN = "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function zip(files: Record<string, string>) {
  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}

function cfb(streamName: string) {
  const b = new Uint8Array(1024);
  b.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  for (let i = 0; i < streamName.length; i++) b[512 + i * 2] = streamName.charCodeAt(i);
  return b;
}

describe("detectDeck", () => {
  it("reads the format from the main content type", () => {
    expect(detectDeck(zip({ "[Content_Types].xml": CT(PPTX_MAIN), "ppt/presentation.xml": "<p:presentation/>" }), "a.pptx")).toEqual({ ok: true, format: "pptx", macros: false });
    const pptm = zip({
      "[Content_Types].xml": CT("application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml"),
      "ppt/presentation.xml": "<p:presentation/>",
      "ppt/vbaProject.bin": "x",
    });
    expect(detectDeck(pptm, "a.pptm")).toEqual({ ok: true, format: "pptm", macros: true });
    const ppsx = zip({ "[Content_Types].xml": CT("application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml"), "ppt/presentation.xml": "x" });
    expect(detectDeck(ppsx, "a.ppsx")).toMatchObject({ ok: true, format: "ppsx" });
  });

  it("names files it cannot open", () => {
    expect(detectDeck(cfb("PowerPoint Document"), "old.ppt")).toEqual({ ok: false, error: "ppt" });
    expect(detectDeck(cfb("EncryptedPackage"), "locked.pptx")).toEqual({ ok: false, error: "encrypted" });
    expect(detectDeck(zip({ mimetype: "application/vnd.oasis.opendocument.presentation", "content.xml": "x" }), "a.odp")).toEqual({ ok: false, error: "odp" });
    expect(detectDeck(zip({ "Index/Document.iwa": "x" }), "a.key")).toEqual({ ok: false, error: "key" });
    expect(detectDeck(zip({ "[Content_Types].xml": CT("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml") }), "a.docx")).toEqual({ ok: false, error: "word" });
    expect(detectDeck(new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3]), "a.pptx")).toEqual({ ok: false, error: "corrupt" });
    expect(detectDeck(strToU8("%PDF-1.7"), "a.pdf")).toEqual({ ok: false, error: "pdf" });
    expect(detectDeck(new Uint8Array(), "a.pptx")).toEqual({ ok: false, error: "empty" });
  });
});

const NOTES = `<p:notes><p:cSld><p:spTree>
<p:sp><p:nvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr></p:sp>
<p:sp><p:nvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:txBody><a:bodyPr/>
<a:p><a:r><a:t>Say hello &amp; smile</a:t></a:r></a:p><a:p/><a:p><a:r><a:t>Line</a:t></a:r><a:br/><a:r><a:t>two</a:t></a:r></a:p>
</p:txBody></p:sp>
<p:sp><p:nvSpPr><p:nvPr><p:ph type="sldNum"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>3</a:t></a:r></a:p></p:txBody></p:sp>
</p:spTree></p:cSld></p:notes>`;

describe("notes and inventory", () => {
  it("keeps only the notes body text", () => {
    expect(notesText(NOTES)).toBe("Say hello & smile\n\nLine\ntwo");
    expect(notesText("<p:notes/>")).toBeNull();
  });

  it("reads slides in presentation order with notes, hidden flag and issues", () => {
    const bytes = zip({
      "ppt/presentation.xml": `<p:presentation><p:sldIdLst><p:sldId id="257" r:id="rId3"/><p:sldId id="256" r:id="rId2"/></p:sldIdLst><p:embeddedFontLst><p:embeddedFont><p:font typeface="Lato"/></p:embeddedFont></p:embeddedFontLst></p:presentation>`,
      "ppt/_rels/presentation.xml.rels": `<Relationships><Relationship Id="rId2" Type="${R}/slide" Target="slides/slide1.xml"/><Relationship Id="rId3" Type="${R}/slide" Target="slides/slide2.xml"/></Relationships>`,
      "ppt/slides/slide1.xml": `<p:sld show="0"><a:latin typeface="Proxima Nova"/><a:latin typeface="+mn-lt"/><p:oleObj r:id="rId5"/><p:timing><p:tnLst><p:par><p:animEffect/></p:par></p:tnLst></p:timing></p:sld>`,
      "ppt/slides/_rels/slide1.xml.rels": `<Relationships><Relationship Id="rId1" Type="${R}/notesSlide" Target="../notesSlides/notesSlide1.xml"/><Relationship Id="rId4" Type="${R}/image" Target="../media/image1.tiff"/></Relationships>`,
      "ppt/notesSlides/notesSlide1.xml": NOTES,
      "ppt/slides/slide2.xml": `<p:sld><p:pic><a:videoFile r:link="rId2"/><p:extLst><p14:media r:embed="rId3"/></p:extLst></p:pic><p:pic><a:videoFile r:link="rId6"/></p:pic><a:graphicData><dgm:relIds r:dm="rId7"/></a:graphicData></p:sld>`,
      "ppt/slides/_rels/slide2.xml.rels": `<Relationships><Relationship Id="rId2" Type="${R}/video" Target="../media/media1.wmv"/><Relationship Id="rId3" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="../media/media1.wmv"/><Relationship Id="rId6" Type="${R}/video" Target="https://example.com/v.mp4" TargetMode="External"/></Relationships>`,
      "ppt/slideMasters/_rels/slideMaster1.xml.rels": `<Relationships><Relationship Id="rId9" Type="${R}/theme" Target="../theme/theme1.xml"/></Relationships>`,
      "ppt/theme/theme1.xml": `<a:theme><a:fontScheme><a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:theme>`,
    });
    const info = readDeckInfo(bytes);
    expect(info.slides.map((s) => s.path)).toEqual(["ppt/slides/slide2.xml", "ppt/slides/slide1.xml"]);
    expect(info.themeFonts).toEqual(["Calibri Light", "Calibri"]);
    expect(info.embeddedFonts).toEqual(["Lato"]);

    const [two, one] = info.slides;
    expect(one).toMatchObject({ hidden: true, notes: "Say hello & smile\n\nLine\ntwo", fonts: ["Proxima Nova"] });
    expect(one.issues).toEqual([{ kind: "ole" }, { kind: "animation" }, { kind: "image", ext: "tiff" }]);
    expect(two.hidden).toBe(false);
    expect(two.notes).toBeNull();
    expect(two.issues).toEqual([
      { kind: "media", media: "video", ext: "wmv", status: "unsupported" },
      { kind: "media", media: "video", ext: "mp4", status: "linked" },
      { kind: "smartart" },
    ]);
  });
});

describe("slideshow keys", () => {
  const hidden = [false, true, false, false];
  const run = (keys: string[], start = startShow(0, hidden)) => {
    let s: ShowState = start;
    let exit = false;
    for (const k of keys) {
      const r = showKey(s, k, hidden);
      if (r) {
        s = r.state;
        exit ||= !!r.exit;
      }
    }
    return { s, exit };
  };

  it("skips hidden slides going forward and back", () => {
    expect(run(["ArrowRight"]).s.index).toBe(2);
    expect(run([" ", "PageDown"]).s.index).toBe(3);
    expect(run(["End", "ArrowLeft", "PageUp"]).s.index).toBe(0);
    expect(startShow(1, hidden).index).toBe(2);
  });

  it("jumps with number + Enter, even to a hidden slide", () => {
    expect(run(["2", "Enter"]).s).toMatchObject({ index: 1, typed: "" });
    expect(run(["9", "Enter"]).s.index).toBe(0);
  });

  it("blanks with B and W, and a next key only unblanks", () => {
    expect(run(["b"]).s.blank).toBe("black");
    expect(run(["b", "b"]).s.blank).toBeNull();
    expect(run(["w"]).s.blank).toBe("white");
    expect(run(["b", "ArrowRight"]).s).toMatchObject({ blank: null, index: 0 });
  });

  it("shows an end screen after the last slide, then exits", () => {
    expect(run(["End", "ArrowRight"]).s.end).toBe(true);
    expect(run(["End", "ArrowRight", "ArrowLeft"]).s).toMatchObject({ end: false, index: 3 });
    expect(run(["End", "ArrowRight", "ArrowRight"]).exit).toBe(true);
    expect(run(["Escape"]).exit).toBe(true);
    expect(showKey(startShow(0, hidden), "q", hidden)).toBeNull();
  });
});

describe("buildPdf", () => {
  it("writes one page per image with a valid xref", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = buildPdf(
      [
        { jpeg, pixelWidth: 1920, pixelHeight: 1080 },
        { jpeg, pixelWidth: 1920, pixelHeight: 1080 },
      ],
      720,
      405,
    );
    const text = new TextDecoder("latin1").decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(text).toContain("/MediaBox [0 0 720 405]");
    const startxref = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");
    // Every xref offset points at its object header.
    const entries = text.slice(startxref).split("\n").slice(3, 3 + 8);
    entries.forEach((line, i) => {
      const at = Number(line.slice(0, 10));
      expect(text.slice(at, at + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`);
    });
  });
});

describe("report", () => {
  it("groups issues by slide and folds missing fonts into one line", async () => {
    const { buildReport, slideRanges } = await import("./report");
    const info = {
      themeFonts: ["Calibri"],
      embeddedFonts: [],
      slides: [
        { path: "a", hidden: false, notes: null, fonts: ["Proxima Nova"], issues: [{ kind: "animation" as const }, { kind: "image" as const, ext: "emf" as const }] },
        { path: "b", hidden: false, notes: null, fonts: [], issues: [{ kind: "animation" as const }, { kind: "image" as const, ext: "wmf" as const }, { kind: "image" as const, ext: "tiff" as const }] },
      ],
    };
    const rows = buildReport(info, new Set(["Proxima Nova"]), true);
    expect(rows).toEqual([
      { issue: { kind: "animation" }, slides: [1, 2] },
      { issue: { kind: "image", ext: "emf" }, slides: [1, 2] },
      { issue: { kind: "fonts", fonts: ["Proxima Nova"] }, slides: [1] },
    ]);
    expect(buildReport(info, new Set(["Calibri"]), false).at(-1)).toEqual({ issue: { kind: "fonts", fonts: ["Calibri"] }, slides: "deck" });
    expect(slideRanges([9, 1, 2, 3, 5, 8])).toBe("1–3, 5, 8, 9");
  });
});

describe("SmartArt pictures", () => {
  it("moves drawing image rels into the slides that use the drawing", () => {
    const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const slideRels = new Map([
      ["ppt/slides/slide4.xml", `<Relationships><Relationship Id="rId1" Type="${R}/slideLayout" Target="../slideLayouts/slideLayout4.xml"/><Relationship Id="rId8" Type="http://schemas.microsoft.com/office/2007/relationships/diagramDrawing" Target="../diagrams/drawing1.xml"/></Relationships>`],
      ["ppt/slides/slide5.xml", `<Relationships><Relationship Id="rId1" Type="${R}/slideLayout" Target="../slideLayouts/slideLayout4.xml"/></Relationships>`],
    ]);
    const drawings = new Map([["ppt/diagrams/drawing1.xml", `<a:blip r:embed="rId1"><asvg:svgBlip r:embed="rId2"/></a:blip><a:blip r:embed="rId10"/>`]]);
    const drawingRels = new Map([
      ["ppt/diagrams/_rels/drawing1.xml.rels", `<Relationships><Relationship Id="rId1" Type="${R}/image" Target="../media/image9.png"/><Relationship Id="rId2" Type="${R}/image" Target="../media/image10.svg"/><Relationship Id="rId10" Type="${R}/image" Target="../media/image20.png"/></Relationships>`],
    ]);
    expect(inlineDiagramImages(slideRels, drawings, drawingRels)).toBe(1);
    expect(drawings.get("ppt/diagrams/drawing1.xml")).toBe(`<a:blip r:embed="ordDgm1_rId1"><asvg:svgBlip r:embed="ordDgm1_rId2"/></a:blip><a:blip r:embed="ordDgm1_rId10"/>`);
    const s4 = slideRels.get("ppt/slides/slide4.xml")!;
    expect(s4).toContain(`Id="ordDgm1_rId1" Type="${R}/image" Target="../media/image9.png"`);
    expect(s4).toContain(`Id="ordDgm1_rId10" Type="${R}/image" Target="../media/image20.png"`);
    expect(s4).toContain(`Id="rId1" Type="${R}/slideLayout"`);
    expect(slideRels.get("ppt/slides/slide5.xml")).not.toContain("ordDgm");
  });
});
