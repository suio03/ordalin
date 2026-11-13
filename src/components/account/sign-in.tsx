"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./sign-in.module.css";

const OPEN_EVENT = "ordalin:sign-in";
const HINT_COOKIE = "ordalin_signed_in";

type Reason = "submit" | "buy" | "account" | "general";
type OpenDetail = { next: string; reason: Reason; error?: string };

const REASONS: Record<Reason, string> = {
  submit: "Sign in to check your website and send it for review. Your first submission is free.",
  buy: "Sign in to buy credits. They are added to your account and never expire.",
  account: "Sign in to see your credits, submissions and review results.",
  general: "Sign in to submit tools, buy credits and follow your reviews.",
};

const ERRORS: Record<string, string> = {
  unavailable: "Google sign-in is not available right now. Please try again later.",
  failed: "Google sign-in did not complete. Please try again.",
  unverified: "This Google account has no verified email address.",
  blocked: "This account cannot submit tools. Contact Ordalin if you think this is a mistake.",
};

/** Opens the site-wide sign-in dialog; after Google sign-in the visitor lands on `next`. */
export function openSignIn(next: string, reason: Reason = "account") {
  window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_EVENT, { detail: { next, reason } }));
}

function readHint() {
  return document.cookie.split(";").some((part) => part.trim() === `${HINT_COOKIE}=1`);
}

/** Whether this browser holds a session. A hint only: the server still checks the session. */
export function useSignedIn() {
  return useSyncExternalStore(() => () => {}, readHint, () => false);
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" width="18" height="18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/** Header control: "Sign in" opens the dialog, "Account" links to /account. Owns the one dialog on the page. */
export function AccountControl({ className }: { className?: string }) {
  const signedIn = useSignedIn();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<{ next: string; reason: Reason; error?: string }>({ next: "/account", reason: "account" });

  const show = useCallback((next: OpenDetail) => {
    setState(next);
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => show((event as CustomEvent<OpenDetail>).detail);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [show]);

  // A failed Google sign-in returns with ?signin=<reason>: reopen the dialog with the message.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("signin");
    if (!code) return;
    url.searchParams.delete("signin");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    const reason: Reason = url.pathname === "/submit" ? "submit" : url.pathname === "/account" ? "account" : "buy";
    window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_EVENT, { detail: { next: `${url.pathname}${url.search}`, reason, error: ERRORS[code] ?? ERRORS.failed } }));
  }, [pathname]);

  const start = `/api/auth/google?${new URLSearchParams({ next: state.next })}`;
  return (
    <>
      {signedIn ? (
        <Link className={className} href="/account" prefetch={false}>Account</Link>
      ) : (
        <button className={className} type="button" onClick={() => show({ next: pathname === "/submit" || pathname === "/pricing" ? pathname : "/account", reason: "general" })}>Sign in</button>
      )}
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="sign-in-title" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <div className={styles.body}>
          <button className={styles.close} type="button" aria-label="Close" onClick={() => dialog.current?.close()}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
          <h2 id="sign-in-title">Sign in to Ordalin</h2>
          <p>{REASONS[state.reason]}</p>
          {state.error ? <p className={styles.error} role="alert">{state.error}</p> : null}
          {/* OAuth starts on an API route, so it needs a full page navigation. */}
          <a className={styles.google} href={start}><GoogleMark /> Continue with Google</a>
          <small>We use your Google email to tell you about your listings and to keep track of your free submission and credits. By continuing you agree to the <Link href="/terms" prefetch={false}>terms</Link> and <Link href="/privacy" prefetch={false}>privacy policy</Link>.</small>
        </div>
      </dialog>
    </>
  );
}

/** A button anywhere on the page that opens the dialog, or links straight on when already signed in. */
export function SignInGate({ next, reason, className, children }: { next: string; reason: Reason; className?: string; children: ReactNode }) {
  const signedIn = useSignedIn();
  if (signedIn) return <Link className={className} href={next} prefetch={false}>{children}</Link>;
  return <button className={className} type="button" onClick={() => openSignIn(next, reason)}>{children}</button>;
}

/** Always opens the dialog, for pages that already know the visitor is signed out. */
export function SignInButton({ next, reason, className, children }: { next: string; reason: Reason; className?: string; children: ReactNode }) {
  return <button className={className} type="button" onClick={() => openSignIn(next, reason)}>{children}</button>;
}
