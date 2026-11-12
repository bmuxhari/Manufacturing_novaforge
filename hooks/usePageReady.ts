"use client";

import { useEffect, useRef } from "react";

/**
 * "Page ready" = the preloader has finished.
 * The hero entrance, gear draw-on and scroll reveals all wait for this moment.
 */
let isReady = false;
const listeners = new Set<() => void>();

/** Called once by the Preloader when it finishes (or is skipped). */
export function markPageReady() {
  if (isReady) return;
  isReady = true;
  document.body.classList.remove("is-loading");
  document.body.classList.add("is-ready");
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Runs `callback` once the page is ready (immediately if it already is). */
export function usePageReady(callback: () => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) callbackRef.current();
    };
    if (isReady) run();
    else listeners.add(run);
    return () => {
      cancelled = true;
      listeners.delete(run);
    };
  }, []);
}
