// Slideshow keys, matching PowerPoint: next/previous, Home/End, number + Enter,
// B/W blank screens, Esc to leave. Hidden slides are skipped unless jumped to.

export type ShowState = { index: number; blank: "black" | "white" | null; typed: string; end: boolean };
export type ShowResult = { state: ShowState; exit?: boolean };

export const startShow = (index: number, hidden: boolean[]): ShowState => ({
  index: hidden[index] ? (nextVisible(index, hidden) ?? index) : index,
  blank: null,
  typed: "",
  end: false,
});

function nextVisible(from: number, hidden: boolean[]) {
  for (let i = from + 1; i < hidden.length; i++) if (!hidden[i]) return i;
  return null;
}
function prevVisible(from: number, hidden: boolean[]) {
  for (let i = from - 1; i >= 0; i--) if (!hidden[i]) return i;
  return null;
}
const firstVisible = (hidden: boolean[]) => (hidden[0] ? (nextVisible(0, hidden) ?? 0) : 0);
const lastVisible = (hidden: boolean[]) => (hidden.at(-1) ? (prevVisible(hidden.length - 1, hidden) ?? hidden.length - 1) : hidden.length - 1);

const NEXT = new Set(["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n", "N"]);
const PREV = new Set(["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p", "P"]);

export function showKey(s: ShowState, key: string, hidden: boolean[]): ShowResult | null {
  if (key === "Escape") return { state: s, exit: true };

  if (/^[0-9]$/.test(key)) return { state: { ...s, typed: (s.typed + key).slice(-4) } };
  if (key === "Enter" && s.typed) {
    const n = Number(s.typed);
    const index = n >= 1 && n <= hidden.length ? n - 1 : s.index;
    return { state: { index, blank: null, typed: "", end: false } };
  }
  const clean = { ...s, typed: "" };

  if (key === "b" || key === "B" || key === ".") return { state: { ...clean, blank: s.blank === "black" ? null : "black" } };
  if (key === "w" || key === "W" || key === ",") return { state: { ...clean, blank: s.blank === "white" ? null : "white" } };

  // While blanked, a next/previous key only brings the slide back.
  if (s.blank && (NEXT.has(key) || PREV.has(key))) return { state: { ...clean, blank: null } };

  if (NEXT.has(key)) {
    if (s.end) return { state: clean, exit: true };
    const n = nextVisible(s.index, hidden);
    return { state: n === null ? { ...clean, end: true } : { ...clean, index: n } };
  }
  if (PREV.has(key)) {
    if (s.end) return { state: { ...clean, end: false } };
    const p = prevVisible(s.index, hidden);
    return { state: p === null ? clean : { ...clean, index: p } };
  }
  if (key === "Home") return { state: { ...clean, index: firstVisible(hidden), end: false, blank: null } };
  if (key === "End") return { state: { ...clean, index: lastVisible(hidden), end: false, blank: null } };
  return null;
}
