import { Router } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db } from "../db";
import { favorites, listings, users, categories } from "shared/src/schema";
import { requireAuth } from "../auth";

const router = Router();
router.use(requireAuth);

// Get all favorited listings for the current user
router.get("/", async (req, res) => {
  const userId = req.auth!.userId;
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
      },
      category: categories,
      favoritedAt: favorites.createdAt,
    })
    .from(favorites)
    .innerJoin(listings, eq(favorites.listingId, listings.id))
    .innerJoin(users, eq(listings.userId, users.id))
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  res.json({
    favorites: rows.map(({ listing, owner, category, favoritedAt }) => ({
      ...listing,
      owner,
      category,
      favoritedAt,
    })),
  });
});

// Get just the listing IDs the user has favorited (for quick lookup)
router.get("/ids", async (req, res) => {
  const userId = req.auth!.userId;
  const rows = await db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  res.json({ ids: rows.map((r) => r.listingId) });
});

// Add a listing to favorites
router.post("/:listingId", async (req, res) => {
  const userId = req.auth!.userId;
  const listingId = Number(req.params.listingId);

  const listing = await db.query.listings.findFirst({ where: eq(listings.id, listingId) });
  if (!listing) return res.status(404).json({ error: "Anunțul nu există" });

  const existing = await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)),
  });
  if (existing) return res.status(409).json({ error: "Deja salvat" });

  const [row] = await db.insert(favorites).values({ userId, listingId }).returning();
  res.status(201).json({ favorite: row });
});

// Remove a listing from favorites
router.delete("/:listingId", async (req, res) => {
  const userId = req.auth!.userId;
  const listingId = Number(req.params.listingId);
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
  res.json({ ok: true });
});

export default router;
