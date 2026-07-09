import { Router } from "express";
import { db } from "../db";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await db.query.categories.findMany();
  res.json({ categories: rows });
});

export default router;
