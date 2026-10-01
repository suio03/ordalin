"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toolMark } from "@/lib/catalog";
import styles from "./submit.module.css";

type Props = { slug: string; name: string; tagline: string; logoSrc: string | null };

const confettiTokens = ["--color-accent-primary", "--color-accent-text", "--color-accent-soft", "--color-text-primary", "--color-focus-ring"];

// One short burst from both sides; skipped when the visitor prefers reduced motion.
function burst(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * ratio; canvas.height = height * ratio;
  context.scale(ratio, ratio);
  const styles = getComputedStyle(document.documentElement);
  const colors = confettiTokens.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
  const pieces = Array.from({ length: 160 }, (_, index) => {
    const fromLeft = index % 2 === 0;
    const angle = (fromLeft ? -55 : -125) + (Math.random() - .5) * 40;
    const speed = (14 + Math.random() * 14) * Math.min(1.4, Math.max(.8, width / 1280));
    return {
      x: fromLeft ? 0 : width, y: height * .85,
      vx: Math.cos(angle * Math.PI / 180) * speed, vy: Math.sin(angle * Math.PI / 180) * speed,
      size: 5 + Math.random() * 6, rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * .3,
      color: colors[index % colors.length] ?? "#147754",
    };
  });
  let frame = 0;
  const start = performance.now();
  let last = start;
  function draw(now: number) {
    const elapsed = now - start;
    // Step by elapsed time so the burst looks the same at any frame rate.
    const step = Math.min(3, (now - last) / 16.7); last = now;
    context!.clearRect(0, 0, width, height);
    context!.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 2600) / 900);
    for (const piece of pieces) {
      const drag = Math.pow(.982, step);
      piece.vx *= drag; piece.vy = piece.vy * drag + .3 * step;
      piece.x += piece.vx * step; piece.y += piece.vy * step; piece.rotation += piece.spin * step;
      context!.save();
      context!.translate(piece.x, piece.y); context!.rotate(piece.rotation);
      context!.fillStyle = piece.color;
      context!.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context!.restore();
    }
    if (elapsed < 3500) frame = requestAnimationFrame(draw);
    else context!.clearRect(0, 0, width, height);
  }
  frame = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frame);
}

export function SubmitSuccess({ slug, name, tagline, logoSrc }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const path = `/tools/${slug}`;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    return canvas.current ? burst(canvas.current) : undefined;
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard can be blocked; the link stays visible below. */ }
  }

  return (
    <section className={styles.success} aria-live="polite">
      <canvas ref={canvas} className={styles.confetti} aria-hidden="true" />
      <p className={styles.successStatus}><span aria-hidden="true" />Published</p>
      <h2>{name} is live on Ordalin.</h2>
      <p className={styles.successLead}>Thanks for submitting. The listing is labelled as submitted information and can now be found across the catalogue.</p>
      <div className={styles.successCard}>
        {logoSrc ? <Image className={styles.previewLogo} src={logoSrc} alt="" width={56} height={56} unoptimized /> : <span className={styles.previewLogo}>{toolMark(name)}</span>}
        <div><strong>{name}</strong><p>{tagline}</p><small>ordalin.com{path}</small></div>
      </div>
      <div className={styles.successActions}>
        <Link className={styles.publishButton} href={path}>View your listing →</Link>
        <button type="button" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
        <a href="/submit">Submit another tool</a>
      </div>
    </section>
  );
}
