import Link from "next/link";

import { AppShell } from "./AppShell";
import { EmptyState } from "./primitives";

/**
 * What every screen shows when there is no candidate in the database. Four
 * screens need it, so it is written once. Delivery 1 has no sign-in, so this
 * is a seeding problem rather than a logged-out state.
 */
export function NoProfile({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <EmptyState title="No candidate yet">
        Run <code>pnpm db:migrate &amp;&amp; pnpm db:seed</code>, or fill the wizard at{" "}
        <Link href="/onboarding">/onboarding</Link>.
      </EmptyState>
    </AppShell>
  );
}
