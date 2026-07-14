import { Router } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../db";
import { users, listings, reviews } from "shared/src/schema";
import { requireAuth } from "../auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Id invalid" });

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return res.status(404).json({ error: "Profil inexistent" });

  const userListings = await db.query.listings.findMany({
    where: eq(listings.userId, id),
    orderBy: [desc(listings.createdAt)],
    with: { category: true },
  });

  // Aggregate rating across all of this user's listings from the per-listing
  // cached rating/review counts, so we avoid a second heavy join here.
  const totalReviewCount = userListings.reduce((sum, l) => sum + l.reviewCount, 0);
  const avgRating = totalReviewCount > 0
    ? userListings.reduce((sum, l) => sum + (l.ratingAvg ? Number(l.ratingAvg) * l.reviewCount : 0), 0) / totalReviewCount
    : null;

  const categoryMap = new Map<number, { id: number; name: string; slug: string }>();
  const galleryImages: string[] = [];
  for (const l of userListings) {
    if (l.category) categoryMap.set(l.category.id, l.category);
    if (l.isActive) galleryImages.push(...l.images);
  }

  const listingIds = userListings.map((l) => l.id);
  const recentReviews = listingIds.length === 0
    ? []
    : await db
        .select({
          review: reviews,
          author: { id: users.id, name: users.name },
          listing: { id: listings.id, title: listings.title },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .innerJoin(listings, eq(reviews.listingId, listings.id))
        .where(inArray(reviews.listingId, listingIds))
        .orderBy(desc(reviews.createdAt))
        .limit(10);

  const { passwordHash, ...safe } = user;
  res.json({
    user: safe,
    listings: userListings,
    stats: {
      totalListings: userListings.length,
      activeListings: userListings.filter((l) => l.isActive).length,
      avgRating: avgRating !== null ? Number(avgRating.toFixed(1)) : null,
      reviewCount: totalReviewCount,
      categories: Array.from(categoryMap.values()),
      gallery: galleryImages.slice(0, 8),
    },
    reviews: recentReviews.map(({ review, author, listing }) => ({ ...review, author, listing })),
  });
});

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const [user] = await db
    .update(users)
    .set({ ...parsed.data })
    .where(eq(users.id, req.auth!.userId))
    .returning();

  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

router.patch("/me/password", requireAuth, async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const user = await db.query.users.findFirst({ where: eq(users.id, req.auth!.userId) });
  if (!user) return res.status(404).json({ error: "Utilizator inexistent" });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Parola curentă este greșită" });

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));

  res.json({ ok: true });
});

export default router;
