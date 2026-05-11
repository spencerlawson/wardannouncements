# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**wardAnnouncements.com** — A multi-ward LDS church announcement platform. Each ward has a public-facing page (no auth required) that displays weekly announcements. Authenticated users manage announcements through an approval workflow.

## Tech Stack

- **Framework**: Next.js App Router (TypeScript)
- **Database**: Neon Postgres via Vercel Marketplace + Drizzle ORM
- **Auth**: Auth.js v5 — magic link email + Google OAuth
- **File Storage**: Vercel Blob (images and document attachments)
- **Email**: Resend (transactional: approval requests, approval confirmations, revision requests)
- **WYSIWYG**: TipTap editor (announcement body is stored as HTML)
- **UI**: shadcn/ui + Tailwind CSS
- **QR Codes**: `qrcode` npm package (server-side generation, downloadable PNG)
- **Deployment**: Vercel

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run db:push      # push Drizzle schema to Neon (dev)
npm run db:migrate   # run migrations (production)
npm run db:studio    # Drizzle Studio GUI
```

Running a single test (once tests are added):
```bash
npx jest path/to/test.ts
```

## Architecture

### URL Structure

| Path | Auth | Description |
|------|------|-------------|
| `/ward/[slug]` | None | Public ward page — current week's announcements |
| `/login` | None | Magic link / Google sign-in |
| `/dashboard` | Any user | Redirect to user's ward dashboard |
| `/dashboard/announcements` | Poster+ | List ward announcements |
| `/dashboard/announcements/new` | Poster+ | Create announcement (WYSIWYG + file upload) |
| `/dashboard/announcements/[id]` | Poster+ | View/edit announcement |
| `/dashboard/settings` | Ward Leader | Ward branding + QR code |
| `/dashboard/users` | Ward Leader | Manage ward users |
| `/admin` | SuperUser | SuperUser panel |
| `/admin/organizations` | SuperUser | CRUD Wards and Stakes |
| `/admin/users` | SuperUser | Global user management + reports |

### Database Schema (Drizzle)

**`organizations`** — supports flat Wards now, Stakes-over-Wards later
- `id`, `name`, `slug` (used in public URL), `type` (`'ward' | 'stake'`)
- `parent_id` → self-referential FK (null for top-level; set when a Ward belongs to a Stake)
- `timezone` (e.g. `America/Denver`) — used for Sunday–Saturday week calculation
- `logo_url`, `primary_color`, `secondary_color` — per-ward branding
- `created_at`, `updated_at`

**`users`**
- `id`, `email`, `name`, `avatar_url`, `is_super_admin` (boolean)

**`user_organization_roles`** — many-to-many users ↔ organizations
- `user_id`, `organization_id`, `role` (`'ward_leader' | 'announcement_poster' | 'stake_leader'`)
- A user can belong to multiple wards with different roles

**`announcements`**
- `id`, `organization_id` (ward), `title`, `body` (HTML from TipTap)
- `status`: `'draft' | 'submitted' | 'approved' | 'revision_requested'`
- `display_start_date`, `display_end_date` — controls which week(s) announcement appears
- `created_by` (user_id), `approved_by` (user_id, nullable), `approved_at`
- `created_at`, `updated_at`

**`announcement_attachments`**
- `id`, `announcement_id`, `file_url` (Vercel Blob URL), `file_name`, `file_type` (`'image' | 'document'`), `file_size`

**`announcement_history`** — full audit trail of status changes
- `id`, `announcement_id`, `status`, `changed_by` (user_id), `notes` (revision notes from Ward Leader), `created_at`

### User Roles & Permissions

| Action | SuperUser | Stake Leader | Ward Leader | Announcement Poster |
|--------|-----------|--------------|-------------|---------------------|
| CRUD any organization | ✓ | — | — | — |
| Provision first Ward Leader | ✓ | — | — | — |
| CRUD Ward Leaders & Posters in their ward | — | — | ✓ | — |
| CRUD all wards in their stake | — | ✓ | — | — |
| CRUD announcements | ✓ | ✓ | ✓ | Own only |
| Approve announcements | ✓ | ✓ | ✓ | — |
| Send back for revision | ✓ | ✓ | ✓ | — |
| Generate/download ward QR code | ✓ | ✓ | ✓ | — |
| Edit ward branding | ✓ | ✓ | ✓ | — |
| View global user reports | ✓ | — | — | — |

### Announcement Workflow

```
draft → submitted → approved
                 → revision_requested → (edited) → submitted → ...
```

Email triggers (via Resend):
- **On submit**: all Ward Leaders for that ward get notified to approve
- **On approve**: announcement creator gets confirmation email  
- **On revision_requested**: announcement creator gets email with Ward Leader's notes

### Public Ward Page (`/ward/[slug]`)

- No authentication required
- Default view: announcements where current date falls within `display_start_date`–`display_end_date`, filtered to the current Sunday–Saturday week in the ward's timezone
- Week navigation: "Previous Week" / "Next Week" controls
- Only shows `approved` announcements
- Does NOT show `created_by` or `approved_by` fields

### Key Implementation Notes

- **Week calculation**: always compute Sunday–Saturday range using the ward's `timezone` field — never assume UTC or server timezone
- **QR code**: generate server-side pointing to `/ward/[slug]`; Ward Leaders download as PNG
- **File uploads**: stream directly to Vercel Blob from the browser using `@vercel/blob/client`; store the resulting URL in `announcement_attachments`
- **Auth middleware**: protect `/dashboard/**` and `/admin/**` routes in `middleware.ts`; role checks happen in Server Components / Server Actions, not just middleware
- **Stake Leaders**: when a Stake is created and a Stake Leader assigned, they inherit Ward Leader permissions over all wards with `parent_id` pointing to that stake
