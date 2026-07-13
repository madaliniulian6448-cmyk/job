import { Router } from "express";
import { and, eq, avg, count, desc } from "drizzle-orm";
import { db } from "../db";
import { reviews, users, listings, notifications } from "shared/src/schema";
import { requireAuth } from "../auth";
import { z } from "zod";

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const replySchema = z.object({
  reply: z.string().trim().min(1, "Răspunsul nu poate fi gol").max(1000),
});

// Recompute and cache the average rating + review count on the listing row so
// the marketplace listing/filter query can sort and filter by rating cheaply.
async function refreshListingRatingCache(listingId: number) {
  const [stats] = await db
    .select({ avgRating: avg(reviews.rating), totalCount: count(reviews.id) })
    .from(reviews)
    .where(eq(reviews.listingId, listingId));

  await db
    .update(listings)
    .set({
      ratingAvg: stats.avgRating ? Number(stats.avgRating).toFixed(2) : null,
      reviewCount: Number(stats.totalCount),
    })
    .where(eq(listings.id, listingId));
}

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

  await refreshListingRatingCache(listingId);

  // Notify listing owner
  const reviewer = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const stars = "★".repeat(parsed.data.rating) + "☆".repeat(5 - parsed.data.rating);
  await db.insert(notifications).values({
    userId: listing.userId,
    type: "new_review",
    message: `${reviewer?.name ?? "Cineva"} a lăsat o recenzie ${stars} pentru anunțul tău "${listing.title}".`,
    listingId: listing.id,
  }).catch(() => {}); // non-blocking

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

  await refreshListingRatingCache(listingId);

  res.json({ review: row });
});

router.delete("/listing/:listingId/my", requireAuth, async (req, res) => {
  const listingId = Number(req.params.listingId);
  const userId = req.auth!.userId;

  await db
    .delete(reviews)
    .where(and(eq(reviews.listingId, listingId), eq(reviews.userId, userId)));

  await refreshListingRatingCache(listingId);

  res.json({ ok: true });
});

// ── PUT /:id/reply ─────────────────────────────────────────────────────────
// Only the listing owner may reply to a review left on their listing.
router.put("/:id/reply", requireAuth, async (req, res) => {
  const reviewId = Number(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: "ID invalid" });

  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const existing = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  });
  if (!existing) return res.status(404).json({ error: "Recenzia nu există" });

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, existing.listingId),
  });
  if (!listing || listing.userId !== req.auth!.userId) {
    return res.status(403).json({ error: "Doar proprietarul anunțului poate răspunde" });
  }

  const [row] = await db
    .update(reviews)
    .set({ reply: parsed.data.reply, repliedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning();

  res.json({ review: row });
});

router.delete("/:id/reply", requireAuth, async (req, res) => {
  const reviewId = Number(req.params.id);
  if (isNaN(reviewId)) return res.status(400).json({ error: "ID invalid" });

  const existing = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  });
  if (!existing) return res.status(404).json({ error: "Recenzia nu există" });

  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, existing.listingId),
  });
  if (!listing || listing.userId !== req.auth!.userId) {
    return res.status(403).json({ error: "Doar proprietarul anunțului poate șterge răspunsul" });
  }

  const [row] = await db
    .update(reviews)
    .set({ reply: null, repliedAt: null })
    .where(eq(reviews.id, reviewId))
    .returning();

  res.json({ review: row });
});

export default router;
