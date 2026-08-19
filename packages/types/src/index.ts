/** Shapes shared across every boundary. No logic lives here. */

export type WorkMode = "remote" | "hybrid" | "onsite";
export type RequirementKind = "must-have" | "nice-to-have";

export interface Skill {
  name: string;
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string | undefined;
  description?: string | undefined;
}

export interface Education {
  institution: string;
  degree: string;
  startYear: number;
  endYear?: number | undefined;
}

export interface Expectations {
  targetRole?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  workModes: WorkMode[];
  willRelocate: boolean;
  cities: string[];
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  city?: string | undefined;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  expectations: Expectations;
}

/** A single thing a vacancy asks for. Weight is derived from the kind, never stored twice. */
export interface Requirement {
  skill: string;
  kind: RequirementKind;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  workMode: WorkMode;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  requirements: Requirement[];
}

export interface ScoreLine {
  skill: string;
  kind: RequirementKind;
  met: boolean;
  weight: number;
}

export interface ScoreResult {
  vacancyId: string;
  score: number;
  matched: Requirement[];
  missing: Requirement[];
  reason: string;
  breakdown: ScoreLine[];
}

/** Where an application sits in the candidate's own pipeline. */
export type ApplicationStatus = "applied" | "in-review" | "interview" | "rejected";

/**
 * A candidate's application to one vacancy. The brief rules out real
 * auto-applying, so this records an application the candidate makes and tracks
 * its state; nothing is sent anywhere.
 */
export interface Application {
  id: string;
  profileId: string;
  vacancyId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  note?: string | undefined;
}

/** An application with the vacancy behind it and its score, for the board. */
export interface ApplicationCard extends Application {
  vacancy: Vacancy;
  score: number;
}

export interface CompletenessResult {
  percentage: number;
  missing: string[];
}

/** A skill the candidate lacks, measured against the whole vacancy set. */
export interface MarketGap {
  skill: string;
  demandCount: number;
  sharePercent: number;
}
