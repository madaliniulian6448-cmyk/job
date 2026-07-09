import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";
import categoriesRoutes from "./routes/categories";
import businessRoutes from "./routes/business";
import adminRoutes from "./routes/admin";
import reviewsRoutes from "./routes/reviews";
import profileRoutes from "./routes/profile";
import favoritesRoutes from "./routes/favorites";
import notificationsRoutes from "./routes/notifications";
import uploadRoutes from "./routes/upload";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Allow the Vite dev server, the Replit preview domain, and any configured frontend origin.
// In production set ALLOWED_ORIGINS to the deployed frontend URL.
const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:5000",
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    ...(process.env.ALLOWED_ORIGINS ?? "").split(","),
  ]
    .filter(Boolean)
    .map((o) => (o as string).trim())
);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / server-to-server requests (no Origin header)
      if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      // Allow port-specific subdomains of this repl's own dev domain only
      // (e.g. 5000-<replId>.replit.dev) — not arbitrary *.replit.dev origins.
      const replDev = process.env.REPLIT_DEV_DOMAIN;
      if (replDev && (origin === `https://${replDev}` || origin.endsWith(`.${replDev}`))) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/uploads", express.static(path.join(process.cwd(), "public/uploads")));
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/notifications", notificationsRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Eroare de server" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
