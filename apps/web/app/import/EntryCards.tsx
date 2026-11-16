"use client";

import { useState, type ReactNode } from "react";
import { isLinkedInProfileUrl } from "@moonlight/core";

import { Icon, type IconName } from "../../components/Icon";
import { Card, buttonClass, inputClass, liftCard } from "../../components/primitives";

const MAX_BYTES = 5 * 1024 * 1024;
const SAMPLE_URL = "/samples/hoja-de-vida-ejemplo.pdf";

/** The same limits the server enforces, checked first so a wrong file fails at once. */
function pdfProblem(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Solo aceptamos archivos PDF.";
  if (file.size > MAX_BYTES) return "El archivo pesa más de 5 MB.";
  return null;
}

export function EntryCards({
  url,
  onUrlChange,
  lastFile,
  onLinkedIn,
  onFile,
}: {
  url: string;
  onUrlChange: (url: string) => void;
  lastFile: File | null;
  onLinkedIn: (url: string) => void;
  onFile: (file: File) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <LinkedInCard url={url} onUrlChange={onUrlChange} onSubmit={onLinkedIn} />
      <ResumeCard lastFile={lastFile} onFile={onFile} />
    </div>
  );
}

function EntryCard({
  icon,
  title,
  lead,
  delay,
  children,
}: {
  icon: IconName;
  title: string;
  lead: string;
  delay: string;
  children: ReactNode;
}) {
  return (
    <Card className={`flex animate-rise flex-col gap-5 p-6 sm:p-8 ${liftCard} ${delay}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand">
          <Icon name={icon} size={20} />
        </span>
        <div>
          <h2 className="text-xl font-black text-slate">{title}</h2>
          <p className="text-sm text-pretty text-muted">{lead}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function LinkedInCard({
  url,
  onUrlChange,
  onSubmit,
}: {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (url: string) => void;
}) {
  const valid = isLinkedInProfileUrl(url);
  const typed = url.trim() !== "";

  return (
    <EntryCard
      icon="user"
      title="Desde LinkedIn"
      lead="Pega la dirección de tu perfil público."
      delay="[animation-delay:80ms]"
    >
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(url.trim());
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            aria-label="Dirección de tu perfil de LinkedIn"
            aria-invalid={typed && !valid}
            inputMode="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="linkedin.com/in/tu-nombre"
          />
          <button type="submit" className={buttonClass("primary")} disabled={!valid}>
            Importar
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
        <p
          className={`min-h-5 px-4 text-xs font-bold ${valid ? "text-mint-deep" : "text-danger"}`}
          aria-live="polite"
        >
          {typed &&
            (valid
              ? "Perfil listo para importar."
              : "Usa una dirección como https://www.linkedin.com/in/tu-nombre")}
        </p>
      </form>
    </EntryCard>
  );
}

function ResumeCard({ lastFile, onFile }: { lastFile: File | null; onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  function take(file: File | undefined): void {
    if (!file) return;
    const issue = pdfProblem(file);
    setProblem(issue);
    if (!issue) onFile(file);
  }

  async function loadSample(): Promise<void> {
    setLoadingSample(true);
    setProblem(null);
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      onFile(new File([blob], "hoja-de-vida-ejemplo.pdf", { type: "application/pdf" }));
    } catch {
      setProblem("No pudimos cargar la hoja de vida de ejemplo.");
      setLoadingSample(false);
    }
  }

  return (
    <EntryCard
      icon="upload"
      title="Desde tu hoja de vida"
      lead="Un PDF de hasta 5 MB. Lo leemos y no lo guardamos."
      delay="[animation-delay:150ms]"
    >
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-8 text-center transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-wash ${
          dragging
            ? "scale-[1.01] border-brand bg-brand-wash"
            : "border-control hover:border-brand/50 hover:bg-brand-wash/40"
        }`}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-canvas text-brand motion-safe:animate-float">
          <Icon name="upload" size={22} />
        </span>
        <span className="font-bold text-slate">
          {dragging ? "Suelta tu PDF aquí" : "Arrastra tu PDF o haz clic para elegirlo"}
        </span>
