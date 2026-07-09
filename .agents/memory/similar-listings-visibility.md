---
name: Similar-listings visibility
description: Visibility filters must live in SQL before LIMIT, not in JS after limiting.
---

`GET /listings/:id/similar` needs up to 4 visible similar listings. Visibility = `businessStatus === "approved"` AND `paidUntil > now`. If these filters are applied in JS *after* a `LIMIT(N)` the query may return fewer than 4 results even when more exist in the DB.

**Rule:** Always embed visibility conditions in the Drizzle `where()` clause before `.limit()`.

**Why:** A `limit(8)` then `filter().slice(0,4)` can return 0–3 items when the first 8 rows happen to be non-visible businesses. Moving the filter to SQL means the LIMIT is applied to the already-valid set.

**How to apply:** Use `sql\`${users.paidUntil} > ${now.toISOString()}\`` inside `and(...)` in the WHERE clause.
