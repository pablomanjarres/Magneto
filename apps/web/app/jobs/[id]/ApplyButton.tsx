"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_LABELS } from "@moonlight/core";
import type { Application } from "@moonlight/types";

import { Icon } from "../../../components/Icon";
import { Chip, buttonClass } from "../../../components/primitives";
import { applyToVacancy } from "../../../lib/client";
import { shortDate } from "../../../lib/format";

type Applied = Pick<Application, "status" | "appliedAt">;

/**
 * Apply, and what the vacancy shows once applied. The applied state appears
 * only after the API answers; the route is then refreshed so every other part
 * of the screen reads the new application too.
 */
export function ApplyButton({
  profileId,
  vacancyId,
  application,
}: {
  profileId: string;
  vacancyId: string;
  application?: Applied | undefined;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState<Applied | undefined>(application);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(): Promise<void> {
    setPending(true);
    setError(null);
    try {
      const { application: created } = await applyToVacancy(profileId, vacancyId);
      setApplied(created);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos registrar la postulación.");
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <div className="flex animate-pop flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <Chip tone="met">{STATUS_LABELS[applied.status]}</Chip>
          <span className="text-xs text-muted">desde el {shortDate(applied.appliedAt)}</span>
        </div>
        <Link href="/applications" className={buttonClass("ghost", "sm")}>
          Ver en mis postulaciones
          <Icon name="arrowRight" size={14} strokeWidth={2.4} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className={buttonClass("primary")}
        onClick={() => void apply()}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Postulando…" : "Postularme"}
        {!pending && <Icon name="arrowRight" size={16} strokeWidth={2.4} />}
      </button>
      {error ? (
        <span role="alert" className="text-xs font-bold text-danger">
          {error}
        </span>
      ) : (
        <span className="text-xs text-pretty text-muted">
          Queda registrada en tu tablero de postulaciones.
        </span>
      )}
    </div>
  );
}
