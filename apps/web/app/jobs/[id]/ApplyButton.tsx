"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "../../../components/Icon";
import { applyToVacancy } from "../../../lib/client";

/**
 * The only interactive piece of the vacancy screen. On success it refreshes the
 * route so the server component re-reads the application and swaps this button
 * for the status it now has.
 */
export function ApplyButton({ profileId, vacancyId }: { profileId: string; vacancyId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      await applyToVacancy(profileId, vacancyId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not record the application.");
      setPending(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => void apply()}
        disabled={pending}
      >
        {pending ? "Marking…" : "Mark as applied"}
        {!pending && <Icon name="check" size={16} strokeWidth={2.4} />}
      </button>

      {error ? (
        <span className="meta" role="alert" style={{ color: "var(--gold-text)" }}>
          {error}
        </span>
      ) : (
        <span className="meta" style={{ textWrap: "pretty" }}>
          Nothing is sent to the company. This records the application on your own board.
        </span>
      )}
    </div>
  );
}
