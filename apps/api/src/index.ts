import express from "express";
import type { Profile } from "@moonlight/types";
import {
  createApplication,
  deleteApplication,
  getApplication,
  getProfile,
  getVacancy,
  listApplications,
  listVacancies,
  saveProfile,
  updateApplicationStatus,
} from "@moonlight/db";
import {
  ALLOWED_MOVES,
  applicationCards,
  canMove,
  isApplicationStatus,
  marketGaps,
  profileCompleteness,
  rankVacancies,
} from "@moonlight/core";

// Branch B of the comparison PoC: the same endpoints as apps/web/app/api,
// running as a standalone Express service instead of Next route handlers.
// The payloads are byte-identical on purpose — see docs/poc-comparison.md.
const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "express" });
});

app.get("/vacancies", async (_req, res) => {
  res.json(await listVacancies());
});

app.get("/vacancies/:id", async (req, res) => {
  const vacancy = await getVacancy(req.params.id);
  if (!vacancy) {
    res.status(404).json({ error: "vacancy not found" });
    return;
  }
  res.json(vacancy);
});

app.post("/profiles", async (req, res) => {
  const profile = req.body as Profile;
  if (!profile?.id || !profile.email) {
    res.status(400).json({ error: "id and email are required" });
    return;
  }
  const saved = await saveProfile(profile);
  res.status(201).json({ profile: saved, completeness: profileCompleteness(saved) });
});

app.get("/profiles/:id", async (req, res) => {
  const profile = await getProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "profile not found" });
    return;
  }
  res.json({ profile, completeness: profileCompleteness(profile) });
});

app.get("/profiles/:id/recommendations", async (req, res) => {
  const profile = await getProfile(req.params.id);
  if (!profile) {
    res.status(404).json({ error: "profile not found" });
    return;
  }
  const vacancies = await listVacancies();
  res.json({
    completeness: profileCompleteness(profile),
    recommendations: rankVacancies(profile, vacancies),
    marketGaps: marketGaps(profile, vacancies),
  });
});

app.get("/applications", async (req, res) => {
  const profileId = typeof req.query["profileId"] === "string" ? req.query["profileId"] : "";
  if (!profileId) {
    res.status(400).json({ error: "profileId is required" });
    return;
  }
  const profile = await getProfile(profileId);
  if (!profile) {
    res.status(404).json({ error: "profile not found" });
    return;
  }
  const [applications, vacancies] = await Promise.all([
    listApplications(profileId),
    listVacancies(),
  ]);
  res.json({ applications: applicationCards(profile, applications, vacancies) });
});

app.post("/applications", async (req, res) => {
  const body = req.body as { profileId?: string; vacancyId?: string; note?: string };
  if (!body?.profileId || !body.vacancyId) {
    res.status(400).json({ error: "profileId and vacancyId are required" });
    return;
  }
  const [profile, vacancy] = await Promise.all([
    getProfile(body.profileId),
    getVacancy(body.vacancyId),
  ]);
  if (!profile) {
    res.status(404).json({ error: "profile not found" });
    return;
  }
  if (!vacancy) {
    res.status(404).json({ error: "vacancy not found" });
    return;
  }
  res.status(201).json({ application: await createApplication(body.profileId, body.vacancyId, body.note) });
});

app.patch("/applications/:id", async (req, res) => {
  const status: unknown = (req.body as { status?: unknown })?.status;
  if (!isApplicationStatus(status)) {
    res.status(400).json({ error: "status must be one of the four board columns" });
    return;
  }
  const current = await getApplication(req.params.id);
  if (!current) {
    res.status(404).json({ error: "application not found" });
    return;
  }
  if (!canMove(current.status, status)) {
    res.status(409).json({
      error: `cannot move from ${current.status} to ${status}`,
      allowed: ALLOWED_MOVES[current.status],
    });
    return;
  }
  res.json({ application: await updateApplicationStatus(req.params.id, status) });
});

app.delete("/applications/:id", async (req, res) => {
  const removed = await deleteApplication(req.params.id);
  if (!removed) {
    res.status(404).json({ error: "application not found" });
    return;
  }
  res.status(204).end();
});

const port = Number(process.env["API_PORT"] ?? 4000);
app.listen(port, () => console.log(`express api on :${port}`));
