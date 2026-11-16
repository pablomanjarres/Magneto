import { redirect } from "next/navigation";

/** No sign-in: the app opens on the dashboard. */
export default function Home() {
  redirect("/dashboard");
}
