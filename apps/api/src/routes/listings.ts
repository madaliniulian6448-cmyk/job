import { Router } from "express";
import { and, desc, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { listings, users, categories, reports, listingDailyStats } from "shared/src/schema";
import { listingSchema } from "shared/src/validators";
import { requireAuth } from "../auth";

const router = Router();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fire-and-forget upsert of today's daily counter row for a listing.
async function bumpDailyStat(listingId: number, field: "views" | "contactClicks") {
  const date = todayUTC();
  try {
    await db
      .insert(listingDailyStats)
      .values({ listingId, date, views: field === "views" ? 1 : 0, contactClicks: field === "contactClicks" ? 1 : 0 })
      .onConflictDoUpdate({
        target: [listingDailyStats.listingId, listingDailyStats.date],
        set: {
          views: field === "views" ? sql`${listingDailyStats.views} + 1` : sql`${listingDailyStats.views}`,
          contactClicks:
            field === "contactClicks"
              ? sql`${listingDailyStats.contactClicks} + 1`
              : sql`${listingDailyStats.contactClicks}`,
        },
      });
  } catch {
    // Non-critical — never block the request on stats tracking.
  }
}

// ── GET /  ─────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { city, categoryId, minPrice, maxPrice, minRating, sort } = req.query;

  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: users.id,
        name: users.name,
        businessType: users.businessType,
        businessName: users.businessName,
        paidUntil: users.paidUntil,
        businessStatus: users.businessStatus,
        isVerified: users.isVerified,
      },
      category: categories,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(eq(listings.isActive, true))
    .orderBy(desc(listings.createdAt));

  const now = new Date();

  const visible = rows.filter(({ owner }) => {
    if (owner.businessStatus !== "approved") return false;
    return owner.paidUntil && new Date(owner.paidUntil) > now;
  });

  // Promoted-first sort (keep createdAt order within each group)
  const sorted = [...visible].sort((a, b) => {
    const aP = a.listing.isPromoted && a.listing.promotedUntil && new Date(a.listing.promotedUntil) > now;
    const bP = b.listing.isPromoted && b.listing.promotedUntil && new Date(b.listing.promotedUntil) > now;
    if (aP && !bP) return -1;
    if (!aP && bP) return 1;
    return 0;
  });

  const minPriceNum = minPrice && String(minPrice).length > 0 ? Number(minPrice) : null;
  const maxPriceNum = maxPrice && String(maxPrice).length > 0 ? Number(maxPrice) : null;
  const minRatingNum = minRating && String(minRating).length > 0 ? Number(minRating) : null;

  const filtered = sorted.filter(({ listing }) => {
    if (city && String(city).length > 0) {
      if (listing.city.toLowerCase() !== String(city).toLowerCase()) return false;
    }
    if (categoryId && String(categoryId).length > 0) {
      if (listing.categoryId !== Number(categoryId)) return false;
    }
    if (minPriceNum !== null && !isNaN(minPriceNum)) {
      if (listing.price === null || Number(listing.price) < minPriceNum) return false;
    }
    if (maxPriceNum !== null && !isNaN(maxPriceNum)) {
      if (listing.price === null || Number(listing.price) > maxPriceNum) return false;
    }
    if (minRatingNum !== null && !isNaN(minRatingNum)) {
      if (!listing.ratingAvg || Number(listing.ratingAvg) < minRatingNum) return false;
    }
    return true;
  });

  // Optional secondary sort, applied within the promoted-first grouping already done above.
  const sortKey = String(sort ?? "newest");
  if (sortKey !== "newest") {
    filtered.sort((a, b) => {
      const aPromoted = a.listing.isPromoted && a.listing.promotedUntil && new Date(a.listing.promotedUntil) > now;
      const bPromoted = b.listing.isPromoted && b.listing.promotedUntil && new Date(b.listing.promotedUntil) > now;
      if (aPromoted && !bPromoted) return -1;
      if (!aPromoted && bPromoted) return 1;

      switch (sortKey) {
        case "price_asc":
          return Number(a.listing.price ?? Infinity) - Number(b.listing.price ?? Infinity);
        case "price_desc":
          return Number(b.listing.price ?? -Infinity) - Number(a.listing.price ?? -Infinity);
        case "rating":
          return Number(b.listing.ratingAvg ?? 0) - Number(a.listing.ratingAvg ?? 0);
        default:
          return 0;
      }
    });
  }

  res.json({
    listings: filtered.map(({ listing, owner, category }) => ({
      ...listing,
      owner,
      category,
    })),
  });
});

