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
