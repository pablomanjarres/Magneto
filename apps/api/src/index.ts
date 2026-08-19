import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
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
  parseProfile,
  profileCompleteness,
  rankVacancies,
} from "@moonlight/core";

// Branch B of the comparison PoC: the same endpoints as apps/web/app/api,
// running as a standalone Express service instead of Next route handlers.
// The payloads match field for field on purpose — see docs/adr/0001-backend-choice.md.
const app = express();
app.use(express.json({ limit: "1mb" }));

type IdParams = { id: string };

// express@4 never adopts the promise an async handler returns, so a rejection
// becomes an unhandled rejection and Node kills the process. Every route goes
// through this so the rejection reaches the error middleware at the bottom.
const wrap =
  <P>(handler: (req: Request<P>, res: Response) => Promise<void>): RequestHandler<P> =>
  (req, res, next) => {
    handler(req, res).catch(next);
  };

// profiles.email is UNIQUE, so a known email under a new id is the client's
// mistake, not ours. Racing a pre-flight SELECT would still let two win.
const isDuplicate = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === "23505";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "express" });
});

app.get(
  "/vacancies",
  wrap(async (_req, res) => {
    res.json(await listVacancies());
  }),
);

app.get(
  "/vacancies/:id",
  wrap<IdParams>(async (req, res) => {
    const vacancy = await getVacancy(req.params.id);
    if (!vacancy) {
      res.status(404).json({ error: "vacancy not found" });
      return;
    }
    res.json(vacancy);
  }),
);

app.post(
  "/profiles",
  wrap(async (req, res) => {
    const parsed = parseProfile(req.body);
    if ("errors" in parsed) {
      res.status(400).json({ error: parsed.errors.join(", "), errors: parsed.errors });
      return;
    }
    try {
      const saved = await saveProfile(parsed.profile);
      res.status(201).json({ profile: saved, completeness: profileCompleteness(saved) });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      res.status(409).json({ error: "that email already belongs to another profile" });
    }
  }),
);

app.get(
  "/profiles/:id",
  wrap<IdParams>(async (req, res) => {
    const profile = await getProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: "profile not found" });
      return;
    }
    res.json({ profile, completeness: profileCompleteness(profile) });
  }),
);

app.get(
  "/profiles/:id/recommendations",
  wrap<IdParams>(async (req, res) => {
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
  }),
);

app.get(
  "/applications",
  wrap(async (req, res) => {
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
  }),
);

app.post(
  "/applications",
  wrap(async (req, res) => {
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
    res
      .status(201)
      .json({ application: await createApplication(body.profileId, body.vacancyId, body.note) });
  }),
);

app.patch(
  "/applications/:id",
  wrap<IdParams>(async (req, res) => {
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
  }),
);

app.delete(
  "/applications/:id",
  wrap<IdParams>(async (req, res) => {
    const removed = await deleteApplication(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "application not found" });
      return;
    }
    res.status(204).end();
  }),
);

// Four arguments is what makes express treat this as the error handler.
app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  // A response already on the wire cannot become a 500; express ends that one.
  if (res.headersSent) next(error);
  else res.status(500).json({ error: "internal error" });
});

const port = Number(process.env["API_PORT"] ?? 4000);
app.listen(port, () => console.log(`express api on :${port}`));
