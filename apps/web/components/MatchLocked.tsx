import { Icon } from "./Icon";
import { ButtonLink, Card } from "./primitives";

/** What the candidate gets once the profile has a skill to compare. */
const UNLOCKS = [
  "Tu % de match en cada vacante",
  "Las vacantes ordenadas por lo que ya cumples",
  "Lo que te falta en cada una",
];

/**
 * Where a match would be while the profile has no skills: why there is no
 * number yet, what turns it on, and the two ways to get there. Shown instead
 * of a 0% that would only mean "nothing to compare". The job page, the
 * vacancy list and the dashboard share it.
 */
export function MatchLocked({ vacancyCount }: { vacancyCount: number }) {
  return (
    <Card className="flex animate-rise flex-col items-center gap-4 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-brand-wash text-brand">
        <Icon name="user" size={22} />
      </span>
      <div>
        <h2 className="text-xl font-black text-slate">Tu match aparece con tu primera habilidad</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-muted">
          Comparamos tus habilidades con los requisitos de cada vacante. Sin ninguna, las{" "}
          {vacancyCount} darían 0%.
        </p>
      </div>
      <ul className="flex flex-col gap-1.5 text-left text-sm font-bold text-ink">
        {UNLOCKS.map((unlock) => (
          <li key={unlock} className="flex items-center gap-2">
            <span className="text-mint-deep">
              <Icon name="check" size={14} strokeWidth={3} />
            </span>
            {unlock}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink href="/onboarding">
          Agregar mis habilidades
          <Icon name="arrowRight" size={16} strokeWidth={2.4} />
        </ButtonLink>
        <ButtonLink href="/import" variant="quiet">
          <Icon name="sparkles" size={15} />
          Importar LinkedIn o PDF
        </ButtonLink>
      </div>
    </Card>
  );
}
