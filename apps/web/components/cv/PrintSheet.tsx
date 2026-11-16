"use client";

import { useEffect } from "react";
import type { CvDocument } from "@moonlight/types";

import { HarvardCv } from "./HarvardCv";

/**
 * The one sheet that goes to paper, from a download button or Ctrl+P alike;
 * the page hides everything else in print while it exists. "Guardar como PDF"
 * names the file after the page title, so `title` renames the page meanwhile.
 */
export function PrintSheet({ doc, title }: { doc: CvDocument; title?: string }) {
  useEffect(() => {
    if (!title) return;
    const original = document.title;
    const rename = (): void => {
      document.title = title;
    };
    const restore = (): void => {
      document.title = original;
    };
    window.addEventListener("beforeprint", rename);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", rename);
      window.removeEventListener("afterprint", restore);
    };
  }, [title]);

  return (
    <div data-print-sheet className="hidden print:block">
      <HarvardCv doc={doc} standalone />
    </div>
  );
}
