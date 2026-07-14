import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { sql } from "drizzle-orm";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { listings, users, categories } from "shared/src/schema";

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

// Replit's dev/prod proxy sits in front of this server and sets X-Forwarded-For,
// so trust exactly one hop to get real client IPs (needed for rate limiting)
// without opening up IP spoofing via arbitrary forwarded headers.
app.set("trust proxy", 1);

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

// Security headers. CSP/COEP are disabled: the API serves no HTML/scripts
// itself and strict defaults would break the static-served /api/uploads
// images (which can be embedded by the frontend on a different origin).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// Baseline abuse protection. Auth endpoints get a tighter limit since they're
// the most attractive brute-force target; everything else gets a generous
// general limit so normal browsing/filtering never hits it.
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Prea multe încercări. Încearcă din nou mai târziu." },
});
app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

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

app.get("/api/health", async (_req, res) => {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    res.json({ ok: true, db: "up", dbLatencyMs: Date.now() - startedAt });
  } catch (err) {
    res.status(503).json({ ok: false, db: "down", error: "Database unreachable" });
  }
});

// ── SEO: sitemap.xml & robots.txt ───────────────────────────────────────────
// Served at the root so they resolve correctly if this server is the origin
// that clients/crawlers hit directly (e.g. custom domain pointed at the API,
// or a reverse proxy that forwards /sitemap.xml and /robots.txt here).
function siteOrigin(req: express.Request): string {
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return `${req.protocol}://${req.get("host")}`;
}

app.get("/sitemap.xml", async (req, res) => {
  const origin = siteOrigin(req);
  const now = new Date();

  const cats = await db.select().from(categories);
  const activeListings = await db
    .select({ id: listings.id, createdAt: listings.createdAt })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .where(and(eq(listings.isActive, true), eq(users.businessStatus, "approved")));

  const staticUrls = ["/", "/despre", "/termeni", "/confidentialitate"];

  const urls = [
    ...staticUrls.map((u) => `<url><loc>${origin}${u}</loc></url>`),
    ...cats.map((c) => `<url><loc>${origin}/${c.slug}</loc></url>`),
    ...activeListings.map(
      (l) =>
        `<url><loc>${origin}/listing/${l.id}</loc><lastmod>${new Date(l.createdAt).toISOString()}</lastmod></url>`
    ),
  ];

  res.set("Content-Type", "application/xml");
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
      "\n"
    )}\n</urlset>`
  );
});

app.get("/robots.txt", (req, res) => {
  const origin = siteOrigin(req);
  res.set("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Eroare de server" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
