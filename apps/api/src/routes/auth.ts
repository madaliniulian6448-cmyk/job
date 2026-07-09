import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "shared/src/schema";
import { registerSchema, loginSchema } from "shared/src/validators";
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from "../auth";

const router = Router();

function publicUser(u: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = u;
  return rest;
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { email, password, name, phone, city } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    return res.status(409).json({ error: "Există deja un cont cu acest email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, name, phone, city })
    .returning();

  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Date invalide" });
  }
  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (!user) return res.status(401).json({ error: "Email sau parolă greșită" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Email sau parolă greșită" });

  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.auth!.userId),
  });
  if (!user) return res.status(404).json({ error: "Utilizator inexistent" });
  res.json({ user: publicUser(user) });
});

export default router;
