"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Icon } from "./Icon";

/** The public site. public/qr-moonlight.svg encodes https:// plus exactly this. */
const SITE = "moonlight-lime.vercel.app";
const QR = "/qr-moonlight.svg";

/**
 * A small tab on the dashboard's right edge with the site's QR, so anyone in
 * the room can open Moon Light on their phone. It opens a mini pop-up with the
 * code large enough to scan; the close button, Escape or a click elsewhere put
 * it away. Wide screens only: on a phone it would cover the page it opens.
 */
export function SiteQr() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const tab = useRef<HTMLButtonElement>(null);

  function dismiss(): void {
    setOpen(false);
    tab.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") dismiss();
    };
    const onPointer = (event: PointerEvent): void => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      ref={wrapper}
      className="fixed top-1/2 right-0 z-40 hidden -translate-y-1/2 lg:block print:hidden"
    >
      {open && (
        <div
          id="site-qr"
          role="dialog"
          aria-label="Código QR de Moon Light"
          className="absolute top-1/2 right-full mr-3 w-72 -translate-y-1/2 animate-pop rounded-3xl border border-line bg-canvas p-5 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold text-slate">Ábrelo en tu celular</p>
            <button
              ref={closeButton}
              type="button"
              aria-label="Cerrar el código QR"
              onClick={dismiss}
              className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
            >
              <Icon name="close" size={16} strokeWidth={2.4} />
            </button>
          </div>
          <Image
            src={QR}
            alt={`Código QR que abre ${SITE}`}
            width={248}
            height={248}
            className="mt-3 w-full rounded-2xl"
          />
          <p className="mt-3 text-center text-sm font-bold text-ink">{SITE}</p>
          <p className="text-center text-xs text-muted">Apunta la cámara al código.</p>
        </div>
      )}

      <button
        ref={tab}
        type="button"
        aria-expanded={open}
        aria-controls="site-qr"
        aria-label="Código QR para abrir Moon Light en el celular"
        onClick={() => setOpen(!open)}
        className="flex flex-col items-center gap-1 rounded-l-2xl border border-r-0 border-line bg-canvas py-2.5 pr-2 pl-2.5 shadow-lg transition hover:bg-surface"
      >
        <Image src={QR} alt="" width={36} height={36} className="size-9" />
        <span className="text-[11px] font-bold text-ink">QR</span>
      </button>
    </div>
  );
}
