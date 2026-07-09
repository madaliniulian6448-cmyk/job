import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth";
import listingsRoutes from "./routes/listings";
import categoriesRoutes from "./routes/categories";
import businessRoutes from "./routes/business";
import adminRoutes from "./routes/admin";
import reviewsRoutes from "./routes/reviews";
import profileRoutes from "./routes/profile";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/profile", profileRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Eroare de server" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
