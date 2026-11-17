import type { Profile } from "@moonlight/types";

import { AppShell } from "../../components/AppShell";
import { PageHeader } from "../../components/primitives";
import { loadVacancies, requireProfile } from "../../lib/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

/** Nothing filled in yet, under a new id: stored as soon as it has a name and an e-mail. */
const blankProfile = (): Profile => ({
  id: crypto.randomUUID(),
  email: "",
  fullName: "",
  skills: [],
  experience: [],
  education: [],
  expectations: { workModes: [], cities: [] },
});

/**
 * The wizard opens on whatever the candidate has already confirmed and edits
 * that one profile, name and email included. Nothing is imported, so every
 * empty field here is exactly what the completeness bar is measuring. With
 * `?nuevo` (the header's "Crear perfil nuevo") it first asks who a new profile
 * is for, stores it empty and opens again on it, so the import and every other
 * screen act as the new person rather than the one picked before.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const fresh = (await searchParams).nuevo !== undefined;
  const profile = fresh ? blankProfile() : await requireProfile();
  // The skills step suggests what the market asks for, recomputed in the
  // browser as chips come and go, so the wizard needs the vacancies themselves.
  const vacancies = await loadVacancies();

  return (
    <AppShell>
      <PageHeader
        eyebrow={fresh ? "Perfil nuevo" : "Mi perfil"}
        title={fresh ? "Crea un perfil desde cero" : "Completa tu perfil"}
        lead={
          fresh
            ? "Empieza vacío, sin nada del perfil que estabas usando."
            : `Cinco pasos para contar quién eres y qué buscas. Te evaluamos contra ${vacancies.length} vacantes abiertas.`
        }
      />
      <OnboardingWizard initial={profile} vacancies={vacancies} fresh={fresh} />
    </AppShell>
  );
}
