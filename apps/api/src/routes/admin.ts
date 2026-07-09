import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  notifications,
  listings,
  reports,
  categories,
} from "shared/src/schema";
import { requireAuth, requireAdmin } from "../auth";

const router = Router();
router.use(requireAuth, requireAdmin);

function publicUser(u: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = u;
  return rest;
}

// ── Users ──────────────────────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  const rows = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });
  res.json({ users: rows.map(publicUser) });
});

router.patch("/users/:id/business-status", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as {
    status: "approved" | "rejected" | "pending";
  };
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Status invalid" });
  }
  const [row] = await db
    .update(users)
    .set({ businessStatus: status })
    .where(eq(users.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Utilizator inexistent" });

  if (status === "approved" || status === "rejected") {
    const msg =
      status === "approved"
        ? "Contul tău de firmă a fost aprobat! Poți acum să publici anunțuri."
        : "Cererea ta de cont de firmă a fost respinsă. Contactează-ne pentru mai multe detalii.";
    await db
      .insert(notifications)
      .values({ userId: id, type: `business_${status}`, message: msg })
      .catch(() => {});
  }

  res.json({ user: publicUser(row) });
});

router.patch("/users/:id/paid-until", async (req, res) => {
  const id = Number(req.params.id);
  const { months } = req.body as { months: number };
  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!existing) return res.status(404).json({ error: "Utilizator inexistent" });

  const base =
    existing.paidUntil && new Date(existing.paidUntil) > new Date()
      ? new Date(existing.paidUntil)
      : new Date();
  base.setMonth(base.getMonth() + (months || 1));

  const [row] = await db
    .update(users)
    .set({ paidUntil: base })
    .where(eq(users.id, id))
    .returning();
  res.json({ user: publicUser(row) });
});

router.patch("/users/:id/unmark-paid", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .update(users)
    .set({ paidUntil: null })
    .where(eq(users.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Utilizator inexistent" });
  res.json({ user: publicUser(row) });
});

router.patch("/users/:id/role", async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body as { role: "user" | "admin" };
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "Rol invalid" });
  }
  const [row] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Utilizator inexistent" });
  res.json({ user: publicUser(row) });
});

router.patch("/users/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!existing) return res.status(404).json({ error: "Utilizator inexistent" });
  const [row] = await db
    .update(users)
    .set({ isVerified: !existing.isVerified })
    .where(eq(users.id, id))
    .returning();
  res.json({ user: publicUser(row) });
});

// ── Listings ───────────────────────────────────────────────────────────────

router.get("/listings", async (_req, res) => {
  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: users.id,
        name: users.name,
        businessName: users.businessName,
      },
      category: {
        id: categories.id,
        name: categories.name,
      },
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .orderBy(desc(listings.createdAt));

  res.json({
    listings: rows.map(({ listing, owner, category }) => ({
      ...listing,
      owner,
      category,
    })),
  });
});

router.patch("/listings/:id/promote", async (req, res) => {
  const id = Number(req.params.id);
  const { months } = req.body as { months?: number };
  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!existing) return res.status(404).json({ error: "Anunț inexistent" });

  const base =
    existing.promotedUntil && new Date(existing.promotedUntil) > new Date()
      ? new Date(existing.promotedUntil)
      : new Date();
  base.setMonth(base.getMonth() + (months || 1));

  const [row] = await db
    .update(listings)
    .set({ isPromoted: true, promotedUntil: base })
    .where(eq(listings.id, id))
    .returning();
  res.json({ listing: row });
});

router.patch("/listings/:id/unpromote", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .update(listings)
    .set({ isPromoted: false, promotedUntil: null })
    .where(eq(listings.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Anunț inexistent" });
  res.json({ listing: row });
});

// ── Reports ────────────────────────────────────────────────────────────────

router.get("/reports", async (_req, res) => {
  const rows = await db
    .select({
      report: reports,
      listing: {
        id: listings.id,
        title: listings.title,
      },
      reporter: {
        id: users.id,
        name: users.name,
      },
    })
    .from(reports)
    .innerJoin(listings, eq(reports.listingId, listings.id))
    .innerJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt));

  res.json({
    reports: rows.map(({ report, listing, reporter }) => ({
      ...report,
      listing,
      reporter,
    })),
  });
});

router.patch("/reports/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: "resolved" | "dismissed" };
  if (!["resolved", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Status invalid" });
  }
  const [row] = await db
    .update(reports)
    .set({ status })
    .where(eq(reports.id, id))
    .returning();
  if (!row) return res.status(404).json({ error: "Raport inexistent" });
  res.json({ report: row });
});

export default router;
