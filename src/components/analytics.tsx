"use client";

import { useEffect } from "react";
import { GA_MEASUREMENT_ID, installAnalytics } from "@/lib/analytics";

export function Analytics() {
  useEffect(() => {
    installAnalytics(window, process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? GA_MEASUREMENT_ID);
  }, []);
  return null;
}
