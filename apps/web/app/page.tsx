import { redirect } from "next/navigation";

import { loadProfile } from "../lib/queries.js";

export const dynamic = "force-dynamic";

/** A candidate with no profile starts at the wizard, everyone else at the dashboard. */
export default async function Home() {
  redirect((await loadProfile()) ? "/dashboard" : "/onboarding");
}
