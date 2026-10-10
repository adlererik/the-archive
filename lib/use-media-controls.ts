"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from "react";

const IDLE_DELAY = 3000;

// Only visible cards run an idle timer; keyboard use and open menus keep controls available.
export function useMediaControls(surface: RefObject<HTMLDivElement | null>, menuOpen: boolean) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inView = useRef(false);
  const keyboardFocus = useRef(false);
  const pointerHeld = useRef(false);
  const pinned = useRef(menuOpen);
  pinned.current = menuOpen;

  const clearTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const reveal = useCallback(() => {
    clearTimer();
    setVisible(true);
    if (inView.current && !pinned.current && !keyboardFocus.current && !pointerHeld.current) {
      timer.current = setTimeout(() => { timer.current = null; setVisible(false); }, IDLE_DELAY);
    }
  }, [clearTimer]);

  useEffect(() => {
    const node = surface.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
      if (entry.isIntersecting) reveal();
      else { clearTimer(); setVisible(false); }
    });
    observer.observe(node);
    return () => { observer.disconnect(); clearTimer(); };
  }, [surface, reveal, clearTimer]);

  useEffect(() => { reveal(); }, [menuOpen, reveal]);

  return {
    visible: visible || menuOpen,
    reveal,
    activity: {
      onPointerMoveCapture: reveal,
      onPointerDownCapture: () => { pointerHeld.current = true; reveal(); },
      onPointerUpCapture: () => { pointerHeld.current = false; reveal(); },
      onPointerCancelCapture: () => { pointerHeld.current = false; reveal(); },
      onPointerEnter: reveal,
      onPointerLeave: () => { pointerHeld.current = false; reveal(); },
      onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
        keyboardFocus.current = event.target.matches(":focus-visible");
        reveal();
      },
      onBlurCapture: () => { keyboardFocus.current = false; reveal(); },
      onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => {
        keyboardFocus.current = surface.current?.contains(document.activeElement) ?? false;
        if (event.key !== "Tab") reveal();
      },
    },
  };
}
