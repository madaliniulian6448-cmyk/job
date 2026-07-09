import { Router } from "express";
import { and, eq, avg, count, desc } from "drizzle-orm";
import { db } from "../db";
import { reviews, users, listings } from "shared/src/schema";
import { requireAuth } from "../auth";
import { z } from "zod";

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.get("/listing/:id", async (req, res) => {
  const listingId = Number(req.params.id);

  const rows = await db
    .select({
      review: reviews,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.listingId, listingId))
    .orderBy(desc(reviews.createdAt));

  const [stats] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalCount: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.listingId, listingId));

  res.json({
    reviews: rows.map(({ review, author }) => ({ ...review, author })),
    avgRating: stats.avgRating ? Number(Number(stats.avgRating).toFixed(1)) : null,
    totalCount: Number(stats.totalCount),
  });
});

router.post("/listing/:id", requireAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  const userId = req.auth!.userId;

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });
  if (!listing || !listing.isActive) {
    return res.status(404).json({ error: "Anunțul nu există" });
  }
  if (listing.userId === userId) {
    return res.status(400).json({ error: "Nu poți recenza propriul anunț" });
  }

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.listingId, listingId), eq(reviews.userId, userId)),
  });
  if (existing) {
    return res.status(409).json({ error: "Ai lăsat deja o recenzie pentru acest anunț" });
  }

  const [row] = await db
    .insert(reviews)
    .values({ listingId, userId, rating: parsed.data.rating, comment: parsed.data.comment })
    .returning();

  res.status(201).json({ review: row });
});

router.put("/listing/:listingId/my", requireAuth, async (req, res) => {
  const listingId = Number(req.params.listingId);
  const userId = req.auth!.userId;

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.listingId, listingId), eq(reviews.userId, userId)),
  });
  if (!existing) {
    return res.status(404).json({ error: "Recenzia nu există" });
  }

  const [row] = await db
    .update(reviews)
    .set({ rating: parsed.data.rating, comment: parsed.data.comment })
    .where(and(eq(reviews.listingId, listingId), eq(reviews.userId, userId)))
    .returning();

  res.json({ review: row });
});

router.delete("/listing/:listingId/my", requireAuth, async (req, res) => {
  const listingId = Number(req.params.listingId);
  const userId = req.auth!.userId;

  await db
    .delete(reviews)
    .where(and(eq(reviews.listingId, listingId), eq(reviews.userId, userId)));

  res.json({ ok: true });
});

export default router;
