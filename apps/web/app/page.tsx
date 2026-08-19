import { redirect } from "next/navigation";

import { currentProfile } from "../lib/session";

export const dynamic = "force-dynamic";

/** Signed in goes to the dashboard, everyone else to the sign-in page. */
export default async function Home() {
  redirect((await currentProfile()) ? "/dashboard" : "/login");
}
