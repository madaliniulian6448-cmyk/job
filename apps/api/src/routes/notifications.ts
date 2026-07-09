import { Router } from "express";
import { and, eq, desc, count } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "shared/src/schema";
import { requireAuth } from "../auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.auth!.userId;
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });
  res.json({ notifications: rows });
});

router.get("/unread-count", async (req, res) => {
  const userId = req.auth!.userId;
  const [row] = await db
    .select({ count: count(notifications.id) })
    .from(notifications)
    .where(eq(notifications.userId, userId));
  // Use a separate query for unread count
  const allRows = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
  });
  const unread = allRows.filter((n) => !n.isRead).length;
  res.json({ count: unread });
});

router.patch("/:id/read", async (req, res) => {
  const userId = req.auth!.userId;
  const id = Number(req.params.id);
  const [row] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();
  if (!row) return res.status(404).json({ error: "Notificare inexistentă" });
  res.json({ notification: row });
});

router.patch("/read-all", async (req, res) => {
  const userId = req.auth!.userId;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  res.json({ ok: true });
});

export default router;
