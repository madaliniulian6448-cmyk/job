import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "shared/src/schema";
import { businessUpgradeSchema } from "shared/src/validators";
import { requireAuth } from "../auth";

const router = Router();

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

export default router;