// ── GET /mine ──────────────────────────────────────────────────────────────
router.get("/mine", requireAuth, async (req, res) => {
  const rows = await db.query.listings.findMany({
    where: eq(listings.userId, req.auth!.userId),
    orderBy: [desc(listings.createdAt)],
  });
  res.json({ listings: rows });
});

// ── GET /:id/similar ───────────────────────────────────────────────────────
// Must be before /:id so Express doesn't treat "similar" as an ID.
router.get("/:id/similar", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.json({ listings: [] });

  const current = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!current) return res.json({ listings: [] });

  const now = new Date();

  // Build visibility condition in SQL so we don't over-limit before filtering
  const visibleWhere = and(
    ne(listings.id, id),
    eq(listings.isActive, true),
    eq(users.businessStatus, "approved"),
    // paidUntil > now — use sql expression
    sql`${users.paidUntil} > ${now.toISOString()}`
  );

  const similarWhere = current.categoryId
    ? or(
        eq(listings.categoryId, current.categoryId),
        eq(listings.city, current.city)
      )
    : eq(listings.city, current.city);

  const rows = await db
    .select({
      listing: listings,
      owner: {
        id: users.id,
        name: users.name,
        businessType: users.businessType,
        businessName: users.businessName,
        paidUntil: users.paidUntil,
        businessStatus: users.businessStatus,
        isVerified: users.isVerified,
      },
      category: categories,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(visibleWhere, similarWhere))
    .orderBy(desc(listings.createdAt))
    .limit(4);

  res.json({
    listings: rows.map(({ listing, owner, category }) => ({
      ...listing,
      owner,
      category,
    })),
  });
});

// ── GET /:id ───────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const row = await db
    .select({
      listing: listings,
      owner: {
        id: users.id,
        name: users.name,
        businessType: users.businessType,
        businessName: users.businessName,
        businessDescription: users.businessDescription,
        paidUntil: users.paidUntil,
        businessStatus: users.businessStatus,
        city: users.city,
        phone: users.phone,
        isVerified: users.isVerified,
      },
      category: categories,
    })
    .from(listings)
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row[0]) return res.status(404).json({ error: "Anunțul nu există" });

  // Increment view count — fire and forget
  db.update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, id))
    .catch(() => {});
  bumpDailyStat(id, "views");

  const { listing, owner, category } = row[0];
  res.json({ listing: { ...listing, owner, category } });
});

// ── POST /:id/contact-click ────────────────────────────────────────────────
router.post("/:id/contact-click", async (req, res) => {
  const id = Number(req.params.id);
  if (!isNaN(id)) {
    db.update(listings)
      .set({ contactClickCount: sql`${listings.contactClickCount} + 1` })
      .where(eq(listings.id, id))
      .catch(() => {});
    bumpDailyStat(id, "contactClicks");
  }
  res.json({ ok: true });
});

