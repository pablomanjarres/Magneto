import { Card } from "../../components/primitives";
import { shortDate } from "../../lib/format";
import type { loadActivity } from "../../lib/queries";

type ActivityItem = Awaited<ReturnType<typeof loadActivity>>[number];

/** The activity log beside the board, newest first. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="flex h-fit animate-rise flex-col gap-4 p-5 [animation-delay:200ms]">
      <h2 className="text-lg font-black text-slate">Actividad reciente</h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          Aún no hay actividad. Cada postulación y cada cambio quedan registrados aquí.
        </p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="relative flex animate-rise gap-3 pb-4 last:pb-0"
              style={{ animationDelay: `${250 + index * 50}ms` }}
            >
              {index < items.length - 1 && (
                // The rail joining one event to the next.
                <span aria-hidden className="absolute top-3 bottom-0 left-[4.5px] w-px bg-line" />
              )}
              <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand" />
              <div className="min-w-0">
                <p className="text-sm text-pretty text-ink">{item.sentence}</p>
                <time dateTime={item.createdAt} className="text-xs text-muted">
                  {shortDate(item.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
