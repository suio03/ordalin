"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toolMark } from "@/lib/catalog";
import type { TagKind } from "@/domain/catalog";
import type { CatalogAnalysis } from "@/lib/catalog-analysis";
import type { CatalogEnrichmentCandidate } from "@/lib/catalog-enrichment/contract";
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
type Draft = { draftId: string; candidate: CatalogEnrichmentCandidate; analysis: CatalogAnalysis };
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

export function SubmitFlow({ categories, tags, turnstileSiteKey }: { categories: Category[]; tags: Tag[]; turnstileSiteKey?: string }) {
  const [details, setDetails] = useState<Record<DetailField, string>>({ features: "", pricingDetails: "", useCases: "" });
  const [preparedLogo, setPreparedLogo] = useState<File | null>(null);
  const preparedLogoPreview = useMemo(() => preparedLogo ? URL.createObjectURL(preparedLogo) : null, [preparedLogo]);
  useEffect(() => () => { if (preparedLogoPreview) URL.revokeObjectURL(preparedLogoPreview); }, [preparedLogoPreview]);
  const [reviewing, setReviewing] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotChoice, setScreenshotChoice] = useState("none");
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [captureAttempts, setCaptureAttempts] = useState(0);
  const activeDraft = useRef("");
  const imageOperation = useRef(0);
  const screenshotPreview = useMemo(() => screenshot ? URL.createObjectURL(screenshot) : null, [screenshot]);
  useEffect(() => () => { if (screenshotPreview) URL.revokeObjectURL(screenshotPreview); }, [screenshotPreview]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [existingTool, setExistingTool] = useState<ExistingTool | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
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

  async function checkWebsite(event: FormEvent) {
    event.preventDefault(); setError(""); setExistingTool(null);
    if (!websiteUrl.trim()) { setError("Enter your product's website, like your-product.com."); return; }
    setBusy(true);
    try {
      const value = await responseJson(await fetch("/api/submissions/enrich", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ websiteUrl }),
      }));
      const next = value as unknown as Draft;
      activeDraft.current = next.draftId;
      setDraft(next); setReviewing(false); setLogoUpload(null); setScreenshot(null); setScreenshotChoice("none"); setCaptureAttempts(0);
      setDetails(Object.fromEntries(detailFields.map(key => [key, next.analysis.details?.[key]?.text ?? ""])) as Record<DetailField, string>);
      void captureScreenshot(next.draftId);
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
    } catch (caught) {
      const value = caught as { code?: string; existingTool?: ExistingTool };
      if (value.code === "duplicate_domain" && value.existingTool) setExistingTool(value.existingTool);
      setError(messageFrom(caught));
    } finally { setBusy(false); }
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

  async function publish(event: FormEvent) {
    event.preventDefault(); if (!draft || !reviewing || captureBusy) return; setBusy(true); setError("");
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
      const value = await responseJson(await fetch("/api/submissions/publish", { method: "POST", body: form }));
      setPublishedSlug(String(value.slug));
    } catch (caught) {
      setError(messageFrom(caught)); setTurnstileToken(""); setTurnstileVersion((version) => version + 1);
    } finally { setBusy(false); }
  }

  if (publishedSlug) return <SubmitSuccess slug={publishedSlug} name={name} tagline={tagline} logoSrc={preparedLogoPreview} />;

  return (
    <div className={styles.flow}>
      <ol className={styles.steps} aria-label="Submission progress">
        <li aria-current={draft ? undefined : "step"}><span>01</span> Check website</li>
        <li aria-current={draft && !reviewing ? "step" : undefined}><span>02</span> Edit profile</li>
        <li aria-current={reviewing ? "step" : undefined}><span>03</span> Preview & publish</li>
      </ol>
      {!draft ? (
        <section className={styles.urlStage}>
          <form onSubmit={checkWebsite} noValidate>
            <label htmlFor="website">Official product website</label>
            <div className={styles.urlControl}>
              <input id="website" type="text" inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} placeholder="your-product.com" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "website-error" : undefined} />
              <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check website →"}</button>
            </div>
            {error ? <div id="website-error" className={styles.error} role="alert">{error}{existingTool ? <Link href={`/tools/${existingTool.slug}`}>View {existingTool.name} →</Link> : null}</div> : null}
          </form>
          <div className={styles.stageNotes}>
            <p><span>01</span> We inspect a small set of public pages.</p>
            <p><span>02</span> Existing domains cannot be submitted again.</p>
            <p><span>03</span> Nothing is published until you confirm it.</p>
          </div>
        </section>
      ) : (
        <form className={styles.reviewForm} onSubmit={publish}>
          <header className={styles.reviewHeader}>
            <div><p className={styles.stepLabel}>Profile draft · {draft.candidate.canonicalDomain}</p><h2>Make this profile yours.</h2></div>
            <button className={styles.textButton} type="button" disabled={busy} onClick={() => { activeDraft.current = ""; imageOperation.current++; setCaptureBusy(false); setDraft(null); setError(""); }}>Use another website</button>
          </header>
          {draft.candidate.warnings.length ? <p className={styles.notice} role="status">{draft.candidate.warnings[0]}</p> : null}
          <div hidden={reviewing}>
          <section className={styles.formSection} aria-labelledby="identity-title">
            <div className={styles.sectionHeading}><span>01</span><div><h3 id="identity-title">Identity and purpose</h3><p>Edit vendor language into a short factual description.</p></div></div>
            <div className={styles.fieldGrid}>
              <label><span>Tool name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
              <label className={styles.wideField}><span>Short description</span><input value={tagline} onChange={(event) => setTagline(event.target.value)} minLength={20} maxLength={180} required /><small>{tagline.length}/180</small></label>
              <label className={styles.wideField}><span>What it does</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={60} maxLength={1200} rows={5} required /><small>{description.length}/1200</small></label>
            </div>
          </section>
          <section className={styles.formSection} aria-labelledby="logo-title">
            <div className={styles.sectionHeading}><span>02</span><div><h3 id="logo-title">Product mark</h3><p>Choose a discovered image, upload a cleaner one, or keep the letter mark.</p></div></div>
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
          </section>
          <section className={styles.formSection} aria-labelledby="screenshot-title">
            <div className={styles.sectionHeading}><span>03</span><div><h3 id="screenshot-title">Screenshot</h3><p>Check the image visitors will see. Uploads are fitted into a 1440 × 900 frame.</p></div></div>
            <div className={styles.mediaEditor}>
              {screenshotPreview ? <Image className={styles.screenshot} src={screenshotPreview} alt="Screenshot selected for publication" width={1440} height={900} unoptimized /> : <p className={styles.emptyImage}>{captureBusy ? "Capturing the website…" : "No screenshot selected"}</p>}
              <div className={styles.imageActions}>
                <button type="button" disabled={captureBusy || captureAttempts >= 3} onClick={() => void captureScreenshot(draft.draftId)}>{captureBusy ? "Preparing image…" : "Capture again"}</button>
                <label>Upload screenshot<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void uploadScreenshot(event.target.files?.[0]); event.target.value = ""; }} /></label>
                <button type="button" onClick={() => { imageOperation.current++; setCaptureBusy(false); setScreenshot(null); setScreenshotChoice("none"); setCaptureError(""); }}>No screenshot</button>
              </div>
              {captureError ? <p role="status">{captureError}</p> : null}
            </div>
          </section>
          <section className={styles.formSection} aria-labelledby="details-title">
            <div className={styles.sectionHeading}><span>04</span><div><h3 id="details-title">Product details</h3><p>Optional. Keep supported facts, correct anything inaccurate, or leave a section empty to hide it.</p></div></div>
            <div className={styles.fieldGrid}>{detailFields.map(key => <label className={styles.wideField} key={key}><span>{detailLabels[key]}</span><textarea rows={4} maxLength={1200} value={details[key]} onChange={event => setDetails(current => ({ ...current, [key]: event.target.value }))} /><small>{details[key] && details[key] === draft.analysis.details?.[key]?.text ? "From the website · please confirm" : "Your information"}</small></label>)}</div>
          </section>
          <section className={styles.formSection} aria-labelledby="facts-title">
            <div className={styles.sectionHeading}><span>05</span><div><h3 id="facts-title">Classification</h3><p>Choose a primary group and one to four specific categories.</p></div></div>
            <div className={styles.fieldGrid}>
              <label><span>Pricing</span><select value={pricingModel} onChange={(event) => setPricingModel(event.target.value)}>{PRICING_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
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
          </section>
          <button className={styles.publishButton} type="button" disabled={busy || captureBusy || selectedBrowseCategoryCount === 0 || !hasPrimaryGroupCategory} onClick={async event => {
            const form = event.currentTarget.form;
            const fields = form?.querySelectorAll("input:not([type=email]), textarea, select");
            if (fields && [...fields].some(field => !(field as unknown as HTMLInputElement).reportValidity())) return;
            if (logoChoice === "upload" && !logoUpload) { setError("Upload a logo or choose the letter mark."); return; }
            setBusy(true); setError("");
            try {
              const logo = logoChoice.startsWith("candidate:") ? await logoWebp(`/api/submissions/drafts/${draft.draftId}/assets/${logoChoice.split(":")[1]}`) : logoChoice === "upload" && logoUpload ? await logoWebp(logoUpload) : null;
              setPreparedLogo(logo); setReviewing(true);
            } catch (caught) { setError(messageFrom(caught)); }
            finally { setBusy(false); }
          }}>Preview profile →</button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </div>
          {reviewing ? <article className={styles.profilePreview} aria-label="Profile preview">
            <header><div><p className={styles.stepLabel}>Profile preview · Submitted information</p><h2>{name}</h2></div><button type="button" className={styles.textButton} disabled={busy} onClick={() => setReviewing(false)}>Edit profile</button></header>
            {preparedLogoPreview ? <Image className={styles.previewLogo} src={preparedLogoPreview!} alt={`${name} logo`} width={72} height={72} unoptimized /> : <span className={styles.previewLogo}>{toolMark(name)}</span>}
            <p>{tagline}</p><p className={styles.previewMeta}>{PRICING_OPTIONS.find(([value]) => value === pricingModel)?.[1]} · {categories.find(category => category.slug === primaryCategory)?.name}</p>
            <p>{description}</p>
            {detailFields.map(key => details[key] ? <section key={key}><h3>{detailLabels[key]}</h3><p className={styles.detailText}>{details[key]}</p></section> : null)}
            {screenshotPreview ? <Image className={styles.screenshot} src={screenshotPreview} alt={`${name} screenshot`} width={1440} height={900} unoptimized /> : null}
            <p className={styles.previewMeta}>{tags.filter(tag => tagSlugs.includes(tag.slug)).map(tag => tag.name).join(" · ")}</p>
          </article> : null}
          <section hidden={!reviewing} className={styles.publishSection} aria-labelledby="publish-title">
            <div><p className={styles.stepLabel}>Final confirmation</p><h3 id="publish-title">Publish submitted information</h3><p>This creates a public listing immediately. Existing domains cannot be overwritten through this form.</p></div>
            <label className={styles.emailField}><span>Private contact email</span><input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required /><small>Used only if Ordalin needs to contact you about this listing.</small></label>
            <div className={styles.turnstile}><TurnstileBox key={turnstileVersion} siteKey={turnstileSiteKey} onToken={handleToken} /></div>
            {error ? <div className={styles.error} role="alert">{error}</div> : null}
            <button className={styles.publishButton} type="submit" disabled={busy || captureBusy || !reviewing || !turnstileToken || selectedBrowseCategoryCount === 0 || !hasPrimaryGroupCategory}>{busy ? "Publishing…" : `Publish ${name || "tool"} →`}</button>
          </section>
        </form>
      )}
    </div>
  );
}
