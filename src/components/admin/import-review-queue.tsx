"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { PricingModel, TagKind } from "@/domain/catalog";
import styles from "./imports.module.css";

type Category = { slug: string; name: string };
type Tag = { slug: string; name: string; kind: TagKind; groupSlug: string | null };
type ImportItem = {
  id: string;
  provider: "product_hunt" | "toolify" | "manual";
  discoveryUrl: string;
  websiteUrl: string;
  canonicalDomain: string;
  status: string;
  discoveredAt: number;
  toolSlug: string | null;
  name: string;
  tagline: string;
  description: string;
  pricingModel: PricingModel;
  primaryCategorySlug: string;
  categorySlugs: string[];
  tagSlugs: string[];
  decisionReasons: string[];
  evidenceUrls: string[];
  hasScreenshot: boolean;
  errorSummary: string | null;
};

const PRICING_OPTIONS: Array<[PricingModel, string]> = [
  ["free", "Free"], ["freemium", "Free plan"], ["paid", "Paid"],
  ["free_trial", "Free trial"], ["contact_sales", "Contact sales"], ["unknown", "Unknown"],
];

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function ReviewCard({ item, categories, tags }: { item: ImportItem; categories: Category[]; tags: Tag[] }) {
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(item.name);
  const [tagline, setTagline] = useState(item.tagline);
  const [description, setDescription] = useState(item.description);
  const [pricingModel, setPricingModel] = useState<PricingModel>(item.pricingModel);
  const [primaryCategorySlug, setPrimaryCategorySlug] = useState(item.primaryCategorySlug);
  const [categorySlugs, setCategorySlugs] = useState(item.categorySlugs);
  const [tagSlugs, setTagSlugs] = useState(item.tagSlugs);

  const toggle = (value: string, current: string[], setValue: (next: string[]) => void, max: number) => {
    if (current.includes(value)) setValue(current.filter((itemValue) => itemValue !== value));
    else if (current.length < max) setValue([...current, value]);
  };

  async function request(action: "publish" | "reject", event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/imports/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          fields: { name, tagline, description, pricingModel, primaryCategorySlug, categorySlugs, tagSlugs },
        }),
      });
      const value = await response.json() as { status?: string; error?: string };
      if (!response.ok) throw new Error(value.error ?? "Review failed");
      setStatus(value.status ?? action);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  const pending = status === "pending_review";
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <div className={styles.sourceLine}>
            <span className={styles.provider}>{item.provider.replace("_", " ")}</span>
            <span>{new Date(item.discoveredAt * 1_000).toLocaleDateString("en-AU")}</span>
            <span>{item.canonicalDomain}</span>
          </div>
          <h2>{name || item.canonicalDomain}</h2>
          <p>{tagline || "Analysis has not produced a short description."}</p>
        </div>
        <span className={`${styles.status} ${styles[`status_${status}`] ?? ""}`}>{statusLabel(status)}</span>
      </header>

      <div className={styles.links}>
        <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer">Official website ↗</a>
        <a href={item.discoveryUrl} target="_blank" rel="noopener noreferrer">Source listing ↗</a>
        {item.toolSlug ? <Link href={`/tools/${item.toolSlug}`}>Tool profile →</Link> : null}
      </div>

      {item.decisionReasons.length ? (
        <section className={styles.reasons} aria-label="Review reasons">
          <strong>Why this needs attention</strong>
          <ul>{item.decisionReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
      ) : null}
      {item.errorSummary ? <p className={styles.error}>{item.errorSummary}</p> : null}

      {pending ? (
        <form className={styles.form} onSubmit={(event) => request("publish", event)}>
          <div className={styles.fieldGrid}>
            <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required /></label>
            <label><span>Pricing</span><select value={pricingModel} onChange={(event) => setPricingModel(event.target.value as PricingModel)}>{PRICING_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label className={styles.wide}><span>Short description</span><input value={tagline} onChange={(event) => setTagline(event.target.value)} minLength={20} maxLength={180} required /></label>
            <label className={styles.wide}><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={60} maxLength={1_200} rows={4} required /></label>
            <label><span>Primary group</span><select value={primaryCategorySlug} onChange={(event) => {
              const next = event.target.value;
              setPrimaryCategorySlug(next);
              if (!categorySlugs.includes(next)) setCategorySlugs([next, ...categorySlugs].slice(0, 4));
            }}>{categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label>
          </div>

          <details className={styles.classification}>
            <summary>Classification · {categorySlugs.length} groups · {tagSlugs.length} tags</summary>
            <fieldset>
              <legend>Category groups</legend>
              <div className={styles.checkGrid}>{categories.map((category) => <label key={category.slug}><input type="checkbox" checked={categorySlugs.includes(category.slug)} disabled={category.slug === primaryCategorySlug || (!categorySlugs.includes(category.slug) && categorySlugs.length >= 4)} onChange={() => toggle(category.slug, categorySlugs, setCategorySlugs, 4)} />{category.name}</label>)}</div>
            </fieldset>
            <fieldset>
              <legend>Concrete categories and attributes</legend>
              <div className={styles.checkGrid}>{tags.map((tag) => <label key={tag.slug}><input type="checkbox" checked={tagSlugs.includes(tag.slug)} disabled={!tagSlugs.includes(tag.slug) && tagSlugs.length >= 8} onChange={() => toggle(tag.slug, tagSlugs, setTagSlugs, 8)} />{tag.name}</label>)}</div>
            </fieldset>
          </details>

          <div className={styles.evidence}>
            <span>Evidence</span>
            {item.evidenceUrls.map((url) => <a href={url} target="_blank" rel="noopener noreferrer" key={url}>{new URL(url).pathname || "/"} ↗</a>)}
            <span>{item.hasScreenshot ? "Screenshot ready" : "Screenshot missing"}</span>
          </div>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <button className={styles.publish} type="submit" disabled={busy}>{busy ? "Working…" : "Publish changes"}</button>
            <button className={styles.reject} type="button" disabled={busy} onClick={() => request("reject")}>Reject</button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

export function ImportReviewQueue({ items, categories, tags }: { items: ImportItem[]; categories: Category[]; tags: Tag[] }) {
  return <div className={styles.queue}>{items.map((item) => <ReviewCard item={item} categories={categories} tags={tags} key={item.id} />)}</div>;
}
