---
name: Report endpoint hardening
description: Input validation pattern for numeric route params and insert-before-existence-check.
---

Endpoints that take a numeric `:id` param and insert a related record must:
1. Guard `isNaN(id)` and return 400 immediately.
2. Look up the parent record and return 404 if missing.
3. Only then attempt the insert.
4. Handle DB-level duplicate errors (Postgres code `23505`) explicitly.

**Why:** Relying solely on DB errors for invalid/missing IDs produces opaque 500s to clients instead of actionable 400/404 responses. This was missed on the initial report endpoint implementation.

**How to apply:** Use this pattern in any POST/PATCH route that inserts a child record keyed to a parent entity.
