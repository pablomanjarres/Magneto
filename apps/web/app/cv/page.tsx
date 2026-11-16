import type { Metadata } from "next";
import Link from "next/link";
import { toHarvardCv } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { HarvardCv } from "../../components/cv/HarvardCv";
import { Icon } from "../../components/Icon";
import { ButtonLink, PageHeader } from "../../components/primitives";
import { requireProfile } from "../../lib/queries";
import { AdaptedCv } from "./AdaptedCv";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

/** The browser names the saved PDF after the page title. */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await requireProfile();
  return { title: `${profile.fullName} · Hoja de vida` };
}

/** "experiencia, educación ni habilidades": a Spanish list after a negative. */
const nor = (items: string[]): string =>
  items.length > 1 ? `${items.slice(0, -1).join(", ")} ni ${items.at(-1)}` : (items[0] ?? "");

export default async function CvPage() {
  const profile = await requireProfile();
  const missing = Object.entries({
    experiencia: profile.experience,
    educación: profile.education,
    habilidades: profile.skills,
  }).flatMap(([label, list]) => (list.length === 0 ? [label] : []));

  return (
    <AppShell>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Hoja de vida"
          title="Tu hoja de vida"
          lead="Está en formato Harvard y se actualiza sola cada vez que cambia tu perfil, ya sea con una importación o desde el asistente."
          actions={
            <>
              <PrintButton />
              <ButtonLink href="/onboarding" variant="quiet">
                <Icon name="edit" size={16} />
                Editar perfil
              </ButtonLink>
              <ButtonLink href="/import" variant="quiet">
                <Icon name="upload" size={16} />
                Importar CV
              </ButtonLink>
            </>
          }
        />
      </div>

      <div className="flex animate-rise flex-col gap-4 [animation-delay:80ms] print:animate-none">
        {missing.length > 0 && (
          <p className="mx-auto flex w-full max-w-[8.5in] gap-3 rounded-2xl bg-brand-wash p-4 text-sm text-ink print:hidden">
            <span className="text-brand">
              <Icon name="sparkles" size={18} />
            </span>
            <span>
              Tu hoja de vida todavía no muestra {nor(missing)}.{" "}
              <Link href="/onboarding" className="font-bold text-brand hover:underline">
                Complétala en tu perfil
              </Link>
            </span>
          </p>
        )}
        <AdaptedCv profile={profile}>
          <HarvardCv doc={toHarvardCv(profile)} standalone />
        </AdaptedCv>
      </div>
    </AppShell>
  );
}
