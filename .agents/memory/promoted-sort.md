---
name: Promoted-sort stability
description: How to maintain promoted-first ordering when a secondary client-side sort is applied.
---

The API returns listings with promoted items first. If the frontend re-sorts the array for secondary criteria (price, date), the comparator must include a first key for active-promotion status, otherwise promoted listings can fall behind non-promoted ones.

**Rule:** In any comparator that processes listings from the API, check `isPromoted && promotedUntil > now` as the highest-priority key. Only fall through to secondary keys (price, date) when both items have the same promotion status.

**Why:** The homepage uses a user-selectable sort dropdown. Without an explicit promo key, price-asc or date sorts silently overrode the server's promoted-first order.

**How to apply:** Always write comparators as: promo diff → secondary criterion.
