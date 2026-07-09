import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { users, listings, reviews } from "shared/src/schema";
import { requireAuth } from "../auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return res.status(404).json({ error: "Profil inexistent" });

  const userListings = await db.query.listings.findMany({
    where: eq(listings.userId, id),
    orderBy: [desc(listings.createdAt)],
    with: { category: true },
  });

  const { passwordHash, ...safe } = user;
  res.json({ user: safe, listings: userListings });
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
