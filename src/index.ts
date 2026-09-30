import "dotenv/config";
import express from "express";
import { testDivarConnectivity } from "./collectors/divar.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "divar-deal-agent" });
});

app.get("/test/divar", async (_req, res) => {
  const result = await testDivarConnectivity();
  res.status(result.ok ? 200 : 502).json(result);
});

app.listen(port, () => {
  console.log(`Divar Deal Agent running on http://localhost:${port}`);
});
