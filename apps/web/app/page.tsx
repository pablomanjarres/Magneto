import { redirect } from "next/navigation";

import { currentProfile } from "../lib/queries";

export const dynamic = "force-dynamic";

/** A registered candidate goes to the dashboard, a new one to the form. */
export default async function Home() {
  redirect((await currentProfile()) ? "/dashboard" : "/register");
}
