"use client";

import { useEffect, useRef } from "react";
import { normalizeSearchQuery, resultBucket, trackEvent } from "@/lib/analytics";

// Reports each distinct query once, on its first results page. Filter and
// pagination changes for the same query are not new searches.
export function SearchTracker({ query, total, page = 1 }: { query: string; total: number; page?: number }) {
  const lastQuery = useRef("");
  useEffect(() => {
    const normalized = normalizeSearchQuery(query);
    if (!normalized || page !== 1 || normalized === lastQuery.current) return;
    lastQuery.current = normalized;
    trackEvent("Search", { query: normalized, results: resultBucket(total) });
  }, [query, total, page]);
  return null;
}
