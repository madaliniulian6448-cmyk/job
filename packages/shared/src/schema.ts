import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  numeric,
  pgEnum,
  smallint,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const businessTypeEnum = pgEnum("business_type", [
  "none",
  "private",
  "company",
]);
export const businessStatusEnum = pgEnum("business_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 120 }),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  businessType: businessTypeEnum("business_type").notNull().default("none"),
  businessStatus: businessStatusEnum("business_status")
    .notNull()
    .default("pending"),
  businessName: varchar("business_name", { length: 255 }),
  businessDescription: text("business_description"),
  caen: varchar("caen", { length: 50 }),
  cui: varchar("cui", { length: 50 }),
  proofUrl: text("proof_url"),
  paidUntil: timestamp("paid_until"),
  businessRequestedAt: timestamp("business_requested_at"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("reviews_listing_user_unique").on(t.listingId, t.userId)]
);

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("favorites_user_listing_unique").on(t.userId, t.listingId)]
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Favorite = typeof favorites.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  reviews: many(reviews),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  user: one(users, { fields: [listings.userId], references: [users.id] }),
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  listing: one(listings, { fields: [reviews.listingId], references: [listings.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
