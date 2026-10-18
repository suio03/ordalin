"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { toolMark } from "@/lib/catalog";
import type { TagKind } from "@/domain/catalog";
import type { CatalogAnalysis } from "@/lib/catalog-analysis";
import type { CatalogEnrichmentCandidate, EnrichmentEvidencePage } from "@/lib/catalog-enrichment/contract";
import { detailFields, detailLabels, type DetailField } from "@/lib/submissions/profile";
import { SubmitSuccess } from "./submit-success";
import { TurnstileBox } from "./turnstile-box";
import styles from "./submit.module.css";

type Category = { slug: string; name: string; description: string };
type Tag = {
  slug: string;
  name: string;
  kind: TagKind;
  groupSlug: string | null;
  groupName: string | null;
};
export type Draft = { draftId: string; candidate: CatalogEnrichmentCandidate; analysis: CatalogAnalysis };
type ExistingTool = { slug: string; name: string };

const PRICING_OPTIONS = [
  ["free", "Free"], ["freemium", "Free plan"], ["paid", "Paid"],
  ["free_trial", "Free trial"], ["contact_sales", "Contact sales"], ["unknown", "Not confirmed"],
] as const;

async function responseJson(response: Response) {
  const value = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw value;
  return value;
}

// createImageBitmap cannot decode SVG blobs, so SVG logos go through an <img> element.
async function decodeLogo(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (blob.type !== "image/svg+xml" && !(blob instanceof File && blob.name.toLowerCase().endsWith(".svg"))) {
    try {
      const bitmap = await createImageBitmap(blob);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch { /* Fall through to the <img> decoder. */ }
  }
  const url = URL.createObjectURL(blob);
  const element = new window.Image();
  try {
    element.src = url;
    await element.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This logo could not be read. Choose another logo or upload a PNG.");
  }
  // SVGs without intrinsic dimensions report 0; draw them as a square.
  const width = element.naturalWidth || 512;
  const height = element.naturalHeight || 512;
  return { source: element, width, height, close: () => URL.revokeObjectURL(url) };
}

async function logoWebp(source: File | string) {
  const blob = typeof source === "string" ? await fetch(source).then((response) => {
    if (!response.ok) throw new Error("The selected logo could not be prepared.");
    return response.blob();
  }) : source;
  if (blob.size > 10_000_000) throw new Error("Choose an image smaller than 10 MB.");
  const image = await decodeLogo(blob);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  const scale = Math.min(448 / image.width, 448 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image.source, (512 - width) / 2, (512 - height) / 2, width, height);
  image.close();
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!webp) throw new Error("Your browser could not convert this image to WebP.");
  return new File([webp], "tool-logo.webp", { type: "image/webp" });
}

async function screenshotWebp(file: File) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 10_000_000) throw new Error("Choose a PNG, JPEG or WebP image smaller than 10 MB.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 1440; canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("Your browser could not prepare this image."); }
  context.fillStyle = "#ffffff"; context.fillRect(0, 0, 1440, 900);
  const scale = Math.min(1440 / bitmap.width, 900 / bitmap.height);
  context.drawImage(bitmap, (1440 - bitmap.width * scale) / 2, (900 - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.9));
  if (!blob || blob.size > 4_000_000) throw new Error("This image is too large. Choose a smaller image.");
  return new File([blob], "tool-screenshot.webp", { type: "image/webp" });
}

