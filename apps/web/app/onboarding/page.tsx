import type { Profile } from "@moonlight/types";

import { AppShell } from "../../components/AppShell";
import { DEMO_PROFILE_ID } from "../../lib/demo";
import { loadProfile, loadRanked } from "../../lib/queries";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

/**
 * A resume or a LinkedIn is scraped elsewhere, so the wizard opens on what we
 * already hold and only asks the candidate to confirm it. With nothing scraped
 * it opens empty, on the one id delivery 1 has in place of a sign-in.
 */
const BLANK: Profile = {
  id: DEMO_PROFILE_ID,
  email: "",
  fullName: "",
  city: "",
  skills: [],
  experience: [],
  education: [],
  expectations: {
    targetRole: "",
    salaryMin: undefined,
    salaryMax: undefined,
    currency: "COP",
    workModes: [],
    willRelocate: false,
    cities: [],
  },
};

export default async function OnboardingPage() {
  const existing = await loadProfile();
  const initial = existing ?? BLANK;
  // The skills step suggests what the market asks for, recomputed in the
  // browser as chips come and go, so the wizard needs the vacancies themselves.
  const { vacancies } = await loadRanked(initial);

  return (
    <AppShell title="Setting up your profile" meta={`${vacancies.length} vacancies waiting`}>
      <OnboardingWizard initial={initial} vacancies={vacancies} />
    </AppShell>
  );
}
