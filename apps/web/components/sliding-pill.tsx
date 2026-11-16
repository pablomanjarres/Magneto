"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** A box in the container's own coordinates, so a container that scrolls sideways keeps it right. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where a pill last sat. A caller that remounts on every page keeps one at
 * module scope, so the next mount starts there and slides on to the new item.
 */
export interface PillMemory<K> {
  current: { at: K; box: Box } | null;
}

/** Until the pill is measured, as in the server's HTML, the item paints the navy itself. */
const SOLID = "bg-navy text-white";
/** Over the pill the item only turns its text white, through its own colour transition. */
const ON_PILL = "text-white";
/** 350 ms, easing out; with reduced motion asked for, the pill jumps instead. */
const SLIDE =
  "transition-[transform,width,height] duration-350 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none";

/** Where the container's `aria-current` item sits inside it, or null when no item is current. */
function measure(container: HTMLElement): Box | null {
  const item = container.querySelector("[aria-current]");
  if (!item) return null;
  const outer = container.getBoundingClientRect();
  const inner = item.getBoundingClientRect();
  return {
    x: inner.left - outer.left - container.clientLeft + container.scrollLeft,
    y: inner.top - outer.top - container.clientTop + container.scrollTop,
    width: inner.width,
    height: inner.height,
  };
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return [a.x - b.x, a.y - b.y, a.width - b.width, a.height - b.height].every(
    (d) => Math.abs(d) < 0.1,
  );
}

/**
 * The navy pill behind the current item, which slides to the next item instead
 * of jumping. Render `pill` first inside a `relative` container whose current
 * item carries `aria-current`; items, or their content, need `relative` to
 * paint over it. `at` is the item the pill is on, which is what the items
 * should be drawn from, and `lit(key)` gives that item's navy classes.
 */
export function useSlidingPill<K>(current: K, memory?: PillMemory<K>) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pill, setPill] = useState(() => ({
    at: memory?.current ? memory.current.at : current,
    box: memory?.current?.box ?? null,
    slide: false,
  }));

  // Runs after every render. Measuring makes the browser place the pill where it
  // still is, so giving it the new box next animates instead of jumping.
  useLayoutEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    const box = measure(container);
    if (memory) memory.current = box ? { at: current, box } : null;
    if (pill.at !== current) {
      // A new current item: slide over from the old one, if the pill was showing.
      setPill({ at: current, box, slide: pill.box !== null && box !== null });
    } else if (!sameBox(pill.box, box)) {
      // The same item moved, say after new counts: follow it without sliding.
      setPill({ at: current, box, slide: false });
    }
  });

  // A resized window or a late font moves the items without a render.
  useEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const box = measure(container);
      setPill((p) => (sameBox(p.box, box) ? p : { ...p, box, slide: false }));
    });
    observer.observe(container);
    const item = container.querySelector("[aria-current]");
    if (item) observer.observe(item);
    return () => observer.disconnect();
  }, [current]);

  const { at, box, slide } = pill;
  return {
    pill: (
      <span
        ref={ref}
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 left-0 rounded-full bg-navy ${box ? "" : "hidden"} ${slide ? SLIDE : ""}`}
        style={
          box
            ? {
                transform: `translate(${box.x}px, ${box.y}px)`,
                width: box.width,
                height: box.height,
              }
            : undefined
        }
      />
    ),
    at,
    lit: (key: K): string | null => (key !== at ? null : box ? ON_PILL : SOLID),
  };
}
