import { groupByStatus } from "@moonlight/core";

import { AppShell } from "../../components/AppShell";
import { ButtonLink, EmptyState, PageHeader } from "../../components/primitives";
import { Icon } from "../../components/Icon";
import { loadActivity, loadBoard, requireProfile } from "../../lib/queries";
import { ActivityFeed } from "./ActivityFeed";
import { BoardColumn } from "./BoardColumn";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const profile = await requireProfile();
  const [cards, activity] = await Promise.all([loadBoard(profile), loadActivity(profile.id)]);
  const interviews = cards.filter((card) => card.status === "interview").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Postulaciones"
        title="Tu proceso, paso a paso"
        lead={`${cards.length} ${cards.length === 1 ? "postulación" : "postulaciones"} en seguimiento · ${interviews} en entrevista. Mueve cada una según avance y anota tu próximo paso.`}
        actions={
          <ButtonLink href="/jobs">
            <Icon name="plus" size={16} strokeWidth={2.4} />
            Postularme a otra
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-6">
        {cards.length === 0 ? (
          <EmptyState title="Aún no te has postulado">
            Cada vacante ya está evaluada contra tu perfil. Elige una en Vacantes y aparecerá en la
            primera columna.
          </EmptyState>
        ) : (
          <div className="-mx-4 grid animate-rise snap-x auto-cols-[minmax(260px,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 [animation-delay:100ms] sm:mx-0 sm:px-0">
            {groupByStatus(cards).map((column) => (
              <BoardColumn
                key={column.status}
                status={column.status}
                label={column.label}
                cards={column.cards}
              />
            ))}
          </div>
        )}

        <ActivityFeed items={activity} />
      </div>
    </AppShell>
  );
}
