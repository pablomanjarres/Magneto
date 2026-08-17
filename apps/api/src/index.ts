import express from "express";
import type { Profile } from "@moonlight/types";
import { getProfile, listVacancies, saveProfile } from "@moonlight/db";
import { marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

// Branch B of the comparison PoC: the same four endpoints as apps/web/app/api,
// running as a standalone Express service instead of Next route handlers.
const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "express" });
});

app.get("/vacancies", async (_req, res) => {
  res.json(await listVacancies());
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

const port = Number(process.env["API_PORT"] ?? 4000);
app.listen(port, () => console.log(`express api on :${port}`));
