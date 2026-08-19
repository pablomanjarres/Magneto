import Link from "next/link";
import { groupByStatus } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { EmptyState } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { NoProfile } from "../../components/NoProfile";
import { loadBoard, loadProfile } from "../../lib/queries";
import { BoardColumn } from "./BoardColumn";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const profile = await loadProfile();
  if (!profile) return <NoProfile title="Applications" />;

  const cards = await loadBoard(profile);
  const columns = groupByStatus(cards);
  const interviews = cards.filter((card) => card.status === "interview").length;

  return (
    <AppShell
      title="Applications"
      meta={
        <span className="row" style={{ gap: 12 }}>
          <span>
            {cards.length} tracked · {interviews} at interview
          </span>
          <Link href="/jobs" className="btn btn--sm">
            <Icon name="plus" size={14} strokeWidth={2.2} />
            Track a vacancy
          </Link>
        </span>
      }
    >
      {cards.length === 0 ? (
        <EmptyState title="You have not applied anywhere yet">
          Every open vacancy is already scored against your profile. Pick one at{" "}
          <Link href="/jobs">/jobs</Link> and it lands in the first column.
        </EmptyState>
      ) : (
        <div className="board">
          {columns.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              cards={column.cards}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
