import type { ProfileSource } from "@moonlight/types";

export const SOURCE_LABELS: Record<ProfileSource, string> = {
  linkedin: "LinkedIn",
  resume: "Hoja de vida",
};

const SOURCE_TONES: Record<ProfileSource, string> = {
  linkedin: "bg-brand text-white",
  resume: "bg-mint text-mint-ink",
};

/** Where an imported entry came from, small enough to sit beside its name. */
export function SourceChip({ source }: { source: ProfileSource }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${SOURCE_TONES[source]}`}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}
