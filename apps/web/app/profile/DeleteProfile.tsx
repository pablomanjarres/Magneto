"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "../../components/Icon";
import { buttonClass } from "../../components/primitives";
import { deleteProfile } from "../../lib/client";

/**
 * A quiet way to delete the profile shown: a muted button that asks inline
 * before anything goes. Escape or "Cancelar" backs out. `name` is empty for a
 * profile nobody has named yet.
 */
export function DeleteProfile({ profileId, name }: { profileId: string; name: string }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Focus goes back to the button only after a cancel, not on the first render.
  const reopened = useRef(false);

  useEffect(() => {
    if (confirming) cancel.current?.focus();
    else if (reopened.current) trigger.current?.focus();
  }, [confirming]);

  // A failed delete re-enables the buttons; focus returns to them so Escape still works.
  useEffect(() => {
    if (error) cancel.current?.focus();
  }, [error]);

  function close(): void {
    if (busy) return;
    reopened.current = true;
    setError(null);
    setConfirming(false);
  }

  async function remove(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProfile(profileId);
      // A full load, as after a switch: every server component reads the cleared cookie.
      window.location.assign("/dashboard");
    } catch {
      setBusy(false);
      setError("No pudimos eliminar el perfil. Intenta de nuevo.");
    }
  }

  if (!confirming) {
    return (
      <button
        ref={trigger}
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 self-start rounded-full px-2 py-1 text-sm font-bold text-muted transition hover:text-danger focus-visible:text-danger"
      >
        <Icon name="trash" size={15} />
        Eliminar este perfil
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Eliminar este perfil"
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        close();
      }}
      className="flex w-full max-w-xs flex-col items-start gap-3 self-start"
    >
      <p className="text-sm text-ink">
        ¿Eliminar {name ? `a ${name}` : "este perfil"}? Se borran sus datos y sus postulaciones, y
        no se puede deshacer.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          ref={cancel}
          type="button"
          disabled={busy}
          onClick={close}
          className={buttonClass("quiet", "sm")}
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className={buttonClass("danger", "sm")}
        >
          {busy ? "Eliminando…" : "Sí, eliminar"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
