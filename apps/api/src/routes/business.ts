import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, listings } from "shared/src/schema";
import { businessUpgradeSchema, businessRegisterSchema } from "shared/src/validators";
import { requireAuth } from "../auth";

const router = Router();

// Legacy: request business upgrade (admin flow)
router.post("/request", requireAuth, async (req, res) => {
  const parsed = businessUpgradeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  if (data.businessType === "company" && (!data.caen || !data.cui || !data.proofUrl)) {
    return res.status(400).json({
      error: "Pentru firmă normală sunt necesare codul CAEN, CUI-ul și dovada",
    });
  }

  const [user] = await db
    .update(users)
    .set({
      businessType: data.businessType,
      businessStatus: "pending",
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      caen: data.caen,
      cui: data.cui,
      proofUrl: data.proofUrl,
      businessRequestedAt: new Date(),
    })
    .where(eq(users.id, req.auth!.userId))
    .returning();

  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});

// New: combined business registration + listing creation in one step
router.post("/register", requireAuth, async (req, res) => {
  const parsed = businessRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const data = parsed.data;

  if (data.businessType === "company" && (!data.caen || !data.cui || !data.proofUrl)) {
    return res.status(400).json({
      error: "Pentru firmă înregistrată sunt necesare codul CAEN, CUI-ul și dovada",
    });
  }

  // Update user business profile
  const [updatedUser] = await db
    .update(users)
    .set({
      businessType: data.businessType,
      businessStatus: "pending",
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      caen: data.caen ?? null,
      cui: data.cui ?? null,
      proofUrl: data.proofUrl ?? null,
      businessRequestedAt: new Date(),
    })
    .where(eq(users.id, req.auth!.userId))
    .returning();

  const l = data.listing;
  const listingValues = {
    userId: req.auth!.userId,
    title: l.title,
    description: l.description ?? null,
    price: l.price !== undefined ? String(l.price) : null,
    phone: l.phone,
    city: l.city,
    categoryId: l.categoryId ? Number(l.categoryId) : null,
    images: l.images ?? [],
    isActive: true,
  };

  // Upsert: update existing listing or create new one
  const existing = await db.query.listings.findFirst({
    where: eq(listings.userId, req.auth!.userId),
  });

  let listing;
  if (existing) {
    const [row] = await db
      .update(listings)
      .set(listingValues)
      .where(eq(listings.id, existing.id))
      .returning();
    listing = row;
  } else {
    const [row] = await db.insert(listings).values(listingValues).returning();
    listing = row;
  }

  const { passwordHash, ...safeUser } = updatedUser;
  res.status(201).json({ user: safeUser, listing });
});

export default router;
