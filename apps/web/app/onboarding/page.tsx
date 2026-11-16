import { AppShell } from "../../components/AppShell";
import { PageHeader } from "../../components/primitives";
import { loadVacancies, requireProfile } from "../../lib/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

/**
 * The wizard opens on whatever the candidate has already confirmed and edits
 * that one profile, name and email included. Nothing is imported, so every
 * empty field here is exactly what the completeness bar is measuring.
 */
export default async function OnboardingPage() {
  const profile = await requireProfile();
  // The skills step suggests what the market asks for, recomputed in the
  // browser as chips come and go, so the wizard needs the vacancies themselves.
  const vacancies = await loadVacancies();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Mi perfil"
        title="Completa tu perfil"
        lead={`Cinco pasos para contar quién eres y qué buscas. Te evaluamos contra ${vacancies.length} vacantes abiertas.`}
      />
      <OnboardingWizard initial={profile} vacancies={vacancies} />
    </AppShell>
  );
}
