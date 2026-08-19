import type { WorkMode } from "@moonlight/types";

/**
 * The runtime twin of the WorkMode union: every mode, in the order the screens
 * offer them. @moonlight/types holds types only, so the list lives here — the
 * one place both /jobs and /onboarding can import from.
 */
export const WORK_MODES: readonly WorkMode[] = ["remote", "hybrid", "onsite"];
