import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { fromCsv, parseDelimited } from "./convert";
import { detectBook } from "./detect";
import { cellText, formatColor, general, generalFit, showCell } from "./display";
import { sheetToCsv, sheetToPrintHtml } from "./export";
import { findAll } from "./find";
import { buildLayout, indexAt, step } from "./layout";
import { cellName, colName, runs } from "./model";
import { openBook } from "./open";

const text = (value: string) => new TextEncoder().encode(value);

/** A minimal .xlsx: one visible sheet, one hidden sheet, a formula, a date format, a hidden row and a merge. */
function workbook(): Uint8Array {
  const xml = (body: string) => strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`);
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const type = "application/vnd.openxmlformats-officedocument.spreadsheetml";
  return zipSync({
    "[Content_Types].xml": xml(
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${type}.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="${type}.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="${type}.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="${type}.styles+xml"/></Types>`,
    ),
    "_rels/.rels": xml(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": xml(`<workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/><sheet name="Secret" sheetId="2" state="hidden" r:id="rId2"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": xml(
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${rel}/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/styles.xml": xml(
      `<styleSheet xmlns="${main}"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>`,
    ),
    "xl/worksheets/sheet1.xml": xml(
      `<worksheet xmlns="${main}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>When</t></is></c><c r="C1" t="inlineStr"><is><t>Share</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Alpha, "one"</t></is></c><c r="B2" s="1"><v>46037</v></c><c r="C2" s="2"><v>0.3125</v></c></row><row r="3" hidden="1"><c r="A3" t="inlineStr"><is><t>Hidden row</t></is></c></row><row r="4"><c r="A4"><f>1+2</f><v>3</v></c></row><row r="5"><c r="A5" t="inlineStr"><is><t>Merged</t></is></c></row></sheetData><mergeCells count="1"><mergeCell ref="A5:B5"/></mergeCells></worksheet>`,
    ),
    "xl/worksheets/sheet2.xml": xml(`<worksheet xmlns="${main}"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Needle</t></is></c></row></sheetData></worksheet>`),
  });
}

describe("xlsx viewer: General numbers", () => {
  it("writes numbers the way Excel's General format does", () => {
    expect(general(42)).toBe("42");
    expect(general(0.1 + 0.2)).toBe("0.3");
    expect(general(297638.74775)).toBe("297638.74775");
    expect(general(123456789012)).toBe("1.23457E+11");
    expect(general(0.000000000123)).toBe("1.23E-10");
  });

  it("shortens a number that is too wide before giving up", () => {
    const upTo = (chars: number) => (candidate: string) => candidate.length <= chars;
    expect(generalFit(297638.74775, upTo(8))).toBe("297638.7");
    expect(generalFit(297638.74775, upTo(6))).toBe("297639");
    expect(generalFit(123456789, upTo(6))).toBe("1E+08");
    expect(generalFit(123456789, upTo(2))).toBeNull();
  });

  it("reads the colour of a number format section", () => {
    expect(formatColor("#,##0.00;[Red]-#,##0.00", -1)).toBe("#ff0000");
    expect(formatColor("#,##0.00;[Red]-#,##0.00", 1)).toBeUndefined();
    expect(formatColor("0.00", -1)).toBeUndefined();
  });
});

describe("xlsx viewer: cell names", () => {
  it("names columns and cells", () => {
    expect([0, 25, 26, 701, 702, 16383].map(colName)).toEqual(["A", "Z", "AA", "ZZ", "AAA", "XFD"]);
    expect(cellName(11, 3)).toBe("D12");
  });

  it("groups sorted indexes into runs", () => {
    expect(runs([4, 5, 6, 9, 11, 12])).toEqual([
      [4, 6],
      [9, 9],
      [11, 12],
    ]);
  });
});

describe("xlsx viewer: file detection", () => {
  it("explains files that are not spreadsheets", () => {
    expect(detectBook(new Uint8Array(0), "a.xlsx")).toEqual({ ok: false, error: "empty" });
    expect(detectBook(text("%PDF-1.7\n"), "a.xlsx")).toEqual({ ok: false, error: "pdf" });
    expect(detectBook(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]), "a.png")).toEqual({ ok: false, error: "unknown" });
    expect(detectBook(workbook().slice(0, 400), "cut.xlsx")).toEqual({ ok: false, error: "corrupt" });
  });

  it("goes by content, not by extension", () => {
    expect(detectBook(workbook(), "report.txt")).toEqual({ ok: true, format: "xlsx", macros: false });
    expect(detectBook(text("a,b\n1,2\n"), "data.csv")).toEqual({ ok: true, format: "csv", macros: false });
  });
});

