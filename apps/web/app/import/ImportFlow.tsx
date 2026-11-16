"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ImportedProfile, Profile, ProfileSource } from "@moonlight/types";

import { Icon } from "../../components/Icon";
import { ButtonLink, Card, Eyebrow, buttonClass } from "../../components/primitives";
import { startImport } from "../../lib/client";
import { EntryCards } from "./EntryCards";
import { type Added, ReviewStep, summary } from "./ReviewStep";
import { ScanStage } from "./ScanStage";

type Stage =
  | { kind: "entry" }
  | { kind: "scanning"; source: ProfileSource; done: number }
  | { kind: "review"; imported: ImportedProfile }
  | { kind: "saved"; added: Added }
  | { kind: "error"; message: string };

/** How long each finished step stays on screen before the next view, so the checks are seen. */
const BEAT_MS = 650;

/**
 * The whole import, one stage at a time: choose a source, watch it being read,
 * review what was found, save. The URL and the last file outlive a failure so
 * "Intentar de nuevo" starts from what the candidate already gave.
 */
export function ImportFlow({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "entry" });
  const [url, setUrl] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void): void => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  async function run(
    input: { url: string } | { file: File },
    source: ProfileSource,
  ): Promise<void> {
    setStage({ kind: "scanning", source, done: 0 });
    let settled = false;
    try {
      await startImport(input, (event) => {
        if (event.phase === "mapping") {
          setStage({ kind: "scanning", source, done: 1 });
        } else if (event.phase === "done") {
          settled = true;
          setStage({ kind: "scanning", source, done: 2 });
          later(BEAT_MS, () => setStage({ kind: "scanning", source, done: 3 }));
          later(BEAT_MS * 2, () => setStage({ kind: "review", imported: event.imported }));
        } else if (event.phase === "error") {
          settled = true;
          setStage({ kind: "error", message: event.message });
        }
      });
      if (!settled)
        setStage({ kind: "error", message: "La importación se interrumpió antes de terminar." });
    } catch (e) {
      setStage({
        kind: "error",
        message: e instanceof Error ? e.message : "No pudimos conectar con el servidor.",
      });
    }
  }

  switch (stage.kind) {
    case "entry":
      return (
        <EntryCards
          url={url}
          onUrlChange={setUrl}
          lastFile={lastFile}
          onLinkedIn={(value) => void run({ url: value }, "linkedin")}
          onFile={(file) => {
            setLastFile(file);
            void run({ file }, "resume");
          }}
        />
      );
    case "scanning":
      return <ScanStage source={stage.source} done={stage.done} />;
    case "review":
      return (
        <ReviewStep
          profile={profile}
          imported={stage.imported}
          onSaved={(added) => {
            setStage({ kind: "saved", added });
            router.refresh();
          }}
        />
      );
    case "saved":
      return (
        <Outcome
          tone="mint"
          eyebrow="Listo"
          title="Tu perfil quedó actualizado"
          lead={`Agregamos ${summary(stage.added)}. Cada vacante ya se evalúa con lo nuevo.`}
        >
          <ButtonLink href="/cv">
            <Icon name="document" size={16} />
            Ver mi hoja de vida
          </ButtonLink>
          <ButtonLink href="/profile" variant="quiet">
            Ver mi perfil
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="quiet">
            Ir al inicio
          </ButtonLink>
        </Outcome>
      );
    case "error":
      return (
        <Outcome
          tone="danger"
          eyebrow="No se pudo importar"
          title="Algo salió mal"
          lead={stage.message}
        >
          <button
            type="button"
            className={buttonClass("strong")}
            onClick={() => setStage({ kind: "entry" })}
          >
            <Icon name="arrowLeft" size={16} />
            Intentar de nuevo
          </button>
        </Outcome>
      );
  }
}

function Outcome({
  tone,
  eyebrow,
  title,
  lead,
  children,
}: {
  tone: "mint" | "danger";
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex animate-pop flex-col items-center gap-4 px-6 py-12 text-center">
      <span
        className={`flex size-16 animate-pop items-center justify-center rounded-full ${
          tone === "mint" ? "bg-mint text-mint-ink" : "bg-danger-wash text-danger"
        }`}
      >
        <Icon name={tone === "mint" ? "check" : "close"} size={28} strokeWidth={3} />
      </span>
      <div className="max-w-md" role={tone === "danger" ? "alert" : "status"}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-1 text-2xl font-black text-slate">{title}</h2>
        <p className="mt-2 text-pretty text-muted">{lead}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </Card>
  );
}
