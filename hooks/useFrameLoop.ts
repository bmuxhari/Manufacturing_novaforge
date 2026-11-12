"use client";

import { useEffect, useRef } from "react";

/**
 * One shared requestAnimationFrame loop for the whole page.
 * Every frame it reads the scroll position once and hands it to all subscribers,
 * so the nav, progress bar, hero, process steps, gears and cursor stay in sync.
 */
export type FrameInfo = {
  /** Current window.scrollY */
  scrollY: number;
  /** Pixels scrolled since the last frame (0 when not scrolling) */
  scrollDelta: number;
  /** True only on frames where the scroll position changed */
  scrollChanged: boolean;
};

type FrameCallback = (frame: FrameInfo) => void;

const subscribers = new Set<FrameCallback>();
let rafId = 0;
let previousScrollY = -1;

function tick() {
  const scrollY = window.scrollY;
  const scrollChanged = scrollY !== previousScrollY;
  const scrollDelta = scrollChanged && previousScrollY >= 0 ? scrollY - previousScrollY : 0;
  previousScrollY = scrollY;

  const frame: FrameInfo = { scrollY, scrollDelta, scrollChanged };
  subscribers.forEach((callback) => callback(frame));
  rafId = requestAnimationFrame(tick);
}

function subscribe(callback: FrameCallback) {
  subscribers.add(callback);
  if (subscribers.size === 1) {
    previousScrollY = -1;
    rafId = requestAnimationFrame(tick);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) cancelAnimationFrame(rafId);
  };
}

/** Runs `callback` on every animation frame. The latest callback is always used. */
export function useFrameLoop(callback: FrameCallback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => subscribe((frame) => callbackRef.current(frame)), []);
}
