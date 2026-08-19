import { AppShell } from "../../components/AppShell";
import { loadVacancies, requireProfile } from "../../lib/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

/**
 * The wizard opens on whatever the candidate has already confirmed. Delivery 1
 * imports nothing from LinkedIn, so a freshly registered candidate starts with
 * only the name and email they signed up with and fills the rest here — which
 * is exactly what the completeness bar is measuring.
 */
export default async function OnboardingPage() {
  const profile = await requireProfile();
  // The skills step suggests what the market asks for, recomputed in the
  // browser as chips come and go, so the wizard needs the vacancies themselves.
  const vacancies = await loadVacancies();

  return (
    <AppShell title="Your profile" meta={`${vacancies.length} vacancies waiting`}>
      <OnboardingWizard initial={profile} vacancies={vacancies} />
    </AppShell>
  );
}