// ── GET /mine/stats ────────────────────────────────────────────────────────
// Aggregated daily views/contact-clicks across all of the caller's listings,
// for the business analytics panel.
router.get("/mine/stats", requireAuth, async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  const myListings = await db.query.listings.findMany({
    where: eq(listings.userId, req.auth!.userId),
  });
  const listingIds = myListings.map((l) => l.id);

  const totals = {
    totalViews: myListings.reduce((s, l) => s + l.viewCount, 0),
    totalContactClicks: myListings.reduce((s, l) => s + l.contactClickCount, 0),
    listingCount: myListings.length,
  };

  if (listingIds.length === 0) {
    return res.json({ series: [], totals, byListing: [] });
  }

  const rows = await db
    .select({
      date: listingDailyStats.date,
      views: sql<number>`sum(${listingDailyStats.views})`.mapWith(Number),
      contactClicks: sql<number>`sum(${listingDailyStats.contactClicks})`.mapWith(Number),
    })
    .from(listingDailyStats)
    .where(
      and(
        sql`${listingDailyStats.listingId} = ANY(${sql.raw(`ARRAY[${listingIds.join(",")}]`)})`,
        gte(listingDailyStats.date, sinceStr)
      )
    )
    .groupBy(listingDailyStats.date)
    .orderBy(listingDailyStats.date);

  // Fill in missing days with zeros so the chart has a continuous axis.
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const series: { date: string; views: number; contactClicks: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const found = byDate.get(key);
    series.push({ date: key, views: found?.views ?? 0, contactClicks: found?.contactClicks ?? 0 });
  }

  const byListing = myListings
    .map((l) => ({
      id: l.id,
      title: l.title,
      viewCount: l.viewCount,
      contactClickCount: l.contactClickCount,
      ratingAvg: l.ratingAvg,
      reviewCount: l.reviewCount,
    }))
    .sort((a, b) => b.viewCount - a.viewCount);

  res.json({ series, totals, byListing });
});

// ── POST /:id/report ───────────────────────────────────────────────────────
router.post("/:id/report", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID invalid" });

  const { reason } = req.body as { reason?: string };
  if (!reason || reason.trim().length < 5) {
    return res
      .status(400)
      .json({ error: "Motivul trebuie să aibă cel puțin 5 caractere" });
  }

  // Verify listing exists
  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!existing) return res.status(404).json({ error: "Anunțul nu există" });

  try {
    await db.insert(reports).values({
      listingId: id,
      reporterId: req.auth!.userId,
      reason: reason.trim(),
    });
    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === "23505") {
      return res
        .status(400)
        .json({ error: "Ai raportat deja acest anunț" });
    }
    throw e;
  }
});

// ── POST / ─────────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (!user || user.businessType === "none") {
    return res
      .status(403)
      .json({ error: "Doar conturile de firmă pot posta anunțuri" });
  }
  if (user.businessStatus !== "approved") {
    return res
      .status(403)
      .json({ error: "Contul de firmă nu este aprobat încă" });
  }
  const now = new Date();
  if (!user.paidUntil || new Date(user.paidUntil) <= now) {
    return res.status(403).json({ error: "Abonamentul firmei a expirat" });
  }

  const existing = await db.query.listings.findFirst({
    where: eq(listings.userId, userId),
  });
  if (existing) {
    return res.status(403).json({
      error:
        "Firma ta are deja un anunț. Poți edita anunțul existent.",
    });
  }

  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const [row] = await db
    .insert(listings)
    .values({
      userId,
      title: data.title,
      description: data.description ?? null,
      price: data.price !== undefined ? String(data.price) : null,
      phone: data.phone,
      city: data.city,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      images: data.images ?? [],
    })
    .returning();
  res.status(201).json({ listing: row });
});

// ── PUT /:id ───────────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!existing || existing.userId !== req.auth!.userId) {
    return res.status(404).json({ error: "Anunț inexistent" });
  }
  const parsed = listingSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;
  const [row] = await db
    .update(listings)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.price !== undefined && { price: String(data.price) }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.categoryId !== undefined && {
        categoryId: Number(data.categoryId),
      }),
      ...(data.images !== undefined && { images: data.images }),
    })
    .where(eq(listings.id, id))
    .returning();
  res.json({ listing: row });
});

// ── PATCH /:id/toggle ──────────────────────────────────────────────────────
router.patch("/:id/toggle", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!existing || existing.userId !== req.auth!.userId) {
    return res.status(404).json({ error: "Anunț inexistent" });
  }
  const [row] = await db
    .update(listings)
    .set({ isActive: !existing.isActive })
    .where(eq(listings.id, id))
    .returning();
  res.json({ listing: row });
});

// ── DELETE /:id ────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await db.query.listings.findFirst({
    where: eq(listings.id, id),
  });
  if (!existing || existing.userId !== req.auth!.userId) {
    return res.status(404).json({ error: "Anunț inexistent" });
  }
  await db.delete(listings).where(eq(listings.id, id));
  res.json({ ok: true });
});

export default router;