function messageFrom(error: unknown) {
  if (error && typeof error === "object" && "error" in error && typeof error.error === "string") return error.error;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

const REVIEW_STEPS = [
  { label: "Identity", title: "Name and description", hint: "Check that the name, summary and description match what your product does today." },
  { label: "Images", title: "Logo and screenshot", hint: "Visitors see these first. Pick a clean logo and a screenshot of the real product." },
  { label: "Details", title: "Pricing, features and use cases", hint: "Automatic drafts get these wrong most often. Correct anything outdated, or leave a section empty to hide it." },
  { label: "Categories", title: "Where it appears", hint: "We suggested these from your website. Choose a primary group and one to four specific categories." },
  { label: "Submit", title: "Final check", hint: "" },
] as const;
const REVIEW_STEP = REVIEW_STEPS.length - 1;

const PAGE_LABELS: Record<EnrichmentEvidencePage["role"], string> = {
  homepage: "Homepage", pricing: "Pricing page", features: "Features page", docs: "Docs", security: "Security page", privacy: "Privacy page",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function textProblem(value: string, min: number, empty: string) {
  const length = value.replace(/\s+/g, " ").trim().length;
  if (!length) return empty;
  return length < min ? `Use at least ${min} characters · ${length} so far.` : "";
}

type FieldName = "name" | "tagline" | "description" | "contactEmail";
const STEP_FIELDS: FieldName[][] = [["name", "tagline", "description"], [], [], [], ["contactEmail"]];

const sameText = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();

function FieldSource({ value, original, urls, pages, optional = false }: { value: string; original: string; urls: string[]; pages: EnrichmentEvidencePage[]; optional?: boolean }) {
  const sources = pages.filter(page => urls.includes(page.url));
  const status = !value.trim()
    ? optional ? "Empty · hidden from the profile" : "Required"
    : original && sameText(value, original) ? "Drafted from your website · please check" : "Your version";
  return (
    <span className={styles.fieldSource} data-origin={status === "Your version" ? "submitter" : undefined}>
      {status}
      {sources.map(page => <a key={page.url} href={page.url} target="_blank" rel="noreferrer">{PAGE_LABELS[page.role]} ↗</a>)}
    </span>
  );
}

export function SubmitFlow({ categories, tags, turnstileSiteKey, initialDraft, initialWebsite = "" }: { categories: Category[]; tags: Tag[]; turnstileSiteKey?: string; initialDraft?: Draft; initialWebsite?: string }) {
  const [details, setDetails] = useState<Record<DetailField, string>>({ features: "", pricingDetails: "", useCases: "" });
  const [preparedLogo, setPreparedLogo] = useState<File | null>(null);
  const preparedLogoPreview = useMemo(() => preparedLogo ? URL.createObjectURL(preparedLogo) : null, [preparedLogo]);
  useEffect(() => () => { if (preparedLogoPreview) URL.revokeObjectURL(preparedLogoPreview); }, [preparedLogoPreview]);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  // Steps the submitter tried to leave with problems; their messages stay live until fixed.
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const reviewing = step === REVIEW_STEP;
  const sections = useRef<(HTMLElement | null)[]>([]);
  const formTop = useRef<HTMLFormElement>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotChoice, setScreenshotChoice] = useState("none");
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [captureAttempts, setCaptureAttempts] = useState(0);
  const activeDraft = useRef("");
  const imageOperation = useRef(0);
  const screenshotPreview = useMemo(() => screenshot ? URL.createObjectURL(screenshot) : null, [screenshot]);
  useEffect(() => () => { if (screenshotPreview) URL.revokeObjectURL(screenshotPreview); }, [screenshotPreview]);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [existingTool, setExistingTool] = useState<ExistingTool | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [pricingModel, setPricingModel] = useState("unknown");
  const initialCategory = categories[0]?.slug ?? "";
  const [primaryCategory, setPrimaryCategory] = useState(initialCategory);
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [logoChoice, setLogoChoice] = useState("none");
  const [logoUpload, setLogoUpload] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const uploadPreview = useMemo(() => logoUpload ? URL.createObjectURL(logoUpload) : null, [logoUpload]);
  const tagBySlug = useMemo(() => new Map(tags.map((tag) => [tag.slug, tag])), [tags]);
  const selectedBrowseCategoryCount = tagSlugs.reduce(
    (count, slug) => count + (tagBySlug.get(slug)?.kind === "category" ? 1 : 0),
    0,
  );
  const hasPrimaryGroupCategory = tagSlugs.some((slug) => {
    const tag = tagBySlug.get(slug);
    return tag?.kind === "category" && tag.groupSlug === primaryCategory;
  });
  const tagGroups = useMemo(() => [
    {
      kind: "category" as const,
      legend: "Specific categories",
      description: "Choose one to four concrete uses. These become public category links.",
      items: tags.filter((tag) => tag.kind === "category"),
    },
    {
      kind: "interface" as const,
      legend: "Available as",
      description: "Where people can use it.",
      items: tags.filter((tag) => tag.kind === "interface"),
    },
    {
      kind: "attribute" as const,
      legend: "Attributes",
      description: "Important product and access characteristics.",
      items: tags.filter((tag) => tag.kind === "attribute"),
    },
  ], [tags]);
  useEffect(() => () => { if (uploadPreview) URL.revokeObjectURL(uploadPreview); }, [uploadPreview]);
  const handleToken = useCallback((token: string) => setTurnstileToken(token), []);
  const [checkToken, setCheckToken] = useState("");
  const [checkVersion, setCheckVersion] = useState(0);
  const handleCheckToken = useCallback((token: string) => setCheckToken(token), []);

  async function captureScreenshot(draftId: string) {
    const operation = ++imageOperation.current;
    setCaptureBusy(true); setCaptureError(""); setCaptureAttempts(value => value + 1);
    try {
      const response = await fetch(`/api/submissions/drafts/${draftId}/screenshot`, { method: "POST" });
      if (!response.ok) await responseJson(response);
      const blob = await response.blob();
      if (activeDraft.current !== draftId || operation !== imageOperation.current) return;
      setScreenshot(new File([blob], "website-preview.webp", { type: "image/webp" }));
      setScreenshotChoice("captured");
    } catch (caught) {
      if (activeDraft.current === draftId && operation === imageOperation.current) setCaptureError(messageFrom(caught));
    } finally {
      if (activeDraft.current === draftId && operation === imageOperation.current) setCaptureBusy(false);
    }
  }

  async function uploadScreenshot(file: File | undefined) {
    if (!file) return;
    const operation = ++imageOperation.current;
    setCaptureBusy(true); setCaptureError("");
    try {
      const prepared = await screenshotWebp(file);
      if (operation !== imageOperation.current) return;
      setScreenshot(prepared); setScreenshotChoice("uploaded");
    } catch (caught) { if (operation === imageOperation.current) setCaptureError(messageFrom(caught)); }
    finally { if (operation === imageOperation.current) setCaptureBusy(false); }
  }

  function applyDraft(next: Draft, capture: boolean) {
    activeDraft.current = next.draftId;
    setDraft(next); setStep(0); setFurthest(0); setCheckedSteps([]); setLogoUpload(null); setScreenshot(null); setScreenshotChoice("none"); setCaptureAttempts(0);
    setDetails(Object.fromEntries(detailFields.map(key => [key, next.analysis.details?.[key]?.text ?? ""])) as Record<DetailField, string>);
    if (capture) void captureScreenshot(next.draftId);
    const candidate = next.candidate;
    const analysis = next.analysis;
    setName(analysis.name);
    setTagline(analysis.tagline);
    setDescription(analysis.description);
    setPricingModel(analysis.pricingModel);
    setTagSlugs(tags.filter((tag) => analysis.tagSlugs.includes(tag.slug)).map((tag) => tag.slug));
    setPrimaryCategory(categories.some((category) => category.slug === analysis.primaryCategorySlug) ? analysis.primaryCategorySlug : initialCategory);
    const logoIndex = candidate.assets.findIndex((asset) => asset.kind === "logo");
    const iconIndex = candidate.assets.findIndex((asset) => asset.kind === "icon");
    const selected = logoIndex >= 0 ? logoIndex : iconIndex;
    setLogoChoice(selected >= 0 ? `candidate:${selected}` : "none");
  }

  // Local design preview only: the page passes a fixture draft in development.
  const fixtureApplied = useRef(false);
  useEffect(() => {
    if (!initialDraft || fixtureApplied.current) return;
    fixtureApplied.current = true;
    applyDraft(initialDraft, false);
  });

  async function checkWebsite(event: FormEvent) {
    event.preventDefault(); setError(""); setExistingTool(null);
    if (!websiteUrl.trim()) { setError("Enter your product's website, like your-product.com."); return; }
    if (!checkToken) { setError("Verification is still loading. Try again in a moment."); return; }
    setBusy(true);
    try {
      const value = await responseJson(await fetch("/api/submissions/enrich", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ websiteUrl, turnstileToken: checkToken }),
      }));
      trackEvent("Submission Started");
      applyDraft(value as unknown as Draft, true);
    } catch (caught) {
      const value = caught as { code?: string; existingTool?: ExistingTool };
      if (value.code === "duplicate_domain" && value.existingTool) setExistingTool(value.existingTool);
      setError(messageFrom(caught));
    } finally {
      // Turnstile tokens are single-use; mount a fresh widget for the next check.
      setCheckToken(""); setCheckVersion((version) => version + 1); setBusy(false);
    }
  }

  function toggleTag(slug: string) {
    setTagSlugs((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 8) return current;
      const tag = tagBySlug.get(slug);
      const categoryCount = current.reduce(
        (count, item) => count + (tagBySlug.get(item)?.kind === "category" ? 1 : 0),
        0,
      );
      if (tag?.kind === "category" && categoryCount >= 4) return current;
      return [...current, slug];
    });
  }

  function showStep(index: number) {
    setStep(index); setError("");
    const top = formTop.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) formTop.current?.scrollIntoView({ block: "start" });
  }

  const fieldProblems: Record<FieldName, string> = {
    name: textProblem(name, 2, "Enter the tool name."),
    tagline: textProblem(tagline, 20, "Add a short description."),
    description: textProblem(description, 60, "Describe what the tool does."),
    contactEmail: !contactEmail.trim() ? "Enter an email so we can reach you about this listing." : EMAIL_PATTERN.test(contactEmail.trim()) ? "" : "Enter a valid email address.",
  };
  function stepMessage(index: number) {
    if (index === 1 && logoChoice === "upload" && !logoUpload) return "Upload a logo or choose the letter mark.";
    if (index === 3 && selectedBrowseCategoryCount === 0) return "Choose at least one specific category.";
    if (index === 3 && !hasPrimaryGroupCategory) return "Choose a specific category from the primary group.";
    return "";
  }
  const stepValid = (index: number) => STEP_FIELDS[index].every(field => !fieldProblems[field]) && !stepMessage(index);
  const shownProblem = (field: FieldName) => checkedSteps.includes(STEP_FIELDS.findIndex(fields => fields.includes(field))) ? fieldProblems[field] : "";

  function reportProblem(index: number) {
    setCheckedSteps(current => current.includes(index) ? current : [...current, index]);
    showStep(index);
    const field = STEP_FIELDS[index].find(item => fieldProblems[item]);
    if (field) requestAnimationFrame(() => sections.current[index]?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus());
  }

  async function goTo(index: number) {
    if (!draft || busy) return;
    if (index < REVIEW_STEP) {
      if (index > step && !stepValid(step)) { reportProblem(step); return; }
      setFurthest(value => Math.max(value, index));
      showStep(index);
      return;
    }
    for (let check = 0; check < REVIEW_STEP; check += 1) {
      if (!stepValid(check)) { reportProblem(check); return; }
    }
    setBusy(true); setError("");
    try {
      const logo = logoChoice.startsWith("candidate:") ? await logoWebp(`/api/submissions/drafts/${draft.draftId}/assets/${logoChoice.split(":")[1]}`) : logoChoice === "upload" && logoUpload ? await logoWebp(logoUpload) : null;
      setPreparedLogo(logo); setFurthest(REVIEW_STEP); showStep(REVIEW_STEP);
    } catch (caught) { showStep(1); setError(messageFrom(caught)); }
    finally { setBusy(false); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault(); if (!draft || !reviewing || captureBusy) return;
    if (!stepValid(REVIEW_STEP)) { reportProblem(REVIEW_STEP); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData();
      const selectedGroupSlugs = tagSlugs
        .map((slug) => tagBySlug.get(slug)?.groupSlug)
        .filter((slug): slug is string => Boolean(slug));
      const categorySlugs = [...new Set([primaryCategory, ...selectedGroupSlugs])].slice(0, 4);
      const fields: Record<string, string> = {
        ...details, screenshotChoice,
        draftId: draft.draftId, name, tagline, description, contactEmail, pricingModel,
        primaryCategorySlug: primaryCategory, categorySlugs: JSON.stringify(categorySlugs),
        tagSlugs: JSON.stringify(tagSlugs), turnstileToken,
      };
      for (const [key, value] of Object.entries(fields)) form.set(key, value);
      if (screenshot) form.set("screenshotFile", screenshot);
      if (preparedLogo) form.set("logoFile", preparedLogo);
      await responseJson(await fetch("/api/submissions/publish", { method: "POST", body: form }));
      trackEvent("Submission Sent");
      setSubmitted(true);
    } catch (caught) {
      setError(messageFrom(caught)); setTurnstileToken(""); setTurnstileVersion((version) => version + 1);
    } finally { setBusy(false); }
  }

  if (submitted) return <SubmitSuccess name={name} tagline={tagline} logoSrc={preparedLogoPreview} />;

  const invalid = (field: FieldName) => shownProblem(field) ? { "aria-invalid": true, "aria-describedby": `${field}-problem` } : {};
  const fieldNote = (field: FieldName, fallback: ReactNode) => shownProblem(field)
    ? <span className={styles.fieldError} id={`${field}-problem`}>{shownProblem(field)}</span>
    : fallback;
  const pages = draft?.candidate.evidencePages ?? [];
  const evidence = draft?.analysis.evidence;
  const stepHeading = (index: number) => (
    <div className={styles.sectionHeading}>
      <span>{String(index + 2).padStart(2, "0")}</span>
      <div><h3 id={`step-${index}-title`}>{REVIEW_STEPS[index].title}</h3><p>{REVIEW_STEPS[index].hint}</p></div>
    </div>
  );
  const stepActions = (index: number) => (
    <div className={styles.stepActions}>
      {error || (checkedSteps.includes(index) && stepMessage(index)) ? <p className={styles.error} role="alert">{error || stepMessage(index)}</p> : null}
      {index > 0 ? <button type="button" className={styles.textButton} disabled={busy} onClick={() => showStep(index - 1)}>← Back</button> : null}
      <button type="button" className={styles.publishButton} disabled={busy} onClick={() => void goTo(index + 1)}>
        {busy ? "Preparing…" : `Looks right · ${REVIEW_STEPS[index + 1].label === "Submit" ? "Final check" : REVIEW_STEPS[index + 1].label} →`}
      </button>
    </div>
  );
  const editButton = (index: number) => <button type="button" className={styles.textButton} disabled={busy} onClick={() => showStep(index)}>Edit</button>;

  return (
    <div className={styles.flow}>
      <ol className={styles.steps} aria-label="Submission progress">
        <li aria-current={draft ? undefined : "step"} data-done={draft ? "" : undefined}><span>{draft ? "✓" : "01"}</span><b>Website</b></li>
        {REVIEW_STEPS.map((item, index) => {
          const current = Boolean(draft) && step === index;
          const done = Boolean(draft) && index < furthest && !current;
          const content = <><span>{done ? "✓" : String(index + 2).padStart(2, "0")}</span><b>{item.label}</b></>;
          return (
            <li key={item.label} aria-current={current ? "step" : undefined} data-done={done ? "" : undefined}>
              {draft && !current && index <= furthest ? <button type="button" disabled={busy} onClick={() => void goTo(index)}>{content}</button> : content}
            </li>
          );
        })}
      </ol>
      {!draft ? (
        <section className={styles.urlStage}>
          <form onSubmit={checkWebsite} noValidate>
            <label htmlFor="website">Official product website</label>
            <div className={styles.urlControl}>
              <input id="website" type="text" inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} placeholder="your-product.com" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "website-error" : undefined} />
              <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check website →"}</button>
            </div>
            <TurnstileBox key={checkVersion} siteKey={turnstileSiteKey} onToken={handleCheckToken} action="submit-enrich" />
            {error ? <div id="website-error" className={styles.error} role="alert">{error}{existingTool ? <Link href={`/tools/${existingTool.slug}`}>View {existingTool.name} →</Link> : null}</div> : null}
          </form>
          <div className={styles.stageNotes}>
            <p><span>01</span> We inspect a small set of public pages.</p>
            <p><span>02</span> You check each part of the draft before anything is sent.</p>
            <p><span>03</span> Existing domains cannot be submitted again.</p>
          </div>
        </section>
      ) : (
        <form ref={formTop} className={styles.reviewForm} onSubmit={publish} noValidate>
          <header className={styles.reviewHeader}>
            <div><p className={styles.stepLabel}>Profile draft · {draft.candidate.canonicalDomain} · Step {step + 1} of {REVIEW_STEPS.length}</p><h2>{reviewing ? "Check the profile once more." : "Check each part of your profile."}</h2></div>
            <button className={styles.textButton} type="button" disabled={busy} onClick={() => { activeDraft.current = ""; imageOperation.current++; setCaptureBusy(false); setDraft(null); setStep(0); setFurthest(0); setError(""); }}>Use another website</button>
          </header>
          {draft.candidate.warnings.length && step === 0 ? <p className={styles.notice} role="status">{draft.candidate.warnings[0]}</p> : null}
          <section ref={node => { sections.current[0] = node; }} hidden={step !== 0} className={styles.formSection} aria-labelledby="step-0-title">
            {stepHeading(0)}
            <div className={styles.fieldGrid}>
              <label><span>Tool name</span><input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} aria-required="true" {...invalid("name")} /><span className={styles.fieldMeta}>{fieldNote("name", <FieldSource value={name} original={draft.analysis.name} urls={evidence?.identity ?? []} pages={pages} />)}</span></label>
              <label className={styles.wideField}><span>Short description</span><input name="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} maxLength={180} aria-required="true" {...invalid("tagline")} /><span className={styles.fieldMeta}>{fieldNote("tagline", <FieldSource value={tagline} original={draft.analysis.tagline} urls={evidence?.identity ?? []} pages={pages} />)}<small>{tagline.length}/180</small></span></label>
              <label className={styles.wideField}><span>What it does</span><textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} rows={5} aria-required="true" {...invalid("description")} /><span className={styles.fieldMeta}>{fieldNote("description", <FieldSource value={description} original={draft.analysis.description} urls={evidence?.description ?? []} pages={pages} />)}<small>{description.length}/1200</small></span></label>
              {stepActions(0)}
            </div>
          </section>
          <section ref={node => { sections.current[1] = node; }} hidden={step !== 1} className={styles.formSection} aria-labelledby="step-1-title">
            {stepHeading(1)}
            <div className={styles.stepBody}>
              <h4 className={styles.subheading}>Logo</h4>
              <div className={styles.logoChoices}>
                {draft.candidate.assets.map((asset, index) => asset.kind === "social_preview" ? null : <label key={`${asset.value}-${index}`} className={logoChoice === `candidate:${index}` ? styles.selectedLogo : undefined}>
                  <input type="radio" name="logoChoice" value={`candidate:${index}`} checked={logoChoice === `candidate:${index}`} onChange={(event) => setLogoChoice(event.target.value)} />
                  <span className={styles.logoPreview}><Image src={`/api/submissions/drafts/${draft.draftId}/assets/${index}`} alt="" width={72} height={72} unoptimized /></span>
                  <strong>{asset.kind.replace("_", " ")}</strong>
                </label>)}
                <label className={logoChoice === "upload" ? styles.selectedLogo : undefined}>
                  <input type="radio" name="logoChoice" value="upload" checked={logoChoice === "upload"} onChange={(event) => setLogoChoice(event.target.value)} />
                  <span className={styles.logoPreview}>{uploadPreview ? <Image src={uploadPreview} alt="Selected upload" width={72} height={72} unoptimized /> : "+"}</span>
                  <strong>Upload image</strong>
                  <input className={styles.fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.target.files?.[0] ?? null; setLogoUpload(file); if (file) setLogoChoice("upload"); }} />
                </label>
                <label className={logoChoice === "none" ? styles.selectedLogo : undefined}>
                  <input type="radio" name="logoChoice" value="none" checked={logoChoice === "none"} onChange={(event) => setLogoChoice(event.target.value)} />
                  <span className={`${styles.logoPreview} ${styles.letterPreview}`}>{name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AI"}</span><strong>Letter mark</strong>
                </label>
              </div>
              <h4 className={styles.subheading}>Screenshot</h4>
              <div className={styles.mediaEditor}>
                {screenshotPreview ? <Image className={styles.screenshot} src={screenshotPreview} alt="Screenshot selected for publication" width={1440} height={900} unoptimized /> : <p className={styles.emptyImage}>{captureBusy ? "Capturing the website…" : "No screenshot selected"}</p>}
                <div className={styles.imageActions}>
                  <button type="button" disabled={captureBusy || captureAttempts >= 3} onClick={() => void captureScreenshot(draft.draftId)}>{captureBusy ? "Preparing image…" : "Capture again"}</button>
                  <label>Upload screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void uploadScreenshot(event.target.files?.[0]); event.target.value = ""; }} /></label>
                  <button type="button" onClick={() => { imageOperation.current++; setCaptureBusy(false); setScreenshot(null); setScreenshotChoice("none"); setCaptureError(""); }}>No screenshot</button>
                </div>
                {captureError ? <p role="status">{captureError}</p> : null}
                <small className={styles.mediaNote}>Uploads are fitted into a 1440 × 900 frame.</small>
              </div>
              {stepActions(1)}
            </div>
          </section>
          <section ref={node => { sections.current[2] = node; }} hidden={step !== 2} className={styles.formSection} aria-labelledby="step-2-title">
            {stepHeading(2)}
            <div className={styles.fieldGrid}>
              <label className={styles.wideField}><span>Pricing model</span><select value={pricingModel} onChange={(event) => setPricingModel(event.target.value)}>{PRICING_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><span className={styles.fieldMeta}><FieldSource value={pricingModel} original={draft.analysis.pricingModel} urls={evidence?.pricing ?? []} pages={pages} /></span></label>
              {detailFields.map(key => <label className={styles.wideField} key={key}><span>{detailLabels[key]}</span><textarea rows={4} maxLength={1200} value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /><span className={styles.fieldMeta}><FieldSource value={details[key]} original={draft.analysis.details?.[key]?.text ?? ""} urls={draft.analysis.details?.[key]?.sourceUrl ? [draft.analysis.details[key].sourceUrl] : []} pages={pages} optional /><small>{details[key].length}/1200</small></span></label>)}
              {stepActions(2)}
            </div>
          </section>
          <section ref={node => { sections.current[3] = node; }} hidden={step !== 3} className={styles.formSection} aria-labelledby="step-3-title">
            {stepHeading(3)}
            <div className={styles.stepBody}>
              <div className={styles.fieldGrid}>
                <label><span>Primary category group</span><select value={primaryCategory} onChange={(event) => setPrimaryCategory(event.target.value)}>{categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
              </div>
              <div className={styles.classificationGroups}>
                {tagGroups.map((group) => (
                  <fieldset className={styles.choiceField} key={group.kind}>
                    <legend>{group.legend}</legend>
                    <p>{group.description}</p>
                    <div>{group.items.map((tag) => {
                      const selected = tagSlugs.includes(tag.slug);
                      const disabled = !selected && (tagSlugs.length >= 8 || (tag.kind === "category" && selectedBrowseCategoryCount >= 4));
                      const label = tag.kind === "category" && tag.groupName ? `${tag.groupName} / ${tag.name}` : tag.name;
                      return <label key={tag.slug}><input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleTag(tag.slug)} /><span>{label}</span></label>;
                    })}</div>
                  </fieldset>
                ))}
              </div>
              {stepActions(3)}
            </div>
          </section>
          {reviewing ? <article className={styles.profilePreview} aria-label="Profile preview">
            <section className={styles.previewBlock}>
              <header><p className={styles.stepLabel}>Identity</p>{editButton(0)}</header>
              <div className={styles.previewIdentity}>
                {preparedLogoPreview ? <Image className={styles.previewLogo} src={preparedLogoPreview} alt={`${name} logo`} width={72} height={72} unoptimized /> : <span className={styles.previewLogo}>{toolMark(name)}</span>}
                <div><h2>{name}</h2><p>{tagline}</p></div>
              </div>
              <p>{description}</p>
            </section>
            <section className={styles.previewBlock}>
              <header><p className={styles.stepLabel}>Images</p>{editButton(1)}</header>
              {screenshotPreview ? <Image className={styles.screenshot} src={screenshotPreview} alt={`${name} screenshot`} width={1440} height={900} unoptimized /> : <p className={styles.previewMeta}>No screenshot</p>}
            </section>
            <section className={styles.previewBlock}>
              <header><p className={styles.stepLabel}>Details</p>{editButton(2)}</header>
              <p className={styles.previewMeta}>{PRICING_OPTIONS.find(([value]) => value === pricingModel)?.[1]}</p>
              {detailFields.map(key => details[key] ? <div key={key}><h3>{detailLabels[key]}</h3><p className={styles.detailText}>{details[key]}</p></div> : null)}
            </section>
            <section className={styles.previewBlock}>
              <header><p className={styles.stepLabel}>Categories</p>{editButton(3)}</header>
              <p className={styles.previewMeta}>{categories.find(category => category.slug === primaryCategory)?.name} · {tags.filter(tag => tagSlugs.includes(tag.slug)).map(tag => tag.name).join(" · ")}</p>
            </section>
          </article> : null}
          <section hidden={!reviewing} className={styles.publishSection} aria-labelledby="publish-title">
            <div><p className={styles.stepLabel}>Final confirmation</p><h3 id="publish-title">Submit for review</h3><p>Ordalin researches the official website before the listing goes live. Existing domains cannot be overwritten through this form.</p></div>
            <label className={styles.emailField}><span>Private contact email</span><input name="contactEmail" type="email" autoComplete="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} aria-required="true" {...invalid("contactEmail")} />{fieldNote("contactEmail", <small>Used only if Ordalin needs to contact you about this listing.</small>)}</label>
            <div className={styles.turnstile}><TurnstileBox key={turnstileVersion} siteKey={turnstileSiteKey} onToken={handleToken} /></div>
            {error && reviewing ? <div className={styles.error} role="alert">{error}</div> : null}
            <button className={styles.publishButton} type="submit" disabled={busy || captureBusy || !reviewing || !turnstileToken || selectedBrowseCategoryCount === 0 || !hasPrimaryGroupCategory}>{busy ? "Submitting…" : `Submit ${name || "tool"} →`}</button>
          </section>
        </form>
      )}
    </div>
  );
}