describe("xlsx viewer: CSV", () => {
  it("parses quotes, embedded newlines and other delimiters", () => {
    expect(parseDelimited('a,"b,1","say ""hi"""\r\n"two\nlines",,z\n')).toEqual([
      ["a", "b,1", 'say "hi"'],
      ["two\nlines", "", "z"],
    ]);
    expect(parseDelimited("a;b\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseDelimited("a\tb\n1\t2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps every field as written", () => {
    const book = fromCsv(text("﻿id,zip\n1,00501\n"), "codes.csv");
    expect(book.sheets[0].name).toBe("codes");
    expect(cellText(book, book.sheets[0], 0, 0)).toBe("id");
    expect(cellText(book, book.sheets[0], 1, 1)).toBe("00501");
  });
});

describe("xlsx viewer: opening a workbook", () => {
  it("reads sheets, formats, formulas, hidden items and merges", async () => {
    const result = await openBook(workbook(), "book.xlsx");
    if (!result.ok) throw new Error(result.error);
    const { book } = result;
    expect(book.sheets.map((sheet) => [sheet.name, sheet.hidden])).toEqual([
      ["Data", false],
      ["Secret", true],
    ]);
    const sheet = book.sheets[0];
    expect(cellText(book, sheet, 1, 1)).toBe("2026-01-15");
    expect(cellText(book, sheet, 1, 2)).toBe("31.25%");
    expect(showCell(book, sheet, 3, 0)).toMatchObject({ text: "3", kind: "number" });
    expect(sheet.meta.get(3 * 16384)?.f).toBe("1+2");
    expect(sheet.hiddenRows).toEqual([2]);
    expect(sheet.merges).toEqual([[4, 0, 4, 1]]);
    expect(sheet.stats.formulas).toBe(1);
  });

  it("finds text in every sheet, hidden ones included", async () => {
    const result = await openBook(workbook(), "book.xlsx");
    if (!result.ok) throw new Error(result.error);
    expect((await findAll(result.book, "needle", () => false))?.hits).toEqual([{ sheet: 1, row: 0, col: 0 }]);
    expect((await findAll(result.book, "31.25", () => false))?.hits).toEqual([{ sheet: 0, row: 1, col: 2 }]);
    expect(await findAll(result.book, "name", () => true)).toBeNull();
  });

  it("exports what is shown, leaving hidden rows out unless asked", async () => {
    const result = await openBook(workbook(), "book.xlsx");
    if (!result.ok) throw new Error(result.error);
    const { book } = result;
    const csv = sheetToCsv(book, book.sheets[0], { includeHidden: false });
    expect(csv.split("\r\n").slice(0, 2)).toEqual(["Name,When,Share", '"Alpha, ""one""",2026-01-15,31.25%']);
    expect(csv).not.toContain("Hidden row");
    expect(sheetToCsv(book, book.sheets[0], { includeHidden: true })).toContain("Hidden row");
    const print = sheetToPrintHtml(book, book.sheets[0], { includeHidden: false, title: "book <Data>" });
    expect(print.truncated).toBe(false);
    expect(print.html).toContain("book &lt;Data&gt;");
    expect(print.html).toContain('colspan="2"');
    expect(print.html).not.toContain("Hidden row");
  });

  it("reports damaged files instead of throwing", async () => {
    expect(await openBook(workbook().slice(0, 400), "cut.xlsx")).toMatchObject({ ok: false, error: "corrupt" });
  });
});

describe("xlsx viewer: layout", () => {
  it("collapses hidden rows and finds the row under a pixel", async () => {
    const result = await openBook(workbook(), "book.xlsx");
    if (!result.ok) throw new Error(result.error);
    const sheet = result.book.sheets[0];
    const hidden = buildLayout(sheet, false);
    expect(hidden.rowTop[3] - hidden.rowTop[2]).toBe(0);
    expect(indexAt(hidden.rowTop, hidden.rowTop[2])).toBe(3);
    expect(step(hidden.rowTop, 1, 1)).toBe(3);
    expect(step(hidden.rowTop, 3, -1)).toBe(1);
    expect(step(hidden.rowTop, 0, -1)).toBe(0);
    const shown = buildLayout(sheet, true);
    expect(shown.rowTop[3] - shown.rowTop[2]).toBeGreaterThan(0);
    expect(indexAt(shown.rowTop, shown.rowTop[2])).toBe(2);
  });
});
