"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./site-shell.module.css";

const THEME_STORAGE_KEY = "ordalin-theme:v1";

type ThemePreference = "system" | "light" | "dark";
type ThemeSnapshot = "system-light" | "system-dark" | "light" | "dark";

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const themeListeners = new Set<() => void>();

function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "system" || saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // Fall back to the operating-system preference when storage is unavailable.
  }

  return "system";
}

function getResolvedTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = getResolvedTheme(preference);
  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((element) =>
      element.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#1c2522" : "#e9efec",
      ),
    );
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    if (getThemePreference() !== "system") return;
    applyTheme("system");
    callback();
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyTheme(getThemePreference());
    callback();
  };

  mediaQuery.addEventListener("change", handleSystemChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    themeListeners.delete(callback);
    mediaQuery.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function getThemeSnapshot(): ThemeSnapshot {
  const preference = getThemePreference();
  if (preference === "system") {
    return getResolvedTheme(preference) === "dark"
      ? "system-dark"
      : "system-light";
  }
  return preference;
}

function getThemeServerSnapshot(): ThemeSnapshot {
  return "system-light";
}

function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // The preference still applies to the current page when storage is blocked.
  }

  applyTheme(preference);
  themeListeners.forEach((listener) => listener());
}

function ThemeIcon({ resolvedTheme }: { resolvedTheme: "light" | "dark" }) {
  return resolvedTheme === "dark" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.3 15.2A8.4 8.4 0 0 1 8.8 3.7 8.5 8.5 0 1 0 20.3 15.2Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

export function ThemeSelector() {
  const snapshot = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const preference: ThemePreference =
    snapshot === "system-light" || snapshot === "system-dark"
      ? "system"
      : snapshot;
  const resolvedTheme = snapshot.endsWith("dark") ? "dark" : "light";

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.themeSelector} ref={containerRef}>
      <button
        ref={triggerRef}
        className={styles.themeTrigger}
        type="button"
        aria-label={`Appearance: ${preference}${preference === "system" ? ` (${resolvedTheme})` : ""}`}
        aria-expanded={open}
        aria-controls="appearance-options"
        title="Appearance"
        onClick={() => setOpen((current) => !current)}
      >
        <ThemeIcon resolvedTheme={resolvedTheme} />
      </button>
      {open ? (
        <div
          id="appearance-options"
          className={styles.themeMenu}
          role="group"
          aria-label="Appearance"
        >
          <span className={styles.themeMenuLabel}>Appearance</span>
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={preference === option.value}
              onClick={() => {
                setThemePreference(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {preference === option.value ? (
                <span className={styles.themeCheck} aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
