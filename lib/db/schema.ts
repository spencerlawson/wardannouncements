import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "@auth/core/adapters";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const organizationTypeEnum = pgEnum("organization_type", ["ward", "stake"]);
export const userRoleEnum = pgEnum("user_role", [
  "ward_leader",
  "announcement_poster",
  "stake_leader",
]);
export const announcementStatusEnum = pgEnum("announcement_status", [
  "draft",
  "submitted",
  "approved",
  "revision_requested",
]);
export const attachmentTypeEnum = pgEnum("attachment_type", ["image", "document"]);

// ─── Auth.js required tables ─────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Organizations (Wards and Stakes) ────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: organizationTypeEnum("type").notNull().default("ward"),
  parentId: uuid("parent_id").references((): any => organizations.id),
  timezone: text("timezone").notNull().default("America/Denver"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  primaryColor: text("primary_color").notNull().default("#1a365d"),
  secondaryColor: text("secondary_color").notNull().default("#e2e8f0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── User ↔ Organization roles ────────────────────────────────────────────────

export const userOrganizationRoles = pgTable("user_organization_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Announcements ────────────────────────────────────────────────────────────

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  headerImageUrl: text("header_image_url"),
  status: announcementStatusEnum("status").notNull().default("draft"),
  displayStartDate: date("display_start_date").notNull(),
  displayEndDate: date("display_end_date").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Announcement Attachments ─────────────────────────────────────────────────

export const announcementAttachments = pgTable("announcement_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  announcementId: uuid("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileType: attachmentTypeEnum("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Announcement History (audit trail) ──────────────────────────────────────

export const announcementHistory = pgTable("announcement_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  announcementId: uuid("announcement_id")
    .notNull()
    .references(() => announcements.id, { onDelete: "cascade" }),
  status: announcementStatusEnum("status").notNull(),
  changedBy: text("changed_by")
    .notNull()
    .references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  organizationRoles: many(userOrganizationRoles),
  createdAnnouncements: many(announcements, { relationName: "announcementCreator" }),
  approvedAnnouncements: many(announcements, { relationName: "announcementApprover" }),
  historyEntries: many(announcementHistory),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: "orgHierarchy",
  }),
  children: many(organizations, { relationName: "orgHierarchy" }),
  userRoles: many(userOrganizationRoles),
  announcements: many(announcements),
}));

export const userOrganizationRolesRelations = relations(userOrganizationRoles, ({ one }) => ({
  user: one(users, { fields: [userOrganizationRoles.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [userOrganizationRoles.organizationId],
    references: [organizations.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [announcements.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
    relationName: "announcementCreator",
  }),
  approver: one(users, {
    fields: [announcements.approvedBy],
    references: [users.id],
    relationName: "announcementApprover",
  }),
  attachments: many(announcementAttachments),
  history: many(announcementHistory),
}));

export const announcementAttachmentsRelations = relations(announcementAttachments, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementAttachments.announcementId],
    references: [announcements.id],
  }),
}));

export const announcementHistoryRelations = relations(announcementHistory, ({ one }) => ({
  announcement: one(announcements, {
    fields: [announcementHistory.announcementId],
    references: [announcements.id],
  }),
  changedByUser: one(users, {
    fields: [announcementHistory.changedBy],
    references: [users.id],
  }),
}));

// ─── Convenience types ────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AnnouncementAttachment = typeof announcementAttachments.$inferSelect;
export type AnnouncementHistoryEntry = typeof announcementHistory.$inferSelect;
export type UserOrganizationRole = typeof userOrganizationRoles.$inferSelect;
export type OrgRole = "ward_leader" | "announcement_poster" | "stake_leader";
export type AnnouncementStatus = "draft" | "submitted" | "approved" | "revision_requested";
