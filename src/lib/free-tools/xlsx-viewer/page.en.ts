import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// Facts: docs/keywords/xlsx-viewer.md, "Verified product facts". Every claim maps to that list.
export const xlsxViewerPageEn: ToolPageCopy = {
  title: "Online XLSX Viewer & XLSX Reader: Free, No Sign-Up | Ordalin",
  description:
    "Free online XLSX viewer: open an Excel file in your browser and read its sheets, formulas and hidden rows. View only; the file is never uploaded.",
  h1: "XLSX Viewer: Open Excel Files Without Uploading Them",
  subtitle:
    "Free online XLSX viewer: open an Excel file in your browser and read its sheets, formulas and hidden rows. View only; the file is never uploaded.",
  sections: [
    {
      id: "how-to",
      h2: "How do you open an XLSX file without Excel?",
      blocks: [
        {
          ol: [
            "**Drop the XLSX into the box above,** or click it to choose an .xlsx from your computer or phone. No account, no install.",
            "**Read it.** Switch sheets with the tabs under the grid, scroll, and click any cell to see its full value, its formula, its note or its link in the bar above the grid.",
            "**Find or save what you need.** Search every sheet at once, download the current sheet as a CSV file, or print it.",
          ],
        },
        {
          p: "This online XLSX viewer reads the workbook inside your browser tab. Nothing is sent to Ordalin or anyone else, so a payroll sheet or a client list stays on your device. Most other sites that open an XLSX file online upload it to a server first. You can check this yourself: open your browser's developer tools, switch to the Network tab and open an XLSX. No request carries it.",
        },
      ],
    },
    {
      id: "facts",
      h2: "Quick facts",
      blocks: [
        {
          table: {
            head: ["", ""],
            rows: [
              ["What it is", "A free XLSX viewer and XLSX reader that runs in the browser: read, search and export, no editing"],
              ["Files the XLSX viewer opens", ".xlsx and .xlsm with full formatting; .xls, .xlsb and .ods in a basic view; .csv"],
              ["Largest file", "100 MB"],
              ["Largest sheet tested", "1,048,576 rows by 10 columns (a 74 MB file), open in 4 to 6 seconds in Chrome on a Mac"],
              ["Where it runs", "In your browser. Your XLSX is not uploaded"],
              ["Formulas", "Shown as text, next to the result Excel saved. Nothing is recalculated"],
              ["Macros", "Never run. A .xlsm opens like any other workbook, with a note"],
              ["Exports", "The current sheet as CSV, or printed (first 5,000 rows)"],
              ["Cost", "Free, no sign-up, no daily limit"],
            ],
          },
        },
      ],
    },
    {
      id: "what-you-see",
      h2: "What the XLSX viewer shows",
      blocks: [
        {
          ul: [
            "**Cells as formatted:** fonts, fill colours, borders, alignment, merged cells, column widths, row heights, and number, date, currency and percent formats.",
            "**Every sheet,** on tabs. Hidden sheets are there too, labelled hidden.",
            "**Frozen panes:** header rows and columns stay in place while you scroll.",
            "**Hidden rows and columns,** marked with a double line where they sit. One switch shows them all.",
            "**Formulas:** click a cell to read the formula and the saved result together.",
            "**Notes and links:** a cell with a note has a red corner; the note and any link appear when you select it.",
            "**Pictures** at the position they have in the sheet.",
            "**A workbook overview:** each sheet's used range, plus counts of formulas, pictures, charts, notes, merged ranges and hidden items.",
          ],
        },
        {
          p: "Fonts, colours, borders and pictures are shown for .xlsx and .xlsm. For .xls, .xlsb and .ods the XLSX reader shows a basic view: values, number formats, formulas, merged cells and sizes. A CSV opens with every field exactly as written, so ZIP codes and long IDs keep their leading zeros.",
        },
      ],
    },
    {
      id: "find",
      h2: "Find a value across every sheet",
      blocks: [
        {
          p: "Type in the Find box and this XLSX file viewer searches all sheets at once, hidden sheets and hidden columns included. It matches the text a cell shows, so searching 31.25% finds a cell that stores 0.3125. Step through the matches with the arrows; the grid jumps to each one and switches sheet when needed. The first 2,000 matches are listed. In our test, finding the last row of a 10.5 million cell workbook took about 3 seconds.",
        },
      ],
    },
    {
      id: "not-shown",
      h2: "What the XLSX viewer does not show",
      blocks: [
        {
          p: "An .xlsx file is a ZIP of XML files that Excel draws on screen. This XLSX document viewer draws the same data with web technology, and some things are left out. After an XLSX opens, the XLSX viewer lists under the grid what was skipped in that workbook and on which sheets. The cases:",
        },
        {
          ul: [
            "**Charts** are not drawn. A box with the chart's title marks where each one sits.",
            "**Conditional formatting** (colour scales, data bars, icon sets, highlight rules) is not applied.",
            "**Sparklines, shapes, text boxes, slicers and embedded objects** are not drawn.",
            "**Mixed formatting inside one cell** shows in the cell's main style; rotated text is shown unrotated; gradient fills show as one colour.",
            "**Fonts** that aren't installed on your device are replaced with a similar one.",
            "**Formulas are not recalculated,** so a cell that depends on today's date shows the value from the last save.",
          ],
        },
      ],
    },
    {
      id: "wont-open",
      h2: "When an XLSX won't open",
      blocks: [
        {
          p: "A spreadsheet attachment that fails to open usually has one of a few problems, and the XLSX viewer tells you which. It looks at the content, not the name, so a workbook saved with the wrong extension still opens.",
        },
        {
          ul: [
            "**Password-protected:** type the password and the XLSX is decrypted in your browser. The password is not sent anywhere. Without it the workbook can't be opened, and old protected .xls workbooks can't be opened here at all.",
            "**Damaged or incomplete:** the download was probably cut short. Download it again, or try Excel's Open and Repair.",
            "**Empty (0 bytes):** the export failed on the sender's side.",
            "**Not a spreadsheet:** a Word document, a presentation or a PDF with a spreadsheet's name is named for what it is. For slides, use the [PPTX viewer](/free-tools/pptx-viewer).",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Other ways to open an XLSX file",
      blocks: [
        {
          table: {
            head: ["Option", "Best when", "Not ideal when"],
            rows: [
              ["**This online XLSX viewer**", "You want to read a workbook now, on any computer, without an account or uploading it", "You need to edit cells, see the charts or recalculate"],
              ["**Excel (desktop, web or mobile app)**", "You have Office or a Microsoft account and want exact rendering and editing", "You don't want to sign in, install an app or put the file in OneDrive"],
              ["**Google Sheets**", "You want to edit and share the workbook online", "You'd rather not upload the file to Google Drive; conversion can change formatting"],
              ["**Numbers (Mac, iPhone, iPad)**", "You're on Apple devices and want to edit", "You're on Windows, Android or a Chromebook"],
              ["**LibreOffice Calc**", "You want a free desktop editor that also draws charts", "You can't install software on the computer"],
            ],
          },
        },
      ],
    },
    {
      id: "limits",
      h2: "Good for, not for",
      blocks: [
        {
          ul: [
            "**Good for:** reading a workbook someone sent you, checking a formula or a hidden sheet before you trust a number, looking through a large export, and pulling one sheet out as CSV.",
            "**Not for:** editing, charts and dashboards, pivot table work, or opening a protected file without its password.",
            "**Know before you start:** the whole workbook is read into your browser's memory; our largest test workbook used about 0.9 GB. Phones have less memory than laptops, so a very large XLSX may not open on a phone. On a narrow screen you see about two columns at a time and scroll sideways.",
          ],
        },
      ],
    },
  ],
  faqHeading: "FAQ",
  faq: [
    {
      q: "Is this online XLSX viewer free? Do I need to sign up?",
      a: "Yes, it's free, with no account and no daily limit.",
    },
    {
      q: "Is my XLSX file uploaded?",
      a: "No. The XLSX viewer reads it inside your browser on your own device; it is never sent to a server.",
    },
    {
      q: "Can I view an XLSX file without Excel?",
      a: "Yes. To view XLSX without Excel, drop it on this page: sheets, formatting and formulas are drawn in the browser, with no Office licence or Microsoft account.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. The XLSX viewer runs in your browser, so there is no app to download: this page is the XLSX opener. We tested it in Chrome.",
    },
    {
      q: "Can I open an XLSX file on my iPhone or Android phone?",
      a: "The page is laid out for phone screens: open this online XLSX viewer in the phone's browser and tap the box to choose the XLSX. Sheet tabs scroll sideways and the grid scrolls inside its own frame.",
    },
    {
      q: "Can I edit the XLSX?",
      a: "No, this XLSX reader only views, searches and exports, and your original is never changed. To edit, use Excel, Google Sheets, Numbers or LibreOffice Calc.",
    },
    {
      q: "Does it show formulas?",
      a: "Yes. Select a cell and the bar above the grid shows the formula and the result Excel saved with it.",
    },
    {
      q: "Can it open a password-protected XLSX?",
      a: "Yes, if you know the password. It can't remove or recover a password.",
    },
    {
      q: "Is it safe to open an .xlsm file with macros?",
      a: "Macros are never run here. The XLSX reader shows the workbook's cells and tells you that macros are present.",
    },
    {
      q: "How do I convert an XLSX sheet to CSV?",
      a: "Open the XLSX in the XLSX viewer, pick the sheet and press Download CSV. The CSV holds the text each cell shows, in UTF-8.",
    },
    {
      q: "Is XLSX the same as Excel?",
      a: "XLSX is the file format Excel has used since 2007. Because it is an open, documented format, other programs and a browser-based XLSX reader can open it too.",
    },
  ],
  closing:
    "Looking for more? See the other [free tools](/free-tools) or browse the [Ordalin AI tool directory](/) for spreadsheet and productivity tools.",
};
